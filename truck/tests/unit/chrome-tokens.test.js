import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const truckRoot = resolve(__dirname, '../..');
const repoRoot = resolve(truckRoot, '..');
const tokensCss = readFileSync(resolve(repoRoot, 'shared/shared-design-tokens.css'), 'utf8');
const truckHtml = readFileSync(resolve(truckRoot, 'index.html'), 'utf8');
const truckCss = readFileSync(resolve(truckRoot, 'style.css'), 'utf8');

describe('Shared chrome design tokens', () => {
  it('defines chrome geometry tokens', () => {
    expect(tokensCss).toMatch(/--chrome-font:\s*17px/);
    expect(tokensCss).toMatch(/--chrome-min-h:\s*48px/);
    expect(tokensCss).toMatch(/--chrome-border:\s*3px/);
    expect(tokensCss).toMatch(/--chrome-radius:\s*var\(--radius-md\)/);
    expect(tokensCss).toMatch(/--chrome-gap:\s*10px/);
  });

  it('shrinks chrome on phone breakpoint', () => {
    expect(tokensCss).toMatch(
      /@media\s*\(max-width:\s*640px\)\s*\{[^}]*--chrome-min-h:\s*44px/s
    );
  });

  it('exposes .game-chrome and status/color variants', () => {
    expect(tokensCss).toMatch(/\.game-chrome\s*\{/);
    expect(tokensCss).toMatch(/\.game-chrome--status\s*\{/);
    expect(tokensCss).toMatch(/\.game-chrome--primary\s*\{/);
    expect(tokensCss).toMatch(/\.game-chrome--secondary\s*\{/);
    expect(tokensCss).toMatch(/\.game-chrome--accent\s*\{/);
  });
});

describe('Truck top chrome wiring', () => {
  it('puts level chip in top-nav with shared chrome classes', () => {
    expect(truckHtml).toMatch(
      /class="top-nav"[\s\S]*id="level-display"[\s\S]*game-chrome--status[\s\S]*top-nav__right/
    );
    expect(truckHtml).not.toMatch(
      /id="game-container"[\s\S]*id="level-display"/
    );
  });

  it('uses game-chrome on hub / theme / language controls', () => {
    expect(truckHtml).toMatch(/hub-link[^"]*game-chrome|game-chrome[^"]*hub-link/);
    expect(truckHtml).toMatch(/theme-select[^"]*game-chrome|game-chrome[^"]*theme-select/);
    expect(truckHtml).toMatch(/id="language-select"[^>]*game-chrome/);
  });

  it('does not reintroduce oversized absolute level badge', () => {
    expect(truckCss).not.toMatch(/\.level-display\s*\{[^}]*position:\s*absolute/s);
    expect(truckCss).not.toMatch(/\.level-display\s*\{[^}]*font-size:\s*36px/s);
    expect(truckCss).not.toMatch(/levelPulse/);
  });
});
