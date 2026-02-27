const axios = require('axios');
const cheerio = require('cheerio');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extractRecipeFromUrl(url) {
  try {
    const { data: html } = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeRankBot/1.0)' }
    });
    const $ = cheerio.load(html);
    let recipeData = null;

    // Try JSON-LD schema first
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html());
        const schemas = Array.isArray(json) ? json : [json];
        for (const s of schemas) {
          const recipe = s['@type'] === 'Recipe' ? s
            : (s['@graph'] && s['@graph'].find(g => g['@type'] === 'Recipe'));
          if (recipe) {
            recipeData = {
              title: recipe.name || '',
              description: recipe.description || '',
              ingredients: Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient : [],
              instructions: Array.isArray(recipe.recipeInstructions)
                ? recipe.recipeInstructions.map(i => typeof i === 'string' ? i : i.text || '').filter(Boolean)
                : [],
              prepTime: recipe.prepTime || '',
              cookTime: recipe.cookTime || '',
              totalTime: recipe.totalTime || '',
              servings: recipe.recipeYield || '',
              cuisine: recipe.recipeCuisine || '',
              category: recipe.recipeCategory || '',
              keywords: recipe.keywords || ''
            };
          }
        }
      } catch (e) {}
    });

    // Fallback: scrape page content
    if (!recipeData || !recipeData.title) {
      const title = $('h1').first().text().trim() || $('title').text().trim();
      const ingredients = [];
      $('[class*="ingredient"]').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length < 200) ingredients.push(text);
      });
      const instructions = [];
      $('[class*="instruction"],[class*="step"],[class*="direction"]').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 10 && text.length < 1000) instructions.push(text);
      });
      recipeData = {
        title: title.substring(0, 100),
        description: $('meta[name="description"]').attr('content') || '',
        ingredients: ingredients.slice(0, 30),
        instructions: instructions.slice(0, 20),
        prepTime: '', cookTime: '', totalTime: '', servings: '', cuisine: '', category: '', keywords: ''
      };
    }
    return recipeData;
  } catch (err) {
    throw new Error(`Failed to fetch recipe from URL: ${err.message}`);
  }
}

async function generateSEOPackage(recipeData) {
  const recipeText = [
    `Recipe: ${recipeData.title}`,
    `Description: ${recipeData.description}`,
    `Cuisine: ${recipeData.cuisine} | Category: ${recipeData.category}`,
    `Prep: ${recipeData.prepTime} | Cook: ${recipeData.cookTime} | Servings: ${recipeData.servings}`,
    `Ingredients: ${recipeData.ingredients.slice(0, 15).join(', ')}`,
    `Steps: ${recipeData.instructions.slice(0, 5).join(' | ')}`
  ].join('\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert food blog SEO writer. Output only valid JSON, no markdown.'
      },
      {
        role: 'user',
        content: `Generate a complete SEO content package for this recipe:\n\n${recipeText}\n\nReturn ONLY valid JSON with this structure:\n{\n  "meta_title": "60 char max SEO title",\n  "meta_description": "155 char max meta description",\n  "primary_keyword": "main search keyword",\n  "lsi_keywords": ["10 semantic keywords"],\n  "blog_post": "900-1100 word SEO blog post with ## H2 headings, warm conversational tone, keyword used 4-6 times naturally",\n  "schema_json_ld": {"@context":"https://schema.org","@type":"Recipe"},\n  "social_captions": {\n    "instagram": "caption with emojis and hashtags",\n    "pinterest": "keyword-rich description",\n    "twitter": "punchy under 250 chars",\n    "facebook": "conversational with question",\n    "tiktok": "high-energy with trending hashtags"\n  }\n}`
      }
    ],
    temperature: 0.7,
    max_tokens: 3500,
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}

async function analyzeRecipe(input) {
  let recipeData;
  if (input.url) {
    recipeData = await extractRecipeFromUrl(input.url);
  } else if (input.recipe_text) {
    const lines = input.recipe_text.split('\n').filter(l => l.trim());
    recipeData = {
      title: lines[0] || 'Recipe',
      description: lines.slice(1, 3).join(' '),
      ingredients: lines.filter(l => /^[\d½¼¾]|tbsp|tsp|cup/i.test(l)),
      instructions: lines.filter(l => /^\d+\./.test(l.trim())),
      prepTime: '', cookTime: '', totalTime: '', servings: '', cuisine: '', category: '', keywords: ''
    };
  } else {
    throw new Error('Provide either a URL or recipe_text');
  }

  if (!recipeData.title) throw new Error('Could not extract recipe data');

  const seoPackage = await generateSEOPackage(recipeData);
  return {
    recipe: {
      title: recipeData.title,
      ingredients_count: recipeData.ingredients.length,
      instructions_count: recipeData.instructions.length
    },
    seo: seoPackage,
    generated_at: new Date().toISOString()
  };
}

module.exports = { analyzeRecipe };
