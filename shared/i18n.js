// Shared i18n utilities for toddler games
// Used by: Hub, Monster Truck Match, Photo Puzzle

export const LANGUAGE_STORAGE_KEY = 'toddler-games-language';
export const LEGACY_LANGUAGE_STORAGE_KEY = 'monster-truck-language';

/**
 * Supported languages across all games
 * @typedef {'en' | 'fr' | 'es'} GameLang
 */

/**
 * Resolve stored language from localStorage
 * Checks canonical key first, then legacy key, defaults to 'en'
 * @returns {GameLang}
 */
export function resolveStoredLanguage() {
  try {
    const canonical = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (canonical === 'en' || canonical === 'fr' || canonical === 'es') {
      return canonical;
    }
    const legacy = localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
    if (legacy === 'en' || legacy === 'fr' || legacy === 'es') {
      return legacy;
    }
  } catch {
    /* ignore */
  }
  return 'en';
}

/**
 * Save language preference to localStorage
 * @param {GameLang} lang - Language to save
 */
export function saveLanguagePreference(lang) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}
