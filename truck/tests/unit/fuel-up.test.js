import { describe, it, expect } from 'vitest';
import { applyFuelPump, isFuelTankFull } from '../../src/minigames/fuel-up.js';
import { FUEL_PUMP_FILL_AMOUNT, FUEL_TANK_FULL } from '../../src/constants.js';

describe('Fuel Up mini-game', () => {
  describe('applyFuelPump', () => {
    it('adds default fill amount', () => {
      expect(applyFuelPump(0)).toBe(FUEL_PUMP_FILL_AMOUNT);
    });

    it('accepts custom fill amount', () => {
      expect(applyFuelPump(10, 25)).toBe(35);
    });

    it('clamps at full tank', () => {
      expect(applyFuelPump(95, 20)).toBe(FUEL_TANK_FULL);
    });

    it('treats negative current as zero', () => {
      expect(applyFuelPump(-10, 15)).toBe(15);
    });
  });

  describe('isFuelTankFull', () => {
    it('returns false below full', () => {
      expect(isFuelTankFull(99)).toBe(false);
    });

    it('returns true at full', () => {
      expect(isFuelTankFull(FUEL_TANK_FULL)).toBe(true);
    });

    it('returns true above full', () => {
      expect(isFuelTankFull(120)).toBe(true);
    });
  });
});
