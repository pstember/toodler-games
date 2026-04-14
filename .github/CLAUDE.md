# CI/CD Instructions

CI/CD patterns for GitHub Actions workflows.

## Workflow Files

- `ci.yml` - runs on push/PR to main
- `deploy.yml` - deploys to GitHub Pages on push to main

## CI Job Pattern

Each game gets own job with this structure:

```yaml
game-name:
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: game-name
  steps:
    - uses: actions/checkout@v6
    - uses: actions/setup-node@v6
      with:
        node-version: '24'
        cache: npm
        cache-dependency-path: game-name/package-lock.json
    
    # CRITICAL: Registry config step for all npm projects
    - name: Configure npm to use public registry
      run: |
        # Remove any .npmrc files
        rm -f ~/.npmrc
        rm -f .npmrc

        # Rewrite package-lock.json to use public npm registry instead of Artifactory
        if [ -f package-lock.json ]; then
          echo "Rewriting package-lock.json URLs from Artifactory to public registry..."
          sed -i 's|https://repox.jfrog.io/artifactory/api/npm/npm/|https://registry.npmjs.org/|g' package-lock.json
          echo "✅ Rewritten $(grep -c 'registry.npmjs.org' package-lock.json) URLs"
        fi

        echo "✅ npm configured to use public registry"
    
    - run: npm ci
    - run: npx playwright install --with-deps
    - run: npm test
      env:
        CI: true
```

## Deploy Workflow Pattern

**Puzzle build:**
- Build with `VITE_BASE=/toodler-games/puzzle/` (repo name from `github.event.repository.name`)
- Single-file output to `puzzle/dist/`

**Assembly:**
```bash
mkdir -p _site/truck _site/puzzle _site/rhythm _site/shared
cp index.html _site/
cp -R puzzle/dist/. _site/puzzle/
rsync -a --exclude node_modules truck/ _site/truck/
rsync -a rhythm/ _site/rhythm/
cp -R shared/. _site/shared/
touch _site/.nojekyll
```

**Upload:**
- Use `actions/upload-pages-artifact@v4` with `path: _site`
- Deploy with `actions/deploy-pages@v5`

## GitHub Pages Configuration

**CRITICAL:** Pages must deploy from Actions artifact, NOT branch.

1. Repo **Settings → Pages → Build and deployment**
2. Set **Source** to **GitHub Actions** (not "Deploy from a branch")
3. Push to main, wait for workflow

**Why:** Puzzle is Vite app. Raw `puzzle/index.html` in git references `/src/main.js` (dev entry), which 404s on GitHub Pages. Production build is in `puzzle/dist/`.

## Adding New Game to CI

When adding new game:

1. Add job to `ci.yml` (copy pattern above)
2. Add game to deploy workflow assembly section
3. Update `cache-dependency-path` to point to new `package-lock.json`
4. Include registry config step (CRITICAL)
5. Install Playwright browsers with `--with-deps`
6. Run `npm test` with `CI: true` env var
