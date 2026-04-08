import { createJigsawState, placePiece, createSeededRandom } from './puzzle-logic.js';
import { buildVoronoiJigsaw } from './voronoi-jigsaw.js';
import {
  getTongueParams,
  setTongueParam,
  resetTongueParams,
  DEFAULT_TONGUE_PARAMS,
} from './tongue-params.js';
import { setLanguage, resolveStoredLanguage, tCurrent } from './translations.js';
import { initThemeManagement, CANONICAL_THEME_COLORS } from '../../shared/theme.js';

const LEVELS = [
  { cols: 3, rows: 3 },
  { cols: 4, rows: 3 },
  { cols: 4, rows: 4 },
  { cols: 5, rows: 4 },
  { cols: 8, rows: 6 },
];

const DEFAULT_IMAGE_URL =
  'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&fit=crop';

function initLanguageSelect() {
  const lang = resolveStoredLanguage();
  const sel = document.getElementById('language-select');
  if (sel) sel.value = lang;
  setLanguage(lang);
  sel?.addEventListener('change', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const v = target.value;
    if (v === 'en' || v === 'fr' || v === 'es') {
      setLanguage(v);
    }
  });
}

let state = null;
/** Voronoi cells + tongue edges; set in startNewGame */
let pieceGeometry = null;
/** Fixed while tuning tongue sliders so only tabs change, not cell layout */
let voronoiLayoutSeed = Math.floor(Math.random() * 0x7fffffff);
/** @type {string | null} processed JPEG data URL */
let currentImageDataUrl = null;
/** @type {string | null} fallback when canvas taints (img.src) */
let fallbackImageSrc = null;
let sourceImage = null;
/** Revoked after canvas encodes JPEG, or when replacing with a new upload */
let objectUrlForSource = null;

function revokeSourceObjectUrl() {
  if (objectUrlForSource) {
    URL.revokeObjectURL(objectUrlForSource);
    objectUrlForSource = null;
  }
}

let audioContext = null;
let hintVisible = false;
let numbersVisible = false;

let dragState = null;

// Hint system: pulse the correct slot after 5 seconds
const HINT_DELAY_MS = 5000;
/** @type {Map<number, number>} Map of pieceId -> timer ID */
const hintTimers = new Map();

function clearHint(pieceId) {
  if (typeof pieceId !== 'number') return;
  const timerId = hintTimers.get(pieceId);
  if (timerId !== undefined) {
    clearTimeout(timerId);
    hintTimers.delete(pieceId);
  }
  // Remove hint class from the corresponding slot
  const slot = document.querySelector(`.board-slot[data-slot-index="${pieceId}"]`);
  if (slot) {
    slot.classList.remove('board-slot--hint');
  }
}

function clearAllHints() {
  hintTimers.forEach((timerId) => clearTimeout(timerId));
  hintTimers.clear();
  document.querySelectorAll('.board-slot--hint').forEach((el) => {
    el.classList.remove('board-slot--hint');
  });
}

function startHintTimer(pieceId) {
  if (typeof pieceId !== 'number') return;
  clearHint(pieceId); // Clear any existing timer

  const timerId = setTimeout(() => {
    const slot = document.querySelector(`.board-slot[data-slot-index="${pieceId}"]`);
    if (slot && slot.classList.contains('board-slot--empty')) {
      slot.classList.add('board-slot--hint');
    }
    hintTimers.delete(pieceId);
  }, HINT_DELAY_MS);

  hintTimers.set(pieceId, timerId);
}

function updateHintsForTray() {
  if (!state || !state.tray) {
    console.warn('updateHintsForTray: no state or tray');
    return;
  }
  // Start timers for all pieces in the tray
  state.tray.forEach((pieceId) => {
    startHintTimer(pieceId);
  });
}

function generateAllClipPaths() {
  const svgDefs = document.getElementById('svg-defs');
  if (!svgDefs || !pieceGeometry) return;
  svgDefs.replaceChildren();
  const ns = 'http://www.w3.org/2000/svg';
  pieceGeometry.pieces.forEach((g, i) => {
    const cp = document.createElementNS(ns, 'clipPath');
    cp.setAttribute('id', `piece-voronoi-${i}`);
    cp.setAttribute('clipPathUnits', 'objectBoundingBox');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', g.pathDNormalized);
    path.setAttribute('shape-rendering', 'crispEdges');
    cp.appendChild(path);
    svgDefs.appendChild(cp);
  });
}

function applyPieceBackground(el, pieceId) {
  const src = currentImageDataUrl || fallbackImageSrc;
  if (src) {
    el.style.backgroundImage = `url(${src})`;
  } else {
    el.style.backgroundImage = '';
  }
  el.style.backgroundRepeat = 'no-repeat';
  el.dataset.pieceId = String(pieceId);
  const clip = `url(#piece-voronoi-${pieceId})`;
  el.style.clipPath = clip;
  el.style.webkitClipPath = clip;
}

/** Same silhouette aspect as the piece on the board: (bw·Pw)/(bh·Ph). Scaled for tray. */
const TRAY_PIECE_SCALE = 0.5;
const TRAY_PIECE_MAX_PX = 96;

function layoutTrayPieceSizes(Pw, Ph) {
  if (!pieceGeometry) return;
  const pad = 0; // tray pieces have no outer frame; wrap fits the silhouette only
  document.querySelectorAll('.tray-piece-wrap').forEach((wrap) => {
    const id = Number.parseInt(wrap.dataset.pieceId ?? '', 10);
    const g = pieceGeometry.pieces[id];
    if (!g) return;
    const eps = 1e-9;
    const bw = Math.max(g.maxX - g.minX, eps);
    const bh = Math.max(g.maxY - g.minY, eps);
    const pieceW = bw * Pw;
    const pieceH = bh * Ph;
    let tw = pieceW * TRAY_PIECE_SCALE;
    let th = pieceH * TRAY_PIECE_SCALE;
    const m = Math.max(tw, th);
    if (m > TRAY_PIECE_MAX_PX) {
      const s = TRAY_PIECE_MAX_PX / m;
      tw *= s;
      th *= s;
    }
    wrap.style.boxSizing = 'border-box';
    wrap.style.width = `${Math.round(tw + pad)}px`;
    wrap.style.height = `${Math.round(th + pad)}px`;
  });
}

function layoutPieceBackgrounds() {
  if (!state || !pieceGeometry) return;
  const grid = document.getElementById('puzzle-grid');
  if (!grid) return;
  const { width: Pw, height: Ph } = grid.getBoundingClientRect();
  if (Pw < 2 || Ph < 2) return;

  layoutTrayPieceSizes(Pw, Ph);

  grid.querySelectorAll('.piece-surface').forEach((el) => {
    const id = Number.parseInt(el.dataset.pieceId ?? '', 10);
    const g = pieceGeometry.pieces[id];
    if (!g) return;
    el.style.backgroundSize = `${Pw}px ${Ph}px`;
    el.style.backgroundPosition = `${-g.minX * Pw}px ${-g.minY * Ph}px`;
  });

  document.querySelectorAll('.tray-piece-surface').forEach((el) => {
    const id = Number.parseInt(el.dataset.pieceId ?? '', 10);
    const g = pieceGeometry.pieces[id];
    const wrap = el.closest('.tray-piece-wrap');
    if (!g || !wrap) return;
    const cs = getComputedStyle(wrap);
    const pl = Number.parseFloat(cs.paddingLeft) || 0;
    const pr = Number.parseFloat(cs.paddingRight) || 0;
    const pt = Number.parseFloat(cs.paddingTop) || 0;
    const pb = Number.parseFloat(cs.paddingBottom) || 0;
    const tW = wrap.clientWidth - pl - pr;
    const tH = wrap.clientHeight - pt - pb;
    if (tW < 2 || tH < 2) return;
    const bw = g.maxX - g.minX;
    const bh = g.maxY - g.minY;
    const eps = 1e-9;
    const safeBw = bw < eps ? 1 : bw;
    const safeBh = bh < eps ? 1 : bh;
    el.style.backgroundSize = `${tW / safeBw}px ${tH / safeBh}px`;
    el.style.backgroundPosition = `${-g.minX * (tW / safeBw)}px ${-g.minY * (tH / safeBh)}px`;
  });
}

let pieceLayoutObserver = null;
/** Deferred so ResizeObserver does not run in the same synchronous layout pass that our own tray sizing triggers (observing #piece-tray caused an infinite resize loop and tab freeze). */
let pieceLayoutFrame = null;
function schedulePieceLayoutFromResize() {
  if (pieceLayoutFrame != null) return;
  pieceLayoutFrame = requestAnimationFrame(() => {
    pieceLayoutFrame = null;
    layoutPieceBackgrounds();
  });
}

function ensurePieceLayoutObserver() {
  if (pieceLayoutObserver) return;
  const pc = document.getElementById('puzzle-container');
  if (!pc || typeof ResizeObserver === 'undefined') return;
  pieceLayoutObserver = new ResizeObserver(() => schedulePieceLayoutFromResize());
  // Only the board container: it drives Pw/Ph. Do NOT observe #piece-tray — layoutTrayPieceSizes
  // changes tray children dimensions, which resized the tray and re-fired the observer forever.
  pieceLayoutObserver.observe(pc);
}

function showLoading(show = true) {
  const loading = document.getElementById('loading');
  if (loading) loading.classList.toggle('visible', show);
}

function processImage(img, cols, rows) {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgAspect = img.width / img.height;
    const gridAspect = cols / rows;
    let drawWidth;
    let drawHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (imgAspect > gridAspect) {
      drawHeight = img.height;
      drawWidth = img.height * gridAspect;
      offsetX = (img.width - drawWidth) / 2;
    } else {
      drawWidth = img.width;
      drawHeight = img.width / gridAspect;
      offsetY = (img.height - drawHeight) / 2;
    }

    canvas.width = cols * 250;
    canvas.height = rows * 250;
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (e) {
    console.warn('Canvas image export failed (CORS/taint?):', e);
    return null;
  }
}

/**
 * Only http(s) images need crossOrigin for canvas; blob:/data: break if forced to 'anonymous'.
 * Uses a timeout so a hung network request cannot leave the UI stuck forever (onload/onerror may never run).
 *
 * @param {string} url
 * @param {(img: HTMLImageElement) => void} onLoad
 * @param {() => void} [onError]
 * @param {{ timeoutMs?: number }} [options]
 */
function loadImage(url, onLoad, onError, options = {}) {
  const timeoutMs = options.timeoutMs ?? 20000;
  const img = new Image();
  if (typeof url === 'string' && /^https?:/i.test(url)) {
    img.crossOrigin = 'anonymous';
  }
  let settled = false;
  const timer = setTimeout(() => {
    if (settled) return;
    settled = true;
    img.onload = null;
    img.onerror = null;
    img.src = '';
    console.warn('Image load timed out:', typeof url === 'string' ? url.slice(0, 80) : url);
    onError?.();
  }, timeoutMs);

  const finish = (fn) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    fn();
  };

  img.onload = () => finish(() => onLoad(img));
  img.onerror = () =>
    finish(() => {
      console.error('Failed to load image:', typeof url === 'string' ? url.slice(0, 80) : url);
      onError?.();
    });
  img.src = url;
}

function createGradientFallback() {
  if (!state) return;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = state.cols * 250;
  canvas.height = state.rows * 250;
  ctx.fillStyle = '#7c6bb0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  currentImageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
  fallbackImageSrc = null;
  renderAll();
}

function syncImageFromSource() {
  if (!state || !sourceImage) return;
  const processed = processImage(sourceImage, state.cols, state.rows);
  currentImageDataUrl = processed;
  fallbackImageSrc = processed ? null : sourceImage.src || null;
  if (processed) {
    revokeSourceObjectUrl();
  }
  renderAll();
}

function loadDefaultImage() {
  revokeSourceObjectUrl();
  // Do not use #loading here: startNewGame() already drew a playable gradient; blocking the UI
  // on a remote photo would feel like an infinite load if the network never completes.
  loadImage(
    DEFAULT_IMAGE_URL,
    (img) => {
      try {
        sourceImage = img;
        syncImageFromSource();
      } catch (e) {
        console.warn('Default image apply failed:', e);
        createGradientFallback();
      }
    },
    () => {
      console.warn('Default image failed; gradient fallback');
      createGradientFallback();
    },
    { timeoutMs: 15000 }
  );
}

function handleImageUpload(file) {
  if (!file || !file.type.startsWith('image/')) return;
  showLoading(true);
  revokeSourceObjectUrl();
  objectUrlForSource = URL.createObjectURL(file);
  loadImage(
    objectUrlForSource,
    (img) => {
      try {
        sourceImage = img;
        syncImageFromSource();
      } finally {
        showLoading(false);
      }
    },
    () => {
      revokeSourceObjectUrl();
      showLoading(false);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result;
        if (typeof dataUrl !== 'string') {
          console.warn('Could not read image file');
          return;
        }
        loadImage(
          dataUrl,
          (img2) => {
            try {
              sourceImage = img2;
              syncImageFromSource();
            } finally {
              showLoading(false);
            }
          },
          () => showLoading(false),
          { timeoutMs: 20000 }
        );
      };
      reader.onerror = () => {
        console.warn('FileReader failed for image');
        showLoading(false);
      };
      reader.readAsDataURL(file);
    },
    { timeoutMs: 20000 }
  );
}

function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function playTone(ctx, frequency, startTime, duration, gain = 0.25) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency;
  gainNode.gain.setValueAtTime(gain, ctx.currentTime + startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start(ctx.currentTime + startTime);
  oscillator.stop(ctx.currentTime + startTime + duration);
}

function playSnapSound() {
  try {
    const ctx = initAudioContext();
    playTone(ctx, 880, 0, 0.08, 0.12);
  } catch (_) {
    /* ignore */
  }
}

function playTadaSound() {
  try {
    const ctx = initAudioContext();
    playTone(ctx, 523.25, 0, 0.15);
    playTone(ctx, 659.25, 0.15, 0.15);
    playTone(ctx, 783.99, 0.3, 0.4);
  } catch (_) {
    /* ignore */
  }
}

function onWin() {
  playTadaSound();
  document.getElementById('win-overlay').classList.add('visible');
}

function renderBoard() {
  const grid = document.getElementById('puzzle-grid');
  const container = document.getElementById('puzzle-container');
  container.style.setProperty('--grid-cols', state.cols);
  container.style.setProperty('--grid-rows', state.rows);

  grid.innerHTML = '';
  grid.classList.toggle('show-numbers', numbersVisible);
  document.getElementById('piece-tray').classList.toggle('show-numbers', numbersVisible);

  for (let slotIndex = 0; slotIndex < state.totalTiles; slotIndex++) {
    const pieceId = state.board[slotIndex];
    const slot = document.createElement('div');
    slot.className = 'board-slot';
    slot.dataset.slotIndex = String(slotIndex);
    slot.dataset.testid = 'board-slot';

    const g = pieceGeometry?.pieces[slotIndex];
    if (g) {
      slot.style.position = 'absolute';
      slot.style.left = `${g.minX * 100}%`;
      slot.style.top = `${g.minY * 100}%`;
      slot.style.width = `${(g.maxX - g.minX) * 100}%`;
      slot.style.height = `${(g.maxY - g.minY) * 100}%`;
    }

    if (pieceId !== null) {
      const stack = document.createElement('div');
      stack.className = 'piece piece--placed piece-stack';
      const surface = document.createElement('div');
      surface.className = 'piece-surface';
      applyPieceBackground(surface, pieceId);
      const num = document.createElement('div');
      num.className = 'piece-number';
      num.textContent = String(pieceId + 1);
      stack.appendChild(surface);
      stack.appendChild(num);
      slot.appendChild(stack);
    } else {
      slot.classList.add('board-slot--empty');
      if (g?.pathDNormalized) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 1 1');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('aria-hidden', 'true');
        svg.classList.add('board-slot-outline');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', g.pathDNormalized);
        path.setAttribute('shape-rendering', 'geometricPrecision');
        svg.appendChild(path);
        slot.appendChild(svg);
      } else {
        slot.style.border = '2px dashed rgba(255, 255, 255, 0.35)';
        slot.style.background = 'rgba(255, 255, 255, 0.1)';
      }
      const targetNum = document.createElement('div');
      targetNum.className = 'piece-number piece-number--target';
      targetNum.textContent = String(slotIndex + 1);
      slot.appendChild(targetNum);
    }

    grid.appendChild(slot);
  }

  const hintOverlay = document.getElementById('hint-overlay');
  const bg = currentImageDataUrl || fallbackImageSrc;
  if (bg) hintOverlay.style.backgroundImage = `url(${bg})`;
}

function renderTray() {
  const tray = document.getElementById('piece-tray');
  tray.innerHTML = '';

  state.tray.forEach((pieceId) => {
    const wrap = document.createElement('div');
    wrap.className = 'tray-piece-wrap';
    wrap.dataset.pieceId = String(pieceId);
    wrap.dataset.testid = 'tray-piece';
    const stack = document.createElement('div');
    stack.className = 'tray-piece-stack';
    const surface = document.createElement('div');
    surface.className = 'tray-piece-surface';
    applyPieceBackground(surface, pieceId);
    stack.appendChild(surface);
    const g = pieceGeometry?.pieces[pieceId];
    if (g?.pathDNormalized) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 1 1');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');
      svg.classList.add('tray-piece-outline');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', g.pathDNormalized);
      path.setAttribute('shape-rendering', 'geometricPrecision');
      svg.appendChild(path);
      stack.appendChild(svg);
    }
    const num = document.createElement('div');
    num.className = 'piece-number';
    num.textContent = String(pieceId + 1);
    wrap.appendChild(stack);
    wrap.appendChild(num);
    tray.appendChild(wrap);

    wrap.addEventListener('pointerdown', onTrayPointerDown);
  });

  // Start hint timers for pieces in the tray
  // TEMPORARILY DISABLED FOR DEBUGGING
  // updateHintsForTray();
}

function renderAll() {
  if (!state) return;
  renderBoard();
  renderTray();
  ensurePieceLayoutObserver();
  requestAnimationFrame(() => {
    layoutPieceBackgrounds();
    requestAnimationFrame(() => layoutPieceBackgrounds());
  });
}

function startNewGame(cols, rows, opts = {}) {
  clearAllHints(); // Clear all hint timers from previous game
  if (!opts.preserveLayoutSeed) {
    voronoiLayoutSeed = Math.floor(Math.random() * 0x7fffffff);
  }
  const siteRng = createSeededRandom(voronoiLayoutSeed);
  pieceGeometry = buildVoronoiJigsaw(cols, rows, siteRng, getTongueParams());
  generateAllClipPaths();
  state = createJigsawState(cols, rows);
  if (sourceImage) syncImageFromSource();
  else if (!currentImageDataUrl && !fallbackImageSrc) {
    /* First paint before loadDefaultImage() finishes: without a URL, clipped pieces are invisible */
    createGradientFallback();
  } else {
    renderAll();
  }
}

function tryDrop(pieceId, slotIndex) {
  const next = placePiece(state, pieceId, slotIndex);
  if (!next) return false;
  state = next;
  clearHint(pieceId); // Clear hint when piece is successfully placed
  playSnapSound();
  renderAll();
  if (state.solved) {
    clearAllHints(); // Clear all hints when puzzle is solved
    setTimeout(() => onWin(), 200);
  }
  return true;
}

function clearDragDropHighlight(ds) {
  if (ds?.lastDropHighlight) {
    ds.lastDropHighlight.classList.remove('board-slot--drop-hover');
    ds.lastDropHighlight = null;
  }
}

/** Blue highlight on empty slots only while dragging (no “correct slot” hint). */
function updateDragDropHighlight(ds, clientX, clientY) {
  if (!ds || !state) return;
  clearDragDropHighlight(ds);
  const stack = document.elementsFromPoint(clientX, clientY);
  const slotEl = stack.find((el) => el.classList?.contains('board-slot'));
  if (!slotEl || !slotEl.classList.contains('board-slot--empty')) return;
  ds.lastDropHighlight = slotEl;
  slotEl.classList.add('board-slot--drop-hover');
}

function onTrayPointerDown(e) {
  if (!state || state.solved) return;
  if (dragState) return;
  if (e.button !== 0) return;
  e.preventDefault();
  const pieceEl = e.currentTarget;
  const pointerId = e.pointerId;
  const pieceId = parseInt(pieceEl.dataset.pieceId, 10);
  const rect = pieceEl.getBoundingClientRect();

  clearHint(pieceId); // Clear hint when piece is picked up

  initAudioContext();

  const clone = pieceEl.cloneNode(true);
  clone.classList.add('drag-clone');
  clone.querySelectorAll('.piece-number').forEach((n) => n.remove());
  document.body.appendChild(clone);

  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.left = `${e.clientX - offsetX}px`;
  clone.style.top = `${e.clientY - offsetY}px`;

  dragState = {
    pieceId,
    pointerId,
    lastClientX: e.clientX,
    lastClientY: e.clientY,
    clone,
    offsetX,
    offsetY,
    fromRect: rect,
    pieceEl,
    lastDropHighlight: null,
  };

  try {
    pieceEl.setPointerCapture(pointerId);
  } catch {
    /* ignore */
  }

  pieceEl.style.opacity = '0.35';

  updateDragDropHighlight(dragState, e.clientX, e.clientY);

  const onMove = (ev) => {
    if (!dragState || ev.pointerId !== dragState.pointerId) return;
    ev.preventDefault();
    dragState.lastClientX = ev.clientX;
    dragState.lastClientY = ev.clientY;
    dragState.clone.style.left = `${ev.clientX - dragState.offsetX}px`;
    dragState.clone.style.top = `${ev.clientY - dragState.offsetY}px`;
    updateDragDropHighlight(dragState, ev.clientX, ev.clientY);
  };

  const cleanup = () => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onUp);
    pieceEl.removeEventListener('lostpointercapture', onLostCapture);
  };

  function releaseCaptureIfHeld() {
    try {
      pieceEl.releasePointerCapture(pointerId);
    } catch {
      /* ignore */
    }
  }

  function completeDragEnd(clientX, clientY) {
    const ds = dragState;
    if (!ds) return;
    clearDragDropHighlight(ds);
    const piece = ds.pieceEl;
    if (piece) piece.style.opacity = '';
    const { pieceId: pid, clone: cl } = ds;
    dragState = null;
    cl.remove();

    const stack = document.elementsFromPoint(clientX, clientY);
    const slotEl = stack.find((el) => el.classList?.contains('board-slot'));
    if (slotEl) {
      const slotIndex = parseInt(slotEl.dataset.slotIndex, 10);
      if (tryDrop(pid, slotIndex)) {
        return;
      }
    }
  }

  function onUp(ev) {
    if (!dragState || ev.pointerId !== dragState.pointerId) return;
    cleanup();
    releaseCaptureIfHeld();
    completeDragEnd(ev.clientX, ev.clientY);
  }

  function onLostCapture(ev) {
    if (!dragState || ev.pointerId !== dragState.pointerId) return;
    cleanup();
    const ds = dragState;
    completeDragEnd(ds.lastClientX, ds.lastClientY);
  }

  pieceEl.addEventListener('lostpointercapture', onLostCapture);
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onUp);
}

function cheatSolve() {
  if (!state) return;
  let s = state;
  for (let i = 0; i < s.totalTiles; i++) {
    if (!s.tray.includes(i)) continue;
    const n = placePiece(s, i, i);
    if (n) s = n;
  }
  state = s;
  renderAll();
  if (state.solved) {
    setTimeout(() => onWin(), 50);
  }
}

// --- UI wiring ---
initLanguageSelect();
initThemeManagement(CANONICAL_THEME_COLORS);

document.addEventListener('puzzle-lang-updated', () => {
  updateTongueSliderLabels();
});

document.getElementById('btn-photo').addEventListener('click', () => {
  document.getElementById('file-input').click();
});

document.getElementById('btn-hint').addEventListener('click', () => {
  hintVisible = !hintVisible;
  document.getElementById('hint-overlay').classList.toggle('visible', hintVisible);
});

document.getElementById('btn-numbers').addEventListener('click', () => {
  numbersVisible = !numbersVisible;
  document.getElementById('puzzle-grid').classList.toggle('show-numbers', numbersVisible);
  document.getElementById('piece-tray').classList.toggle('show-numbers', numbersVisible);
});

document.getElementById('difficulty-select').addEventListener('change', (e) => {
  const level = LEVELS[parseInt(e.target.value, 10)];
  startNewGame(level.cols, level.rows);
});

document.getElementById('file-input').addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) handleImageUpload(file);
  e.target.value = '';
});

document.getElementById('btn-replay').addEventListener('click', () => {
  document.getElementById('win-overlay').classList.remove('visible');
  if (state) {
    const level = LEVELS.find((l) => l.cols === state.cols && l.rows === state.rows) || LEVELS[0];
    startNewGame(level.cols, level.rows);
  }
});

try {
  startNewGame(LEVELS[0].cols, LEVELS[0].rows);
} catch (e) {
  console.error('✗ Failed to start game:', e);
}
try {
  loadDefaultImage();
} catch (e) {
  console.error('✗ Failed to load image:', e);
}

function formatTongueVal(_key, v) {
  if (typeof v !== 'number' || Number.isNaN(v)) return String(v);
  return String(Math.round(v * 10000) / 10000);
}

/** @type {Array<[string, string, number, number, number]>} */
const TONGUE_SLIDER_DEFS = [
  ['globalBulge', 'tongue-slider-globalBulge', 0.35, 3, 0.05],
  ['amplitudeMax', 'tongue-slider-amplitudeMax', 0.4, 1.75, 0.02],
  ['amplitudeMin', 'tongue-slider-amplitudeMin', 0.12, 0.7, 0.02],
  ['widthMax', 'tongue-slider-widthMax', 0.32, 1.75, 0.02],
  ['widthMin', 'tongue-slider-widthMin', 0.18, 0.85, 0.02],
  ['edgeVertexPad', 'tongue-slider-edgeVertexPad', 0.07, 0.24, 0.005],
  ['tabSpanMin', 'tongue-slider-tabSpanMin', 0.2, 0.58, 0.01],
  ['tabSpanMax', 'tongue-slider-tabSpanMax', 0.35, 0.72, 0.01],
  ['cornerDamp2', 'tongue-slider-cornerDamp2', 0.45, 1, 0.02],
  ['cornerDamp3', 'tongue-slider-cornerDamp3', 0.32, 1, 0.02],
  ['shortChordRef', 'tongue-slider-shortChordRef', 0.035, 0.14, 0.005],
  ['refLen', 'tongue-slider-refLen', 0.06, 0.2, 0.005],
  ['minChordLength', 'tongue-slider-minChordLength', 0.018, 0.12, 0.002],
];

function updateTongueSliderLabels() {
  for (const [key, i18nKey] of TONGUE_SLIDER_DEFS) {
    const lab = document.querySelector(`label[for="tongue-${key}"]`);
    if (lab) lab.textContent = tCurrent(i18nKey);
  }
}

function clampTongueParams() {
  const p = getTongueParams();
  if (p.tabSpanMin > p.tabSpanMax) setTongueParam('tabSpanMax', p.tabSpanMin);
  if (p.amplitudeMin > p.amplitudeMax) setTongueParam('amplitudeMax', p.amplitudeMin);
  if (p.widthMin > p.widthMax) setTongueParam('widthMax', p.widthMin);
}

function syncTongueSliders() {
  const p = getTongueParams();
  document.querySelectorAll('#tongue-sliders-root input[data-key]').forEach((input) => {
    const key = input.dataset.key;
    if (key && typeof p[key] === 'number') {
      input.value = String(p[key]);
      const el = document.querySelector(`#tongue-sliders-root [data-val-for="${key}"]`);
      if (el) el.textContent = formatTongueVal(key, p[key]);
    }
  });
}

function initTongueTuning() {
  const root = document.getElementById('tongue-sliders-root');
  if (!root) return;
  const params = getTongueParams();
  root.replaceChildren();
  for (const [key, i18nKey, min, max, step] of TONGUE_SLIDER_DEFS) {
    const row = document.createElement('div');
    row.className = 'tongue-slider-row';
    const val = params[key] ?? DEFAULT_TONGUE_PARAMS[key];
    const lab = document.createElement('label');
    lab.className = 'tongue-slider-row__label';
    lab.textContent = tCurrent(i18nKey);
    lab.htmlFor = `tongue-${key}`;
    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'tongue-slider-row__range';
    input.id = `tongue-${key}`;
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(val);
    input.dataset.key = key;
    const span = document.createElement('span');
    span.className = 'tongue-slider-row__val';
    span.dataset.valFor = key;
    span.textContent = formatTongueVal(key, val);
    row.appendChild(lab);
    row.appendChild(input);
    row.appendChild(span);
    root.appendChild(row);
    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      setTongueParam(key, v);
      clampTongueParams();
      const p2 = getTongueParams();
      input.value = String(p2[key]);
      span.textContent = formatTongueVal(key, p2[key]);
      if (state) startNewGame(state.cols, state.rows, { preserveLayoutSeed: true });
    });
  }
  document.getElementById('btn-tongue-reset')?.addEventListener('click', () => {
    resetTongueParams();
    syncTongueSliders();
    if (state) startNewGame(state.cols, state.rows, { preserveLayoutSeed: true });
  });
  document.getElementById('btn-tongue-new-seed')?.addEventListener('click', () => {
    if (state) startNewGame(state.cols, state.rows, { preserveLayoutSeed: false });
  });
  document.getElementById('btn-tongue-copy')?.addEventListener('click', async () => {
    const text = JSON.stringify(getTongueParams(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      console.info('Tongue params JSON:\n', text);
    }
  });
}

initTongueTuning();

window._state = () => state;
window.__PUZZLE_TEST__ = {
  solve: cheatSolve,
  getDragState: () => dragState,
};
window.getTongueParams = getTongueParams;
