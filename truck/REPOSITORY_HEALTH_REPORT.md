# Repository Health Report
## toddler-truck-game

**Generated:** 2026-10-11  
**Status:** Modular ES modules; audit fixes applied (fireworks, mud-wash pointer lifecycle, jump overflow)

---

## Executive Summary

Truck game modularized under `src/`. Unit suite covers drag, levels, match handlers, visual effects. Known stale claims from 2026-04 report corrected below.

### Key Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Unit tests | 86+ (vitest) | Prefer unit over E2E |
| E2E | Playwright critical flows | Some click-path cases skipped |
| Critical play bugs (2026-10 audit) | Fireworks / mud-wash / jump clipped | Fixed this cycle |
| Architecture | ES modules in `src/` | Entry `script.js` |

---

## Module layout

```
truck/
├── script.js              # Entry
├── index.html / style.css
└── src/
    ├── constants.js
    ├── state.js
    ├── drag-drop.js
    ├── match-validation.js
    ├── levels.js
    ├── visual-effects.js
    ├── utils.js
    ├── translations.js
    └── minigames/
        ├── mud-wash.js
        ├── sticker-shop.js
        ├── big-jump.js
        └── bubble-wrap.js
```

---

## Recent fixes (2026-10-11)

- Fireworks: set `--tx`/`--ty` px burst offsets; spawn at center `%`
- Mud wash: `mouseup`/`touchend` on `document`; seed brush on pointer down
- Big jump: scene `overflow: visible`, taller scene so backflip apex shows
- Drag: guard empty touch lists; block drag during level complete / intermission

---

## Known debt

- Circular import `drag-drop.js` ↔ `match-validation.js` (works via live bindings)
- Docs previously claimed immutable state / counter-rotated minigames — code uses mutable singleton + random minigame pick
- Colors in play: 8 (no brown/lime assets)

---

## Testing

```bash
npm ci
npm run test:unit
npm run test:e2e   # optional / CI
```
