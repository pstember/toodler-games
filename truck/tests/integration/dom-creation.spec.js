import { test, expect } from '@playwright/test';
import { GamePage } from '../helpers/game-page.js';

test.describe('DOM Creation Functions', () => {
  test('createSlot creates div with correct data attributes', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();

    const slotData = await page.evaluate(() => {
      const slot = createSlot('circle', 'red', 'large');
      return {
        requiredShape: slot.dataset.requiredShape,
        requiredColor: slot.dataset.requiredColor,
        requiredSize: slot.dataset.requiredSize,
        className: slot.className
      };
    });

    expect(slotData.requiredShape).toBe('circle');
    expect(slotData.requiredColor).toBe('red');
    expect(slotData.requiredSize).toBe('large');
    expect(slotData.className).toContain('slot');
  });

  test('createSlot contains slot-outline child', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();

    const hasOutline = await page.evaluate(() => {
      const slot = createSlot('square', 'blue', 'large');
      const outline = slot.querySelector('.slot-outline');
      return {
        exists: !!outline,
        hasShapeClass: outline?.classList.contains('square'),
        hasColorClass: outline?.classList.contains('color-blue')
      };
    });

    expect(hasOutline.exists).toBe(true);
    expect(hasOutline.hasShapeClass).toBe(true);
    expect(hasOutline.hasColorClass).toBe(true);
  });

  test('createSlot large is CSS-sized via size-large', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();

    const size = await page.evaluate(() => {
      const slot = createSlot('circle', 'red', 'large');
      document.body.appendChild(slot);
      const computed = getComputedStyle(slot);
      return {
        hasClass: slot.classList.contains('size-large'),
        inlineWidth: slot.style.width,
        inlineHeight: slot.style.height,
        width: computed.width,
        height: computed.height
      };
    });

    expect(size.hasClass).toBe(true);
    expect(size.inlineWidth).toBe('');
    expect(size.inlineHeight).toBe('');
    expect(size.width).toBe('120px');
    expect(size.height).toBe('120px');
  });

  test('createSlot small is CSS-sized via size-small', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();

    const size = await page.evaluate(() => {
      const slot = createSlot('circle', 'red', 'small');
      document.body.appendChild(slot);
      const computed = getComputedStyle(slot);
      return {
        hasClass: slot.classList.contains('size-small'),
        inlineWidth: slot.style.width,
        inlineHeight: slot.style.height,
        width: computed.width,
        height: computed.height
      };
    });

    expect(size.hasClass).toBe(true);
    expect(size.inlineWidth).toBe('');
    expect(size.inlineHeight).toBe('');
    // --tire-small = 2/3 of 120px
    expect(size.width).toBe('80px');
    expect(size.height).toBe('80px');
  });

  test('createDraggableItem has correct CSS classes', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();

    const classes = await page.evaluate(() => {
      const item = createDraggableItem('triangle', 'green', 'large');
      return {
        className: item.className,
        hasShape: item.classList.contains('triangle'),
        hasColor: item.classList.contains('color-green'),
        hasSize: item.classList.contains('size-large')
      };
    });

    expect(classes.hasShape).toBe(true);
    expect(classes.hasColor).toBe(true);
    expect(classes.hasSize).toBe(true);
    expect(classes.className).toContain('draggable-item');
  });

  test('createDraggableItem has correct data attributes', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();

    const data = await page.evaluate(() => {
      const item = createDraggableItem('star', 'purple', 'small');
      return {
        shape: item.dataset.shape,
        color: item.dataset.color,
        size: item.dataset.size
      };
    });

    expect(data.shape).toBe('star');
    expect(data.color).toBe('purple');
    expect(data.size).toBe('small');
  });

  test('createDraggableItem has event listeners attached', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();

    // Add item to DOM and trigger mousedown
    const triggered = await page.evaluate(() => {
      const item = createDraggableItem('circle', 'red', 'large');
      document.body.appendChild(item);

      let mousedownFired = false;

      // Trigger mousedown - if listener is attached, dragging class should be added
      const event = new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 100 });
      item.dispatchEvent(event);

      // Check if dragging class was added (indicates listener fired)
      mousedownFired = item.classList.contains('dragging');

      document.body.removeChild(item);
      return mousedownFired;
    });

    expect(triggered).toBe(true);
  });

  test('slot outline has correct shape and color classes', async ({ page }) => {
    const game = new GamePage(page);
    await game.navigate();

    const outlineClasses = await page.evaluate(() => {
      const slot = createSlot('heart', 'pink', 'large');
      const outline = slot.querySelector('.slot-outline');
      return {
        hasHeart: outline?.classList.contains('heart'),
        hasPink: outline?.classList.contains('color-pink'),
        hasLarge: outline?.classList.contains('size-large')
      };
    });

    expect(outlineClasses.hasHeart).toBe(true);
    expect(outlineClasses.hasPink).toBe(true);
    expect(outlineClasses.hasLarge).toBe(true);
  });
});
