import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LANGUAGES, STRINGS } from '../config/languages'
import { API_BASE_URL } from '../config/api'

const STORAGE_KEY = '@mindmatter_language'
const LanguageContext = createContext(null)

// in-memory translation cache: `${lang}:${text}` -> translated
const translationCache = new Map()

async function translateViaBackend(text, target) {
  if (!text || !text.trim() || target === 'en') return text
  const key = `${target}:${text}`
  if (translationCache.has(key)) return translationCache.get(key)
  try {
    const res = await fetch(`${API_BASE_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target }),
    })
    if (!res.ok) throw new Error('translate failed')
    const data = await res.json()
    const out = data.translatedText || text
    translationCache.set(key, out)
    if (translationCache.size > 1000) {
      const first = translationCache.keys().next().value
      translationCache.delete(first)
    }
    return out
  } catch (e) {
    console.log('[Language] translate error:', e?.message)
    return text
  }
}

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en')
    // bump this to force all <T> components to re-translate
    const [version, setVersion] = useState(0)
    const langRef = useRef('en')
    langRef.current = language

    useEffect(() => {
        const load = async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY)
                if (saved && STRINGS[saved]) {
                    setLanguage(saved)
                }
            } catch (e) {
                console.log('[Language] load error:', e?.message)
            }
        }
        load()
    }, [])

    const changeLanguage = async code => {
        if (!STRINGS[code]) return
        setLanguage(code)
        setVersion(v => v + 1)
        try {
            await AsyncStorage.setItem(STORAGE_KEY, code)
        } catch (e) {
            console.log('[Language] save error:', e?.message)
        }
    }

    // static UI strings (instant, offline)
    const t = useCallback(key => STRINGS[langRef.current]?.[key] ?? STRINGS.en[key] ?? key, [])

    // dynamic user content (posts, comments, etc.) via free API
    const translate = useCallback(async text => {
      return translateViaBackend(text, langRef.current)
    }, [])

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t, translate, LANGUAGES, version }}>
            {children}
        </LanguageContext.Provider>
    )
}

export const useLanguage = () => {
    const ctx = useContext(LanguageContext)
    if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
    return ctx
}

export default LanguageContext
