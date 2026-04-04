/** @typedef {'en'|'fr'|'es'} GameLang */

export const LANGUAGE_STORAGE_KEY = 'toddler-games-language';
const LEGACY_LANGUAGE_STORAGE_KEY = 'monster-truck-language';

/**
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

/** @type {GameLang} */
let currentLanguage = resolveStoredLanguage();

export function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * @param {GameLang} lang
 * @param {string} key
 */
export function t(lang, key) {
  const table = translations[lang] || translations.en;
  return table[key] ?? translations.en[key] ?? key;
}

/** @param {string} key */
export function tCurrent(key) {
  return t(currentLanguage, key);
}

export const translations = {
  en: {
    'meta-page-title': 'Photo puzzle',
    'more-games': 'More games',
    'btn-photo': '📸 Choose a photo',
    'difficulty-aria': 'Puzzle difficulty',
    'difficulty-title': 'Grid size: more cells means harder.',
    'difficulty-opt-0': 'Beginner (3×3)',
    'difficulty-opt-1': 'Intermediate (4×3)',
    'difficulty-opt-2': 'Advanced (4×4)',
    'difficulty-opt-3': 'Challenge (5×4)',
    'difficulty-opt-4': 'Expert (8×6)',
    'btn-hint': '💡 Hint',
    'btn-numbers': '🔢 Numbers',
    'btn-numbers-title':
      'Shows a number on each piece (and on each empty slot: which piece belongs there).',
    'theme-aria': 'Display theme',
    'theme-title': 'Light, dark, or match your phone or tablet',
    'theme-opt-system': '🖥️ System',
    'theme-opt-light': '☀️ Light',
    'theme-opt-dark': '🌙 Dark',
    'tongue-panel-summary': 'Tab settings (piece shape)',
    'tongue-panel-hint':
      'Move the sliders to tune parameters. The Voronoi grid does not change until you press “New seed”. Note values you like to copy into code.',
    'tongue-panel-sliders-aria': 'Jigsaw tab parameters',
    'tongue-reset': 'Reset settings',
    'tongue-new-seed': 'New seed',
    'tongue-copy': 'Copy JSON',
    'piece-tray-aria': 'Puzzle pieces',
    'loading': 'Loading…',
    'win-message': 'Well done! 🎉',
    'btn-replay': '🔄 Play again',
    'language-select-aria': 'Game language',
    'file-input-aria': 'Choose image file',
    'tongue-slider-globalBulge': 'Global bulge (×)',
    'tongue-slider-amplitudeMax': 'Max amplitude',
    'tongue-slider-amplitudeMin': 'Min amplitude',
    'tongue-slider-widthMax': 'Max width',
    'tongue-slider-widthMin': 'Min width',
    'tongue-slider-edgeVertexPad': 'Corner padding',
    'tongue-slider-tabSpanMin': 'Min tab length',
    'tongue-slider-tabSpanMax': 'Max tab length',
    'tongue-slider-cornerDamp2': '2nd edge at vertex',
    'tongue-slider-cornerDamp3': '3rd+ edge at vertex',
    'tongue-slider-shortChordRef': 'Short chord ref (↑ = larger tabs)',
    'tongue-slider-refLen': 'refLen (length scale)',
    'tongue-slider-minChordLength': 'Min chord for curve',
  },
  fr: {
    'meta-page-title': 'Puzzle photo',
    'more-games': 'Autres jeux',
    'btn-photo': '📸 Choisir une photo',
    'difficulty-aria': 'Difficulté du puzzle',
    'difficulty-title': 'Taille de la grille : plus il y a de cases, plus c’est difficile.',
    'difficulty-opt-0': 'Débutant (3×3)',
    'difficulty-opt-1': 'Intermédiaire (4×3)',
    'difficulty-opt-2': 'Avancé (4×4)',
    'difficulty-opt-3': 'Défi (5×4)',
    'difficulty-opt-4': 'Expert (8×6)',
    'btn-hint': '💡 Aide',
    'btn-numbers': '🔢 Numéros',
    'btn-numbers-title':
      'Affiche un numéro sur chaque pièce (et sur chaque case vide : la pièce qui doit s’y placer).',
    'theme-aria': 'Thème d’affichage',
    'theme-title': 'Clair, sombre ou comme le réglage du téléphone ou de la tablette',
    'theme-opt-system': '🖥️ Système',
    'theme-opt-light': '☀️ Clair',
    'theme-opt-dark': '🌙 Sombre',
    'tongue-panel-summary': 'Réglages des languettes (forme des pièces)',
    'tongue-panel-hint':
      'Déplacez les curseurs pour tester les paramètres. La grille Voronoi ne change pas tant que vous n’appuyez pas sur « Nouvelle graine ». Notez les valeurs qui vous conviennent pour les reporter dans le code.',
    'tongue-panel-sliders-aria': 'Paramètres des languettes',
    'tongue-reset': 'Réinitialiser réglages',
    'tongue-new-seed': 'Nouvelle graine',
    'tongue-copy': 'Copier JSON',
    'piece-tray-aria': 'Pièces du puzzle',
    'loading': 'Chargement…',
    'win-message': 'Bravo ! 🎉',
    'btn-replay': '🔄 Rejouer',
    'language-select-aria': 'Langue du jeu',
    'file-input-aria': 'Choisir un fichier image',
    'tongue-slider-globalBulge': 'Bulge global (×)',
    'tongue-slider-amplitudeMax': 'Amplitude max',
    'tongue-slider-amplitudeMin': 'Amplitude min',
    'tongue-slider-widthMax': 'Largeur max',
    'tongue-slider-widthMin': 'Largeur min',
    'tongue-slider-edgeVertexPad': 'Marge aux coins',
    'tongue-slider-tabSpanMin': 'Longueur languette min',
    'tongue-slider-tabSpanMax': 'Longueur languette max',
    'tongue-slider-cornerDamp2': '2ᵉ arête au sommet',
    'tongue-slider-cornerDamp3': '3ᵉ+ arête au sommet',
    'tongue-slider-shortChordRef': 'Réf. corde courte (↑ = languettes plus grandes)',
    'tongue-slider-refLen': 'refLen (échelle longueur)',
    'tongue-slider-minChordLength': 'Corde min. pour courbe',
  },
  es: {
    'meta-page-title': 'Puzzle de fotos',
    'more-games': 'Más juegos',
    'btn-photo': '📸 Elegir una foto',
    'difficulty-aria': 'Dificultad del puzzle',
    'difficulty-title': 'Tamaño de la cuadrícula: más casillas, más difícil.',
    'difficulty-opt-0': 'Principiante (3×3)',
    'difficulty-opt-1': 'Intermedio (4×3)',
    'difficulty-opt-2': 'Avanzado (4×4)',
    'difficulty-opt-3': 'Desafío (5×4)',
    'difficulty-opt-4': 'Experto (8×6)',
    'btn-hint': '💡 Pista',
    'btn-numbers': '🔢 Números',
    'btn-numbers-title':
      'Muestra un número en cada pieza (y en cada hueco vacío: qué pieza va ahí).',
    'theme-aria': 'Tema de pantalla',
    'theme-title': 'Claro, oscuro o igual que el teléfono o la tablet',
    'theme-opt-system': '🖥️ Sistema',
    'theme-opt-light': '☀️ Claro',
    'theme-opt-dark': '🌙 Oscuro',
    'tongue-panel-summary': 'Ajustes de lengüetas (forma de piezas)',
    'tongue-panel-hint':
      'Mueve los controles para probar parámetros. La cuadrícula Voronoi no cambia hasta que pulses «Nueva semilla». Anota los valores que te gusten para copiarlos al código.',
    'tongue-panel-sliders-aria': 'Parámetros de lengüetas del puzzle',
    'tongue-reset': 'Restablecer ajustes',
    'tongue-new-seed': 'Nueva semilla',
    'tongue-copy': 'Copiar JSON',
    'piece-tray-aria': 'Piezas del puzzle',
    'loading': 'Cargando…',
    'win-message': '¡Bien hecho! 🎉',
    'btn-replay': '🔄 Jugar de nuevo',
    'language-select-aria': 'Idioma del juego',
    'file-input-aria': 'Elegir archivo de imagen',
    'tongue-slider-globalBulge': 'Bulbo global (×)',
    'tongue-slider-amplitudeMax': 'Amplitud máx.',
    'tongue-slider-amplitudeMin': 'Amplitud mín.',
    'tongue-slider-widthMax': 'Ancho máx.',
    'tongue-slider-widthMin': 'Ancho mín.',
    'tongue-slider-edgeVertexPad': 'Margen en esquinas',
    'tongue-slider-tabSpanMin': 'Long. lengüeta mín.',
    'tongue-slider-tabSpanMax': 'Long. lengüeta máx.',
    'tongue-slider-cornerDamp2': '2.ª arista en vértice',
    'tongue-slider-cornerDamp3': '3.ª+ arista en vértice',
    'tongue-slider-shortChordRef': 'Ref. cuerda corta (↑ = lengüetas más grandes)',
    'tongue-slider-refLen': 'refLen (escala de longitud)',
    'tongue-slider-minChordLength': 'Cuerda mín. para curva',
  },
};

/**
 * Apply translated strings to the document and persist preference.
 * @param {GameLang} lang
 */
export function setLanguage(lang) {
  if (lang !== 'en' && lang !== 'fr' && lang !== 'es') return;
  currentLanguage = lang;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    localStorage.setItem(LEGACY_LANGUAGE_STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }

  const table = translations[lang] || translations.en;
  if (lang === 'en') document.documentElement.lang = 'en';
  else if (lang === 'es') document.documentElement.lang = 'es';
  else document.documentElement.lang = 'fr';
  document.title = table['meta-page-title'];

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (key && table[key]) {
      element.textContent = table[key];
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach((element) => {
    const key = element.getAttribute('data-i18n-title');
    if (key && table[key]) {
      element.setAttribute('title', table[key]);
    }
  });

  document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
    const key = element.getAttribute('data-i18n-aria');
    if (key && table[key]) {
      element.setAttribute('aria-label', table[key]);
    }
  });

  document.dispatchEvent(new CustomEvent('puzzle-lang-updated', { detail: { lang } }));
}
