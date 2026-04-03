// ===================================
// BUBBLE WRAP MINI-GAME MODULE
// ===================================

import {
    BREAKPOINT_TABLET,
    BREAKPOINT_MOBILE,
    BUBBLE_GRID_SMALL,
    BUBBLE_GRID_MOBILE,
    BUBBLE_GRID_DEFAULT
} from '../constants.js';
import { playSound, clearContainer } from '../utils.js';

/**
 * Starts the bubble wrap mini-game
 */
export function startBubbleWrapGame() {
    const game = document.getElementById('bubble-wrap-game');
    game.classList.remove('hidden');

    const bubbleGrid = document.getElementById('bubble-grid');
    const bubblesPopped = document.getElementById('bubbles-popped');
    const bubblesTotal = document.getElementById('bubbles-total');

    // Determine grid size based on screen size
    const isMobile = window.innerWidth <= BREAKPOINT_TABLET;
    const isSmallMobile = window.innerWidth <= BREAKPOINT_MOBILE;

    let rows, cols;
    if (isSmallMobile) {
        rows = BUBBLE_GRID_SMALL.rows;
        cols = BUBBLE_GRID_SMALL.cols;
    } else if (isMobile) {
        rows = BUBBLE_GRID_MOBILE.rows;
        cols = BUBBLE_GRID_MOBILE.cols;
    } else {
        rows = BUBBLE_GRID_DEFAULT.rows;
        cols = BUBBLE_GRID_DEFAULT.cols;
    }

    const totalBubbles = rows * cols;
    let poppedCount = 0;

    // Update grid layout
    bubbleGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    bubbleGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    // Update total counter
    bubblesTotal.textContent = totalBubbles;
    bubblesPopped.textContent = '0';

    // Clear existing bubbles
    clearContainer(bubbleGrid);

    // Create bubbles
    for (let i = 0; i < totalBubbles; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.dataset.index = i;

        bubble.onclick = () => {
            if (!bubble.classList.contains('popped')) {
                bubble.classList.add('popped');
                poppedCount++;
                bubblesPopped.textContent = poppedCount;
                playSound('pop');

                // Check if all bubbles are popped
                if (poppedCount === totalBubbles) {
                    setTimeout(() => {
                        playSound('success');
                        // Dynamic import to avoid circular dependency
                        import('../visual-effects.js').then(({ endIntermission }) => {
                            endIntermission();
                        });
                    }, 500);
                }
            }
        };

        bubbleGrid.appendChild(bubble);
    }
}
