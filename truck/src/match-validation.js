// ===================================
// MATCH VALIDATION MODULE
// ===================================

import {
    BOUNCE_ANIMATION_DURATION,
    LEVEL_COMPLETE_DELAY,
    CELEBRATION_DURATION,
    INTERMISSION_FREQUENCY
} from './constants.js';
import { gameState } from './state.js';
import { playSound } from './utils.js';
import {
    createConfetti,
    showCelebrationOverlay,
    hideCelebrationOverlay,
    triggerIntermission
} from './visual-effects.js';
import { generateLevel } from './levels.js';
import { handleDragStart } from './drag-drop.js';

/**
 * Validates if an item matches a slot's requirements
 * @param {HTMLElement} item - The draggable item
 * @param {HTMLElement} slot - The target slot
 * @returns {boolean} True if item matches slot requirements
 */
export function validateMatch(item, slot) {
    const itemShape = item.dataset.shape;
    const itemColor = item.dataset.color;
    const itemSize = item.dataset.size;

    const requiredShape = slot.dataset.requiredShape;
    const requiredColor = slot.dataset.requiredColor;
    const requiredSize = slot.dataset.requiredSize;

    return itemShape === requiredShape &&
           itemColor === requiredColor &&
           itemSize === requiredSize;
}

/**
 * Handles a successful match between item and slot
 * @param {HTMLElement} item - The matched item
 * @param {HTMLElement} slot - The target slot
 */
export function handleSuccessfulMatch(item, slot) {
    playSound('success');

    // Remove from inventory
    item.remove();

    // Clone and place in slot
    const clone = item.cloneNode(true);
    clone.style.position = 'relative';
    clone.style.left = '';
    clone.style.top = '';
    clone.style.transform = '';
    clone.style.pointerEvents = 'none';
    clone.classList.remove('dragging');
    clone.classList.add('snapping');

    slot.appendChild(clone);
    slot.classList.add('filled');

    // Update game state
    const slotData = gameState.slots.find(s => s.element === slot);
    if (slotData) {
        slotData.filled = true;
    }

    // Check if level complete
    setTimeout(() => {
        checkLevelComplete();
    }, 300);
}

/**
 * Handles a failed match attempt
 * @param {HTMLElement} item - The item that failed to match
 */
export function handleFailedMatch(item) {
    playSound('tryAgain');

    // Restore to original parent if it was moved
    if (item._originalParent) {
        if (item._originalNextSibling) {
            item._originalParent.insertBefore(item, item._originalNextSibling);
        } else {
            item._originalParent.appendChild(item);
        }
        delete item._originalParent;
        delete item._originalNextSibling;
    }

    // Bounce back to inventory
    item.classList.remove('dragging');
    item.setAttribute('aria-grabbed', 'false');
    item.classList.add('bouncing');
    item.style.position = 'relative';
    item.style.left = '';
    item.style.top = '';
    item.style.transform = '';
    item.style.zIndex = '';
    item.style.pointerEvents = '';

    // Restore animations
    item.style.animation = '';

    setTimeout(() => {
        item.classList.remove('bouncing');
    }, BOUNCE_ANIMATION_DURATION);
}

/**
 * Checks if the level is complete and triggers next actions
 */
export function checkLevelComplete() {
    const allFilled = gameState.slots.every(slot => slot.filled);

    // Prevent race condition: only trigger once even if multiple matches happen rapidly
    if (allFilled && !gameState.levelCompleting) {
        gameState.levelCompleting = true;
        playSound('levelComplete');

        // Drive off animation
        const truck = document.getElementById('monster-truck');
        truck.classList.add('driving-off');

        createConfetti();

        // Check for tier completion (every 3 levels)
        gameState.intermissionCounter++;

        setTimeout(() => {
            if (gameState.intermissionCounter % INTERMISSION_FREQUENCY === 0) {
                playSound('tierComplete');
                showCelebrationOverlay();
                setTimeout(() => {
                    hideCelebrationOverlay();
                    triggerIntermission();
                }, CELEBRATION_DURATION);
            } else {
                // Next level
                gameState.levelCount++;
                generateLevel(gameState.levelCount, handleDragStart);
            }
        }, LEVEL_COMPLETE_DELAY);
    }
}
