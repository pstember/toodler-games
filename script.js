// ===================================
// MONSTER TRUCK MATCH - MAIN ENTRY POINT
// ===================================

// Import configuration and state
import { gameState } from './src/state.js';

// Import translation system
import { setLanguage, getCurrentLanguage } from './src/translations.js';

// Import utility functions
import { playSound } from './src/utils.js';

// Import level generation
import { generateLevel } from './src/levels.js';

// Import drag and drop system
import { handleDragStart, findSlotAtPosition } from './src/drag-drop.js';

// Import match validation
import { validateMatch } from './src/match-validation.js';

// Import level generation helpers
import { getUnlockedShapes, getUnlockedColors, createSlot, createDraggableItem } from './src/levels.js';

// Import utilities
import { shuffleArray, clearContainer } from './src/utils.js';

// Import minigame functions
import { startMudWashGame } from './src/minigames/mud-wash.js';
import { startStickerShopGame } from './src/minigames/sticker-shop.js';
import { startBigJumpGame } from './src/minigames/big-jump.js';
import { startBubbleWrapGame } from './src/minigames/bubble-wrap.js';

// ===================================
// EXPOSE FUNCTIONS FOR TESTING
// ===================================
// Playwright tests use page.evaluate() which needs global scope access
if (typeof window !== 'undefined') {
    window.validateMatch = validateMatch;
    window.getUnlockedShapes = getUnlockedShapes;
    window.getUnlockedColors = getUnlockedColors;
    window.createSlot = createSlot;
    window.createDraggableItem = createDraggableItem;
    window.shuffleArray = shuffleArray;
    window.clearContainer = clearContainer;
    window.findSlotAtPosition = findSlotAtPosition;
    window.generateLevel = generateLevel;
    window.gameState = gameState;
    window.handleDragStart = handleDragStart;
}

// ===================================
// INITIALIZE GAME
// ===================================

document.addEventListener('DOMContentLoaded', () => {

    // Initialize language
    const currentLanguage = getCurrentLanguage();
    const languageSelect = document.getElementById('language-select');
    languageSelect.value = currentLanguage;
    setLanguage(currentLanguage);

    // Handle language change
    languageSelect.addEventListener('change', (e) => {
        setLanguage(e.target.value);
    });

    // Handle start game button
    const startGameBtn = document.getElementById('start-game-btn');
    const splashScreen = document.getElementById('splash-screen');
    const gameContainer = document.getElementById('game-container');

    startGameBtn.addEventListener('click', () => {
        playSound('success');

        // Hide splash screen
        splashScreen.classList.add('hidden');

        // Show game container
        gameContainer.classList.remove('hidden');

        // Check for URL parameters to trigger specific mini-games (for testing)
        const urlParams = new URLSearchParams(window.location.search);
        const testMinigame = urlParams.get('minigame');

        if (testMinigame) {

            // Set level to 0 so endIntermission increments to 1 (not 2)
            gameState.levelCount = 0;

            // Manually show intermission container
            const intermissionContainer = document.getElementById('intermission-container');
            intermissionContainer.classList.remove('hidden');
            gameState.isInIntermission = true;

            // Hide all mini-games first
            document.querySelectorAll('.mini-game').forEach(g => g.classList.add('hidden'));

            // Show specific mini-game
            setTimeout(() => {
                switch (testMinigame) {
                    case 'mud-wash':
                    case 'wash':
                        startMudWashGame();
                        break;
                    case 'sticker-shop':
                    case 'stickers':
                        startStickerShopGame();
                        break;
                    case 'big-jump':
                    case 'jump':
                        startBigJumpGame();
                        break;
                    case 'bubble-wrap':
                    case 'bubbles':
                        startBubbleWrapGame();
                        break;
                    default:
                        console.error(`Unknown mini-game: ${testMinigame}. Available: mud-wash, sticker-shop, big-jump, bubble-wrap`);
                        // Show normal game if unknown
                        intermissionContainer.classList.add('hidden');
                        gameState.isInIntermission = false;
                        generateLevel(gameState.levelCount, handleDragStart);
                }
            }, 100);
        } else {
            // Start normal game
            generateLevel(gameState.levelCount, handleDragStart);
        }
    });
});
