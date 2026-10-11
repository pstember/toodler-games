// ===================================
// VISUAL EFFECTS MODULE
// ===================================

import {
    CONFETTI_COUNT,
    CONFETTI_CLEANUP_DELAY,
    FIREWORK_COUNT,
    FIREWORK_CLEANUP_DELAY,
    FIREWORK_POSITION_VARIANCE,
    FIREWORK_POSITION_CENTER,
    FIREWORK_DISTANCE_MIN,
    FIREWORK_DISTANCE_MAX
} from './constants.js';
import { gameState } from './state.js';
import { clearContainer } from './utils.js';

/**
 * Creates confetti animation
 */
export function createConfetti() {
    const container = document.getElementById('confetti-container');
    clearContainer(container);

    const colors = ['#FF4444', '#4444FF', '#44FF44', '#FFFF44', '#AA44FF', '#FF8844'];

    for (let i = 0; i < CONFETTI_COUNT; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.top = `${-20 + Math.random() * -20}px`;
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = `${Math.random() * 0.5}s`;
        container.appendChild(confetti);
    }

    // Clear after animation
    setTimeout(() => {
        clearContainer(container);
    }, CONFETTI_CLEANUP_DELAY);
}

/**
 * Shows the celebration overlay
 */
export function showCelebrationOverlay() {
    const overlay = document.getElementById('celebration-overlay');
    overlay.classList.remove('hidden');
}

/**
 * Hides the celebration overlay
 */
export function hideCelebrationOverlay() {
    const overlay = document.getElementById('celebration-overlay');
    overlay.classList.add('hidden');
}

/**
 * Creates fireworks animation
 */
export function createFireworks() {
    const container = document.getElementById('fireworks-container');
    if (!container) return;
    clearContainer(container);

    const colors = ['#FF4444', '#4444FF', '#44FF44', '#FFFF44', '#AA44FF', '#FF8844'];

    for (let i = 0; i < FIREWORK_COUNT; i++) {
        const firework = document.createElement('div');
        firework.className = 'firework';

        // Spawn near center; explode outward via --tx/--ty (px) used by @keyframes explode
        const angle = Math.random() * Math.PI * 2;
        const distance =
            FIREWORK_DISTANCE_MIN +
            Math.random() * (FIREWORK_DISTANCE_MAX - FIREWORK_DISTANCE_MIN);
        const tx =
            Math.cos(angle) * distance +
            (Math.random() - 0.5) * FIREWORK_POSITION_VARIANCE.horizontal;
        const ty =
            Math.sin(angle) * distance +
            (Math.random() - 0.5) * FIREWORK_POSITION_VARIANCE.vertical;

        firework.style.left = `${FIREWORK_POSITION_CENTER.left}%`;
        firework.style.top = `${FIREWORK_POSITION_CENTER.top}%`;
        firework.style.setProperty('--tx', `${tx}px`);
        firework.style.setProperty('--ty', `${ty}px`);
        firework.style.background = colors[Math.floor(Math.random() * colors.length)];
        firework.style.animationDelay = `${Math.random() * 0.5}s`;

        container.appendChild(firework);
    }

    // Clear after animation
    setTimeout(() => {
        clearContainer(container);
    }, FIREWORK_CLEANUP_DELAY);
}

/**
 * Triggers an intermission mini-game
 * Dynamically imports minigame modules to avoid initial load bloat
 */
export function triggerIntermission() {
    gameState.isInIntermission = true;

    const intermissionContainer = document.getElementById('intermission-container');
    intermissionContainer.classList.remove('hidden');

    // Hide inventory area during minigame
    const inventoryArea = document.getElementById('inventory-area');
    if (inventoryArea) {
        inventoryArea.classList.add('hidden');
    }

    // Randomly select a mini-game
    const games = ['mud-wash', 'sticker-shop', 'big-jump', 'bubble-wrap', 'fuel-up'];
    const selectedGame = games[Math.floor(Math.random() * games.length)];

    // Dynamic imports for minigames
    switch (selectedGame) {
        case 'mud-wash':
            import('./minigames/mud-wash.js').then(({ startMudWashGame }) => startMudWashGame());
            break;
        case 'sticker-shop':
            import('./minigames/sticker-shop.js').then(({ startStickerShopGame }) => startStickerShopGame());
            break;
        case 'big-jump':
            import('./minigames/big-jump.js').then(({ startBigJumpGame }) => startBigJumpGame());
            break;
        case 'bubble-wrap':
            import('./minigames/bubble-wrap.js').then(({ startBubbleWrapGame }) => startBubbleWrapGame());
            break;
        case 'fuel-up':
            import('./minigames/fuel-up.js').then(({ startFuelUpGame }) => startFuelUpGame());
            break;
    }
}

/**
 * Ends the intermission and returns to normal gameplay
 */
export function endIntermission() {
    // Clean up event listeners to prevent memory leaks
    import('./minigames/mud-wash.js').then(({ cleanupMudWashListeners }) => cleanupMudWashListeners());
    import('./minigames/sticker-shop.js').then(({ cleanupStickerListeners }) => cleanupStickerListeners());

    const intermissionContainer = document.getElementById('intermission-container');
    intermissionContainer.classList.add('hidden');

    // Hide all mini-games
    document.querySelectorAll('.mini-game').forEach(game => {
        game.classList.add('hidden');
    });

    // Show inventory area when returning to gameplay
    const inventoryArea = document.getElementById('inventory-area');
    if (inventoryArea) {
        inventoryArea.classList.remove('hidden');
    }

    gameState.isInIntermission = false;

    // Continue to next level
    gameState.levelCount++;
    import('./levels.js').then(({ generateLevel }) => {
        import('./drag-drop.js').then(({ handleDragStart }) => {
            generateLevel(gameState.levelCount, handleDragStart);
        });
    });
}
