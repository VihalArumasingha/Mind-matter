import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

// Strings that must NEVER be translated (Zoom links, IDs, URLs, passwords)
const isNoTranslate = (s) => {
  if (!s || typeof s !== 'string') return true;
  const t = s.trim();
  if (!t) return true;
  if (/^https?:\/\//i.test(t)) return true;
  if (/zoom\.us/i.test(t)) return true;
  if (/zoomus:\/\//i.test(t)) return true;
  if (/^[\d\s-]{6,}$/.test(t)) return true; // meeting IDs / numbers
  if (/^pwd=|passcode|password\s*:/i.test(t) && t.length < 60 && /[a-zA-Z0-9]{4,}/.test(t)) {
    // short credential fragments — leave alone unless clearly a sentence
    if (!/\s/.test(t)) return true;
  }
  // pure URL fragment
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t) && !/\s/.test(t) && t.length < 120) return true;
  return false;
};

/**
 * <T> auto-translates any text content when language is si/ta.
 * Zoom links / URLs / meeting IDs / passwords are NEVER translated
 * (rendered as-is in English).
 * Usage: <T style={...}>Hello world</T>
 *   <T text={post.description} style={...} />
 */
const T = ({ children, text, style, numberOfLines, ...rest }) => {
  const { language, translate, version } = useLanguage();
  const original = text ?? (typeof children === 'string' ? children : '');
  const [display, setDisplay] = useState(original);

  useEffect(() => {
    let cancelled = false;
    if (language === 'en' || !original || typeof original !== 'string' || isNoTranslate(original)) {
      setDisplay(original);
      return;
    }
    // show original immediately, then swap to translated
    setDisplay(original);
    translate(original).then(out => {
      if (!cancelled) setDisplay(out);
    });
    return () => { cancelled = true; };
  }, [original, language, translate, version]);

  // non-string children (nested components) render as-is
  if (text === undefined && typeof children !== 'string') {
    return <Text style={style} numberOfLines={numberOfLines} {...rest}>{children}</Text>;
  }
  return <Text style={style} numberOfLines={numberOfLines} {...rest}>{display}</Text>;
};

export default T;
