// ===================================
// MUD WASH MINI-GAME MODULE
// ===================================

import {
    BREAKPOINT_TABLET,
    BREAKPOINT_MOBILE,
    BRUSH_RADIUS,
    MUD_WASH_COMPLETION_THRESHOLD,
    PROGRESS_UPDATE_INTERVAL
} from '../constants.js';
import { playSound } from '../utils.js';

// Store mud wash listeners for cleanup
let mudWashListeners = null;

/**
 * Starts the mud wash mini-game
 */
export function startMudWashGame() {
    const game = document.getElementById('mud-wash-game');
    game.classList.remove('hidden');

    const canvas = document.getElementById('mud-canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size - responsive to screen size
    const isMobile = window.innerWidth <= BREAKPOINT_TABLET;
    const isSmallMobile = window.innerWidth <= BREAKPOINT_MOBILE;

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
    let lastProgressUpdate = 0; // Timestamp of last progress calculation
    let rafId = null; // RequestAnimationFrame ID
    let cachedCanvasRect = canvas.getBoundingClientRect(); // Cache canvas rect
    let currentMousePos = { x: 0, y: 0 }; // Track current position

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
        // Throttle progress updates to max 10fps (100ms intervals)
        const now = Date.now();
        if (now - lastProgressUpdate < PROGRESS_UPDATE_INTERVAL) {
            return;
        }
        lastProgressUpdate = now;

        const percentCleared = calculateClearedPercentage();
        const displayPercent = Math.min(MUD_WASH_COMPLETION_THRESHOLD, Math.floor(percentCleared)); // Cap at completion threshold until complete

        // Update progress bar
        progressFill.style.width = displayPercent + '%';
        progressText.textContent = displayPercent + '%';

        // Check if game should end (completion threshold)
        if (percentCleared >= MUD_WASH_COMPLETION_THRESHOLD && !gameEnding) {
            gameEnding = true;
            progressFill.style.width = `${MUD_WASH_COMPLETION_THRESHOLD}%`;
            progressText.textContent = `${MUD_WASH_COMPLETION_THRESHOLD}%`;
            setTimeout(() => {
                // Dynamic import to avoid circular dependency
                import('../visual-effects.js').then(({ endIntermission }) => {
                    endIntermission();
                });
            }, 500);
        }
    }

    function clearMud(x, y) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Update progress every 5 strokes to avoid performance issues
        checkCounter++;
        if (checkCounter % 5 === 0) {
            updateProgress();
        }
    }

    // RAF-based drawing loop for smooth performance
    function drawLoop() {
        if (isDrawing && currentMousePos.x !== null) {
            clearMud(currentMousePos.x, currentMousePos.y);
        }

        if (isDrawing) {
            rafId = requestAnimationFrame(drawLoop);
        }
    }

    // Initial progress
    updateProgress();

    // Create listener functions for cleanup
    const onMouseDown = () => {
        isDrawing = true;
        if (!rafId) {
            rafId = requestAnimationFrame(drawLoop);
        }
    };

    const onMouseUp = () => {
        isDrawing = false;
        currentMousePos = { x: null, y: null };
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    };

    const onMouseMove = (e) => {
        if (isDrawing) {
            // Just update position - RAF loop handles drawing
            currentMousePos = {
                x: e.clientX - cachedCanvasRect.left,
                y: e.clientY - cachedCanvasRect.top
            };
        }
    };

    const onTouchStart = (e) => {
        e.preventDefault();
        isDrawing = true;
        if (!rafId) {
            rafId = requestAnimationFrame(drawLoop);
        }
    };

    const onTouchEnd = () => {
        isDrawing = false;
        currentMousePos = { x: null, y: null };
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    };

    const onTouchMove = (e) => {
        e.preventDefault();
        if (isDrawing && e.touches[0]) {
            const touch = e.touches[0];
            // Just update position - RAF loop handles drawing
            currentMousePos = {
                x: touch.clientX - cachedCanvasRect.left,
                y: touch.clientY - cachedCanvasRect.top
            };
        }
    };

    // Add event listeners
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchstart', onTouchStart);
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('touchmove', onTouchMove);

    // Store listeners and RAF ID for cleanup
    mudWashListeners = {
        canvas,
        rafId: () => rafId, // Function to get current RAF ID
        cancelRaf: () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        },
        listeners: [
            { type: 'mousedown', handler: onMouseDown },
            { type: 'mouseup', handler: onMouseUp },
            { type: 'mousemove', handler: onMouseMove },
            { type: 'touchstart', handler: onTouchStart },
            { type: 'touchend', handler: onTouchEnd },
            { type: 'touchmove', handler: onTouchMove }
        ]
    };
}

/**
 * Cleans up mud wash event listeners to prevent memory leaks
 */
export function cleanupMudWashListeners() {
    if (mudWashListeners) {
        const { canvas, listeners, cancelRaf } = mudWashListeners;

        // Cancel any pending animation frame
        cancelRaf();

        // Remove event listeners
        listeners.forEach(({ type, handler }) => {
            canvas.removeEventListener(type, handler);
        });

        mudWashListeners = null;
    }
}
