import { describe, it, expect } from 'vitest';
import { resolveDropSlot } from './drop-target.js';

/** @param {Partial<import('./drop-target.js').SlotRect> & { slotIndex: number }} p */
function slot(p) {
  return {
    empty: true,
    left: 0,
    top: 0,
    right: 100,
    bottom: 100,
    ...p,
  };
}

describe('resolveDropSlot', () => {
  it('returns null when pointer is outside all slots', () => {
    const slots = [slot({ slotIndex: 0, left: 0, right: 50, top: 0, bottom: 50 })];
    expect(resolveDropSlot(0, 200, 200, slots)).toBeNull();
  });

  it('prefers correct empty slot under overlapping AABBs', () => {
    // Slot 1 painted later (on top) but piece 0 is correct for slot 0
    const slots = [
      slot({ slotIndex: 0, left: 0, right: 80, top: 0, bottom: 80 }),
      slot({ slotIndex: 1, left: 40, right: 120, top: 40, bottom: 120 }),
    ];
    // Point in overlap — DOM top would be slot 1; toddler piece 0 must still win
    expect(resolveDropSlot(0, 60, 60, slots)).toBe(0);
  });

  it('ignores occupied correct slot and falls back to topmost empty', () => {
    const slots = [
      slot({ slotIndex: 0, empty: false, left: 0, right: 80, top: 0, bottom: 80 }),
      slot({ slotIndex: 1, empty: true, left: 40, right: 120, top: 40, bottom: 120 }),
    ];
    expect(resolveDropSlot(0, 60, 60, slots)).toBe(1);
  });

  it('returns null when all overlapping slots are occupied', () => {
    const slots = [
      slot({ slotIndex: 0, empty: false, left: 0, right: 80, top: 0, bottom: 80 }),
      slot({ slotIndex: 1, empty: false, left: 40, right: 120, top: 40, bottom: 120 }),
    ];
    expect(resolveDropSlot(0, 60, 60, slots)).toBeNull();
  });

  it('uses topmost empty when dragging wrong piece over overlap', () => {
    const slots = [
      slot({ slotIndex: 0, left: 0, right: 80, top: 0, bottom: 80 }),
      slot({ slotIndex: 1, left: 40, right: 120, top: 40, bottom: 120 }),
    ];
    // Piece 2 has no slot under pointer; topmost empty is 1
    expect(resolveDropSlot(2, 60, 60, slots)).toBe(1);
  });

  it('returns sole empty slot under pointer', () => {
    const slots = [slot({ slotIndex: 3, left: 10, right: 40, top: 10, bottom: 40 })];
    expect(resolveDropSlot(3, 20, 20, slots)).toBe(3);
  });
});
