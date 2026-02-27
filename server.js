require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { analyzeRecipe } = require('./services/recipeAnalyzer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting: 3 free analyses per IP per day
const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Daily limit reached',
    message: 'You have used your 3 free daily analyses. Upgrade to RecipeRank Pro for unlimited access.',
    upgrade_url: 'mailto:troy@reciperank.pro?subject=RecipeRank Pro Subscription'
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', service: 'RecipeRank Pro' });
});

// Main analysis endpoint
app.post('/api/analyze', limiter, async (req, res) => {
  const { url, recipe_text } = req.body;

  if (!url && !recipe_text) {
    return res.status(400).json({
      error: 'Missing input',
      message: 'Provide either a recipe URL or recipe_text'
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: 'Configuration error',
      message: 'OpenAI API key not configured'
    });
  }

  try {
    const result = await analyzeRecipe({ url, recipe_text });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Analysis error:', err.message);
    res.status(422).json({
      error: 'Analysis failed',
      message: err.message
    });
  }
});

// Serve UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`RecipeRank Pro running on port ${PORT}`);
});

module.exports = app;
