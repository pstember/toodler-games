// ===================================
// FUEL UP MINI-GAME MODULE
// ===================================

import {
    CELEBRATION_DURATION,
    FUEL_PUMP_FILL_AMOUNT,
    FUEL_TANK_FULL
} from '../constants.js';
import { playSound } from '../utils.js';
import { createConfetti } from '../visual-effects.js';

/**
 * Apply one pump tap to the fuel level.
 * Pure helper for unit tests and gameplay.
 * @param {number} currentFuel - Current fill 0-100
 * @param {number} [amount=FUEL_PUMP_FILL_AMOUNT] - Fill per tap
 * @returns {number} New fuel level clamped to full
 */
export function applyFuelPump(currentFuel, amount = FUEL_PUMP_FILL_AMOUNT) {
    const next = Math.min(FUEL_TANK_FULL, Math.max(0, currentFuel) + amount);
    return next;
}

/**
 * Whether the tank is full enough to finish the mini-game
 * @param {number} fuelLevel
 * @returns {boolean}
 */
export function isFuelTankFull(fuelLevel) {
    return fuelLevel >= FUEL_TANK_FULL;
}

/**
 * Starts the fuel-up mini-game
 */
export function startFuelUpGame() {
    const game = document.getElementById('fuel-up-game');
    game.classList.remove('hidden');

    const fuelFill = document.getElementById('fuel-fill');
    const fuelText = document.getElementById('fuel-progress-text');
    const pumpBtn = document.getElementById('fuel-pump-btn');
    const fuelTruck = document.getElementById('fuel-truck');

    let fuelLevel = 0;
    let gameEnding = false;

    // Reset visuals
    fuelFill.style.height = '0%';
    fuelText.textContent = '0%';
    fuelTruck.classList.remove('fuel-driving-off');
    pumpBtn.disabled = false;

    const updateFuelUI = () => {
        fuelFill.style.height = `${fuelLevel}%`;
        fuelText.textContent = `${Math.round(fuelLevel)}%`;
        const bar = document.getElementById('fuel-progress-bar');
        if (bar) {
            bar.setAttribute('aria-valuenow', String(Math.round(fuelLevel)));
        }
    };

    updateFuelUI();

    pumpBtn.onclick = () => {
        if (gameEnding) return;

        fuelLevel = applyFuelPump(fuelLevel);
        updateFuelUI();
        playSound('success');
        pumpBtn.classList.add('fuel-pumping');
        setTimeout(() => pumpBtn.classList.remove('fuel-pumping'), 120);

        if (isFuelTankFull(fuelLevel)) {
            gameEnding = true;
            pumpBtn.disabled = true;
            createConfetti();
            fuelTruck.classList.add('fuel-driving-off');
            playSound('levelComplete');

            setTimeout(() => {
                import('../visual-effects.js').then(({ endIntermission }) => {
                    endIntermission();
                });
            }, CELEBRATION_DURATION);
        }
    };
}
