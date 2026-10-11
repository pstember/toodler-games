/**
 * Rhythm Tap — levels, Challenger (4 lanes), dynamic hit window, visual timing band.
 */
import { initThemeManagement, CANONICAL_THEME_COLORS } from '../shared/theme.js';
import { setLanguage, getCurrentLanguage, translate } from './translations.js';
import {
  starsFromHits,
  infiniteTierFromElapsed,
  shuffleInPlace,
  resolveHit,
  notesPastMissGrace,
  INFINITE_RAMP_SEC
} from './game-logic.js';

const LEAD_IN_SEC = 2;

/** Normal mode: 3 lanes — BPM ↑ and hitWindow ↓ as level increases (single notes only). */
const LEVEL_CONFIG = [
  { level: 1, bpm: 58, hitWindow: 0.52, comboMax: 5, pixelsPerSecond: 218 },
  { level: 2, bpm: 64, hitWindow: 0.42, comboMax: 8, pixelsPerSecond: 232 },
  { level: 3, bpm: 70, hitWindow: 0.34, comboMax: 8, pixelsPerSecond: 248 }
];

/** Challenger: 4th lane (blue), faster, tighter window. */
const CHALLENGER_CONFIG = {
  lanes: 4,
  bpm: 76,
  hitWindow: 0.26,
  comboMax: 10,
  pixelsPerSecond: 268
};

const PATTERN_3 = [
  0, 1, 2, 1, 0, 1, 2, 1,
  0, 0, 2, 2, 1, 1, 0, 2,
  1, 0, 2, 1, 0, 1, 2, 0,
  2, 1, 0, 1, 2, 2, 1, 0
];

const PATTERN_4 = [
  0, 1, 2, 3, 1, 0, 3, 2,
  0, 2, 1, 3, 2, 0, 1, 3,
  3, 1, 0, 2, 1, 3, 2, 0,
  2, 3, 1, 0, 3, 2, 0, 1
];

/** Append another note chunk when this many seconds of chart remain (infinite). */
const INFINITE_EXTEND_BUFFER_SEC = 14;
/** ♾️ mode: end the run when missed notes exceed this count (game ends on the next miss). */
const INFINITE_MAX_MISSES = 5;
/** ♾️ hearts shown — one greys out per miss (game over when misses exceed max). */
const INFINITE_LIFE_HEARTS = INFINITE_MAX_MISSES + 1;
const LANE_COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6'];

function getPatternLanes() {
  const base = state.laneCount === 4 ? [...PATTERN_4] : [...PATTERN_3];
  if (state.randomPattern) {
    shuffleInPlace(base);
  }
  return base;
}

/** Note block height in px (was 22; doubled for visibility). */
const NOTE_HEIGHT_PX = 44;

/** Half-height in time: tap is Perfect while the hit line intersects the note (center within this many seconds of the beat). */
function getPerfectWindowSec() {
  return NOTE_HEIGHT_PX / (2 * state.pixelsPerSecond);
}

function getEffectiveSettings() {
  /** ♾️: start like level 1, then every minute match level 2 / 3 (optionally with 4 lanes + Challenger). */
  if (state.infiniteMode) {
    const idx = Math.max(0, Math.min(2, (state.infiniteRampTier || 1) - 1));
    const cfg = LEVEL_CONFIG[idx];
    const beat = 60 / cfg.bpm;
    return {
      laneCount: state.challengerMode ? 4 : 3,
      bpm: cfg.bpm,
      hitWindow: cfg.hitWindow,
      comboMax: cfg.comboMax,
      pixelsPerSecond: cfg.pixelsPerSecond,
      beat,
      wrongKeyWindow: cfg.hitWindow * 1.35
    };
  }
  if (state.challengerMode) {
    const c = CHALLENGER_CONFIG;
    const beat = 60 / c.bpm;
    return {
      laneCount: c.lanes,
      bpm: c.bpm,
      hitWindow: c.hitWindow,
      comboMax: c.comboMax,
      pixelsPerSecond: c.pixelsPerSecond,
      beat,
      wrongKeyWindow: c.hitWindow * 1.35
    };
  }
  const cfg = LEVEL_CONFIG[(state.selectedLevel || 1) - 1] ?? LEVEL_CONFIG[0];
  const beat = 60 / cfg.bpm;
  return {
    laneCount: 3,
    bpm: cfg.bpm,
    hitWindow: cfg.hitWindow,
    comboMax: cfg.comboMax,
    pixelsPerSecond: cfg.pixelsPerSecond,
    beat,
    wrongKeyWindow: cfg.hitWindow * 1.35
  };
}

function applyGameSettings() {
  const s = getEffectiveSettings();
  state.laneCount = s.laneCount;
  state.bpm = s.bpm;
  state.hitWindow = s.hitWindow;
  state.comboMax = s.comboMax;
  state.pixelsPerSecond = s.pixelsPerSecond;
  state.beat = s.beat;
  state.wrongKeyWindow = s.wrongKeyWindow;
}

function buildChart() {
  const lanes = getPatternLanes();
  const notes = [];
  let t = LEAD_IN_SEC;
  lanes.forEach((lane) => {
    notes.push({
      id: state.noteIdSeq++,
      lane,
      time: t,
      hit: false,
      missed: false
    });
    t += state.beat;
  });
  return notes;
}

function appendInfiniteSegment() {
  const lanes = getPatternLanes();
  let t = state.notes.at(-1).time + state.beat;
  lanes.forEach((lane) => {
    state.notes.push({
      id: state.noteIdSeq++,
      lane,
      time: t,
      hit: false,
      missed: false
    });
    t += state.beat;
  });
}

function playHitSound(ctx, lane) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const freqs = [392, 523, 659, 784];
  o.type = 'sine';
  o.frequency.value = freqs[lane] ?? 440;
  g.gain.value = 0.12;
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + 0.15);
}

function playFailSound(ctx) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.value = 110;
  g.gain.value = 0.09;
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + 0.18);
}

let feedbackHideTimer = 0;

/**
 * @param {'perfect' | 'hit-good' | 'good' | 'early' | 'late' | 'empty' | 'wrong'} kind
 * @param {'hit-perfect' | 'hit-good' | 'combo' | 'fail-early' | 'fail-late' | 'fail-no-note' | 'fail-wrong'} translationKey
 */
function showTimingFeedback(kind, translationKey) {
  const el = document.getElementById('timing-feedback');
  if (!el) return;
  el.textContent = translate(translationKey);
  el.className = `timing-feedback timing-feedback--${kind}`;
  el.getBoundingClientRect();
  el.classList.add('timing-feedback--pop');
  clearTimeout(feedbackHideTimer);
  feedbackHideTimer = setTimeout(() => {
    el.classList.remove('timing-feedback--pop');
  }, 500);
}

/**
 * Full-screen edge flash: red only for "too late" tap; purple (same as wrong color) for wrong lane, too soon, and auto-missed notes.
 * @param {'late' | 'wrong'} kind - 'late' = red glow; anything else = purple glow (wrong / early / miss)
 */
let flashClearTimer = 0;

function flashGameUi(kind) {
  const ui = document.getElementById('game-ui');
  if (!ui || ui.classList.contains('hidden')) return;
  ui.classList.remove('late-flash', 'wrong-flash');
  ui.getBoundingClientRect();
  if (kind === 'late') {
    ui.classList.add('late-flash');
  } else {
    ui.classList.add('wrong-flash');
  }
  clearTimeout(flashClearTimer);
  flashClearTimer = setTimeout(() => {
    ui.classList.remove('late-flash', 'wrong-flash');
  }, 450);
}

function playOneBackingClick(ctx, audioTime) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.value = 110;
  g.gain.value = 0.06;
  g.gain.exponentialRampToValueAtTime(0.001, audioTime + 0.05);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(audioTime);
  o.stop(audioTime + 0.06);
}

function scheduleBackingClicks(ctx, startAt, beats, beatDur) {
  for (let i = 0; i < beats; i++) {
    playOneBackingClick(ctx, startAt + i * beatDur);
  }
}

const state = {
  notes: [],
  playing: false,
  startMs: 0,
  /** AudioContext.currentTime at song start (keeps visuals + SFX on one clock). */
  startAudioTime: null,
  hits: 0,
  audioCtx: null,
  animationId: 0,
  hitLineY: 0,
  cssWidth: 360,
  cssHeight: 420,
  combo: 0,
  laneCount: 3,
  selectedLevel: 1,
  challengerMode: false,
  bpm: 64,
  hitWindow: 0.48,
  comboMax: 8,
  pixelsPerSecond: 240,
  beat: 60 / 64,
  wrongKeyWindow: 0.48 * 1.35,
  randomPattern: false,
  infiniteMode: false,
  /** Notes passed without a hit (♾️ mode only; ends run when > INFINITE_MAX_MISSES). */
  infiniteMissCount: 0,
  /** 1–3 while ♾️; which LEVEL_CONFIG step (ramps over time). */
  infiniteRampTier: 1,
  /** ♾️ metronome: last integer beat index played (game time). */
  lastMetronomeBeatIndex: -1,
  noteIdSeq: 0,
  /** Wall-clock ms when tab was hidden (pause support). */
  hiddenAtMs: null
};

function resetCombo() {
  state.combo = 0;
  updateComboBar();
}

function updateComboBar() {
  const fill = document.getElementById('combo-bar-fill');
  const label = document.getElementById('combo-count');
  const bar = document.getElementById('combo-bar');
  const max = state.comboMax;
  const pct = Math.min(100, (Math.min(state.combo, max) / max) * 100);
  if (fill) fill.style.width = `${pct}%`;
  if (label) label.textContent = String(state.combo);
  if (bar) {
    bar.setAttribute('aria-valuenow', String(Math.min(state.combo, max)));
    bar.setAttribute('aria-valuemax', String(max));
  }
}

function syncKeyboardHint() {
  const el = document.getElementById('keyboard-hint');
  if (!el) return;
  el.textContent = translate(state.laneCount === 4 ? 'keyboard-hint-4' : 'keyboard-hint-3');
}

function registerInfiniteMiss() {
  if (!state.infiniteMode || !state.playing) return;
  state.infiniteMissCount += 1;
  updateLifeHearts();
  if (state.infiniteMissCount > INFINITE_MAX_MISSES) {
    endSong();
  }
}

/** One life / one failure per note in ♾️: mark the note done and count a limitless miss (idempotent per note). */
function consumeNoteMiss(note) {
  if (note.hit || note.missed) return;
  note.missed = true;
  registerInfiniteMiss();
}

function ensureLifeHeartElements(row) {
  let hearts = row.querySelectorAll('.life-heart');
  if (hearts.length === INFINITE_LIFE_HEARTS) return hearts;
  row.replaceChildren();
  for (let i = 0; i < INFINITE_LIFE_HEARTS; i++) {
    const el = document.createElement('span');
    el.className = 'life-heart life-heart--full';
    el.dataset.lost = '0';
    el.setAttribute('aria-hidden', 'true');
    el.textContent = '❤️';
    row.appendChild(el);
  }
  return row.querySelectorAll('.life-heart');
}

function updateLifeHearts() {
  const row = document.getElementById('life-row');
  if (!row) return;
  if (!state.infiniteMode || !state.playing) {
    row.setAttribute('hidden', '');
    row.setAttribute('aria-hidden', 'true');
    return;
  }
  row.removeAttribute('hidden');
  row.setAttribute('aria-hidden', 'false');
  const hearts = ensureLifeHeartElements(row);
  const remaining = Math.max(0, INFINITE_LIFE_HEARTS - state.infiniteMissCount);
  row.setAttribute(
    'aria-label',
    translate('lives-aria').replace('{r}', String(remaining)).replace('{t}', String(INFINITE_LIFE_HEARTS))
  );
  hearts.forEach((el, i) => {
    const nowLost = i < state.infiniteMissCount;
    const wasLost = el.dataset.lost === '1';
    el.dataset.lost = nowLost ? '1' : '0';
    el.textContent = nowLost ? '🩶' : '❤️';
    el.classList.toggle('life-heart--lost', nowLost);
    el.classList.toggle('life-heart--full', !nowLost);
    if (!nowLost) {
      el.classList.remove('life-heart--pop');
    } else if (!wasLost) {
      el.classList.remove('life-heart--pop');
      el.getBoundingClientRect();
      el.classList.add('life-heart--pop');
    }
  });
}

function updateModeBadges() {
  const el = document.getElementById('mode-badges');
  if (!el) return;
  const parts = [];
  if (state.randomPattern) parts.push('🎲');
  if (state.infiniteMode) parts.push('♾️');
  if (state.challengerMode) parts.push('⚔️');
  el.textContent = parts.join('\u00A0');
  if (parts.length > 0) {
    el.removeAttribute('hidden');
    el.setAttribute('aria-label', parts.join(' '));
  } else {
    el.setAttribute('hidden', '');
    el.removeAttribute('aria-label');
  }
}

function updateInfiniteTierBadge() {
  const badge = document.getElementById('infinite-tier-badge');
  if (!badge) return;
  if (state.infiniteMode && state.playing) {
    badge.textContent = translate('infinite-stage').replace('{n}', String(state.infiniteRampTier));
    badge.removeAttribute('hidden');
    badge.setAttribute('aria-hidden', 'false');
  } else {
    badge.setAttribute('hidden', '');
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = '';
  }
}

function applyInfiniteTierIfNeeded(t) {
  if (!state.infiniteMode || !state.playing) return;
  const next = infiniteTierFromElapsed(t);
  if (next === state.infiniteRampTier) return;
  state.infiniteRampTier = next;
  applyGameSettings();
  state.lastMetronomeBeatIndex = Math.floor(t / state.beat) - 1;
  updateComboBar();
  updateInfiniteTierBadge();
}

function updateLaneButtonRow() {
  const wrap = document.querySelector('.lane-buttons');
  if (wrap) {
    wrap.classList.toggle('lane-buttons--4', state.laneCount === 4);
  }
  const b3 = document.querySelector('.lane-btn--3');
  if (b3) {
    if (state.laneCount === 4) {
      b3.removeAttribute('hidden');
      b3.setAttribute('aria-hidden', 'false');
    } else {
      b3.setAttribute('hidden', '');
      b3.setAttribute('aria-hidden', 'true');
    }
  }
}

function getCanvasCoords(canvas) {
  const dpr = window.devicePixelRatio || 1;
  return { dpr, w: canvas.width / dpr, h: canvas.height / dpr };
}

function resizeCanvas(canvas, ctx) {
  const wrap = canvas.parentElement;
  const rect = wrap.getBoundingClientRect();
  const w = Math.min(400, Math.max(280, rect.width));
  const h = Math.min(520, Math.max(360, w * 1.15));
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  state.cssWidth = w;
  state.cssHeight = h;
  state.hitLineY = h * 0.82;
}

function elapsedSec() {
  // Prefer audio clock when available so notes and SFX stay aligned
  if (state.audioCtx && state.startAudioTime != null) {
    return state.audioCtx.currentTime - state.startAudioTime;
  }
  return (performance.now() - state.startMs) / 1000;
}

function draw(ctx, canvas) {
  const { w, h } = getCanvasCoords(canvas);
  const hitY = state.hitLineY;
  const lanes = state.laneCount;
  const lw = w / lanes;
  const winPx = state.hitWindow * state.pixelsPerSecond;

  ctx.clearRect(0, 0, w, h);

  for (let i = 0; i < lanes; i++) {
    const x = i * lw;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)';
    ctx.fillRect(x, 0, lw, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, 1, lw - 2, h - 2);
  }

  if (state.playing) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.09)';
    ctx.fillRect(0, hitY - winPx, w, winPx * 2);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, hitY - winPx);
    ctx.lineTo(w, hitY - winPx);
    ctx.moveTo(0, hitY + winPx);
    ctx.lineTo(w, hitY + winPx);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(167, 200, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(2, hitY - winPx + 1, w - 4, winPx * 2 - 2);
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, hitY);
  ctx.lineTo(w, hitY);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '600 14px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('▼', w / 2, hitY - 8);

  if (!state.playing) return;

  const t = elapsedSec();
  const pad = Math.max(6, 14 - lanes * 2);

  for (const n of state.notes) {
    if (n.hit) continue;
    const dist = n.time - t;
    const y = hitY - dist * state.pixelsPerSecond;

    if (n.missed && y > h + 40) continue;

    const alpha = n.missed ? 0.25 : 1;
    const laneW = lw - pad * 2;
    const x = n.lane * lw + pad;
    const nh = NOTE_HEIGHT_PX;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = LANE_COLORS[n.lane] ?? '#fff';
    const top = y - nh / 2;
    ctx.beginPath();
    if (state.hasRoundRect) {
      ctx.roundRect(x, top, laneW, nh, 10);
    } else {
      ctx.rect(x, top, laneW, nh);
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

}

function processAutoMisses(t) {
  const missGrace = state.hitWindow * 1.2;
  const overdue = notesPastMissGrace(state.notes, t, missGrace);
  for (const n of overdue) {
    consumeNoteMiss(n);
    resetCombo();
    if (state.audioCtx) {
      playFailSound(state.audioCtx);
    }
    flashGameUi('wrong');
  }
}

function gameLoop(canvas, ctx) {
  draw(ctx, canvas);
  if (!state.playing) return;

  const t = elapsedSec();
  processAutoMisses(t);

  if (state.infiniteMode && state.audioCtx) {
    applyInfiniteTierIfNeeded(t);
    const beatIdx = Math.floor(t / state.beat);
    if (beatIdx > state.lastMetronomeBeatIndex) {
      state.lastMetronomeBeatIndex = beatIdx;
      playOneBackingClick(state.audioCtx, state.audioCtx.currentTime);
    }
  }

  if (state.infiniteMode && state.notes.length > 0) {
    let guard = 0;
    const maxTime = t + 120; // Safety: don't generate more than 2 minutes ahead
    while (guard++ < 6) {
      const last = state.notes.at(-1);
      if (last.time - t >= INFINITE_EXTEND_BUFFER_SEC || last.time > maxTime) break;
      appendInfiniteSegment();
    }
  }

  const lastEnd =
    state.notes.length > 0 ? state.notes.at(-1).time + 2.5 : LEAD_IN_SEC + 2;

  if (!state.infiniteMode && t > lastEnd) {
    endSong();
    return;
  }

  state.animationId = requestAnimationFrame(() => gameLoop(canvas, ctx));
}

function tryHit(lane) {
  if (!state.playing || !state.audioCtx) return;
  if (lane < 0 || lane >= state.laneCount) return;

  const t = elapsedSec();
  const result = resolveHit(
    state.notes,
    lane,
    t,
    state.hitWindow,
    state.wrongKeyWindow,
    getPerfectWindowSec()
  );

  if (result.consume && result.note) {
    consumeNoteMiss(result.note);
  }

  if (result.kind === 'perfect' || result.kind === 'good') {
    const g = result.note;
    g.hit = true;
    state.hits += 1;
    state.combo += 1;
    updateComboBar();
    const live = document.getElementById('live-hits');
    if (live) live.textContent = String(state.hits);
    playHitSound(state.audioCtx, lane);
    if (result.kind === 'perfect') {
      showTimingFeedback('perfect', 'hit-perfect');
    } else {
      showTimingFeedback('hit-good', 'hit-good');
    }
    return;
  }

  playFailSound(state.audioCtx);
  resetCombo();

  if (result.kind === 'wrong') {
    showTimingFeedback('wrong', 'fail-wrong');
    flashGameUi('wrong');
    return;
  }
  if (result.kind === 'early') {
    showTimingFeedback('early', 'fail-early');
    flashGameUi('wrong');
    return;
  }
  if (result.kind === 'late') {
    showTimingFeedback('late', 'fail-late');
    flashGameUi('late');
    return;
  }
  showTimingFeedback('empty', 'fail-no-note');
}

function endSong() {
  state.playing = false;
  cancelAnimationFrame(state.animationId);
  updateInfiniteTierBadge();
  updateLifeHearts();

  const total = state.notes.length;
  const stars = starsFromHits(state.hits, total);

  const win = document.getElementById('win-overlay');
  const starEls = document.querySelectorAll('.win-stars .star');
  starEls.forEach((el, i) => {
    el.textContent = i < stars ? '⭐' : '☆';
    el.classList.toggle('star--lit', i < stars);
  });

  const finiteScore = document.getElementById('win-score-finite');
  const infiniteScore = document.getElementById('win-score-infinite');
  if (state.infiniteMode) {
    finiteScore?.classList.add('hidden');
    if (infiniteScore) {
      infiniteScore.textContent = translate('win-hits-only').replace('{n}', String(state.hits));
      infiniteScore.classList.remove('hidden');
    }
  } else {
    infiniteScore?.classList.add('hidden');
    finiteScore?.classList.remove('hidden');
    const hitEl = document.getElementById('hit-count');
    const totalEl = document.getElementById('note-total');
    if (hitEl) hitEl.textContent = String(state.hits);
    if (totalEl) totalEl.textContent = String(total);
  }

  win?.classList.remove('hidden');
}

function readSplashSelections() {
  const activePill = document.querySelector('.level-pill--active');
  const lv = activePill ? Number.parseInt(activePill.dataset.level, 10) : 1;
  state.selectedLevel = lv >= 1 && lv <= 3 ? lv : 1;
  const ch = document.getElementById('challenger-checkbox');
  state.challengerMode = Boolean(ch?.checked);
  state.randomPattern = Boolean(document.getElementById('random-checkbox')?.checked);
  state.infiniteMode = Boolean(document.getElementById('infinite-checkbox')?.checked);
}

function startSong(canvas, ctx) {
  readSplashSelections();
  if (state.infiniteMode) {
    state.infiniteRampTier = 1;
    state.lastMetronomeBeatIndex = -1;
  }
  applyGameSettings();
  resizeCanvas(canvas, ctx);
  updateLaneButtonRow();
  syncKeyboardHint();

  state.noteIdSeq = 0;
  state.notes = buildChart();
  state.hits = 0;
  state.infiniteMissCount = 0;
  state.combo = 0;
  updateComboBar();
  updateModeBadges();
  const live = document.getElementById('live-hits');
  if (live) live.textContent = '0';
  state.playing = true;
  state.startMs = performance.now();
  state.startAudioTime = null;
  state.hiddenAtMs = null;
  updateInfiniteTierBadge();
  updateLifeHearts();

  const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!state.audioCtx) {
    state.audioCtx = new AudioCtx();
  }
  const ctxA = state.audioCtx;

  const beginPlayback = () => {
    state.startAudioTime = ctxA.currentTime;
    state.startMs = performance.now();
    const lastT = state.notes.at(-1).time;
    if (!state.infiniteMode) {
      const beatCount = Math.ceil(lastT / state.beat) + 4;
      scheduleBackingClicks(ctxA, state.startAudioTime + 0.05, beatCount, state.beat);
    }
    document.getElementById('win-overlay')?.classList.add('hidden');
    gameLoop(canvas, ctx);
  };

  if (ctxA.state === 'suspended') {
    ctxA.resume().then(beginPlayback).catch(beginPlayback);
  } else {
    beginPlayback();
  }
}

function wireLaneButtons() {
  document.querySelectorAll('[data-lane]').forEach((btn) => {
    const lane = Number.parseInt(btn.dataset.lane, 10);
    if (Number.isNaN(lane) || lane < 0 || lane > 3) return;
    const go = (e) => {
      e.preventDefault();
      tryHit(lane);
    };
    btn.addEventListener('pointerdown', go);
  });
}

function wireLevelPills() {
  document.querySelectorAll('.level-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.level-pill').forEach((p) => p.classList.remove('level-pill--active'));
      pill.classList.add('level-pill--active');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeManagement(CANONICAL_THEME_COLORS);

  const langSel = document.getElementById('language-select');
  langSel.value = getCurrentLanguage();
  setLanguage(getCurrentLanguage());
  langSel.addEventListener('change', (e) => {
    setLanguage(e.target.value);
    syncKeyboardHint();
  });

  const canvas = document.getElementById('rhythm-canvas');
  const ctx = canvas.getContext('2d');

  // Cache roundRect support to avoid checking in render loop
  state.hasRoundRect = typeof ctx.roundRect === 'function';

  const splash = document.getElementById('splash-screen');
  const gameUi = document.getElementById('game-ui');
  const startBtn = document.getElementById('start-game-btn');
  const againBtn = document.getElementById('play-again-btn');

  function onResize() {
    resizeCanvas(canvas, ctx);
    draw(ctx, canvas);
  }

  window.addEventListener('resize', onResize);
  onResize();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (state.playing) {
        state.hiddenAtMs = performance.now();
        cancelAnimationFrame(state.animationId);
        if (state.audioCtx?.state === 'running') {
          state.audioCtx.suspend();
        }
      }
      return;
    }
    if (!state.playing || state.hiddenAtMs == null) return;
    const pausedMs = performance.now() - state.hiddenAtMs;
    state.hiddenAtMs = null;
    state.startMs += pausedMs;
    const resume = state.audioCtx?.resume?.() ?? Promise.resolve();
    resume.then(() => {
      if (state.audioCtx && state.startAudioTime != null) {
        // Keep audio-relative clock continuous across suspend
        state.startAudioTime = state.audioCtx.currentTime - (performance.now() - state.startMs) / 1000;
      }
      gameLoop(canvas, ctx);
    });
  });

  wireLaneButtons();
  wireLevelPills();

  startBtn.addEventListener('click', () => {
    splash.classList.add('hidden');
    gameUi.classList.remove('hidden');
    gameUi.setAttribute('aria-hidden', 'false');
    startSong(canvas, ctx);
  });

  againBtn.addEventListener('click', () => {
    document.getElementById('win-overlay')?.classList.add('hidden');
    startSong(canvas, ctx);
  });

  globalThis.addEventListener('keydown', (e) => {
    if (!state.playing) return;
    const map3 = { KeyZ: 0, KeyX: 1, KeyC: 2, Digit1: 0, Digit2: 1, Digit3: 2 };
    const map4 = { ...map3, KeyV: 3, Digit4: 3 };
    const map = state.laneCount === 4 ? map4 : map3;
    const lane = map[e.code];
    if (lane !== undefined) {
      e.preventDefault();
      tryHit(lane);
    }
  });

  draw(ctx, canvas);
  syncKeyboardHint();
  updateLaneButtonRow();
});
