import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createConfetti,
  showCelebrationOverlay,
  hideCelebrationOverlay,
  createFireworks,
  triggerIntermission,
  endIntermission
} from '../../src/visual-effects.js';
import { gameState } from '../../src/state.js';
import { CONFETTI_COUNT, FIREWORK_COUNT } from '../../src/constants.js';

// Mock dynamic imports to prevent side effects
vi.mock('../../src/minigames/mud-wash.js', () => ({
  startMudWashGame: vi.fn(),
  cleanupMudWashListeners: vi.fn()
}));

vi.mock('../../src/minigames/sticker-shop.js', () => ({
  startStickerShopGame: vi.fn(),
  cleanupStickerListeners: vi.fn()
}));

vi.mock('../../src/minigames/big-jump.js', () => ({
  startBigJumpGame: vi.fn()
}));

vi.mock('../../src/minigames/bubble-wrap.js', () => ({
  startBubbleWrapGame: vi.fn()
}));

vi.mock('../../src/minigames/fuel-up.js', () => ({
  startFuelUpGame: vi.fn()
}));

vi.mock('../../src/levels.js', () => ({
  generateLevel: vi.fn()
}));

vi.mock('../../src/drag-drop.js', () => ({
  handleDragStart: vi.fn()
}));

describe('Visual Effects', () => {
  beforeEach(() => {
    // Reset game state
    gameState.isInIntermission = false;
    gameState.levelCount = 1;

    // Mock browser globals
    global.confirm = vi.fn(() => false);
    global.window = { location: { reload: vi.fn() } };

    // Setup DOM with all required elements
    document.body.innerHTML = `
      <div id="confetti-container"></div>
      <div id="celebration-overlay" class="hidden"></div>
      <div id="fireworks-container"></div>
      <div id="intermission-container" class="hidden"></div>
      <div id="inventory-area"></div>
      <div class="mini-game hidden"></div>
      <div id="sticker-shop-game" class="hidden"></div>
      <div id="mud-wash-game" class="hidden"></div>
      <div id="big-jump-game" class="hidden"></div>
      <div id="bubble-wrap-game" class="hidden"></div>
    `;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  describe('createConfetti', () => {
    it('creates exactly CONFETTI_COUNT confetti elements', () => {
      createConfetti();

      const container = document.getElementById('confetti-container');
      const confettiElements = container.querySelectorAll('.confetti');

      expect(confettiElements.length).toBe(CONFETTI_COUNT);
    });

    it('positions confetti across full viewport width', () => {
      createConfetti();

      const confettiElements = document.querySelectorAll('.confetti');
      const leftValues = Array.from(confettiElements).map(c => parseFloat(c.style.left));

      // All should be between 0vw and 100vw
      leftValues.forEach(left => {
        expect(left).toBeGreaterThanOrEqual(0);
        expect(left).toBeLessThanOrEqual(100);
      });
    });

    it('positions confetti above viewport (negative top)', () => {
      createConfetti();

      const confettiElements = document.querySelectorAll('.confetti');
      const topValues = Array.from(confettiElements).map(c => parseFloat(c.style.top));

      // All should be negative (above viewport)
      topValues.forEach(top => {
        expect(top).toBeLessThan(0);
      });
    });

    it('assigns random colors to confetti', () => {
      createConfetti();

      const confettiElements = document.querySelectorAll('.confetti');
      const colors = Array.from(confettiElements).map(c => c.style.background);
      const uniqueColors = new Set(colors);

      // Should have variety (at least 2 different colors with 50 confetti)
      expect(uniqueColors.size).toBeGreaterThanOrEqual(2);
    });

    it('assigns random animation delays', () => {
      createConfetti();

      const confettiElements = document.querySelectorAll('.confetti');
      const delays = Array.from(confettiElements).map(c => c.style.animationDelay);
      const uniqueDelays = new Set(delays);

      // Should have variety in delays
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });

    it('clears container before creating new confetti', () => {
      const container = document.getElementById('confetti-container');
      const oldElement = document.createElement('div');
      container.appendChild(oldElement);

      createConfetti();

      expect(container.contains(oldElement)).toBe(false);
    });
  });

  describe('createFireworks', () => {
    it('creates exactly FIREWORK_COUNT firework elements', () => {
      createFireworks();

      const container = document.getElementById('fireworks-container');
      const fireworkElements = container.querySelectorAll('.firework');

      expect(fireworkElements.length).toBe(FIREWORK_COUNT);
    });

    it('spawns near center and sets explode --tx/--ty offsets', () => {
      createFireworks();

      const fireworkElements = document.querySelectorAll('.firework');

      fireworkElements.forEach(fw => {
        expect(fw.style.left).toBe('50%');
        expect(fw.style.top).toBe('30%');
        const tx = fw.style.getPropertyValue('--tx');
        const ty = fw.style.getPropertyValue('--ty');
        expect(tx).toMatch(/^-?\d+(\.\d+)?px$/);
        expect(ty).toMatch(/^-?\d+(\.\d+)?px$/);
      });
    });

    it('assigns random colors to fireworks', () => {
      createFireworks();

      const fireworkElements = document.querySelectorAll('.firework');
      const colors = Array.from(fireworkElements).map(fw => fw.style.background);
      const uniqueColors = new Set(colors);

      // Should have variety in colors
      expect(uniqueColors.size).toBeGreaterThanOrEqual(2);
    });

    it('assigns random animation delays', () => {
      createFireworks();

      const fireworkElements = document.querySelectorAll('.firework');
      const delays = Array.from(fireworkElements).map(fw => fw.style.animationDelay);
      const uniqueDelays = new Set(delays);

      // Should have variety in delays
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });

    it('clears container before creating new fireworks', () => {
      const container = document.getElementById('fireworks-container');
      const oldElement = document.createElement('div');
      container.appendChild(oldElement);

      createFireworks();

      expect(container.contains(oldElement)).toBe(false);
    });
  });

  describe('showCelebrationOverlay', () => {
    it('removes hidden class from overlay', () => {
      const overlay = document.getElementById('celebration-overlay');
      overlay.classList.add('hidden');

      showCelebrationOverlay();

      expect(overlay.classList.contains('hidden')).toBe(false);
    });
  });

  describe('hideCelebrationOverlay', () => {
    it('adds hidden class to overlay', () => {
      const overlay = document.getElementById('celebration-overlay');
      overlay.classList.remove('hidden');

      hideCelebrationOverlay();

      expect(overlay.classList.contains('hidden')).toBe(true);
    });
  });

  describe('triggerIntermission', () => {
    it('sets isInIntermission state to true', () => {
      gameState.isInIntermission = false;

      triggerIntermission();

      expect(gameState.isInIntermission).toBe(true);
    });

    it('shows intermission container', () => {
      const container = document.getElementById('intermission-container');
      container.classList.add('hidden');

      triggerIntermission();

      expect(container.classList.contains('hidden')).toBe(false);
    });

    it('hides inventory area during intermission', () => {
      const inventoryArea = document.getElementById('inventory-area');
      inventoryArea.classList.remove('hidden');

      triggerIntermission();

      expect(inventoryArea.classList.contains('hidden')).toBe(true);
    });
  });

  describe('endIntermission', () => {
    it('sets isInIntermission state to false', () => {
      gameState.isInIntermission = true;

      endIntermission();

      expect(gameState.isInIntermission).toBe(false);
    });

    it('hides intermission container', () => {
      const container = document.getElementById('intermission-container');
      container.classList.remove('hidden');

      endIntermission();

      expect(container.classList.contains('hidden')).toBe(true);
    });

    it('shows inventory area after intermission', () => {
      const inventoryArea = document.getElementById('inventory-area');
      inventoryArea.classList.add('hidden');

      endIntermission();

      expect(inventoryArea.classList.contains('hidden')).toBe(false);
    });

    it('hides all mini-game elements', () => {
      const miniGame = document.querySelector('.mini-game');
      miniGame.classList.remove('hidden');

      endIntermission();

      expect(miniGame.classList.contains('hidden')).toBe(true);
    });

    it('increments level count', () => {
      gameState.levelCount = 5;

      endIntermission();

      expect(gameState.levelCount).toBe(6);
    });
  });
});
