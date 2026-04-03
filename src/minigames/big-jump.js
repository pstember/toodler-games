// ===================================
// BIG JUMP MINI-GAME MODULE
// ===================================

import { CELEBRATION_DURATION } from '../constants.js';
import { playSound } from '../utils.js';
import { createFireworks } from '../visual-effects.js';

/**
 * Starts the big jump mini-game
 */
export function startBigJumpGame() {
    const game = document.getElementById('big-jump-game');
    game.classList.remove('hidden');

    const jumpTruck = document.getElementById('jump-truck');
    const jumpBtn = document.getElementById('jump-btn');

    // Reset animation and positioning
    jumpTruck.classList.remove('jumping');
    jumpTruck.style.left = '-200px';
    jumpTruck.style.transform = 'none';
    jumpTruck.style.animation = 'driveToRamp 3s ease-in-out forwards';

    let hasJumped = false;

    jumpBtn.onclick = () => {
        if (!hasJumped) {
            hasJumped = true;
            playSound('jump');

            // Stop the drive animation and get current position
            const currentLeft = jumpTruck.offsetLeft;
            jumpTruck.style.animation = '';
            jumpTruck.style.left = currentLeft + 'px';

            // Start jump animation
            jumpTruck.classList.add('jumping');

            createFireworks();

            setTimeout(() => {
                // Dynamic import to avoid circular dependency
                import('../visual-effects.js').then(({ endIntermission }) => {
                    endIntermission();
                });
            }, CELEBRATION_DURATION);
        }
    };
}
