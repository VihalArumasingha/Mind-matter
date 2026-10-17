import axios from 'axios';

// Simple in-memory cache: key = `${target}:${text}`
const cache = new Map();
const MAX_CACHE = 2000;

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

// MyMemory uses e.g. EN|SI, EN|TA
const toMyMemoryLang = code => {
  if (code === 'si') return 'SI';
  if (code === 'ta') return 'TA';
  return 'EN';
};

const chunkText = (text, maxLen = 450) => {
  if (!text || text.length <= maxLen) return [text];
  const chunks = [];
  let current = '';
  // split on sentences to keep meaning
  const sentences = text.split(/(?<=[.!?।|။])\s+/);
  for (const s of sentences) {
    if ((current + ' ' + s).trim().length > maxLen && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current = (current ? current + ' ' : '') + s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  // hard split any oversized chunk
  const out = [];
  for (const c of chunks) {
    if (c.length <= maxLen) out.push(c);
    else {
      for (let i = 0; i < c.length; i += maxLen) out.push(c.slice(i, i + maxLen));
    }
  }
  return out;
};

export const translateSingle = async (text, target) => {
  if (!text || !text.trim()) return text;
  if (target === 'en') return text;
  // NEVER translate Zoom links / URLs / meeting IDs — keep English
  const trimmed = text.trim();
  if (/^https?:\/\//i.test(trimmed) || /zoom\.us/i.test(text) || /zoomus:\/\//i.test(text)) return text;
  if (/^[\d\s-]{6,}$/.test(trimmed)) return text;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(trimmed) && !/\s/.test(trimmed) && trimmed.length < 120) return text;
  const key = `${target}:${text}`;
  if (cache.has(key)) return cache.get(key);

  const chunks = chunkText(text);
  const translatedChunks = [];
  for (const chunk of chunks) {
    const chunkKey = `${target}:${chunk}`;
    if (cache.has(chunkKey)) {
      translatedChunks.push(cache.get(chunkKey));
      continue;
    }
    try {
      const res = await axios.get(MYMEMORY_URL, {
        params: { q: chunk, langpair: `en|${toMyMemoryLang(target)}` },
        timeout: 12000,
      });
      let out = res.data?.responseData?.translatedText || chunk;
      // MyMemory error strings
      if (/QUERY LENGTH LIMIT|INVALID/i.test(out)) out = chunk;
      cache.set(chunkKey, out);
      translatedChunks.push(out);
      // small delay to respect free rate limits
      await new Promise(r => setTimeout(r, 150));
    } catch (e) {
      console.log('[Translate] MyMemory failed:', e.message);
      translatedChunks.push(chunk);
    }
  }
  const finalText = translatedChunks.join(' ');
  cache.set(key, finalText);
  if (cache.size > MAX_CACHE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  return finalText;
};

export const translateBatch = async (items, target) => {
  // items: [{ id, text }]
  if (target === 'en') {
    return items.map(i => ({ id: i.id, translatedText: i.text }));
  }
  const results = [];
  for (const item of items) {
    const translatedText = await translateSingle(item.text || '', target);
    results.push({ id: item.id, translatedText });
  }
  return results;
};
