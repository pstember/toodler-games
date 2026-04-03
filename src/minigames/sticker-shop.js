// ===================================
// STICKER SHOP MINI-GAME MODULE
// ===================================

import { playSound } from '../utils.js';

// Store sticker listeners for cleanup
let stickerListeners = [];

/**
 * Starts the sticker shop mini-game
 */
export function startStickerShopGame() {
    const game = document.getElementById('sticker-shop-game');
    game.classList.remove('hidden');

    const truckArea = document.getElementById('sticker-truck-area');

    // Clean up old sticker listeners first
    cleanupStickerListeners();

    // Reset stickers
    const stickers = document.querySelectorAll('.sticker');
    stickers.forEach(sticker => {
        sticker.classList.remove('placed');
        sticker.style.position = '';
        sticker.style.left = '';
        sticker.style.top = '';

        // Add drag handlers (store for cleanup)
        sticker.addEventListener('mousedown', handleStickerDragStart);
        sticker.addEventListener('touchstart', handleStickerDragStart);

        // Store listener info for cleanup
        stickerListeners.push({
            element: sticker,
            listeners: [
                { type: 'mousedown', handler: handleStickerDragStart },
                { type: 'touchstart', handler: handleStickerDragStart }
            ]
        });
    });

    let gameEnding = false; // Prevent multiple clicks

    // Done button
    const doneBtn = document.getElementById('sticker-done-btn');
    doneBtn.onclick = () => {
        if (!gameEnding) {
            gameEnding = true;
            playSound('sticker');
            // Dynamic import to avoid circular dependency
            import('../visual-effects.js').then(({ endIntermission }) => {
                endIntermission();
            });
        }
    };
}

/**
 * Cleans up sticker shop event listeners to prevent memory leaks
 */
export function cleanupStickerListeners() {
    stickerListeners.forEach(({ element, listeners }) => {
        listeners.forEach(({ type, handler }) => {
            element.removeEventListener(type, handler);
        });
    });
    stickerListeners = [];
}

/**
 * Handles the start of sticker drag operation
 * @param {Event} e - Mouse or touch event
 */
function handleStickerDragStart(e) {
    e.preventDefault();

    const sticker = e.currentTarget;
    const startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    const rect = sticker.getBoundingClientRect();
    const offsetX = startX - rect.left;
    const offsetY = startY - rect.top;

    function handleMove(e) {
        const x = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const y = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        sticker.style.position = 'fixed';
        sticker.style.left = `${x - offsetX}px`;
        sticker.style.top = `${y - offsetY}px`;
        sticker.style.zIndex = '1000';
    }

    function handleEnd() {
        sticker.classList.add('placed');
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchend', handleEnd);
    }

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);
}
