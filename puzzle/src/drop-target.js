/**
 * Resolve which board slot a dragged piece should target.
 * Prefers the correct empty slot when the pointer is over its AABB,
 * even if an overlapping wrong/occupied slot is on top in the DOM.
 *
 * @typedef {{ slotIndex: number, empty: boolean, left: number, top: number, right: number, bottom: number }} SlotRect
 *
 * @param {number} pieceId
 * @param {number} clientX
 * @param {number} clientY
 * @param {SlotRect[]} slots - in DOM order (later = higher paint order)
 * @returns {number | null} slotIndex to attempt, or null if none under pointer
 */
export function resolveDropSlot(pieceId, clientX, clientY, slots) {
  const under = [];
  for (const s of slots) {
    if (
      clientX >= s.left &&
      clientX <= s.right &&
      clientY >= s.top &&
      clientY <= s.bottom
    ) {
      under.push(s);
    }
  }
  if (under.length === 0) return null;

  const correct = under.find((s) => s.slotIndex === pieceId && s.empty);
  if (correct) return correct.slotIndex;

  // Topmost empty under pointer (last in DOM order among under)
  for (let i = under.length - 1; i >= 0; i--) {
    if (under[i].empty) return under[i].slotIndex;
  }
  return null;
}

/**
 * Collect slot rects from the board for hit-testing.
 * @param {ParentNode} root
 * @returns {SlotRect[]}
 */
export function collectBoardSlotRects(root = document) {
  const els = root.querySelectorAll('.board-slot');
  return Array.from(els).map((el) => {
    const rect = el.getBoundingClientRect();
    return {
      slotIndex: parseInt(el.dataset.slotIndex, 10),
      empty: el.classList.contains('board-slot--empty'),
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
    };
  });
}
