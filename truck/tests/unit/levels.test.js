import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getUnlockedShapes,
  getUnlockedColors,
  generateLevel,
  createSlot,
  createDraggableItem,
  createNearMissDistractor
} from '../../src/levels.js';
import { gameState, ALL_SHAPES, ALL_COLORS } from '../../src/state.js';

describe('Level Generation', () => {
  beforeEach(() => {
    // Reset game state
    gameState.slots = [];
    gameState.inventory = [];
    gameState.slotRects = [];
    gameState.levelCompleting = false;

    // Setup minimal DOM
    document.body.innerHTML = `
      <div id="slots-container"></div>
      <div id="inventory-items"></div>
      <div id="level-number"></div>
      <div id="monster-truck"></div>
    `;
  });

  describe('getUnlockedShapes', () => {
    it('returns 2 shapes for tier 1 (levels 1-2)', () => {
      expect(getUnlockedShapes(1)).toEqual(['circle', 'square']);
      expect(getUnlockedShapes(2)).toEqual(['circle', 'square']);
    });

    it('returns 3 shapes for tier 2 (levels 3-5)', () => {
      expect(getUnlockedShapes(3)).toEqual(['circle', 'square', 'triangle']);
      expect(getUnlockedShapes(5)).toEqual(['circle', 'square', 'triangle']);
    });

    it('returns 5 shapes for tier 3 (levels 6-8)', () => {
      const tier3Shapes = ['circle', 'square', 'triangle', 'star', 'heart'];
      expect(getUnlockedShapes(6)).toEqual(tier3Shapes);
      expect(getUnlockedShapes(8)).toEqual(tier3Shapes);
    });

    it('returns 7 shapes for tier 4 (levels 9-11)', () => {
      const tier4Shapes = ['circle', 'square', 'triangle', 'star', 'heart', 'pentagon', 'hexagon'];
      expect(getUnlockedShapes(9)).toEqual(tier4Shapes);
      expect(getUnlockedShapes(11)).toEqual(tier4Shapes);
    });

    it('returns all 8 shapes for endless (level 12+)', () => {
      expect(getUnlockedShapes(12)).toEqual(ALL_SHAPES);
      expect(getUnlockedShapes(20)).toEqual(ALL_SHAPES);
      expect(getUnlockedShapes(100)).toEqual(ALL_SHAPES);
    });
  });

  describe('getUnlockedColors', () => {
    it('returns 1 color for tier 1 (levels 1-2)', () => {
      expect(getUnlockedColors(1)).toEqual(['red']);
      expect(getUnlockedColors(2)).toEqual(['red']);
    });

    it('returns 2 colors for tier 2 (levels 3-5)', () => {
      expect(getUnlockedColors(3)).toEqual(['red', 'blue']);
      expect(getUnlockedColors(5)).toEqual(['red', 'blue']);
    });

    it('returns 4 colors for tier 3 (levels 6-8)', () => {
      const tier3Colors = ['red', 'blue', 'green', 'yellow'];
      expect(getUnlockedColors(6)).toEqual(tier3Colors);
      expect(getUnlockedColors(8)).toEqual(tier3Colors);
    });

    it('returns 6 colors for tier 4 (levels 9-11)', () => {
      const tier4Colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
      expect(getUnlockedColors(9)).toEqual(tier4Colors);
      expect(getUnlockedColors(11)).toEqual(tier4Colors);
    });

    it('returns all 8 colors for endless (level 12+)', () => {
      expect(getUnlockedColors(12)).toEqual(ALL_COLORS);
      expect(getUnlockedColors(25)).toEqual(ALL_COLORS);
    });
  });

  describe('createNearMissDistractor', () => {
    it('shares shape or color with a slot requirement', () => {
      const slotReqs = [{ shape: 'circle', color: 'red', size: 'large' }];
      const distractor = createNearMissDistractor(
        slotReqs,
        ['circle', 'square'],
        ['red', 'blue'],
        false,
        [...slotReqs]
      );

      expect(distractor).toBeTruthy();
      expect(
        distractor.shape === 'circle' || distractor.color === 'red'
      ).toBe(true);
      expect(
        distractor.shape === 'circle' && distractor.color === 'red'
      ).toBe(false);
    });

    it('avoids duplicating existing inventory items', () => {
      const slotReqs = [{ shape: 'circle', color: 'red', size: 'large' }];
      const existing = [
        ...slotReqs,
        { shape: 'circle', color: 'blue', size: 'large' },
        { shape: 'square', color: 'red', size: 'large' }
      ];

      // Only 2 shapes × 2 colors = 4 combos; all used except square-blue
      const distractor = createNearMissDistractor(
        slotReqs,
        ['circle', 'square'],
        ['red', 'blue'],
        false,
        existing
      );

      expect(distractor).toEqual({ shape: 'square', color: 'blue', size: 'large' });
    });

    it('returns null when no unique distractor possible', () => {
      const slotReqs = [{ shape: 'circle', color: 'red', size: 'large' }];
      const existing = [
        { shape: 'circle', color: 'red', size: 'large' },
        { shape: 'square', color: 'red', size: 'large' }
      ];

      const distractor = createNearMissDistractor(
        slotReqs,
        ['circle', 'square'],
        ['red'],
        false,
        existing
      );

      expect(distractor).toBeNull();
    });
  });

  describe('generateLevel', () => {
    const mockDragHandler = vi.fn();

    it('generates exactly 1 slot for tier 1', () => {
      generateLevel(1, mockDragHandler);
      expect(gameState.slots.length).toBe(1);
    });

    it('generates exactly 2 slots for tier 2', () => {
      generateLevel(4, mockDragHandler);
      expect(gameState.slots.length).toBe(2);
    });

    it('generates 3 slots for tier 3', () => {
      generateLevel(7, mockDragHandler);
      expect(gameState.slots.length).toBe(3);
    });

    it('generates exactly 4 slots for tier 4', () => {
      generateLevel(10, mockDragHandler);
      expect(gameState.slots.length).toBe(4);
    });

    it('generates 4-5 slots for endless mode', () => {
      generateLevel(12, mockDragHandler);
      expect(gameState.slots.length).toBeGreaterThanOrEqual(4);
      expect(gameState.slots.length).toBeLessThanOrEqual(5);
    });

    it('creates inventory with correct matches for all slots', () => {
      generateLevel(5, mockDragHandler);

      const inventory = document.querySelectorAll('.draggable-item');
      const slots = document.querySelectorAll('.slot');

      // Every slot must have a matching item in inventory
      slots.forEach(slot => {
        const reqShape = slot.dataset.requiredShape;
        const reqColor = slot.dataset.requiredColor;
        const reqSize = slot.dataset.requiredSize;

        const hasMatch = Array.from(inventory).some(item =>
          item.dataset.shape === reqShape &&
          item.dataset.color === reqColor &&
          item.dataset.size === reqSize
        );

        expect(hasMatch).toBe(true);
      });
    });

    it('generates inventory larger than slots (has distractors)', () => {
      generateLevel(4, mockDragHandler);

      const inventory = document.querySelectorAll('.draggable-item');
      const slots = document.querySelectorAll('.slot');

      expect(inventory.length).toBeGreaterThan(slots.length);
    });

    it('generates unique slot requirements (no duplicate slots)', () => {
      generateLevel(7, mockDragHandler);

      const slots = document.querySelectorAll('.slot');
      const slotKeys = Array.from(slots).map(s =>
        `${s.dataset.requiredShape}-${s.dataset.requiredColor}-${s.dataset.requiredSize}`
      );

      const uniqueKeys = new Set(slotKeys);
      expect(uniqueKeys.size).toBe(slotKeys.length);
    });

    it('uses only unlocked shapes for the tier', () => {
      generateLevel(1, mockDragHandler);

      const unlockedShapes = getUnlockedShapes(1);
      const inventory = document.querySelectorAll('.draggable-item');

      inventory.forEach(item => {
        expect(unlockedShapes).toContain(item.dataset.shape);
      });
    });

    it('uses only unlocked colors for the tier', () => {
      generateLevel(1, mockDragHandler);

      const unlockedColors = getUnlockedColors(1);
      const inventory = document.querySelectorAll('.draggable-item');

      inventory.forEach(item => {
        expect(unlockedColors).toContain(item.dataset.color);
      });
    });

    it('clears previous level state', () => {
      // Populate state with old data
      gameState.slots = [{ filled: true }];
      gameState.inventory = [{ shape: 'old' }];
      gameState.slotRects = [{ rect: {} }];
      gameState.levelCompleting = true;

      generateLevel(1, mockDragHandler);

      expect(gameState.levelCompleting).toBe(false);
      expect(gameState.slotRects).toEqual([]);
    });

    it('updates level number display', () => {
      generateLevel(7, mockDragHandler);

      const levelNumber = document.getElementById('level-number');
      expect(levelNumber.textContent).toBe('7');
    });

    it('resets monster truck animation', () => {
      const truck = document.getElementById('monster-truck');
      truck.classList.add('driving-off');
      truck.style.transform = 'translateX(100px)';

      generateLevel(1, mockDragHandler);

      expect(truck.classList.contains('driving-off')).toBe(false);
      expect(truck.style.transform).toBe('');
    });
  });

  describe('createSlot', () => {
    it('creates slot with correct dataset attributes', () => {
      const slot = createSlot('circle', 'red', 'large');

      expect(slot.dataset.requiredShape).toBe('circle');
      expect(slot.dataset.requiredColor).toBe('red');
      expect(slot.dataset.requiredSize).toBe('large');
    });

    it('creates slot with ARIA attributes', () => {
      const slot = createSlot('square', 'blue', 'small');

      expect(slot.getAttribute('role')).toBe('button');
      expect(slot.getAttribute('aria-label')).toContain('blue');
      expect(slot.getAttribute('aria-label')).toContain('square');
      expect(slot.getAttribute('tabindex')).toBe('0');
    });

    it('creates slot outline as child element', () => {
      const slot = createSlot('triangle', 'green', 'large');

      const outline = slot.querySelector('.slot-outline');
      expect(outline).toBeTruthy();
      expect(outline.dataset.shape).toBe('triangle');
      expect(outline.dataset.color).toBe('green');
    });

    it('sets correct size for large slots', () => {
      const slot = createSlot('star', 'yellow', 'large');

      expect(slot.style.width).toBe('120px');
      expect(slot.style.height).toBe('120px');
    });

    it('sets correct size for small slots', () => {
      const slot = createSlot('heart', 'purple', 'small');

      expect(slot.style.width).toBe('80px');
      expect(slot.style.height).toBe('80px');
    });
  });

  describe('createDraggableItem', () => {
    const mockDragHandler = vi.fn();

    it('creates item with correct dataset attributes', () => {
      const item = createDraggableItem('pentagon', 'orange', 'large', mockDragHandler);

      expect(item.dataset.shape).toBe('pentagon');
      expect(item.dataset.color).toBe('orange');
      expect(item.dataset.size).toBe('large');
    });

    it('creates item with ARIA attributes', () => {
      const item = createDraggableItem('hexagon', 'cyan', 'small', mockDragHandler);

      expect(item.getAttribute('role')).toBe('button');
      expect(item.getAttribute('aria-grabbed')).toBe('false');
      expect(item.getAttribute('tabindex')).toBe('0');
    });

    it('attaches drag event listeners', () => {
      const item = createDraggableItem('circle', 'red', 'large', mockDragHandler);

      item.dispatchEvent(new MouseEvent('mousedown'));
      expect(mockDragHandler).toHaveBeenCalled();
    });
  });
});
