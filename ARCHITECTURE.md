# Architecture Documentation

## Overview

Toddler Monster Truck Match is a browser-based drag-and-drop matching game built with vanilla JavaScript, HTML5, and CSS3. The architecture prioritizes simplicity, performance, and accessibility for young children.

## Core Principles

1. **Zero Dependencies**: No external libraries or frameworks
2. **Progressive Enhancement**: Works on all modern browsers
3. **Touch-First Design**: Optimized for mobile devices
4. **Immutable State**: All state changes create new objects
5. **Modular Code**: Small, focused files and functions

## File Structure

```
toddler-truck-game/
├── index.html              # Main entry point
├── script.js              # Main game logic (to be refactored into src/)
├── style.css              # All styles
├── assets/                # Images and media
│   ├── images/            # Tire images
│   ├── sounds/            # Audio files (optional)
│   └── monster_truck.png  # Main truck image
├── tests/                 # Test suite
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   ├── e2e/               # End-to-end tests
│   └── helpers/           # Test utilities
└── src/ (planned)         # Modular code structure
    ├── constants.js       # Configuration constants
    ├── state.js           # State management
    ├── translations.js    # Internationalization
    ├── levels.js          # Level generation
    ├── drag-drop.js       # Drag-and-drop system
    ├── match-validation.js # Matching logic
    ├── visual-effects.js  # Animations
    ├── minigames/         # Mini-game modules
    └── utils.js           # Helper functions
```

## Progressive Difficulty System

The game uses a tier-based progression system that gradually introduces complexity:

### Tier Algorithm

```javascript
const TIER_THRESHOLDS = [3, 6, 9, 12];

function getTier(level) {
    if (level <= TIER_THRESHOLDS[0]) return 1;  // Levels 1-3
    if (level <= TIER_THRESHOLDS[1]) return 2;  // Levels 4-6
    if (level <= TIER_THRESHOLDS[2]) return 3;  // Levels 7-9
    if (level <= TIER_THRESHOLDS[3]) return 4;  // Levels 10-12
    return 5;                                    // Level 13+
}
```

### Shape and Color Unlock Schedule

| Tier | Levels | Shapes | Colors | Size Variation |
|------|--------|--------|--------|----------------|
| 1 | 1-3 | Circle, Square | Red | None |
| 2 | 4-6 | +Triangle | +Blue | None |
| 3 | 7-9 | +Star, +Heart | +Green, +Yellow | None |
| 4 | 10-12 | +Pentagon, +Hexagon | +Purple, +Orange | Small/Large |
| 5 | 13+ | +Diamond (8 total) | +Pink, +Cyan, +Brown, +Lime (10 total) | Small/Large |

### Slot Count Progression

```javascript
function getSlotCount(tier) {
    switch (tier) {
        case 1: return 2;  // 2 slots
        case 2: return 3;  // 3 slots
        case 3: return 4;  // 4 slots
        case 4: return 5;  // 5 slots (introduces size)
        default: return 6; // 6 slots (full difficulty)
    }
}
```

## Drag-and-Drop System

### Architecture

The drag system uses a hybrid approach combining mouse and touch events with `requestAnimationFrame` for smooth performance.

### Key Components

1. **Event Listeners**: Attached to draggable items
2. **RAF Loop**: Updates item position during drag
3. **Collision Detection**: Cached slot rectangles for fast proximity checks
4. **Visual Feedback**: Hover states and animations

### State Management

```javascript
const gameState = {
    currentDragItem: null,        // Currently dragged element
    dragOffset: { x: 0, y: 0 },   // Mouse offset from item center
    rafId: null,                  // Animation frame ID
    currentHoverSlot: null,       // Currently highlighted slot
    slotRects: []                 // Cached slot positions
};
```

### Drag Flow

```
1. mousedown/touchstart
   ↓
2. Store original position and parent
   ↓
3. Start RAF loop (handleDragMove)
   ↓
4. Check proximity to slots (findSlotAtPosition)
   ↓
5. Highlight nearest valid slot
   ↓
6. mouseup/touchend
   ↓
7. Validate match (validateMatch)
   ↓
8. If valid: snap to slot, check level complete
   If invalid: bounce back to original position
```

### Performance Optimizations

1. **RAF Throttling**: Position updates synchronized with browser render cycle
2. **Rect Caching**: Slot positions cached and only recalculated when needed
3. **Hover State Optimization**: Only updates DOM when hover state changes
4. **Transform-based Movement**: Uses CSS `translate` for GPU acceleration

## Match Validation

### Algorithm

```javascript
function validateMatch(item, slot) {
    const itemShape = item.dataset.shape;
    const itemColor = item.dataset.color;
    const itemSize = item.dataset.size || 'medium';

    const slotShape = slot.dataset.shape;
    const slotColor = slot.dataset.color;
    const slotSize = slot.dataset.size || 'medium';

    return itemShape === slotShape &&
           itemColor === slotColor &&
           itemSize === slotSize;
}
```

### Match Feedback

- **Correct Match**: Success sound, confetti animation, item snaps to slot
- **Incorrect Match**: Try-again sound, item bounces back with animation
- **Level Complete**: Celebration overlay, fireworks, tier advancement check

## Intermission Mini-Games

Every 3 levels, players get a break with a mini-game. This prevents fatigue and adds variety.

### Mini-Game Rotation

```javascript
const INTERMISSION_FREQUENCY = 3;
const minigames = ['mud-wash', 'sticker-shop', 'big-jump', 'bubble-wrap'];

function getNextMinigame(intermissionCount) {
    return minigames[intermissionCount % minigames.length];
}
```

### Mini-Game Descriptions

1. **Mud Wash** (Canvas-based):
   - Player swipes to clean mud off truck
   - Uses HTML5 Canvas with alpha channel manipulation
   - Progress tracked by transparent pixel percentage

2. **Sticker Shop** (Drag-based):
   - Player drags stickers onto truck
   - Free-form placement with no validation
   - Click DONE when satisfied

3. **Big Jump** (Animation):
   - Click JUMP button to trigger animation
   - CSS keyframe animation with arc trajectory
   - Auto-completes after animation

4. **Bubble Wrap** (Click-based):
   - Grid of bubbles to pop
   - Responsive grid sizing (mobile vs desktop)
   - Completes when all bubbles popped

## State Management

### Immutable State Pattern

All state changes create new objects rather than mutating existing ones:

```javascript
// ❌ Bad: Mutation
gameState.levelCount++;

// ✅ Good: Immutability
gameState = { ...gameState, levelCount: gameState.levelCount + 1 };
```

### State Structure

```javascript
const gameState = {
    levelCount: 1,              // Current level number
    intermissionCounter: 0,     // How many levels since last intermission
    currentDragItem: null,      // Active drag element
    dragOffset: { x: 0, y: 0 }, // Drag position offset
    slots: [],                  // Array of slot data objects
    inventory: [],              // Array of inventory item data
    isInIntermission: false,    // Intermission active flag
    levelCompleting: false,     // Race condition guard
    rafId: null,                // RAF request ID
    currentHoverSlot: null,     // Highlighted slot
    slotRects: []               // Cached slot rectangles
};
```

## Visual Effects System

### Confetti System

Creates 50 animated div elements with random:
- Colors (from palette)
- Sizes (10-20px)
- Starting positions (spread across width)
- Fall speeds (3-5s)
- Rotation speeds (0-360deg)

Auto-cleanup after 3 seconds.

### Fireworks System

Creates 30 circular div elements with:
- Random colors
- Radial expansion animation
- Opacity fade-out
- Positioned at random screen locations

Auto-cleanup after 2 seconds.

### Celebration Overlay

Full-screen overlay with:
- "🎉 Amazing! 🎉" message
- Gradient background
- Fade-in/fade-out animation
- Auto-dismisses after 2 seconds

## Internationalization (i18n)

### Supported Languages

- English (en)
- French (fr)
- Spanish (es)

### Translation System

```javascript
const translations = {
    en: {
        'splash-title': '🚙 Monster Truck Match 🚙',
        'splash-subtitle': 'Match the shapes and colors!',
        // ... more keys
    },
    fr: { /* French translations */ },
    es: { /* Spanish translations */ }
};
```

### Language Selection

- Persisted in localStorage
- Applied on page load
- Updates all elements with `data-i18n` attribute

### Adding New Languages

1. Add language code to `translations` object
2. Translate all keys
3. Add language selector option (if UI exists)

## Performance Considerations

### Canvas Optimization (Mud Wash)

- **Problem**: `getImageData()` is expensive (100+ calls per swipe)
- **Solution**: Throttle to max 10fps, cache imageData between checks

### Memory Management

- **Event Listeners**: Store references, clean up on game end
- **DOM Cleanup**: Remove elements before creating new ones
- **RAF Cancellation**: Cancel animation frames when not needed

### Mobile Optimizations

- Touch events with passive listeners where possible
- Transform-based animations for GPU acceleration
- Responsive breakpoints (768px, 480px)
- Large touch targets (80-120px)

## Accessibility Features

### ARIA Labels

All interactive elements have descriptive labels:
- Slots: "Slot for [shape] [color]"
- Items: "[shape] [color] [size]"
- Buttons: Clear button text

### Keyboard Navigation

- Tab navigation through interactive elements
- Enter/Space to activate buttons
- Focus indicators visible

### Screen Reader Support

- Semantic HTML structure
- Alternative text for canvas elements
- Status announcements for level changes

### Motor Accessibility

- Large touch targets
- Forgiving drag-and-drop (proximity-based)
- No time limits
- No penalties for errors

## Browser Compatibility

### Supported Browsers

- Chrome/Edge (Chromium) 90+
- Firefox 88+
- Safari 14+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 90+)

### Polyfills (None Required)

All features use widely-supported web standards:
- ES6 modules
- CSS Grid/Flexbox
- Canvas 2D API
- Touch Events
- RequestAnimationFrame

## Testing Architecture

### Test Pyramid

```
        /\
       /E2E\       28 tests - Critical user flows
      /------\
     /  INT  \    22 tests - Component integration
    /----------\
   /   UNIT     \ 22 tests - Pure function logic
  /--------------\
```

### Test Organization

- **Unit**: Pure functions (match validation, utilities)
- **Integration**: DOM interactions (level generation, game state)
- **E2E**: User flows (drag-and-drop, mini-games, progression)

### Coverage Goals

- Lines: 80%+
- Functions: 80%+
- Branches: 80%+

### Test Helpers

`GamePage` class provides common test utilities:
- Navigation
- Element selection
- Drag operations
- Assertions

## Future Enhancements

### Planned Improvements

1. **Modular Architecture**: Split script.js into src/ modules
2. **Saved Progress**: LocalStorage persistence
3. **Sound Effects**: Audio feedback for interactions
4. **More Mini-Games**: Expand rotation
5. **Difficulty Settings**: Easy/Medium/Hard modes
6. **Analytics**: Track completion rates by age

### Technical Debt

1. Memory leaks in event listeners (In Progress)
2. Performance optimization for canvas operations (In Progress)
3. Immutability violations (In Progress)
4. Large function refactoring (In Progress)

## Decision Log

### Why Vanilla JavaScript?

- **Learning Goal**: Educational project demonstrating fundamentals
- **Performance**: No framework overhead
- **Simplicity**: Easy to understand and modify
- **Portability**: Works anywhere without build step

### Why No Image Files for Shapes?

- **Performance**: CSS shapes faster than images
- **Scalability**: Vector-based, scales perfectly
- **Size**: Smaller payload, faster load
- **Flexibility**: Easy color changes

### Why Canvas for Mud Wash?

- **Requirements**: Need pixel-level manipulation
- **Performance**: Direct pixel access faster than DOM
- **Visual Effect**: Alpha channel masking for realistic clearing

### Why RAF for Drag System?

- **Performance**: Syncs with browser render cycle
- **Smoothness**: 60fps on all devices
- **Battery**: More efficient than timers

## Related Documentation

- `CONTRIBUTING.md`: Development and contribution guidelines
- `TESTING.md`: Test structure and coverage requirements
- `README.md`: User-facing documentation
