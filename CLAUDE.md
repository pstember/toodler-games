# Toddler Games - Claude Instructions

Project-specific conventions for AI-assisted development.

## npm Registry Pattern (CRITICAL)

**All npm projects MUST have `.npmrc`:**

```ini
# Use the public registry so `npm ci` works on GitHub Actions and for contributors
# without your corporate npm proxy. Local machine-level proxy settings are overridden
# while you are inside this directory (npm reads this file first).
registry=https://registry.npmjs.org/
```

**Applies to:** puzzle/, truck/, rhythm/, and any future npm projects.

**CI workflow:** See [.github/CLAUDE.md](.github/CLAUDE.md) for registry config step in CI jobs.

## Testing Requirements

**CRITICAL: Prioritize unit tests over E2E tests**

Always write unit tests first. E2E tests are expensive (slow, flaky, hard to debug).

**Unit tests:**
- Fast (<2s total)
- Test pure logic, functions, calculations
- Easy to debug
- Run on every save
- Target: 80%+ coverage

**E2E tests:**
- Slow (5-10s per test)
- Keep minimal - only critical user flows
- Verify integration only
- Supplement unit tests, don't replace them
- Avoid testing implementation details (use unit tests instead)

**Every game needs:**
- Unit tests (vitest + jsdom)
- E2E tests (Playwright, minimal - critical flows only)
- CI job in `.github/workflows/ci.yml`

**Current coverage:**
- puzzle: 49 unit + 6 E2E = 55 tests
- truck: 86 unit + 13 E2E = 99 tests
- rhythm: 10 unit + 2 E2E = 12 tests

## Project Structure

Monorepo with shared utilities:

```
games/
├── index.html          # Hub (game picker)
├── puzzle/             # Vite build, Voronoi jigsaw
├── truck/              # Vanilla JS, drag-drop matching
├── rhythm/             # Vanilla JS, rhythm tap game
└── shared/             # Theme + i18n utilities (shared across all games)
```

**Shared sync:** All games sync theme (light/dark) and language (en/fr/es) via `shared/theme.js` and `shared/i18n.js`.

## Documentation Style

All markdown files compressed to caveman-speak:
- Drop articles (a/an/the)
- Drop filler (just/really/basically)
- Fragments OK
- Code blocks preserved exactly
- Keep technical terms exact

Use `/caveman-compress <filepath>` to compress new docs.

## CI/CD Pattern

See [.github/CLAUDE.md](.github/CLAUDE.md) for CI/CD workflow patterns.

## Development Workflow

**Local dev:**
- Hub: `npx serve .` from root
- Puzzle: `npm run dev` inside puzzle/ (Vite dev server)
- Truck: `npx serve .` from root, open `/truck/`
- Rhythm: `npx serve .` from root, open `/rhythm/`

**Tests:**
- Unit: `npm run test:unit` (vitest)
- E2E: `npm run test:e2e` (Playwright)
- All: `npm test` (unit then E2E)

## Git Workflow

**Commits:**
- Use conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `chore:`
- Include co-author: `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`

**Never:**
- Force push to main
- Skip hooks with `--no-verify`
- Amend published commits
- Commit without tests passing

## New Game Checklist

When adding new game to monorepo:

- [ ] Create `.npmrc` with public registry config
- [ ] Add `package.json` with test scripts (`test`, `test:unit`, `test:e2e`)
- [ ] Create `vitest.config.js` with jsdom environment
- [ ] Create `playwright.config.js` with webServer config
- [ ] Add unit tests (vitest)
- [ ] Add minimal E2E tests (Playwright, critical flows only)
- [ ] Add CI job to `.github/workflows/ci.yml` (see [.github/CLAUDE.md](.github/CLAUDE.md))
- [ ] Update hub `index.html` with game link
- [ ] Update root `README.md` project structure table
- [ ] Use `shared/theme.js` and `shared/i18n.js` for theme/language sync
