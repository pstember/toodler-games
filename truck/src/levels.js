// ===================================
// LEVEL GENERATION MODULE
// ===================================

import {
    SLOT_SIZE_LARGE,
    SLOT_SIZE_SMALL,
    TIER_THRESHOLDS,
    TIER_CONFIG
} from './constants.js';
import { gameState, ALL_SHAPES, ALL_COLORS } from './state.js';
import { clearContainer, shuffleArray } from './utils.js';

/**
 * Get unlocked shapes based on current level
 * @param {number} level - Current level number
 * @returns {string[]} Array of unlocked shape names
 */
export function getUnlockedShapes(level) {
    if (level <= TIER_THRESHOLDS.TIER_1) {
        return ['circle', 'square']; // Tier 1 (1-2): 2 shapes
    } else if (level <= TIER_THRESHOLDS.TIER_2) {
        return ['circle', 'square', 'triangle']; // Tier 2 (3-5): 3 shapes
    } else if (level <= TIER_THRESHOLDS.TIER_3) {
        return ['circle', 'square', 'triangle', 'star', 'heart']; // Tier 3 (6-8): 5 shapes
    } else if (level <= TIER_THRESHOLDS.TIER_4) {
        return ['circle', 'square', 'triangle', 'star', 'heart', 'pentagon', 'hexagon']; // Tier 4 (9-11): 7 shapes
    } else {
        return ALL_SHAPES; // Endless (12+): all 8 shapes
    }
}

/**
 * Get unlocked colors based on current level
 * @param {number} level - Current level number
 * @returns {string[]} Array of unlocked color names
 */
export function getUnlockedColors(level) {
    if (level <= TIER_THRESHOLDS.TIER_1) {
        return ['red']; // Tier 1 (1-2): 1 color
    } else if (level <= TIER_THRESHOLDS.TIER_2) {
        return ['red', 'blue']; // Tier 2 (3-5): 2 colors
    } else if (level <= TIER_THRESHOLDS.TIER_3) {
        return ['red', 'blue', 'green', 'yellow']; // Tier 3 (6-8): 4 colors
    } else if (level <= TIER_THRESHOLDS.TIER_4) {
        return ['red', 'blue', 'green', 'yellow', 'purple', 'orange']; // Tier 4 (9-11): 6 colors
    } else {
        return ALL_COLORS; // Endless (12+): all 8 colors (includes pink, cyan)
    }
}

/**
 * Creates a slot element for a specific shape, color, and size
 * @param {string} shape - Shape name
 * @param {string} color - Color name
 * @param {string} size - Size ('large' or 'small')
 * @param {Function} handleDragStart - Drag start handler
 * @returns {HTMLElement} Slot element
 */
export function createSlot(shape, color, size) {
    const slot = document.createElement('div');
    slot.className = `slot size-${size}`;
    slot.dataset.requiredShape = shape;
    slot.dataset.requiredColor = color;
    slot.dataset.requiredSize = size;

    // ARIA accessibility
    slot.setAttribute('role', 'button');
    slot.setAttribute('aria-label', `Drop zone for ${size} ${color} ${shape}`);
    slot.setAttribute('tabindex', '0');

    // Set size based on size parameter
    const slotSize = size === 'large' ? SLOT_SIZE_LARGE : SLOT_SIZE_SMALL;
    slot.style.width = `${slotSize}px`;
    slot.style.height = `${slotSize}px`;

    // Add visual outline showing what shape is needed
    const outline = document.createElement('div');
    outline.className = `slot-outline shape ${shape} color-${color} size-${size}`;
    outline.dataset.shape = shape;
    outline.dataset.color = color;
    outline.dataset.size = size;
    slot.appendChild(outline);

    return slot;
}

/**
 * Creates a draggable item element
 * @param {string} shape - Shape name
 * @param {string} color - Color name
 * @param {string} size - Size ('large' or 'small')
 * @param {Function} handleDragStart - Drag start handler
 * @returns {HTMLElement} Draggable item element
 */
export function createDraggableItem(shape, color, size, handleDragStart) {
    const item = document.createElement('div');
    item.className = `draggable-item shape ${shape} color-${color} size-${size}`;
    item.dataset.shape = shape;
    item.dataset.color = color;
    item.dataset.size = size;

    // ARIA accessibility
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `Draggable ${size} ${color} ${shape}`);
    item.setAttribute('aria-grabbed', 'false');
    item.setAttribute('tabindex', '0');

    // Store original position
    setTimeout(() => {
        const rect = item.getBoundingClientRect();
        item.dataset.originalX = rect.left;
        item.dataset.originalY = rect.top;
    }, 0);

    // Add event listeners
    item.addEventListener('mousedown', handleDragStart);
    item.addEventListener('touchstart', handleDragStart);

    return item;
}

/**
 * Gets tier configuration based on level
 * @param {number} level - Current level
 * @returns {Object} Configuration with numTargets, numInventory, useSize
 */
function getTierConfiguration(level) {
    if (level <= TIER_THRESHOLDS.TIER_1) {
        return {
            numTargets: TIER_CONFIG.TIER_1.numTargets,
            numInventory: TIER_CONFIG.TIER_1.numInventory,
            useSize: TIER_CONFIG.TIER_1.useSize
        };
    } else if (level <= TIER_THRESHOLDS.TIER_2) {
        return {
            numTargets: TIER_CONFIG.TIER_2.numTargets,
            numInventory: TIER_CONFIG.TIER_2.numInventory,
            useSize: TIER_CONFIG.TIER_2.useSize
        };
    } else if (level <= TIER_THRESHOLDS.TIER_3) {
        return {
            numTargets: TIER_CONFIG.TIER_3.numTargetsMin + Math.floor(Math.random() * (TIER_CONFIG.TIER_3.numTargetsMax - TIER_CONFIG.TIER_3.numTargetsMin + 1)),
            numInventory: TIER_CONFIG.TIER_3.numInventory,
            useSize: TIER_CONFIG.TIER_3.useSize
        };
    } else if (level <= TIER_THRESHOLDS.TIER_4) {
        return {
            numTargets: TIER_CONFIG.TIER_4.numTargets,
            numInventory: TIER_CONFIG.TIER_4.numInventory,
            useSize: TIER_CONFIG.TIER_4.useSize
        };
    } else {
        // Endless mode: randomize difficulty
        return {
            numTargets: TIER_CONFIG.ENDLESS.numTargetsMin + Math.floor(Math.random() * (TIER_CONFIG.ENDLESS.numTargetsMax - TIER_CONFIG.ENDLESS.numTargetsMin + 1)),
            numInventory: TIER_CONFIG.ENDLESS.numInventoryMin + Math.floor(Math.random() * (TIER_CONFIG.ENDLESS.numInventoryMax - TIER_CONFIG.ENDLESS.numInventoryMin + 1)),
            useSize: Math.random() > TIER_CONFIG.ENDLESS.useSizeChance
        };
    }
}

/**
 * Generates unique slot requirements
 * @param {number} numTargets - Number of slots to generate
 * @param {string[]} shapes - Available shapes
 * @param {string[]} colors - Available colors
 * @param {boolean} useSize - Whether to vary size
 * @returns {Object[]} Array of slot requirements
 */
function generateSlotRequirements(numTargets, shapes, colors, useSize) {
    const requirements = [];
    const maxAttempts = 100;

    for (let i = 0; i < numTargets; i++) {
        let shape, color, size;
        let attempts = 0;

        do {
            shape = shapes[Math.floor(Math.random() * shapes.length)];
            color = colors[Math.floor(Math.random() * colors.length)];
            size = useSize ? (Math.random() > 0.5 ? 'large' : 'small') : 'large';
            attempts++;

            if (attempts >= maxAttempts) break;
        } while (requirements.some(req =>
            req.shape === shape && req.color === color && req.size === size
        ));

        requirements.push({ shape, color, size });
    }

    return requirements;
}

/**
 * Build a near-miss distractor that shares shape or color with a slot.
 * Makes wrong picks feel close so matching stays engaging longer.
 * @param {Object[]} slotReqs - Slot requirements to almost-match
 * @param {string[]} shapes - Available shapes
 * @param {string[]} colors - Available colors
 * @param {boolean} useSize - Whether to vary size
 * @param {Object[]} existingItems - Items already in inventory (avoid dupes)
 * @returns {Object|null} Distractor item or null if none found
 */
export function createNearMissDistractor(slotReqs, shapes, colors, useSize, existingItems = []) {
    if (!slotReqs.length || !shapes.length || !colors.length) {
        return null;
    }

    const sizes = useSize ? ['large', 'small'] : ['large'];

    const isTaken = (candidate) =>
        existingItems.some(item =>
            item.shape === candidate.shape &&
            item.color === candidate.color &&
            item.size === candidate.size
        ) ||
        slotReqs.some(req =>
            req.shape === candidate.shape &&
            req.color === candidate.color &&
            req.size === candidate.size
        );

    const nearMissCandidates = [];
    const otherCandidates = [];

    for (const shape of shapes) {
        for (const color of colors) {
            for (const size of sizes) {
                const candidate = { shape, color, size };
                if (isTaken(candidate)) continue;

                const isNearMiss = slotReqs.some(req =>
                    (req.shape === shape && req.color !== color) ||
                    (req.color === color && req.shape !== shape) ||
                    (useSize && req.shape === shape && req.color === color && req.size !== size)
                );

                if (isNearMiss) {
                    nearMissCandidates.push(candidate);
                } else {
                    otherCandidates.push(candidate);
                }
            }
        }
    }

    const pool = nearMissCandidates.length > 0 ? nearMissCandidates : otherCandidates;
    if (pool.length === 0) {
        return null;
    }

    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Generates inventory items (correct matches + near-miss distractors)
 * @param {Object[]} slotReqs - Slot requirements
 * @param {number} numInventory - Total inventory size
 * @param {string[]} shapes - Available shapes
 * @param {string[]} colors - Available colors
 * @param {boolean} useSize - Whether to vary size
 * @returns {Object[]} Array of inventory items
 */
function generateInventoryItems(slotReqs, numInventory, shapes, colors, useSize) {
    const items = [];

    // Add correct matches
    slotReqs.forEach(req => items.push({ ...req }));

    // Calculate safe inventory size
    const possibleSizes = useSize ? 2 : 1;
    const maxUnique = shapes.length * colors.length * possibleSizes;
    const safeSize = Math.min(numInventory, maxUnique);
    const numDistractors = safeSize - slotReqs.length;

    for (let i = 0; i < numDistractors; i++) {
        const distractor = createNearMissDistractor(
            slotReqs,
            shapes,
            colors,
            useSize,
            items
        );

        if (distractor) {
            items.push(distractor);
        } else {
            break;
        }
    }

    return items;
}

/**
 * Renders slots, inventory, and updates UI
 * @param {Object[]} slotReqs - Slot requirements
 * @param {Object[]} items - Inventory items
 * @param {Function} dragHandler - Drag start handler
 * @param {number} level - Current level number
 */
function renderGameElements(slotReqs, items, dragHandler, level) {
    const slotsContainer = document.getElementById('slots-container');
    const inventoryContainer = document.getElementById('inventory-items');

    // Render slots
    slotReqs.forEach(req => {
        const slot = createSlot(req.shape, req.color, req.size);
        slotsContainer.appendChild(slot);
        gameState.slots.push({
            shape: req.shape,
            color: req.color,
            size: req.size,
            filled: false,
            element: slot
        });
    });

    // Shuffle and render inventory
    shuffleArray(items);
    items.forEach(item => {
        const draggable = createDraggableItem(item.shape, item.color, item.size, dragHandler);
        inventoryContainer.appendChild(draggable);
    });

    // Update UI
    const levelNumber = document.getElementById('level-number');
    if (levelNumber) levelNumber.textContent = level;

    const truck = document.getElementById('monster-truck');
    if (truck) {
        truck.classList.remove('driving-off');
        truck.style.transform = '';
    }
}

/**
 * Generates a new level with slots and inventory items
 * @param {number} level - Level number to generate
 * @param {Function} handleDragStart - Drag start handler to attach to items
 */
export function generateLevel(level, handleDragStart) {
    try {
        gameState.levelCompleting = false;

        const unlockedShapes = getUnlockedShapes(level);
        const unlockedColors = getUnlockedColors(level);
        const config = getTierConfiguration(level);

        // Clear previous level
        gameState.slots = [];
        gameState.inventory = [];
        gameState.slotRects = [];
        gameState.levelCompleting = false;

        const slotsContainer = document.getElementById('slots-container');
        const inventoryContainer = document.getElementById('inventory-items');

        if (!slotsContainer || !inventoryContainer) {
            return;
        }

        clearContainer(slotsContainer);
        clearContainer(inventoryContainer);

        // Generate and render level
        const slotReqs = generateSlotRequirements(
            config.numTargets,
            unlockedShapes,
            unlockedColors,
            config.useSize
        );

        const items = generateInventoryItems(
            slotReqs,
            config.numInventory,
            unlockedShapes,
            unlockedColors,
            config.useSize
        );

        renderGameElements(slotReqs, items, handleDragStart, level);

    } catch (error) {
        console.error('Failed to generate level:', error);
        const shouldReload = confirm('An error occurred. Would you like to reload the game?');
        if (shouldReload) {
            window.location.reload();
        }
    }
}
