import { test, expect } from '@playwright/test';

test.describe('Toddler jigsaw', () => {
  test('board and tray have size; hint toggles', async ({ page }) => {
    await page.goto('/');

    const grid = page.locator('#puzzle-grid');
    const tray = page.getByTestId('piece-tray');
    await expect(grid).toBeVisible();
    await expect(tray).toBeVisible();

    const gb = await grid.boundingBox();
    const tb = await tray.boundingBox();
    expect(gb.width).toBeGreaterThan(32);
    expect(gb.height).toBeGreaterThan(32);
    expect(tb.width).toBeGreaterThan(32);
    expect(tb.height).toBeGreaterThan(32);

    const hint = page.locator('#hint-overlay');
    await expect(hint).not.toHaveClass(/visible/);
    await page.locator('#btn-hint').click();
    await expect(hint).toHaveClass(/visible/);
  });

  test('test hook completes puzzle and shows win', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.__PUZZLE_TEST__?.solve === 'function');
    await page.evaluate(() => window.__PUZZLE_TEST__.solve());
    await expect(page.locator('#win-overlay')).toHaveClass(/visible/);
  });

  test('second pointer does not start a parallel drag or move the active clone', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.__PUZZLE_TEST__?.getDragState === 'function');
    await page.waitForSelector('.tray-piece-wrap');

    const check = await page.evaluate(() => {
      const wraps = document.querySelectorAll('.tray-piece-wrap');
      if (wraps.length < 2) {
        return { ok: false, reason: 'need_at_least_two_tray_pieces' };
      }
      const w0 = wraps[0];
      const w1 = wraps[1];
      const r0 = w0.getBoundingClientRect();
      const r1 = w1.getBoundingClientRect();
      const x0 = r0.left + r0.width / 2;
      const y0 = r0.top + r0.height / 2;
      const x1 = r1.left + r1.width / 2;
      const y1 = r1.top + r1.height / 2;

      w0.dispatchEvent(
        new PointerEvent('pointerdown', {
          pointerId: 1,
          clientX: x0,
          clientY: y0,
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 1,
          pointerType: 'touch',
        }),
      );

      const clonesAfterFirst = document.querySelectorAll('.drag-clone').length;
      const ds1 = window.__PUZZLE_TEST__.getDragState();
      const firstPieceId = ds1?.pieceId;
      const clone = document.querySelector('.drag-clone');
      const leftAfterStart = clone ? clone.style.left : '';
      const topAfterStart = clone ? clone.style.top : '';

      w1.dispatchEvent(
        new PointerEvent('pointerdown', {
          pointerId: 2,
          clientX: x1,
          clientY: y1,
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 1,
          pointerType: 'touch',
        }),
      );

      const clonesAfterSecond = document.querySelectorAll('.drag-clone').length;
      const ds2 = window.__PUZZLE_TEST__.getDragState();

      document.dispatchEvent(
        new PointerEvent('pointermove', {
          pointerId: 2,
          clientX: x1 + 80,
          clientY: y1 + 40,
          bubbles: true,
          cancelable: true,
          buttons: 1,
          pointerType: 'touch',
        }),
      );

      const cloneAfterForeignMove = document.querySelector('.drag-clone');
      const leftAfterForeignMove = cloneAfterForeignMove ? cloneAfterForeignMove.style.left : '';
      const topAfterForeignMove = cloneAfterForeignMove ? cloneAfterForeignMove.style.top : '';

      document.dispatchEvent(
        new PointerEvent('pointerup', {
          pointerId: 1,
          clientX: x0,
          clientY: y0,
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 0,
          pointerType: 'touch',
        }),
      );

      return {
        ok: true,
        clonesAfterFirst,
        clonesAfterSecond,
        sameDragPiece: ds2?.pieceId === firstPieceId,
        ds2PointerId: ds2?.pointerId,
        cloneUnchangedByForeignMove:
          leftAfterForeignMove === leftAfterStart && topAfterForeignMove === topAfterStart,
      };
    });

    expect(check.ok).toBe(true);
    expect(check.clonesAfterFirst).toBe(1);
    expect(check.clonesAfterSecond).toBe(1);
    expect(check.sameDragPiece).toBe(true);
    expect(check.ds2PointerId).toBe(1);
    expect(check.cloneUnchangedByForeignMove).toBe(true);
  });
});
