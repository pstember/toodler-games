import { describe, it, expect } from 'vitest';
import {
  starsFromHits,
  infiniteTierFromElapsed,
  shuffleInPlace,
  resolveHit,
  notesPastMissGrace,
  INFINITE_RAMP_SEC
} from './game-logic.js';

describe('starsFromHits (production)', () => {
  it('returns 3 stars when total is 0', () => {
    expect(starsFromHits(0, 0)).toBe(3);
  });

  it('returns 3 stars for 85%+', () => {
    expect(starsFromHits(85, 100)).toBe(3);
    expect(starsFromHits(100, 100)).toBe(3);
  });

  it('returns 2 stars for 55–84%', () => {
    expect(starsFromHits(55, 100)).toBe(2);
    expect(starsFromHits(84, 100)).toBe(2);
  });

  it('returns 1 star below 55%', () => {
    expect(starsFromHits(0, 100)).toBe(1);
    expect(starsFromHits(54, 100)).toBe(1);
  });
});

describe('infiniteTierFromElapsed (production)', () => {
  it('returns tier 1 for first ramp window', () => {
    expect(infiniteTierFromElapsed(0)).toBe(1);
    expect(infiniteTierFromElapsed(INFINITE_RAMP_SEC - 1)).toBe(1);
  });

  it('returns tier 2 then 3', () => {
    expect(infiniteTierFromElapsed(INFINITE_RAMP_SEC)).toBe(2);
    expect(infiniteTierFromElapsed(INFINITE_RAMP_SEC * 2)).toBe(3);
    expect(infiniteTierFromElapsed(INFINITE_RAMP_SEC * 5)).toBe(3);
  });
});

describe('shuffleInPlace (production)', () => {
  it('keeps length and members', () => {
    const arr = [1, 2, 3, 4, 5];
    shuffleInPlace(arr, () => 0.5);
    expect(arr.length).toBe(5);
    expect([...arr].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('resolveHit (production)', () => {
  const note = (time, lane, extra = {}) => ({ time, lane, hit: false, missed: false, ...extra });

  it('returns empty without consuming when no active notes', () => {
    const r = resolveHit([], 0, 1, 0.4, 0.5, 0.1);
    expect(r.kind).toBe('empty');
    expect(r.consume).toBe(false);
  });

  it('does not consume wrong-lane taps far from notes', () => {
    const notes = [note(5, 0)];
    const r = resolveHit(notes, 1, 1, 0.4, 0.5, 0.1);
    expect(r.kind).toBe('empty');
    expect(r.consume).toBe(false);
    expect(notes[0].missed).toBe(false);
  });

  it('consumes wrong-lane taps near a note', () => {
    const notes = [note(1.0, 0)];
    const r = resolveHit(notes, 1, 1.0, 0.4, 0.5, 0.1);
    expect(r.kind).toBe('wrong');
    expect(r.consume).toBe(true);
    expect(r.note).toBe(notes[0]);
  });

  it('scores perfect and good in hit window', () => {
    const notes = [note(2.0, 0)];
    expect(resolveHit(notes, 0, 2.0, 0.4, 0.5, 0.1).kind).toBe('perfect');
    expect(resolveHit(notes, 0, 2.25, 0.4, 0.5, 0.1).kind).toBe('good');
    expect(resolveHit(notes, 0, 2.25, 0.4, 0.5, 0.1).consume).toBe(false);
  });

  it('does not consume early taps on correct lane', () => {
    const notes = [note(2.0, 0)];
    const r = resolveHit(notes, 0, 1.0, 0.4, 0.5, 0.1);
    expect(r.kind).toBe('early');
    expect(r.consume).toBe(false);
  });

  it('consumes late taps on correct lane', () => {
    const notes = [note(2.0, 0)];
    const r = resolveHit(notes, 0, 2.5, 0.4, 0.5, 0.1);
    expect(r.kind).toBe('late');
    expect(r.consume).toBe(true);
  });
});

describe('notesPastMissGrace', () => {
  it('returns only overdue unhandled notes', () => {
    const notes = [
      { time: 1, lane: 0, hit: false, missed: false },
      { time: 2, lane: 1, hit: true, missed: false },
      { time: 3, lane: 2, hit: false, missed: false }
    ];
    const overdue = notesPastMissGrace(notes, 2.5, 0.5);
    expect(overdue).toHaveLength(1);
    expect(overdue[0].time).toBe(1);
  });
});
