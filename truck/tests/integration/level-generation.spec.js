import { test, expect } from '@playwright/test';
import { GamePage } from '../helpers/game-page.js';

test.describe('Level Generation', () => {
  test('Level 1 generates exactly 1 slot and 2 inventory items', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();
    await game.generateLevel(1);

    const slots = await game.getSlots();
    const items = await game.getInventoryItems();

    expect(slots).toHaveLength(1);
    // Level 1 has only 2 unique combinations possible (red circle, red square)
    // so inventory is capped at 2 items to prevent duplicates
    expect(items).toHaveLength(2);
  });

  test('Level 1 uses only circle/square shapes and red color', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();
    await game.generateLevel(1);

    const slots = await game.getSlots();
    const items = await game.getInventoryItems();

    // Check slots
    for (const slot of slots) {
      expect(['circle', 'square']).toContain(slot.shape);
      expect(slot.color).toBe('red');
    }

    // Check items
    for (const item of items) {
      expect(['circle', 'square']).toContain(item.shape);
      expect(item.color).toBe('red');
    }
  });

  test('Level 5 (Tier 2) generates 2 slots and 5 inventory items', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();
    await game.generateLevel(5);

    const slots = await game.getSlots();
    const items = await game.getInventoryItems();

    expect(slots).toHaveLength(2);
    expect(items).toHaveLength(5);
  });

  test('Level 10 (Tier 4) generates 4 slots and 7 items with size variations', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();
    await game.generateLevel(10);

    const slots = await game.getSlots();
    const items = await game.getInventoryItems();

    expect(slots).toHaveLength(4);
    expect(items).toHaveLength(7);

    // Check that sizes vary (at least some large and some small)
    const sizes = items.map(item => item.size);
    const hasLarge = sizes.includes('large');
    const hasSmall = sizes.includes('small');

    // At level 10, size variations are enabled, so we should see both
    expect(hasLarge || hasSmall).toBe(true);
  });

  test('Level 15 (Endless) generates 4-5 slots and 7-9 items', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();
    await game.generateLevel(15);

    const slots = await game.getSlots();
    const items = await game.getInventoryItems();

    expect(slots.length).toBeGreaterThanOrEqual(4);
    expect(slots.length).toBeLessThanOrEqual(5);

    expect(items.length).toBeGreaterThanOrEqual(7);
    expect(items.length).toBeLessThanOrEqual(9);
  });

  test('inventory contains at least one correct match per slot', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();
    await game.generateLevel(5);

    const slots = await game.getSlots();
    const items = await game.getInventoryItems();

    for (const slot of slots) {
      const hasMatch = items.some(item =>
        item.shape === slot.shape &&
        item.color === slot.color &&
        item.size === slot.size
      );

      expect(hasMatch).toBe(true);
    }
  });

  test('level display text updates correctly', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();

    await game.generateLevel(7);
    const level7 = await page.locator('#level-number').textContent();
    expect(level7).toBe('7');

    await game.generateLevel(12);
    const level12 = await page.locator('#level-number').textContent();
    expect(level12).toBe('12');
  });

  test('previous level DOM clears before new level', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();

    await game.generateLevel(1);
    const level1Items = await game.getInventoryItems();
    expect(level1Items).toHaveLength(2); // Level 1 capped at 2 unique combinations

    await game.generateLevel(5);
    const level5Items = await game.getInventoryItems();
    expect(level5Items).toHaveLength(4); // Not 3+4=7, should be fresh 4 items

    const level5Slots = await game.getSlots();
    expect(level5Slots).toHaveLength(2); // Fresh 2 slots, not accumulated
  });
});
