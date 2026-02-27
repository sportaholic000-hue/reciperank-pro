# RecipeRank Pro

**AI-powered SEO content generator for food bloggers.**

Turn any recipe URL or text into a complete SEO package in 30 seconds:
- Full 900-1100 word SEO blog post
- Schema.org Recipe JSON-LD structured data
- Meta title + meta description
- 10 LSI/semantic keywords
- Social media captions (Instagram, Pinterest, Twitter/X, Facebook, TikTok)

## Live Demo

Deploy to Railway in 60 seconds (see below).

## Setup

```bash
git clone https://github.com/sportaholic000-hue/reciperank-pro
cd reciperank-pro
npm install
cp .env.example .env
# Add your OPENAI_API_KEY to .env
npm start
```

Visit `http://localhost:3000`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `PORT` | No | Server port (default: 3000) |
| `RATE_LIMIT_MAX` | No | Free analyses per IP/day (default: 3) |

## API Reference

### POST /api/analyze

Analyze a recipe and get a full SEO package.

**Request (URL):**
```json
{ "url": "https://foodblog.com/pasta-recipe" }
```

**Request (text):**
```json
{ "recipe_text": "Classic Pasta\n\nIngredients:\n2 cups pasta..." }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recipe": {
      "title": "Classic Pasta",
      "ingredients_count": 8,
      "instructions_count": 6
    },
    "seo": {
      "meta_title": "Easy Classic Pasta Recipe - Ready in 20 Minutes",
      "meta_description": "Make the best classic pasta at home...",
      "primary_keyword": "classic pasta recipe",
      "lsi_keywords": ["homemade pasta", "Italian pasta", ...],
      "blog_post": "## Why You'll Love This Classic Pasta...",
      "schema_json_ld": { "@context": "https://schema.org", "@type": "Recipe", ... },
      "social_captions": {
        "instagram": "...",
        "pinterest": "...",
        "twitter": "...",
        "facebook": "...",
        "tiktok": "..."
      }
    },
    "generated_at": "2026-02-27T16:00:00.000Z"
  }
}
```

### GET /health

```json
{ "status": "ok", "version": "1.0.0", "service": "RecipeRank Pro" }
```

## Rate Limiting

- Free tier: 3 analyses per IP per 24 hours
- Pro tier: unlimited (contact troy@reciperank.pro)

## Deploy to Railway

1. Fork this repo
2. Go to [railway.app](https://railway.app) and connect your GitHub
3. Select `reciperank-pro` repo
4. Add environment variable: `OPENAI_API_KEY=sk-...`
5. Deploy — live in 60 seconds

## Pricing

| Plan | Price | Analyses |
|------|-------|----------|
| Free | $0 | 3/day |
| Pro | $29/mo | Unlimited |

To subscribe: [troy@reciperank.pro](mailto:troy@reciperank.pro?subject=RecipeRank%20Pro%20Subscription)

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 4
- **AI**: OpenAI GPT-4o-mini
- **Scraping**: Axios + Cheerio
- **Rate limiting**: express-rate-limit
- **Deploy**: Railway / Render / Heroku

## License

MIT
