# Toddler Games

Browser games for young children (ages 3+), served from unified hub.

- **Hub (local):** from this directory run `npx serve .` and open URL shown (port 3000 or 8080).
- **GitHub Pages:** [https://pstember.github.io/toodler-games/](https://pstember.github.io/toodler-games/)

## Project Structure

| Folder | Contents |
|--------|----------|
| **/** | Hub page with game selection, theme/language controls |
| [truck/](truck/) | Monster Truck Match — vanilla HTML/CSS/JS drag-drop game |
| [puzzle/](puzzle/) | Photo Puzzle — Vite + single-file build, Voronoi jigsaw |
| [rhythm/](rhythm/) | Tap the Colors — levels 1–3, optional Challenger (4 lanes + tighter window), timing band (vanilla ES modules) |
| [shared/](shared/) | Shared theme and i18n utilities used by hub and all games |

### Shared Infrastructure

All games (Hub, Truck, Puzzle, Rhythm) share:
- **Theme synchronization** - Light/dark/system preference syncs across games
- **Language synchronization** - English/French/Spanish preference syncs across games
- **Consistent colors** - Canonical theme colors (`#1e3a5f` light, `#0f172a` dark)

See [shared/README.md](shared/README.md) for details on shared utilities.

Deployment builds puzzle with `VITE_BASE=/toodler-games/puzzle/` (repo name comes from workflow) and copies `truck/`, `rhythm/`, and hub `index.html` into published site.

### GitHub Pages (required for the puzzle)

Published site **must** come from **Deploy GitHub Pages** workflow (Actions artifact), not from **Deploy from a branch**.

If Pages set to deploy `main` branch at repository root, GitHub serves raw [`puzzle/index.html`](puzzle/index.html) from git. That file is Vite **development** entry used to request `/src/main.js`, which resolves to `https://pstember.github.io/src/main.js` and returns 404. Production puzzle is **built** output in `puzzle/dist/`, which workflow copies into published site.

1. Repo **Settings → Pages → Build and deployment**
2. Set **Source** to **GitHub Actions** (not "Deploy from a branch")
3. Push to `main` so workflow runs; wait for it to finish

`Unchecked runtime.lastError` message in console usually from browser extension and can be ignored.

### Easiest ways to play

| Goal | What to do |
|------|------------|
| **Just play everything** | Use hosted site: [GitHub Pages](https://pstember.github.io/toodler-games/) (after Actions deploy). |
| **Truck only, locally** | No install: `npx serve .` from repo root (or `npx serve truck` from anywhere) and open URL. Truck game is plain static files. |
| **Puzzle only, locally** | Either use hosted Pages URL, or run `npm ci && npm run dev` inside `puzzle/` (uses [`puzzle/.npmrc`](puzzle/.npmrc)), or `npm run build` then `npx serve puzzle/dist`. |
| **Rhythm only, locally** | No install: `npx serve .` from repo root and open `/rhythm/` (static ES modules, like Truck). |
| **Run Playwright tests** | Needs `npm ci` in `truck/`, `puzzle/`, or `rhythm/` with lockfiles as committed. |