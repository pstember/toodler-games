import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_TONGUE_PARAMS,
  getTongueParams,
  setTongueParams,
  resetTongueParams,
  setTongueParam,
  clampTongueParams
} from './tongue-params.js';

describe('Tongue Parameters', () => {
  beforeEach(() => {
    // Reset to defaults before each test
    resetTongueParams();
  });

  describe('getTongueParams', () => {
    it('returns default params initially', () => {
      const params = getTongueParams();
      expect(params).toEqual(DEFAULT_TONGUE_PARAMS);
    });

    it('returns copy not reference', () => {
      const params1 = getTongueParams();
      const params2 = getTongueParams();
      expect(params1).not.toBe(params2);
    });

    it('mutations to returned object do not affect internal state', () => {
      const params = getTongueParams();
      params.globalBulge = 999;

      const freshParams = getTongueParams();
      expect(freshParams.globalBulge).toBe(DEFAULT_TONGUE_PARAMS.globalBulge);
    });
  });

  describe('setTongueParams', () => {
    it('updates params partially', () => {
      setTongueParams({ globalBulge: 3.5 });

      const params = getTongueParams();
      expect(params.globalBulge).toBe(3.5);
      expect(params.amplitudeMin).toBe(DEFAULT_TONGUE_PARAMS.amplitudeMin);
    });

    it('updates multiple params at once', () => {
      setTongueParams({
        globalBulge: 4.0,
        amplitudeMin: 0.5,
        widthMax: 2.0
      });

      const params = getTongueParams();
      expect(params.globalBulge).toBe(4.0);
      expect(params.amplitudeMin).toBe(0.5);
      expect(params.widthMax).toBe(2.0);
    });

    it('overwrites previous custom values', () => {
      setTongueParams({ globalBulge: 3.0 });
      setTongueParams({ globalBulge: 5.0 });

      const params = getTongueParams();
      expect(params.globalBulge).toBe(5.0);
    });

    it('handles empty object without error', () => {
      setTongueParams({});
      const params = getTongueParams();
      expect(params).toEqual(DEFAULT_TONGUE_PARAMS);
    });
  });

  describe('resetTongueParams', () => {
    it('restores defaults after custom values', () => {
      setTongueParams({ globalBulge: 10.0, amplitudeMin: 5.0 });
      resetTongueParams();

      const params = getTongueParams();
      expect(params).toEqual(DEFAULT_TONGUE_PARAMS);
    });

    it('can be called multiple times without error', () => {
      resetTongueParams();
      resetTongueParams();

      const params = getTongueParams();
      expect(params).toEqual(DEFAULT_TONGUE_PARAMS);
    });
  });

  describe('setTongueParam', () => {
    it('updates single param by key', () => {
      setTongueParam('globalBulge', 7.5);

      const params = getTongueParams();
      expect(params.globalBulge).toBe(7.5);
    });

    it('works with all default keys', () => {
      const keys = Object.keys(DEFAULT_TONGUE_PARAMS);

      keys.forEach((key) => {
        setTongueParam(key, DEFAULT_TONGUE_PARAMS[key]);
      });

      const params = getTongueParams();
      keys.forEach((key) => {
        expect(params[key]).toBe(DEFAULT_TONGUE_PARAMS[key]);
      });
    });

    it('ignores unknown keys', () => {
      setTongueParam('notARealKey', 99);
      expect(getTongueParams().notARealKey).toBeUndefined();
    });

    it('clamps pad so tab span remains feasible', () => {
      setTongueParam('tabSpanMin', 0.58);
      setTongueParam('edgeVertexPad', 0.24);
      const params = getTongueParams();
      expect(2 * params.edgeVertexPad + params.tabSpanMin).toBeLessThanOrEqual(1 + 1e-6);
    });

    it('updates cornerDamp2 correctly', () => {
      setTongueParam('cornerDamp2', 0.9);

      const params = getTongueParams();
      expect(params.cornerDamp2).toBe(0.9);
    });

    it('updates minChordLength correctly', () => {
      setTongueParam('minChordLength', 0.1);

      const params = getTongueParams();
      expect(params.minChordLength).toBe(0.1);
    });

    it('overwrites previous value for same key', () => {
      setTongueParam('refLen', 0.2);
      setTongueParam('refLen', 0.3);

      const params = getTongueParams();
      expect(params.refLen).toBe(0.3);
    });
  });

  describe('clampTongueParams', () => {
    it('orders min/max pairs', () => {
      const c = clampTongueParams({
        ...DEFAULT_TONGUE_PARAMS,
        amplitudeMin: 2,
        amplitudeMax: 1,
      });
      expect(c.amplitudeMin).toBe(1);
      expect(c.amplitudeMax).toBe(2);
    });
  });
});
