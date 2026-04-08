// ===================================
// TRANSLATIONS MODULE
// ===================================

import {
    LANGUAGE_STORAGE_KEY,
    LEGACY_LANGUAGE_STORAGE_KEY,
    resolveStoredLanguage,
    saveLanguagePreference
} from '../../shared/i18n.js';

// Re-export for backwards compatibility
export { LANGUAGE_STORAGE_KEY, resolveStoredLanguage };

export const translations = {
    en: {
        'splash-title': '🚙 Monster Truck Match 🚙',
        'splash-subtitle': 'Match the shapes and colors!',
        'start-game': 'START GAME',
        'level': 'Level',
        'amazing': '🎉 Amazing! 🎉',
        'mud-wash-title': '🧽 Wash the Truck! 🧽',
        'mud-wash-instructions': 'Swipe to clean off the mud!',
        'mud-wash-celebration': '🌟 Sparkling clean! You did it! 🌟',
        'cleaned': 'Cleaned:',
        'sticker-shop-title': '✨ Decorate Your Truck! ✨',
        'sticker-shop-instructions': 'Drag stickers onto your truck, then click DONE!',
        'done': 'DONE!',
        'big-jump-title': '🚀 BIG JUMP! 🚀',
        'big-jump-instructions': 'Click JUMP to do a backflip!',
        'jump': 'JUMP!',
        'bubble-wrap-title': '🎈 POP THE BUBBLES! 🎈',
        'bubble-wrap-instructions': 'Tap all the bubbles to pop them!',
        'popped': 'popped',
        'more-games': 'More games',
        'theme-aria': 'Display theme',
        'theme-title': 'Light, dark, or match your device',
        'theme-opt-system': '🖥️ System',
        'theme-opt-light': '☀️ Light',
        'theme-opt-dark': '🌙 Dark'
    },
    fr: {
        'splash-title': '🚙 Match de Monster Truck 🚙',
        'splash-subtitle': 'Associe les formes et les couleurs !',
        'start-game': 'COMMENCER',
        'level': 'Niveau',
        'amazing': '🎉 Incroyable ! 🎉',
        'mud-wash-title': '🧽 Lave le Camion ! 🧽',
        'mud-wash-instructions': 'Glisse pour nettoyer la boue !',
        'mud-wash-celebration': '🌟 Tout brillant ! Bravo ! 🌟',
        'cleaned': 'Nettoyé :',
        'sticker-shop-title': '✨ Décore Ton Camion ! ✨',
        'sticker-shop-instructions': 'Glisse les autocollants sur ton camion, puis clique sur FINI !',
        'done': 'FINI !',
        'big-jump-title': '🚀 GRAND SAUT ! 🚀',
        'big-jump-instructions': 'Clique sur SAUTER pour faire un salto !',
        'jump': 'SAUTER !',
        'bubble-wrap-title': '🎈 ÉCLATE LES BULLES ! 🎈',
        'bubble-wrap-instructions': 'Tape sur toutes les bulles pour les éclater !',
        'popped': 'éclatées',
        'more-games': 'Autres jeux',
        'theme-aria': 'Thème d’affichage',
        'theme-title': 'Clair, sombre ou comme l’appareil',
        'theme-opt-system': '🖥️ Système',
        'theme-opt-light': '☀️ Clair',
        'theme-opt-dark': '🌙 Sombre'
    },
    es: {
        'splash-title': '🚙 Empareja el Monster Truck 🚙',
        'splash-subtitle': '¡Empareja las formas y los colores!',
        'start-game': 'EMPEZAR',
        'level': 'Nivel',
        'amazing': '🎉 ¡Increíble! 🎉',
        'mud-wash-title': '🧽 ¡Lava el Camión! 🧽',
        'mud-wash-instructions': '¡Desliza para limpiar el lodo!',
        'mud-wash-celebration': '🌟 ¡Reluciente! ¡Lo lograste! 🌟',
        'cleaned': 'Limpiado:',
        'sticker-shop-title': '✨ ¡Decora Tu Camión! ✨',
        'sticker-shop-instructions': '¡Arrastra pegatinas a tu camión y luego haz clic en LISTO!',
        'done': '¡LISTO!',
        'big-jump-title': '🚀 ¡GRAN SALTO! 🚀',
        'big-jump-instructions': '¡Haz clic en SALTAR para hacer una voltereta!',
        'jump': '¡SALTAR!',
        'bubble-wrap-title': '🎈 ¡REVIENTA LAS BURBUJAS! 🎈',
        'bubble-wrap-instructions': '¡Toca todas las burbujas para reventarlas!',
        'popped': 'reventadas',
        'more-games': 'Más juegos',
        'theme-aria': 'Tema de pantalla',
        'theme-title': 'Claro, oscuro o como el dispositivo',
        'theme-opt-system': '🖥️ Sistema',
        'theme-opt-light': '☀️ Claro',
        'theme-opt-dark': '🌙 Oscuro'
    }
};

let currentLanguage = resolveStoredLanguage();

export function getCurrentLanguage() {
    return currentLanguage;
}

export function setLanguage(lang) {
    currentLanguage = lang;
    saveLanguagePreference(lang);
    // Also update legacy key for backwards compatibility
    try {
        localStorage.setItem(LEGACY_LANGUAGE_STORAGE_KEY, lang);
    } catch {
        /* ignore */
    }

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
