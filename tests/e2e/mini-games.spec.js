import { test, expect } from '@playwright/test';
import { GamePage } from '../helpers/game-page.js';

test.describe('Intermission Mini-Games', () => {
  test('intermission triggers after level 3', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();

    // Complete levels 1, 2, and 3
    for (let level = 1; level <= 3; level++) {
      await game.generateLevel(level);
      await game.completeLevel();
    }

    // Intermission should be visible
    await page.waitForTimeout(3000); // Wait for animations

    const intermissionVisible = await page.locator('#intermission-container').isVisible();
    expect(intermissionVisible).toBe(true);
  });

  test('Mud Wash mini-game - canvas clears and ends', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();

    // Force mud wash selection
    await game.setMathRandom(0.1);

    // Trigger intermission directly
    await page.evaluate(() => triggerIntermission());

    await page.waitForTimeout(500);

    // Verify mud wash game is visible
    const mudGame = page.locator('#mud-wash-game');
    await expect(mudGame).toBeVisible();

    // Verify canvas exists
    const canvas = page.locator('#mud-canvas');
    await expect(canvas).toBeVisible();

    // Simulate drawing/clearing by clicking and dragging on canvas
    const canvasBox = await canvas.boundingBox();

    // Draw across canvas to clear mud - need to clear 95% for game to end
    // Draw more thoroughly with overlapping strokes
    for (let i = 0; i < 15; i++) {
      await page.mouse.move(canvasBox.x + 20, canvasBox.y + 20 * i);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + canvasBox.width - 20, canvasBox.y + 20 * i);
      await page.mouse.up();
    }

    // Wait for game to end (should auto-advance at 95% cleared)
    await page.waitForTimeout(3000);

    // Verify intermission ended and returned to game
    // Use waitFor instead of isHidden for more reliable checking
    await page.locator('#intermission-container').waitFor({ state: 'hidden', timeout: 5000 });
  });

  test('Sticker Shop mini-game - DONE button works', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();

    // Force sticker shop selection
    await game.setMathRandom(0.5);

    // Trigger intermission
    await page.evaluate(() => triggerIntermission());

    await page.waitForTimeout(500);

    // Verify sticker shop is visible
    const stickerGame = page.locator('#sticker-shop-game');
    await expect(stickerGame).toBeVisible();

    // Verify stickers are present
    const stickers = await page.locator('.sticker').count();
    expect(stickers).toBeGreaterThan(0);

    // Click DONE button
    const doneBtn = page.locator('#sticker-done-btn');
    await doneBtn.click();

    // Wait for intermission to end
    await page.waitForTimeout(1000);

    // Verify intermission ended
    const intermissionHidden = await page.locator('#intermission-container').isHidden();
    expect(intermissionHidden).toBe(true);
  });

  test('Big Jump mini-game - JUMP button triggers animation', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();

    // Force big jump selection
    await game.setMathRandom(0.99);

    // Trigger intermission
    await page.evaluate(() => triggerIntermission());

    await page.waitForTimeout(3500); // Wait for drive animation

    // Verify big jump game is visible
    const jumpGame = page.locator('#big-jump-game');
    await expect(jumpGame).toBeVisible();

    // Verify JUMP button is visible
    const jumpBtn = page.locator('#jump-btn');
    await expect(jumpBtn).toBeVisible();

    // Click JUMP button (force because parent div may intercept)
    await jumpBtn.click({ force: true });

    // Wait a bit for animation to start
    await page.waitForTimeout(500);

    // Verify jump animation (truck should have jumping class)
    const truck = page.locator('#jump-truck');
    await expect(truck).toHaveClass(/jumping/);

    // Wait for auto-advance
    await page.waitForTimeout(2500);

    // Verify intermission ended
    const intermissionHidden = await page.locator('#intermission-container').isHidden();
    expect(intermissionHidden).toBe(true);
  });
});
