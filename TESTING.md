# Testing Guide

## Overview

This project uses [Playwright](https://playwright.dev/) for all testing needs - unit, integration, and end-to-end tests. The test suite ensures 80%+ coverage and maintains code quality.

## Test Structure

```
tests/
├── unit/                           # Pure function tests
│   ├── match-validation.spec.js   # Match logic tests
│   ├── utilities.spec.js          # Helper function tests
│   ├── progressive-difficulty.spec.js  # Tier/difficulty tests
│   ├── sound-and-audio.spec.js    # Audio system tests (planned)
│   ├── visual-effects.spec.js     # Animation tests (planned)
│   └── internationalization.spec.js  # i18n tests (planned)
├── integration/                    # Component interaction tests
│   ├── level-generation.spec.js   # Level creation tests
│   ├── game-state.spec.js         # State management tests
│   └── slot-detection.spec.js     # Collision detection (planned)
├── e2e/                           # End-to-end user flow tests
│   ├── basic-gameplay.spec.js     # Core gameplay
│   ├── drag-and-drop.spec.js      # Drag system
│   ├── mini-games.spec.js         # Intermission games
│   ├── edge-cases.spec.js         # Edge case handling
│   ├── click-path-bugs.spec.js    # Regression tests
│   └── bubble-wrap.spec.js        # Bubble wrap game (planned)
└── helpers/
    └── game-page.js               # Shared test utilities
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e           # E2E tests only

# Run with UI (headed mode)
npm run test:headed

# Generate coverage report
npm run test:coverage

# View test report
npm run test:report
```

### Advanced Options

```bash
# Run specific test file
npx playwright test tests/unit/match-validation.spec.js

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Debug mode
npx playwright test --debug

# Update snapshots
npx playwright test --update-snapshots
```

## Coverage Requirements

### Minimum Thresholds

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%

### Checking Coverage

```bash
npm run test:coverage
```

Coverage reports are generated in `playwright-report/` directory.

### Current Coverage Status

As of last update:
- **Lines**: ~62% (Target: 80%)
- **Functions**: ~62% (Target: 80%)
- **Branches**: ~65% (Target: 80%)

### Uncovered Areas (To Address)

1. Sound/audio functions
2. Visual effect functions (confetti, fireworks)
3. Bubble wrap mini-game
4. Internationalization system
5. Slot detection edge cases

## Writing Tests

### Test Naming Convention

Use descriptive names that explain the expected behavior:

```javascript
// ✅ Good
test('should bounce back when wrong item dragged to slot', async ({ page }) => {
    // ...
});

// ❌ Bad
test('drag test', async ({ page }) => {
    // ...
});
```

### Test Structure

Follow Arrange-Act-Assert pattern:

```javascript
test('should match correct shape and color', async ({ page }) => {
    // Arrange
    await page.goto('http://localhost:3000');
    const redCircle = page.locator('[data-shape="circle"][data-color="red"]');
    const redCircleSlot = page.locator('.slot[data-shape="circle"][data-color="red"]');

    // Act
    await redCircle.dragTo(redCircleSlot);

    // Assert
    await expect(redCircleSlot).toHaveClass(/filled/);
});
```

### Using Test Helpers

The `GamePage` class provides common utilities:

```javascript
import { GamePage } from './helpers/game-page.js';

test('level generation', async ({ page }) => {
    const gamePage = new GamePage(page);

    // Navigate to game
    await gamePage.navigate();

    // Start game
    await gamePage.startGame();

    // Get slots
    const slots = await gamePage.getSlots();

    // Assert
    expect(slots.length).toBeGreaterThan(0);
});
```

### Available Helper Methods

```javascript
class GamePage {
    // Navigation
    async navigate()
    async startGame()

    // Element selection
    async getSlots()
    async getInventoryItems()
    async getSlotData(slot)
    async getItemData(item)

    // Actions
    async dragItemToSlot(item, slot)
    async clickButton(selector)

    // Assertions
    async expectSlotFilled(slot)
    async expectItemInInventory(item)
}
```

## Unit Tests

### Purpose

Test pure functions in isolation without DOM dependencies.

### Example

```javascript
test('validates matching shape and color', () => {
    const item = { shape: 'circle', color: 'red', size: 'medium' };
    const slot = { shape: 'circle', color: 'red', size: 'medium' };

    const result = validateMatch(item, slot);

    expect(result).toBe(true);
});
```

### Best Practices

- No DOM access
- No async operations (unless testing async functions)
- Fast execution (<10ms per test)
- Test edge cases (null, undefined, empty strings)

## Integration Tests

### Purpose

Test component interactions and DOM manipulation.

### Example

```javascript
test('generates correct number of slots for tier 1', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
        gameState.levelCount = 1;
        generateLevel(1);
    });

    const slots = await page.locator('.slot').count();
    expect(slots).toBe(2); // Tier 1 has 2 slots
});
```

### Best Practices

- Use `page.evaluate()` for direct function calls
- Mock external dependencies
- Verify DOM state changes
- Test component interactions

## E2E Tests

### Purpose

Test complete user workflows from start to finish.

### Example

```javascript
test('complete level workflow', async ({ page }) => {
    const gamePage = new GamePage(page);

    // Start game
    await gamePage.navigate();
    await gamePage.startGame();

    // Get first item and matching slot
    const items = await gamePage.getInventoryItems();
    const item = items[0];
    const itemData = await gamePage.getItemData(item);

    const slots = await gamePage.getSlots();
    const matchingSlot = await gamePage.findMatchingSlot(slots, itemData);

    // Drag and drop
    await item.dragTo(matchingSlot);

    // Verify slot filled
    await gamePage.expectSlotFilled(matchingSlot);
});
```

### Best Practices

- Test real user interactions
- Use realistic delays (user think time)
- Test happy path and error cases
- Verify visual feedback

## Testing Patterns

### Testing Drag-and-Drop

```javascript
test('drag and drop', async ({ page }) => {
    const item = page.locator('.draggable-item').first();
    const slot = page.locator('.slot').first();

    // Get initial positions
    const itemBox = await item.boundingBox();
    const slotBox = await slot.boundingBox();

    // Perform drag
    await item.dragTo(slot);

    // Verify result
    await expect(slot).toHaveClass(/filled/);
});
```

### Testing Animations

```javascript
test('confetti appears on level complete', async ({ page }) => {
    // Complete level
    await completeLevel(page);

    // Wait for confetti
    await page.waitForSelector('.confetti', { timeout: 2000 });

    // Count confetti elements
    const confettiCount = await page.locator('.confetti').count();
    expect(confettiCount).toBeGreaterThan(0);

    // Wait for cleanup
    await page.waitForFunction(() => {
        return document.querySelectorAll('.confetti').length === 0;
    }, { timeout: 5000 });
});
```

### Testing Canvas Elements

```javascript
test('mud wash canvas rendering', async ({ page }) => {
    // Start mud wash game
    await page.goto('http://localhost:3000?minigame=mud-wash');

    // Wait for canvas
    const canvas = page.locator('#mud-wash-canvas');
    await expect(canvas).toBeVisible();

    // Get canvas context and verify rendering
    const hasContent = await page.evaluate(() => {
        const canvas = document.getElementById('mud-wash-canvas');
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return imageData.data.some(byte => byte > 0);
    });

    expect(hasContent).toBe(true);
});
```

### Testing LocalStorage

```javascript
test('language persists in localStorage', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Set language
    await page.evaluate(() => setLanguage('fr'));

    // Verify in localStorage
    const storedLang = await page.evaluate(() =>
        localStorage.getItem('monster-truck-language')
    );

    expect(storedLang).toBe('fr');

    // Reload page
    await page.reload();

    // Verify language persisted
    const currentLang = await page.evaluate(() => currentLanguage);
    expect(currentLang).toBe('fr');
});
```

## Avoiding Flaky Tests

### Use State-Based Waits

```javascript
// ❌ Bad: Hardcoded timeout
await page.waitForTimeout(3000);

// ✅ Good: Wait for specific state
await page.waitForSelector('.celebration-overlay:visible');
```

### Wait for Animations

```javascript
// ❌ Bad: Assuming animation duration
await page.waitForTimeout(2000);

// ✅ Good: Wait for animation to complete
await page.waitForFunction(() => {
    const element = document.querySelector('.animated-element');
    return !element || getComputedStyle(element).animationPlayState === 'paused';
});
```

### Handle Race Conditions

```javascript
// ❌ Bad: Assuming order
await button1.click();
await button2.click();

// ✅ Good: Wait for first action to complete
await button1.click();
await page.waitForSelector('.result-1');
await button2.click();
```

## Debugging Tests

### Using Headed Mode

```bash
npm run test:headed
```

Shows browser window during test execution.

### Using Debug Mode

```bash
npx playwright test --debug
```

Opens Playwright Inspector for step-by-step debugging.

### Using Console Logs

```javascript
test('debug test', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    await page.goto('http://localhost:3000');
});
```

### Taking Screenshots

```javascript
test('screenshot on failure', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Take screenshot
    await page.screenshot({ path: 'debug-screenshot.png' });

    // Or on failure
    try {
        await expect(page.locator('.missing-element')).toBeVisible();
    } catch (error) {
        await page.screenshot({ path: 'failure-screenshot.png' });
        throw error;
    }
});
```

## Test Performance

### Fast Test Guidelines

- Unit tests: <10ms each
- Integration tests: <100ms each
- E2E tests: <5s each

### Parallel Execution

Playwright runs tests in parallel by default:

```javascript
// playwright.config.js
export default {
    workers: 4, // Run 4 tests in parallel
    fullyParallel: true
};
```

### Test Isolation

Each test gets a fresh browser context:
- No shared state between tests
- Independent localStorage/cookies
- Clean DOM for each test

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npx playwright install
      - run: npm test
      - run: npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## Coverage Reporting

### Viewing Reports

After running `npm run test:coverage`:

```bash
# Open HTML report
npm run test:report

# Or manually
open playwright-report/index.html
```

### Understanding Coverage Metrics

- **Lines**: Percentage of code lines executed
- **Functions**: Percentage of functions called
- **Branches**: Percentage of decision branches taken
- **Statements**: Percentage of statements executed

### Improving Coverage

1. Identify uncovered functions:
   - Check coverage report
   - Look for 0% coverage areas

2. Add missing tests:
   - Focus on untested functions first
   - Test edge cases

3. Remove dead code:
   - If truly unused, delete it
   - If needed, add tests

## Test Maintenance

### When to Update Tests

- When adding new features
- When fixing bugs (add regression test)
- When refactoring code
- When tests become flaky

### Skipping Tests

Use sparingly and document why:

```javascript
test.skip('flaky test - needs investigation', async ({ page }) => {
    // TODO: Fix multi-touch handling
    // Issue: #123
});
```

### Test Fixtures

Create reusable test data:

```javascript
const testLevels = {
    tier1: { level: 1, slots: 2, shapes: ['circle', 'square'] },
    tier2: { level: 4, slots: 3, shapes: ['circle', 'square', 'triangle'] }
};

test('tier 1 level generation', async ({ page }) => {
    const config = testLevels.tier1;
    // Use config in test
});
```

## Best Practices Summary

### DO ✅
- Write tests before implementation (TDD)
- Use descriptive test names
- Test edge cases
- Use state-based waits
- Keep tests independent
- Maintain 80%+ coverage

### DON'T ❌
- Use hardcoded timeouts
- Share state between tests
- Test implementation details
- Skip tests without documentation
- Leave failing tests
- Ignore coverage gaps

## Getting Help

- **Playwright Docs**: https://playwright.dev/
- **Project Issues**: https://github.com/yourusername/toddler-truck-game/issues
- **Test Examples**: Check existing tests in `tests/` directory
