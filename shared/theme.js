// Shared theme management for toddler games
// Used by: Hub, Monster Truck Match, Photo Puzzle

export const THEME_STORAGE_KEY = 'toddler-games-theme';
export const LEGACY_THEME_STORAGE_KEY = 'puzzle-theme';

/**
 * Resolve effective theme from user preference
 * @param {'light' | 'dark' | 'system'} pref - User's theme preference
 * @returns {'light' | 'dark'} - Effective theme to apply
 */
export function resolveEffectiveTheme(pref) {
  if (pref === 'dark') return 'dark';
  if (pref === 'light') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply theme to document and meta tag
 * @param {'light' | 'dark'} effective - Theme to apply
 * @param {{ light: string, dark: string }} colors - Theme colors for meta tag
 */
export function applyEffectiveTheme(effective, colors) {
  document.documentElement.setAttribute('data-theme', effective);
  const meta = document.getElementById('meta-theme-color');
  if (meta) {
    meta.setAttribute('content', effective === 'dark' ? colors.dark : colors.light);
  }
}

/**
 * Get user's stored theme preference
 * @returns {'light' | 'dark' | 'system'} - Stored preference or 'system' default
 */
export function getThemePreference() {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* ignore */
  }
  return 'system';
}

/**
 * Initialize theme management for a game
 * @param {{ light: string, dark: string }} colors - Meta theme colors
 * @param {string} [selectId='theme-select'] - ID of theme select element
 */
export function initThemeManagement(colors, selectId = 'theme-select') {
  const pref = getThemePreference();
  const sel = document.getElementById(selectId);

  if (sel) sel.value = pref;
  applyEffectiveTheme(resolveEffectiveTheme(pref), colors);

  // Listen for system theme changes
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', () => {
    if (getThemePreference() !== 'system') return;
    applyEffectiveTheme(resolveEffectiveTheme('system'), colors);
  });

  // Listen for user theme changes
  sel?.addEventListener('change', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const v = target.value;
    if (v !== 'light' && v !== 'dark' && v !== 'system') return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
    applyEffectiveTheme(resolveEffectiveTheme(v), colors);
  });
}

/**
 * Canonical theme colors used across all games
 */
export const CANONICAL_THEME_COLORS = {
  light: '#1e3a5f',
  dark: '#0f172a'
};
