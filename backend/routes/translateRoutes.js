import express from 'express';
import { translateBatch, translateSingle } from '../utils/translateUtils.js';

const router = express.Router();

// POST /api/translate  { text, target: 'si'|'ta'|'en' }
router.post('/', async (req, res) => {
  try {
    const { text, target } = req.body;
    if (!['en', 'si', 'ta'].includes(target)) {
      return res.status(400).json({ message: 'Invalid target language' });
    }
    const translatedText = await translateSingle(text || '', target);
    res.json({ translatedText });
  } catch (e) {
    console.log('[Translate route] error:', e.message);
    res.status(500).json({ message: 'Translation failed' });
  }
});

// POST /api/translate/batch  { items: [{id, text}], target }
router.post('/batch', async (req, res) => {
  try {
    const { items, target } = req.body;
    if (!['en', 'si', 'ta'].includes(target)) {
      return res.status(400).json({ message: 'Invalid target language' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ translations: [] });
    }
    // cap batch size to protect free API limits
    const sliced = items.slice(0, 30);
    const translations = await translateBatch(sliced, target);
    res.json({ translations });
  } catch (e) {
    console.log('[Translate route batch] error:', e.message);
    res.status(500).json({ message: 'Translation failed' });
  }
});

export default router;
