/**
 * Pure rhythm-game logic (scoring, hit resolution, tiers).
 * Kept free of DOM / Audio so vitest can cover production rules.
 */

export const INFINITE_RAMP_SEC = 60;

/**
 * @param {number} hits
 * @param {number} total
 * @returns {0 | 1 | 2 | 3}
 */
export function starsFromHits(hits, total) {
  if (total === 0) return 3;
  const ratio = hits / total;
  if (ratio >= 0.85) return 3;
  if (ratio >= 0.55) return 2;
  return 1;
}

/** @param {number} t elapsed seconds */
export function infiniteTierFromElapsed(t, rampSec = INFINITE_RAMP_SEC) {
  return Math.min(3, Math.floor(t / rampSec) + 1);
}

/** Fisher–Yates shuffle in place. */
export function shuffleInPlace(arr, randomFn = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Resolve a lane tap against active notes.
 *
 * Rules (toddler-friendly):
 * - Empty chart / no active notes → empty (no consume)
 * - Wrong lane far from any note → empty (no consume)
 * - Wrong lane near a note → wrong (consume that note)
 * - Correct lane in hit window → hit / perfect
 * - Correct lane early → early (no consume — retry allowed)
 * - Correct lane late (past hit window, before auto-miss) → late (consume)
 *
 * @typedef {{ time: number, lane: number, hit?: boolean, missed?: boolean }} Note
 * @typedef {{
 *   kind: 'empty' | 'wrong' | 'perfect' | 'good' | 'early' | 'late',
 *   note: Note | null,
 *   consume: boolean
 * }} HitResult
 *
 * @param {Note[]} notes
 * @param {number} lane
 * @param {number} t elapsed seconds
 * @param {number} hitWindow
 * @param {number} wrongKeyWindow
 * @param {number} perfectWindow
 * @returns {HitResult}
 */
export function resolveHit(notes, lane, t, hitWindow, wrongKeyWindow, perfectWindow) {
  const active = notes.filter((n) => !n.hit && !n.missed);
  if (active.length === 0) {
    return { kind: 'empty', note: null, consume: false };
  }

  let best = active[0];
  let bestAbs = Math.abs(best.time - t);
  for (let i = 1; i < active.length; i++) {
    const n = active[i];
    const a = Math.abs(n.time - t);
    if (a < bestAbs) {
      bestAbs = a;
      best = n;
    }
  }

  if (best.lane !== lane) {
    if (bestAbs <= wrongKeyWindow) {
      return { kind: 'wrong', note: best, consume: true };
    }
    return { kind: 'empty', note: null, consume: false };
  }

  const delta = best.time - t;
  const abs = Math.abs(delta);

  if (abs <= hitWindow) {
    const pw = Math.min(perfectWindow, hitWindow);
    if (abs <= pw) {
      return { kind: 'perfect', note: best, consume: false };
    }
    return { kind: 'good', note: best, consume: false };
  }

  if (delta > hitWindow) {
    // Too early — do not permanently miss; toddler can try again
    return { kind: 'early', note: best, consume: false };
  }

  return { kind: 'late', note: best, consume: true };
}

/**
 * Notes that should auto-miss at time t.
 * @param {Note[]} notes
 * @param {number} t
 * @param {number} missGrace
 * @returns {Note[]}
 */
export function notesPastMissGrace(notes, t, missGrace) {
  return notes.filter((n) => !n.hit && !n.missed && t > n.time + missGrace);
}
