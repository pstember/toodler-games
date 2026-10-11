// Rhythm Tap — i18n (shared keys with truck/puzzle pattern)
import {
  LANGUAGE_STORAGE_KEY,
  LEGACY_LANGUAGE_STORAGE_KEY,
  resolveStoredLanguage,
  saveLanguagePreference
} from '../shared/i18n.js';

export { LANGUAGE_STORAGE_KEY, resolveStoredLanguage };

export const translations = {
  en: {
    'splash-title': '🎸 Tap the Colors! 🎸',
    'splash-subtitle': 'When a note reaches the line, tap the matching color!',
    'start-game': 'START',
    'more-games': 'More games',
    'theme-aria': 'Display theme',
    'theme-title': 'Light, dark, or match your device',
    'theme-opt-system': '🖥️ System',
    'theme-opt-light': '☀️ Light',
    'theme-opt-dark': '🌙 Dark',
    'lane-left': 'Green',
    'lane-center': 'Yellow',
    'lane-right': 'Red',
    'lane-blue': 'Blue',
    'score': 'Stars',
    'combo': 'Nice!',
    'hit-perfect': 'Perfect!',
    'hit-good': 'Good!',
    'ready': 'Listen…',
    'again': 'PLAY AGAIN',
    'you-did-it': '🌟 You did it! 🌟',
    'win-hits-only': 'You hit {n} notes!',
    'tap-along': 'Rhythm tap',
    'fail-early': 'Too soon!',
    'fail-late': 'Too late!',
    'fail-no-note': 'No note here!',
    'fail-wrong': 'Wrong color!',
    'combo-label': 'Combo',
    'pick-level': 'Level',
    'level-easy': 'Easier timing',
    'level-mid': 'Medium',
    'level-hard': 'Faster & tighter',
    'challenger-mode': 'Challenger — 4 colors',
    'challenger-hint': 'Narrower window, blue lane, faster beat.',
    'window-legend': 'Shaded band = Good; line through the fat note = Perfect.',
    'keyboard-hint-3': 'Z · X · C',
    'keyboard-hint-4': 'Z · X · C · V',
    'opt-random': '🎲 Random notes',
    'opt-random-hint': 'Mix up the colors each time.',
    'opt-infinite': '♾️ Keep playing',
    'opt-infinite-hint': 'Starts easy, gets harder each minute — stack with Random & Challenger!',
    'infinite-stage': 'Stage {n}',
    'lives-aria': '{r} hearts out of {t}'
  },
  fr: {
    'splash-title': '🎸 Tape les couleurs ! 🎸',
    'splash-subtitle': 'Quand une note arrive sur la ligne, tape la bonne couleur !',
    'start-game': 'COMMENCER',
    'more-games': 'Autres jeux',
    'theme-aria': 'Thème d’affichage',
    'theme-title': 'Clair, sombre ou comme l’appareil',
    'theme-opt-system': '🖥️ Système',
    'theme-opt-light': '☀️ Clair',
    'theme-opt-dark': '🌙 Sombre',
    'lane-left': 'Vert',
    'lane-center': 'Jaune',
    'lane-right': 'Rouge',
    'lane-blue': 'Bleu',
    'score': 'Étoiles',
    'combo': 'Super !',
    'hit-perfect': 'Parfait !',
    'hit-good': 'Bien !',
    'ready': 'Écoute…',
    'again': 'REJOUER',
    'you-did-it': '🌟 Bravo ! 🌟',
    'win-hits-only': 'Tu as touché {n} notes !',
    'tap-along': 'Rythme à taper',
    'fail-early': 'Trop tôt !',
    'fail-late': 'Trop tard !',
    'fail-no-note': 'Pas de note ici !',
    'fail-wrong': 'Mauvaise couleur !',
    'combo-label': 'Combo',
    'pick-level': 'Niveau',
    'level-easy': 'Plus facile',
    'level-mid': 'Moyen',
    'level-hard': 'Plus rapide & serré',
    'challenger-mode': 'Challenger — 4 couleurs',
    'challenger-hint': 'Fenêtre plus étroite, ligne bleue, rythme plus rapide.',
    'window-legend': 'Zone = Bien ; la ligne au milieu de la note = Parfait.',
    'keyboard-hint-3': 'Z · X · C',
    'keyboard-hint-4': 'Z · X · C · V',
    'opt-random': '🎲 Notes au hasard',
    'opt-random-hint': 'Mélange les couleurs à chaque fois.',
    'opt-infinite': '♾️ Toujours jouer',
    'opt-infinite-hint': 'Commence facile, plus dur chaque minute — avec Hasard et Challenger !',
    'infinite-stage': 'Palier {n}',
    'lives-aria': '{r} cœurs sur {t}'
  },
  es: {
    'splash-title': '🎸 ¡Toca los colores! 🎸',
    'splash-subtitle': '¡Cuando una nota llega a la línea, toca el color que toca!',
    'start-game': 'EMPEZAR',
    'more-games': 'Más juegos',
    'theme-aria': 'Tema de pantalla',
    'theme-title': 'Claro, oscuro o como el dispositivo',
    'theme-opt-system': '🖥️ Sistema',
    'theme-opt-light': '☀️ Claro',
    'theme-opt-dark': '🌙 Oscuro',
    'lane-left': 'Verde',
    'lane-center': 'Amarillo',
    'lane-right': 'Rojo',
    'lane-blue': 'Azul',
    'score': 'Estrellas',
    'combo': '¡Genial!',
    'hit-perfect': '¡Perfecto!',
    'hit-good': '¡Bien!',
    'ready': 'Escucha…',
    'again': 'JUGAR OTRA VEZ',
    'you-did-it': '🌟 ¡Lo lograste! 🌟',
    'win-hits-only': '¡Tocaste {n} notas!',
    'tap-along': 'Ritmo para tocar',
    'fail-early': '¡Demasiado pronto!',
    'fail-late': '¡Demasiado tarde!',
    'fail-no-note': '¡No hay nota aquí!',
    'fail-wrong': '¡Otro color!',
    'combo-label': 'Combo',
    'pick-level': 'Nivel',
    'level-easy': 'Más fácil',
    'level-mid': 'Medio',
    'level-hard': 'Más rápido y justo',
    'challenger-mode': 'Challenger — 4 colores',
    'challenger-hint': 'Ventana más estrecha, carril azul, ritmo más rápido.',
    'window-legend': 'Banda = Bien; la línea en el centro gordo de la nota = Perfecto.',
    'keyboard-hint-3': 'Z · X · C',
    'keyboard-hint-4': 'Z · X · C · V',
    'opt-random': '🎲 Notas al azar',
    'opt-random-hint': 'Mezcla los colores cada vez.',
    'opt-infinite': '♾️ Seguir tocando',
    'opt-infinite-hint': 'Empieza fácil y sube cada minuto — combina con Azar y Challenger.',
    'infinite-stage': 'Fase {n}',
    'lives-aria': '{r} corazones de {t}'
  }
};

let currentLanguage = resolveStoredLanguage();

export function getCurrentLanguage() {
  return currentLanguage;
}

/** Current language string for gameplay feedback (not tied to data-i18n DOM). */
export function translate(key) {
  const table = translations[currentLanguage] || translations.en;
  return table[key] ?? translations.en[key] ?? key;
}

export function setLanguage(lang) {
  if (lang !== 'en' && lang !== 'fr' && lang !== 'es') return;
  currentLanguage = lang;
  saveLanguagePreference(lang);
  try {
    localStorage.setItem(LEGACY_LANGUAGE_STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lang;

  const table = translations[lang] || translations.en;

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
}
