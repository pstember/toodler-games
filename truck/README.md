# 🚙 Toddler Monster Truck Match

Colorful drag-drop matching game for 3-year-olds.

## Features

- **Progressive Difficulty:** Shapes and colors unlock gradually across 4 tiers
- **Positive Reinforcement:** No timers, no fail states, only celebrations
- **Touch-Friendly:** Massive touch targets for tiny fingers
- **Intermission Mini-Games:** Fun breaks every 3 levels (Mud Wash, Sticker Shop, Big Jump, Bubble Wrap, Fuel Up)
- **Zero Dependencies:** Pure HTML/CSS/JavaScript, no external images
- **Theme & Language Sync:** Preferences shared with hub and puzzle via `../shared/` utilities

## Quick Start

Game uses ES modules; serve `truck/` folder over HTTP (do not open `index.html` as `file://`).

```bash
cd truck && npx serve . -l 3000
```

Open URL shown (e.g. `http://localhost:3000`). Works best on mobile in landscape.

In monorepo, run `npx serve .` from repo root and open hub, choose **Monster Truck Match**.

## Tech Stack

- Vanilla JavaScript
- CSS Flexbox/Grid
- HTML5 Canvas (for mini-games)
- CSS Shapes (no image deps)

## Game Structure

- **Levels 1-2:** Basic shape matching (Circle, Square)
- **Levels 3-5:** Shape + color matching (adds Triangle, Blue)
- **Levels 6-8:** Expanded palette (adds Star, Heart, Green, Yellow)
- **Levels 9-11:** Size sorting (adds Pentagon, Hexagon, Purple, Orange)
- **Level 12+:** Endless mode with full palette (8 shapes, 8 colors)

### Full Shape & Color Palette

**Shapes (8):** Circle, Square, Triangle, Star, Heart, Pentagon, Hexagon, Diamond

**Colors (8):** Red, Blue, Green, Yellow, Purple, Orange, Pink, Cyan

## Development

Detailed architecture in `ARCHITECTURE.md`.
Testing guidelines in `TESTING.md`.
Contribution guidelines in `CONTRIBUTING.md`.

### Testing Mini-Games

Test specific mini-games using URL parameters:

```
# Mud Wash Game
?minigame=mud-wash
or ?minigame=wash

# Sticker Shop Game
?minigame=sticker-shop
or ?minigame=stickers

# Big Jump Game
?minigame=big-jump
or ?minigame=jump

# Bubble Wrap Game
?minigame=bubble-wrap
or ?minigame=bubbles

# Fuel Up Game
?minigame=fuel-up
or ?minigame=fuel
```

**Examples:**
- Local: `http://localhost:3000?minigame=mud-wash`
- GitHub Pages: `https://pstember.github.io/toodler-games/truck/?minigame=jump`

Useful for testing mini-games without playing through 3 levels.

## Adding Sounds

Replace placeholder `playSound()` function in `script.js` with:

```javascript
function playSound(soundName) {
  new Audio(`sounds/${soundName}.mp3`).play();
}
```

Add `.mp3` files to `sounds/` directory:
- `success.mp3`
- `tryAgain.mp3`
- `levelComplete.mp3`
- `tierComplete.mp3`
- `jump.mp3`
- `sticker.mp3`