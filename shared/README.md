# Shared Utilities

Common theme and i18n utilities used across all Toddler Games projects.

## Files

- **theme.js** - Theme management (light/dark/system)
- **i18n.js** - Language resolution (en/fr/es)

## Usage

### Theme Management

```javascript
import { initThemeManagement, CANONICAL_THEME_COLORS } from '../shared/theme.js';

// Initialize theme with canonical colors
initThemeManagement(CANONICAL_THEME_COLORS);
```

### Language Resolution

```javascript
import { resolveStoredLanguage, saveLanguagePreference } from '../shared/i18n.js';

// Get current language
const lang = resolveStoredLanguage(); // 'en' | 'fr' | 'es'

// Save language
saveLanguagePreference('fr');
```

## Storage Keys

- **Theme**: `toddler-games-theme` (legacy: `puzzle-theme`)
- **Language**: `toddler-games-language` (legacy: `monster-truck-language`)

## Theme Colors

Canonical colors used across all games:
- Light mode: `#1e3a5f`
- Dark mode: `#0f172a`

## Architecture

The shared utilities ensure consistency across all three games:

1. **Hub** (index.html) - Uses inline script for FOUC prevention, but same logic
2. **Monster Truck Match** (truck/) - Imports shared utilities as ES modules
3. **Photo Puzzle** (puzzle/) - Imports shared utilities as ES modules

All three games synchronize theme and language preferences via localStorage using the same canonical keys.
