// ===================================
// CONSTANTS
// ===================================
// Extracted from script.js to eliminate magic numbers
// and enable easy configuration adjustments

// ===================================
// SIZE CONSTANTS
// ===================================

export const SLOT_SIZE_LARGE = 120;
export const SLOT_SIZE_SMALL = 80;
export const BRUSH_RADIUS = 30;
export const CONFETTI_COUNT = 50;
export const FIREWORK_COUNT = 30;

// ===================================
// TIMING CONSTANTS (milliseconds)
// ===================================

export const BOUNCE_ANIMATION_DURATION = 500;
export const LEVEL_COMPLETE_DELAY = 1500;
export const CELEBRATION_DURATION = 2000;
export const CONFETTI_CLEANUP_DELAY = 3000;
export const FIREWORK_CLEANUP_DELAY = 2000;

// ===================================
// GAMEPLAY CONSTANTS
// ===================================

// Tier thresholds define when players advance to next difficulty tier
// Compressed so challenge arrives sooner (was 3/6/9/12)
export const TIER_THRESHOLDS = {
    TIER_1: 2,   // Levels 1-2
    TIER_2: 5,   // Levels 3-5
    TIER_3: 8,   // Levels 6-8
    TIER_4: 11   // Levels 9-11
    // Level 12+ is endless mode with all features unlocked
};

// How many levels before an intermission mini-game
export const INTERMISSION_FREQUENCY = 3;

// Mud wash completion threshold (percentage)
export const MUD_WASH_COMPLETION_THRESHOLD = 99;

// Fuel-up mini-game: each pump tap fills this much of the tank
export const FUEL_PUMP_FILL_AMOUNT = 12;
export const FUEL_TANK_FULL = 100;

// ===================================
// RESPONSIVE BREAKPOINTS (pixels)
// ===================================

export const BREAKPOINT_TABLET = 768;
export const BREAKPOINT_MOBILE = 480;

// ===================================
// GRID CONFIGURATIONS
// ===================================

// Bubble wrap grid sizing for different screen sizes
export const BUBBLE_GRID_MOBILE = {
    rows: 4,
    cols: 3
};

export const BUBBLE_GRID_SMALL = {
    rows: 3,
    cols: 2
};

// Default desktop bubble grid
export const BUBBLE_GRID_DEFAULT = {
    rows: 3,
    cols: 4
};

// ===================================
// LEVEL GENERATION CONSTANTS
// ===================================

// Number of targets and inventory items per tier
// Higher target/inventory counts + earlier size keep mid-game from feeling trivial
export const TIER_CONFIG = {
    TIER_1: {
        numTargets: 1,
        numInventory: 3,
        useSize: false
    },
    TIER_2: {
        numTargets: 2,
        numInventory: 5,
        useSize: false
    },
    TIER_3: {
        numTargetsMin: 3,
        numTargetsMax: 3,
        numInventory: 6,
        useSize: false
    },
    TIER_4: {
        numTargets: 4,
        numInventory: 7,
        useSize: true
    },
    ENDLESS: {
        numTargetsMin: 4,
        numTargetsMax: 5,
        numInventoryMin: 7,
        numInventoryMax: 9,
        // useSize when Math.random() > useSizeChance → lower = size more often
        useSizeChance: 0.25
    }
};

// ===================================
// FIREWORK ANIMATION CONSTANTS
// ===================================

/** Burst offset jitter in px (applied to --tx/--ty). */
export const FIREWORK_POSITION_VARIANCE = {
    horizontal: 40,
    vertical: 40
};

export const FIREWORK_POSITION_CENTER = {
    left: 50,  // 50% from left
    top: 30    // 30% from top
};

/** Radial burst distance in px for --tx/--ty. */
export const FIREWORK_DISTANCE_MIN = 60;
export const FIREWORK_DISTANCE_MAX = 180;

// ===================================
// PERFORMANCE CONSTANTS
// ===================================

// Progress update throttling for mud wash (milliseconds)
export const PROGRESS_UPDATE_INTERVAL = 100; // Max 10fps
