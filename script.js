// ===================================
// GAME STATE
// ===================================

const gameState = {
    levelCount: 1,
    intermissionCounter: 0,
    currentDragItem: null,
    dragOffset: { x: 0, y: 0 },
    slots: [],
    inventory: [],
    isInIntermission: false
};

// ===================================
// DATA POOLS
// ===================================

const ALL_SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'pentagon', 'hexagon', 'diamond'];
const ALL_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];
const SIZES = ['large', 'small'];

// ===================================
// AUDIO PLACEHOLDER SYSTEM
// ===================================

function playSound(soundName) {
    console.log(`🔊 Playing: ${soundName}.mp3`);
    // Future implementation:
    // const audio = new Audio(`sounds/${soundName}.mp3`);
    // audio.play();
}

// ===================================
// PROGRESSIVE UNLOCKING
// ===================================

function getUnlockedShapes(level) {
    if (level <= 3) {
        return ['circle', 'square']; // Tier 1: 2 shapes
    } else if (level <= 6) {
        return ['circle', 'square', 'triangle']; // Tier 2: 3 shapes
    } else if (level <= 9) {
        return ['circle', 'square', 'triangle', 'star', 'heart']; // Tier 3: 5 shapes
    } else if (level <= 12) {
        return ['circle', 'square', 'triangle', 'star', 'heart', 'pentagon', 'hexagon']; // Tier 4: 7 shapes
    } else {
        return ALL_SHAPES; // Endless: all 8 shapes
    }
}

function getUnlockedColors(level) {
    if (level <= 3) {
        return ['red']; // Tier 1: 1 color
    } else if (level <= 6) {
        return ['red', 'blue']; // Tier 2: 2 colors
    } else if (level <= 9) {
        return ['red', 'blue', 'green', 'yellow']; // Tier 3: 4 colors
    } else if (level <= 12) {
        return ['red', 'blue', 'green', 'yellow', 'purple', 'orange']; // Tier 4: 6 colors
    } else {
        return ALL_COLORS; // Endless: all 8 colors
    }
}

// ===================================
// LEVEL GENERATION
// ===================================

function generateLevel(level) {
    console.log(`📦 Generating Level ${level}`);

    const unlockedShapes = getUnlockedShapes(level);
    const unlockedColors = getUnlockedColors(level);

    let numTargets, numInventory, useSize;

    // Tier logic
    if (level <= 3) {
        numTargets = 1;
        numInventory = 3;
        useSize = false;
    } else if (level <= 6) {
        numTargets = 2;
        numInventory = 4;
        useSize = false;
    } else if (level <= 9) {
        numTargets = 2 + Math.floor(Math.random() * 2); // 2-3
        numInventory = 5;
        useSize = false;
    } else if (level <= 12) {
        numTargets = 3;
        numInventory = 6;
        useSize = true;
    } else {
        // Endless mode: randomize difficulty
        numTargets = 2 + Math.floor(Math.random() * 3); // 2-4
        numInventory = 4 + Math.floor(Math.random() * 5); // 4-8
        useSize = Math.random() > 0.5;
    }

    // Clear previous level
    gameState.slots = [];
    gameState.inventory = [];

    const slotsContainer = document.getElementById('slots-container');
    const inventoryContainer = document.getElementById('inventory-items');
    slotsContainer.innerHTML = '';
    inventoryContainer.innerHTML = '';

    // Generate target slots (ensure no duplicate slot requirements)
    const slotRequirements = [];
    for (let i = 0; i < numTargets; i++) {
        let targetShape, targetColor, targetSize;
        let attempts = 0;
        const maxAttempts = 100;

        // Keep generating until we get a unique slot requirement
        do {
            targetShape = unlockedShapes[Math.floor(Math.random() * unlockedShapes.length)];
            targetColor = unlockedColors[Math.floor(Math.random() * unlockedColors.length)];
            targetSize = useSize ? (Math.random() > 0.5 ? 'large' : 'small') : 'large';
            attempts++;

            // Prevent infinite loop if pool is too small
            if (attempts >= maxAttempts) break;

        } while (slotRequirements.some(req =>
            req.shape === targetShape &&
            req.color === targetColor &&
            req.size === targetSize
        ));

        slotRequirements.push({ shape: targetShape, color: targetColor, size: targetSize });

        const slot = createSlot(targetShape, targetColor, targetSize);
        slotsContainer.appendChild(slot);
        gameState.slots.push({ shape: targetShape, color: targetColor, size: targetSize, filled: false, element: slot });
    }

    // Generate inventory items (correct + distractors)
    const inventoryItems = [];

    // Add correct items (one per unique slot requirement)
    slotRequirements.forEach(req => {
        inventoryItems.push({ shape: req.shape, color: req.color, size: req.size });
    });

    // Calculate maximum possible unique items
    const possibleSizes = useSize ? 2 : 1;
    const maxUniqueItems = unlockedShapes.length * unlockedColors.length * possibleSizes;

    // Adjust inventory size if we don't have enough unique combinations
    const safeInventorySize = Math.min(numInventory, maxUniqueItems);
    const numDistractors = safeInventorySize - numTargets;

    // Add distractor items (ensure no duplicates)
    for (let i = 0; i < numDistractors; i++) {
        let distractor;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            const shape = unlockedShapes[Math.floor(Math.random() * unlockedShapes.length)];
            const color = unlockedColors[Math.floor(Math.random() * unlockedColors.length)];
            const size = useSize ? (Math.random() > 0.5 ? 'large' : 'small') : 'large';
            distractor = { shape, color, size };
            attempts++;

            // Prevent infinite loop if pool is too small
            if (attempts >= maxAttempts) {
                console.error('Failed to generate unique distractor - skipping');
                break;
            }

        } while (inventoryItems.some(item =>
            item.shape === distractor.shape &&
            item.color === distractor.color &&
            item.size === distractor.size
        ));

        // Only add if we successfully generated a unique item
        if (attempts < maxAttempts) {
            inventoryItems.push(distractor);
        }
    }

    // Shuffle inventory
    shuffleArray(inventoryItems);

    // Render inventory
    inventoryItems.forEach(item => {
        const draggable = createDraggableItem(item.shape, item.color, item.size);
        inventoryContainer.appendChild(draggable);
    });

    // Update level display
    document.getElementById('level-number').textContent = level;

    // Reset truck position
    const truck = document.getElementById('monster-truck');
    truck.classList.remove('driving-off');
    truck.style.transform = '';
}

function createSlot(shape, color, size) {
    const slot = document.createElement('div');
    slot.className = `slot size-${size}`;
    slot.dataset.requiredShape = shape;
    slot.dataset.requiredColor = color;
    slot.dataset.requiredSize = size;

    // Set size based on size parameter
    const slotSize = size === 'large' ? 120 : 80;
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

function createDraggableItem(shape, color, size) {
    const item = document.createElement('div');
    item.className = `draggable-item shape ${shape} color-${color} size-${size}`;
    item.dataset.shape = shape;
    item.dataset.color = color;
    item.dataset.size = size;

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

// ===================================
// DRAG AND DROP SYSTEM
// ===================================

function handleDragStart(e) {
    e.preventDefault();

    const item = e.currentTarget;
    gameState.currentDragItem = item;

    // Get touch or mouse position
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

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

    // Remove transforms/animations that interfere with positioning
    item.style.animation = 'none';
    item.style.transform = 'none';

    // Add dragging class (which now has no transforms)
    item.classList.add('dragging');

    // NOW set coordinates to where item currently is (in viewport coords)
    item.style.left = `${rect.left}px`;
    item.style.top = `${rect.top}px`;

    // Add move and end listeners
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);
}

function handleDragMove(e) {
    if (!gameState.currentDragItem) return;

    e.preventDefault();

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    const item = gameState.currentDragItem;
    item.style.left = `${clientX - gameState.dragOffset.x}px`;
    item.style.top = `${clientY - gameState.dragOffset.y}px`;

    // Visual feedback: highlight slot being hovered over
    const slot = findSlotAtPosition(clientX, clientY);

    // Remove highlight from all slots
    document.querySelectorAll('.slot').forEach(s => s.classList.remove('hover-highlight'));

    // Add highlight to hovered slot if it's not filled
    if (slot && !slot.classList.contains('filled')) {
        slot.classList.add('hover-highlight');
    }
}

function handleDragEnd(e) {
    if (!gameState.currentDragItem) return;

    const item = gameState.currentDragItem;
    const clientX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.type === 'touchend' ? e.changedTouches[0].clientY : e.clientY;

    // Remove all hover highlights
    document.querySelectorAll('.slot').forEach(s => s.classList.remove('hover-highlight'));

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

    gameState.currentDragItem = null;
}

function findSlotAtPosition(x, y) {
    const slots = document.querySelectorAll('.slot');
    for (const slot of slots) {
        const rect = slot.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            return slot;
        }
    }
    return null;
}

// ===================================
// MATCH VALIDATION
// ===================================

function validateMatch(item, slot) {
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

function handleSuccessfulMatch(item, slot) {
    console.log('✅ Match!');
    playSound('success');

    // Remove from inventory
    item.remove();

    // Clone and place in slot
    const clone = item.cloneNode(true);
    clone.style.position = 'relative';
    clone.style.left = '0';
    clone.style.top = '0';
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

function handleFailedMatch(item) {
    console.log('❌ No match, try again!');
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
    item.classList.add('bouncing');
    item.style.position = 'relative';
    item.style.left = '0';
    item.style.top = '0';
    item.style.zIndex = '';
    item.style.pointerEvents = '';

    // Restore animations/transforms
    item.style.animation = '';
    item.style.transform = '';

    setTimeout(() => {
        item.classList.remove('bouncing');
    }, 500);
}

// ===================================
// LEVEL COMPLETION
// ===================================

function checkLevelComplete() {
    const allFilled = gameState.slots.every(slot => slot.filled);

    if (allFilled) {
        console.log('🎉 Level Complete!');
        playSound('levelComplete');

        // Drive off animation
        const truck = document.getElementById('monster-truck');
        truck.classList.add('driving-off');

        // Confetti
        createConfetti();

        // Check for tier completion (every 3 levels)
        gameState.intermissionCounter++;

        setTimeout(() => {
            if (gameState.intermissionCounter % 3 === 0) {
                playSound('tierComplete');
                showCelebrationOverlay();
                setTimeout(() => {
                    hideCelebrationOverlay();
                    triggerIntermission();
                }, 2000);
            } else {
                // Next level
                gameState.levelCount++;
                generateLevel(gameState.levelCount);
            }
        }, 1500);
    }
}

function createConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';

    const colors = ['#FF4444', '#4444FF', '#44FF44', '#FFFF44', '#AA44FF', '#FF8844'];

    for (let i = 0; i < 50; i++) {
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
        container.innerHTML = '';
    }, 3000);
}

function showCelebrationOverlay() {
    const overlay = document.getElementById('celebration-overlay');
    overlay.classList.remove('hidden');
}

function hideCelebrationOverlay() {
    const overlay = document.getElementById('celebration-overlay');
    overlay.classList.add('hidden');
}

// ===================================
// INTERMISSION MINI-GAMES
// ===================================

function triggerIntermission() {
    console.log('🎮 Starting Intermission!');
    gameState.isInIntermission = true;

    const intermissionContainer = document.getElementById('intermission-container');
    intermissionContainer.classList.remove('hidden');

    // Randomly select a mini-game
    const games = ['mud-wash', 'sticker-shop', 'big-jump'];
    const selectedGame = games[Math.floor(Math.random() * games.length)];

    console.log(`🎯 Selected: ${selectedGame}`);

    switch (selectedGame) {
        case 'mud-wash':
            startMudWashGame();
            break;
        case 'sticker-shop':
            startStickerShopGame();
            break;
        case 'big-jump':
            startBigJumpGame();
            break;
    }
}

function endIntermission() {
    console.log('🏁 Ending Intermission');

    const intermissionContainer = document.getElementById('intermission-container');
    intermissionContainer.classList.add('hidden');

    // Hide all mini-games
    document.querySelectorAll('.mini-game').forEach(game => {
        game.classList.add('hidden');
    });

    gameState.isInIntermission = false;

    // Continue to next level
    gameState.levelCount++;
    generateLevel(gameState.levelCount);
}

// ===================================
// MUD WASH GAME
// ===================================

function startMudWashGame() {
    const game = document.getElementById('mud-wash-game');
    game.classList.remove('hidden');

    const canvas = document.getElementById('mud-canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size - responsive to screen size
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;

    if (isSmallMobile) {
        canvas.width = Math.min(300, window.innerWidth * 0.85);
        canvas.height = 200;
    } else if (isMobile) {
        canvas.width = Math.min(350, window.innerWidth * 0.9);
        canvas.height = 250;
    } else {
        canvas.width = 400;
        canvas.height = 300;
    }

    // Fill with mud
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let isDrawing = false;
    const totalPixels = canvas.width * canvas.height;
    let gameEnding = false; // Prevent multiple calls to endIntermission
    let checkCounter = 0; // Throttle pixel checking

    // Progress bar elements
    const progressFill = document.getElementById('mud-progress-fill');
    const progressText = document.getElementById('mud-progress-text');

    function calculateClearedPercentage() {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let clearedPixels = 0;

        // Check alpha channel - transparent pixels are cleared
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] === 0) {
                clearedPixels++;
            }
        }

        return (clearedPixels / totalPixels) * 100;
    }

    function updateProgress() {
        const percentCleared = calculateClearedPercentage();
        const displayPercent = Math.min(99, Math.floor(percentCleared)); // Cap at 99% until complete

        // Update progress bar
        progressFill.style.width = displayPercent + '%';
        progressText.textContent = displayPercent + '%';

        // Check if game should end (95% threshold)
        if (percentCleared >= 95 && !gameEnding) {
            gameEnding = true;
            progressFill.style.width = '100%';
            progressText.textContent = '100%';
            setTimeout(() => {
                endIntermission();
            }, 500);
        }
    }

    function clearMud(x, y) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.fill();

        // Update progress every 5 strokes to avoid performance issues
        checkCounter++;
        if (checkCounter % 5 === 0) {
            updateProgress();
        }
    }

    // Initial progress
    updateProgress();

    canvas.addEventListener('mousedown', () => isDrawing = true);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mousemove', (e) => {
        if (isDrawing) {
            const rect = canvas.getBoundingClientRect();
            clearMud(e.clientX - rect.left, e.clientY - rect.top);
        }
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDrawing = true;
    });
    canvas.addEventListener('touchend', () => isDrawing = false);
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (isDrawing) {
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            clearMud(touch.clientX - rect.left, touch.clientY - rect.top);
        }
    });
}

// ===================================
// STICKER SHOP GAME
// ===================================

function startStickerShopGame() {
    const game = document.getElementById('sticker-shop-game');
    game.classList.remove('hidden');

    const truckArea = document.getElementById('sticker-truck-area');

    // Reset stickers
    const stickers = document.querySelectorAll('.sticker');
    stickers.forEach(sticker => {
        sticker.classList.remove('placed');
        sticker.style.position = '';
        sticker.style.left = '';
        sticker.style.top = '';

        // Add drag handlers
        sticker.addEventListener('mousedown', handleStickerDragStart);
        sticker.addEventListener('touchstart', handleStickerDragStart);
    });

    let gameEnding = false; // Prevent multiple clicks

    // Done button
    const doneBtn = document.getElementById('sticker-done-btn');
    doneBtn.onclick = () => {
        if (!gameEnding) {
            gameEnding = true;
            playSound('sticker');
            endIntermission();
        }
    };
}

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

// ===================================
// BIG JUMP GAME
// ===================================

function startBigJumpGame() {
    const game = document.getElementById('big-jump-game');
    game.classList.remove('hidden');

    const jumpTruck = document.getElementById('jump-truck');
    const jumpBtn = document.getElementById('jump-btn');

    // Reset animation and positioning
    jumpTruck.classList.remove('jumping');
    jumpTruck.style.left = '-200px';
    jumpTruck.style.transform = 'none';
    jumpTruck.style.animation = 'driveToRamp 3s ease-in-out forwards';

    let hasJumped = false;

    jumpBtn.onclick = () => {
        if (!hasJumped) {
            hasJumped = true;
            playSound('jump');

            // Stop the drive animation and get current position
            const currentLeft = jumpTruck.offsetLeft;
            jumpTruck.style.animation = '';
            jumpTruck.style.left = currentLeft + 'px';

            // Start jump animation
            jumpTruck.classList.add('jumping');

            createFireworks();

            setTimeout(() => {
                endIntermission();
            }, 2000);
        }
    };
}

function createFireworks() {
    const container = document.getElementById('fireworks-container');
    container.innerHTML = '';

    const colors = ['#FF4444', '#4444FF', '#44FF44', '#FFFF44', '#AA44FF'];

    for (let i = 0; i < 30; i++) {
        const firework = document.createElement('div');
        firework.className = 'firework';
        firework.style.left = `${50 + (Math.random() - 0.5) * 20}%`;
        firework.style.top = `${30 + (Math.random() - 0.5) * 20}%`;
        firework.style.background = colors[Math.floor(Math.random() * colors.length)];

        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 100;
        firework.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
        firework.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
        firework.style.animationDelay = `${Math.random() * 0.5}s`;

        container.appendChild(firework);
    }

    setTimeout(() => {
        container.innerHTML = '';
    }, 2000);
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ===================================
// INITIALIZE GAME
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚙 Monster Truck Match - Starting!');

    // Check for URL parameters to trigger specific mini-games (for testing)
    const urlParams = new URLSearchParams(window.location.search);
    const testMinigame = urlParams.get('minigame');

    if (testMinigame) {
        console.log(`🧪 Testing mini-game: ${testMinigame}`);
        // Hide game container and show intermission
        document.getElementById('game-container').style.display = 'none';
        triggerIntermission();

        // Override random selection to show specific mini-game
        setTimeout(() => {
            switch (testMinigame) {
                case 'mud-wash':
                case 'wash':
                    document.querySelectorAll('.mini-game').forEach(g => g.classList.add('hidden'));
                    startMudWashGame();
                    break;
                case 'sticker-shop':
                case 'stickers':
                    document.querySelectorAll('.mini-game').forEach(g => g.classList.add('hidden'));
                    startStickerShopGame();
                    break;
                case 'big-jump':
                case 'jump':
                    document.querySelectorAll('.mini-game').forEach(g => g.classList.add('hidden'));
                    startBigJumpGame();
                    break;
                default:
                    console.warn(`Unknown mini-game: ${testMinigame}`);
                    console.log('Available mini-games: mud-wash, sticker-shop, big-jump');
            }
        }, 100);
    } else {
        generateLevel(gameState.levelCount);
    }
});
