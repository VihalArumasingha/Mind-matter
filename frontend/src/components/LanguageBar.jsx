import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LanguageContext from '../context/LanguageContext';

/**
 * Shared language switcher bar: [ EN ] [ සිංහල ] [ தமிழ் ]
 * Put it on any screen. Zoom links/IDs/passwords are never passed through here.
 * Safe: renders static fallback if LanguageProvider is missing (never crashes bundle).
 */
const LANGS = [
  { code: 'en', short: 'EN' },
  { code: 'si', short: 'සිංහල' },
  { code: 'ta', short: 'தமிழ்' },
];

const LanguageBar = ({ compact = false }) => {
  const ctx = useContext(LanguageContext);
  const language = ctx?.language ?? 'en';
  const changeLanguage = ctx?.changeLanguage ?? (() => {});
  return (
    <View style={styles.row}>
      {LANGS.map(lang => {
        const active = lang.code === language;
        return (
          <TouchableOpacity
            key={lang.code}
            onPress={() => changeLanguage(lang.code)}
            style={[styles.chip, compact && styles.chipCompact, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {lang.short}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E8F0E4',
    borderWidth: 1.5,
    borderColor: '#4E8C4A',
    marginHorizontal: 4,
    minWidth: 70,
    alignItems: 'center',
  },
  chipCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 60,
  },
  chipActive: {
    backgroundColor: '#4E8C4A',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4E8C4A',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});

export default LanguageBar;
