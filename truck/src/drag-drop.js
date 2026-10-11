// ===================================
// DRAG AND DROP SYSTEM MODULE
// ===================================

import { gameState } from './state.js';
import { validateMatch, handleSuccessfulMatch, handleFailedMatch } from './match-validation.js';

/**
 * Handles the start of a drag operation
 * @param {Event} e - Mouse or touch event
 */
export function handleDragStart(e) {
    e.preventDefault();

    // Prevent starting a new drag if one is already in progress
    // This prevents the multi-touch bug where touching/clicking a second item
    // while dragging another causes the first item to get stuck
    if (gameState.currentDragItem) {
        return;
    }

    // Block drag during level complete drive-off or mini-game intermission
    if (gameState.levelCompleting || gameState.isInIntermission) {
        return;
    }

    const item = e.currentTarget;
    gameState.currentDragItem = item;

    // Get touch or mouse position
    const touch = e.type === 'touchstart' ? e.touches?.[0] : null;
    if (e.type === 'touchstart' && !touch) {
        gameState.currentDragItem = null;
        return;
    }
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;

    // Get current viewport position BEFORE changing anything
    const rect = item.getBoundingClientRect();

    // Calculate offset (where in the item did user click)
    gameState.dragOffset.x = clientX - rect.left;
    gameState.dragOffset.y = clientY - rect.top;

    // Store original parent and position to restore later
    item._originalParent = item.parentElement;
    item._originalNextSibling = item.nextSibling;

    // CRITICAL: Move item to body FIRST
    // The parent has backdrop-filter which creates a new containing block
    // This makes position:fixed relative to the parent, not the viewport!
    // Moving to body ensures position:fixed works relative to viewport
    document.body.appendChild(item);

    // Change to fixed positioning
    item.style.position = 'fixed';
    item.style.zIndex = '1000';
    item.style.pointerEvents = 'none';

    // Remove animations that interfere with positioning
    item.style.animation = 'none';

    // Add dragging class (which now has no transforms)
    item.classList.add('dragging');
    item.setAttribute('aria-grabbed', 'true');

    // Use transform for positioning (GPU accelerated)
    // Set initial position to where item currently is (in viewport coords)
    item.style.left = '0px';
    item.style.top = '0px';
    item.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;

    // Cache slot positions for fast collision detection (avoid repeated getBoundingClientRect)
    const slots = document.querySelectorAll('.slot');
    gameState.slotRects = Array.from(slots).map(slot => ({
        element: slot,
        rect: slot.getBoundingClientRect()
    }));

    // Add move and end listeners
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);
}

/**
 * Handles drag movement with requestAnimationFrame throttling
 * @param {Event} e - Mouse or touch event
 */
export function handleDragMove(e) {
    if (!gameState.currentDragItem) return;

    e.preventDefault();

    const touch = e.type === 'touchmove' ? e.touches?.[0] : null;
    if (e.type === 'touchmove' && !touch) return;
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;

    // Cancel any pending animation frame to avoid stacking
    if (gameState.rafId) {
        cancelAnimationFrame(gameState.rafId);
    }

    // Use requestAnimationFrame for smooth 60fps updates
    gameState.rafId = requestAnimationFrame(() => {
        const item = gameState.currentDragItem;
        if (!item) return;

        // Use transform for GPU-accelerated positioning
        const x = clientX - gameState.dragOffset.x;
        const y = clientY - gameState.dragOffset.y;
        item.style.transform = `translate3d(${x}px, ${y}px, 0)`;

        // Visual feedback: highlight slot being hovered over
        const slot = findSlotAtPosition(clientX, clientY);

        // Only update slot highlights if the hovered slot changed (avoid unnecessary DOM manipulation)
        if (slot !== gameState.currentHoverSlot) {
            // Remove highlight from previous slot
            if (gameState.currentHoverSlot) {
                gameState.currentHoverSlot.classList.remove('hover-highlight');
            }

            // Add highlight to new slot if it's not filled
            if (slot && !slot.classList.contains('filled')) {
                slot.classList.add('hover-highlight');
            }

            gameState.currentHoverSlot = slot;
        }

        gameState.rafId = null;
    });
}

/**
 * Handles the end of a drag operation
 * @param {Event} e - Mouse or touch event
 */
export function handleDragEnd(e) {
    if (!gameState.currentDragItem) return;

    const item = gameState.currentDragItem;
    const touch = e.type === 'touchend' ? e.changedTouches?.[0] : null;
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;

    // Remove highlight from current hover slot
    if (gameState.currentHoverSlot) {
        gameState.currentHoverSlot.classList.remove('hover-highlight');
        gameState.currentHoverSlot = null;
    }

    // Check if dropped on a slot
    const slot = findSlotAtPosition(clientX, clientY);

    if (slot && !slot.classList.contains('filled')) {
        const isMatch = validateMatch(item, slot);

        if (isMatch) {
            handleSuccessfulMatch(item, slot);
        } else {
            handleFailedMatch(item);
        }
    } else {
        handleFailedMatch(item);
    }

    // Cleanup
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchend', handleDragEnd);

    // Cancel any pending animation frame
    if (gameState.rafId) {
        cancelAnimationFrame(gameState.rafId);
        gameState.rafId = null;
    }

    // Clear cached slot positions
    gameState.slotRects = [];

    gameState.currentDragItem = null;
}

/**
 * Finds a slot element at the given viewport coordinates
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {HTMLElement|null} The slot element or null
 */
export function findSlotAtPosition(x, y) {
    // Use cached slot positions for performance (avoid repeated getBoundingClientRect)
    for (const {element, rect} of gameState.slotRects) {
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            return element;
        }
    }
    return null;
}
