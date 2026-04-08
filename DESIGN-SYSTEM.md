# Toddler Games - Unified Design System

## Design Direction: "Playful Organic Toy"

A cohesive, joyful design system optimized for toddlers aged 2-5 years.

### Core Principles

1. **Soft & Approachable** - Rounded shapes, gentle depth, no harsh edges
2. **High Contrast** - Colors and text clearly visible for developing eyes
3. **Consistent Motion** - Gentle bounces and floats, never jarring
4. **Accessible** - Large touch targets, clear focus states, screen reader friendly

---

## Typography

**Font Family:** `Fredoka` (Google Fonts)
- Modern, rounded, toddler-friendly
- Excellent readability at all sizes
- Replaces outdated Comic Sans MS

**Font Weights:**
- `400` - Regular (body text)
- `600` - Semibold (secondary headings)
- `700` - Bold (buttons, labels)
- `800` - Heavy (primary headings, splash screens)

---

## Color System

### Light Theme
- **Background:** Warm gradient sky (#1e3a5f → #0f766e → #bfdbfe → #ffedd5)
- **Text Primary:** Navy #1e3a5f
- **Text Secondary:** Slate #334e68
- **Splash Screen:** Purple gradient (#667eea → #764ba2)
- **Splash Title:** Gold #FFD700
- **Splash Subtitle:** White #ffffff

### Dark Theme
- **Background:** Deep night gradient (#0f172a → #1e3a5f → #172554)
- **Text Primary:** Slate #f1f5f9
- **Text Secondary:** Light slate #cbd5e1
- **Splash Screen:** Deep purple (#4c51bf → #5a3d7c)
- **Splash Title:** Bright yellow #FDE047
- **Splash Subtitle:** Lavender #e0e7ff

### Button Colors (adapts to theme)
- **Primary (Orange):** #f59e0b → #d97706 (light) | #fb923c → #f97316 (dark)
- **Secondary (Blue):** #0ea5e9 → #0369a1 (light) | #38bdf8 → #0ea5e9 (dark)
- **Accent (Purple):** #8b5cf6 → #6d28d9 (light) | #a78bfa → #8b5cf6 (dark)
- **Success (Green):** #10b981 → #059669 (light) | #34d399 → #10b981 (dark)

---

## Spacing System

Following an 8px grid for consistency:

```
--space-xs:  8px   (tight spacing)
--space-sm:  12px  (compact)
--space-md:  16px  (default)
--space-lg:  24px  (comfortable)
--space-xl:  32px  (spacious)
--space-2xl: 48px  (extra spacious)
```

---

## Border Radius

Consistently rounded for toddler-friendly softness:

```
--radius-sm:  12px  (small elements)
--radius-md:  16px  (buttons, cards)
--radius-lg:  24px  (panels)
--radius-xl:  30px  (large buttons, modals)
```

---

## Shadow System - "Toy Depth"

Creates playful, tactile depth without harsh drops:

```
--shadow-toy:      0 8px 0 rgba(30, 58, 95, 0.12)   (standard depth)
--shadow-toy-soft: 0 4px 0 rgba(30, 58, 95, 0.08)   (subtle depth)
--shadow-hover:    0 10px 0 rgba(30, 58, 95, 0.15)  (hover state)
--shadow-lifted:   0 12px 24px rgba(0, 0, 0, 0.2)   (prominent)
--shadow-inset:    inset 0 3px 0 rgba(255, 255, 255, 0.5)
```

**Dark Theme Shadows:** Darker, more pronounced
```
--shadow-toy:      0 8px 0 rgba(0, 0, 0, 0.3)
--shadow-toy-soft: 0 4px 0 rgba(0, 0, 0, 0.2)
--shadow-hover:    0 10px 0 rgba(0, 0, 0, 0.4)
--shadow-lifted:   0 12px 24px rgba(0, 0, 0, 0.5)
```

---

## Button System

### Base Button (`.game-btn`)

**Structure:**
```css
padding: var(--space-sm) var(--space-lg)  /* 12px 24px */
font-size: 18px
font-weight: 700
border: 3px solid var(--border-medium)
border-radius: var(--radius-md)  /* 16px */
```

**States:**
- **Hover:** `scale(1.05)` + enhanced shadow
- **Active:** `scale(0.96)` + reduced shadow
- **Focus:** 3px outline with theme color

**Variants:**
- `.game-btn--primary` (Orange)
- `.game-btn--secondary` (Blue)
- `.game-btn--accent` (Purple)
- `.game-btn--success` (Green)

### Giant Button (minigames)

Larger for easy toddler interaction:
```
min-width: 300px
min-height: 120px
font-size: clamp(40px, 7vw, 64px)
```

---

## Splash Screen System

### Structure
```html
<div class="unified-splash">
  <div class="unified-splash__content">
    <h1 class="unified-splash__title">🚙 Game Title 🚙</h1>
    <p class="unified-splash__subtitle">Subtitle text</p>
    <img class="unified-splash__icon" src="icon.png" alt="">
    <button class="unified-splash__button game-btn--success">
      START GAME
    </button>
  </div>
</div>
```

### Animations
- **Title:** `gentleBounce` (2s loop, subtle vertical movement)
- **Icon:** `iconFloat` (2s loop, float + slight rotation)
- **Container:** `fadeIn` (0.3s on load)

---

## Responsive Breakpoints

### Mobile-First Approach

**Large Tablets & Desktop (> 768px):**
- Full-size buttons and spacing
- 3-column layouts where applicable

**Small Tablets (641px - 768px):**
- Adjusted button sizing
- 2-column layouts

**Mobile (≤ 640px):**
- Reduced button padding: `10px 16px`
- Reduced font-size: `16px`
- Splash icon: `240px` (from `300px`)
- Single-column layouts

---

## Animation Library

### Keyframes Included

**`fadeIn`** - Smooth entrance
```css
from { opacity: 0; }
to { opacity: 1; }
```

**`gentleBounce`** - Title animation
```css
0%, 100% { transform: translateY(0px); }
50% { transform: translateY(-12px); }
```

**`iconFloat`** - Icon hover effect
```css
0%, 100% { transform: translateY(0px) rotate(0deg); }
50% { transform: translateY(-15px) rotate(3deg); }
```

**`levelPulse`** - Level counter pulse
```css
0%, 100% { transform: scale(1); }
50% { transform: scale(1.05); }
```

---

## Implementation Guide

### 1. Link Shared Tokens
```html
<link rel="stylesheet" href="../shared-design-tokens.css">
```

### 2. Use CSS Variables
```css
/* Good */
background: var(--btn-primary);
padding: var(--space-lg);
font-family: var(--font-family);

/* Bad */
background: #f59e0b;
padding: 24px;
font-family: 'Fredoka';
```

### 3. Theme Support
Wrap theme-specific styles:
```css
html[data-theme="dark"] .element {
  /* dark theme overrides */
}
```

### 4. Accessibility
- Always include `aria-label` on interactive elements
- Use `.sr-only` for screen-reader-only text
- Minimum 48×48px touch targets
- 3px focus outlines with high contrast

---

## File Structure

```
/
├── shared-design-tokens.css  (Core design system)
├── index.html                (Hub - game selector)
├── truck/
│   ├── index.html
│   └── style.css
├── puzzle/
│   ├── index.html
│   └── style.css (contains inline styles)
└── DESIGN-SYSTEM.md          (This file)
```

---

## Quality Checklist

Before shipping any game:

- [ ] Uses Fredoka font
- [ ] References `shared-design-tokens.css`
- [ ] Button styles use `.game-btn` classes
- [ ] Splash screen uses unified structure
- [ ] Dark theme fully supported
- [ ] All text has proper contrast (WCAG AA)
- [ ] Touch targets ≥ 48×48px
- [ ] Animations are smooth (60fps)
- [ ] Theme switcher works correctly
- [ ] No Comic Sans MS references

---

## Browser Support

- **iOS Safari:** 14+
- **Chrome/Edge:** Last 2 versions
- **Firefox:** Last 2 versions
- **Samsung Internet:** Last 2 versions

**Progressive Enhancement:**
- CSS variables with fallbacks
- Flexbox primary, Grid secondary
- `dvh` units with `vh` fallback

---

## Credits

**Design System:** Frontend-Design Skill + Claude Code
**Font:** Fredoka by Milena Brandão (Google Fonts)
**Target Audience:** Toddlers aged 2-5 years
**Last Updated:** 2026-04-08
