const THEME_STORAGE_KEY = 'toddler-games-theme';
const LEGACY_THEME_STORAGE_KEY = 'puzzle-theme';

/** @param {'light' | 'dark' | 'system'} pref */
function resolveEffectiveTheme(pref) {
  if (pref === 'dark') return 'dark';
  if (pref === 'light') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** @param {'light' | 'dark'} effective */
function applyEffectiveTheme(effective) {
  document.documentElement.setAttribute('data-theme', effective);
  const meta = document.getElementById('meta-theme-color');
  if (meta) meta.setAttribute('content', effective === 'dark' ? '#1e1b4b' : '#667eea');
}

/** @returns {'light' | 'dark' | 'system'} */
function getThemePreference() {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* ignore */
  }
  return 'system';
}

function onSystemColorSchemeChange() {
  if (getThemePreference() !== 'system') return;
  applyEffectiveTheme(resolveEffectiveTheme('system'));
}

export function initThemeSelect() {
  const pref = getThemePreference();
  const sel = document.getElementById('theme-select');
  if (sel) sel.value = pref;
  applyEffectiveTheme(resolveEffectiveTheme(pref));

  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', onSystemColorSchemeChange);

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
    applyEffectiveTheme(resolveEffectiveTheme(v));
  });
}
