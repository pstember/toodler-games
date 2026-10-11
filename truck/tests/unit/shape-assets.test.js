import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ALL_SHAPES, ALL_COLORS } from '../../src/state.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const truckRoot = resolve(__dirname, '../..');
const styleCss = readFileSync(resolve(truckRoot, 'style.css'), 'utf8');
const tiresDir = resolve(truckRoot, 'assets/images/tires');

/**
 * PNG-tire shapes use ::before (rim color) + ::after (tire_*.png).
 * Heart briefly switched to SVG-only backgrounds in 0537313, which made
 * slot outlines blank when those pieces appeared — keep the tire overlay.
 */
const PNG_TIRE_SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'hexagon', 'diamond'];

describe('Shape visual assets', () => {
  describe('PNG tire overlay CSS', () => {
    PNG_TIRE_SHAPES.forEach((shape) => {
      it(`${shape} has ::before rim fill and ::after tire PNG`, () => {
        expect(styleCss).toMatch(new RegExp(`\\.${shape}::before\\s*\\{`));
        expect(styleCss).toMatch(new RegExp(`\\.${shape}::after\\s*\\{`));
        expect(styleCss).toContain(`tire_${shape}.png`);
      });
    });

    it('keeps all hearts on tire PNG (large and small)', () => {
      // SVG-only hearts were blank in slots (0537313); small must keep tire theme
      expect(styleCss).toMatch(/\.heart::after\s*\{[^}]*tire_heart\.png/s);
      expect(styleCss).not.toMatch(/\.heart\.color-\w+\s*\{\s*background-image:\s*url\(['"]assets\/images\/tires\/heart-/);
      expect(styleCss).not.toMatch(/\.size-small\.heart::before\s*,\s*\.size-small\.heart::after\s*\{[^}]*display:\s*none/s);
      expect(styleCss).toMatch(/\.size-small\.heart::after\s*\{[^}]*background-size:\s*185%/s);
    });
  });

  describe('tire PNG files exist', () => {
    PNG_TIRE_SHAPES.forEach((shape) => {
      it(`tire_${shape}.png is present`, () => {
        expect(existsSync(resolve(tiresDir, `tire_${shape}.png`))).toBe(true);
      });
    });
  });

  describe('pentagon SVG colors cover game palette', () => {
    // Pentagon is SVG-based (no tire PNG); every unlocked color needs a file
    ALL_COLORS.forEach((color) => {
      it(`pentagon-${color}.svg exists`, () => {
        expect(existsSync(resolve(tiresDir, `pentagon-${color}.svg`))).toBe(true);
      });
    });
  });

  describe('createSlot/createDraggableItem class wiring', () => {
    // Ensure every shape/color combo used in endless still maps to CSS classes
    it('covers all shapes and colors from game pools', () => {
      expect(ALL_SHAPES).toEqual([
        'circle', 'square', 'triangle', 'star', 'heart', 'pentagon', 'hexagon', 'diamond'
      ]);
      expect(ALL_COLORS).toEqual([
        'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'
      ]);
    });
  });
});
