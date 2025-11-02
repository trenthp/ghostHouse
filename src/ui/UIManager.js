import { GhostTrackerHUD } from './GhostTrackerHUD.js';

// UI configuration constants
const UI_CONFIG = {
    COMBO_THRESHOLD: 3, // Show combo animation at 3+ combo
    COMBO_RESET_TIMEOUT: 5, // seconds
};

export class UIManager {
    constructor() {
        // Initialize with DOM elements - add null checks
        this.locationStatus = document.getElementById('locationStatus');
        this.locationText = document.getElementById('locationText');
        this.locationIndicator = document.getElementById('locationIndicator');
        this.instrLocation = document.getElementById('instrLocation');

        this.scaresCount = document.getElementById('scaresCount');
        this.ghostCount = document.getElementById('ghostCount');
        this.comboStat = document.getElementById('comboStat');
        this.highScore = document.getElementById('highScore');

        this.comboDisplay = document.getElementById('comboDisplay');
        this.comboLabel = document.getElementById('comboLabel');

        this.lastCombo = 0;

        // Validate that required elements exist
        this._validateDOMElements();

        // Initialize ghost tracker HUD
        this.ghostTrackerHUD = new GhostTrackerHUD();
    }

    _validateDOMElements() {
        const required = [
            ['locationStatus', this.locationStatus],
            ['locationText', this.locationText],
            ['scaresCount', this.scaresCount],
            ['ghostCount', this.ghostCount],
            ['comboStat', this.comboStat],
            ['highScore', this.highScore],
        ];

        const missing = required.filter(([id, el]) => !el);
        if (missing.length > 0) {
            console.warn('Missing UI elements:', missing.map(m => m[0]));
        }
    }

    updateLocationStatus(data, isAtLocation) {
        const distance = Math.round(data.distance);

        if (isAtLocation) {
            this.locationStatus?.classList.remove('away');
            this.locationStatus?.classList.add('at-location');
            this.locationIndicator?.classList.remove('inactive');
            this.locationIndicator?.classList.add('active');
            if (this.locationText) this.locationText.textContent = `🎃 At ${data.address}!`;
        } else {
            this.locationStatus?.classList.remove('at-location');
            this.locationStatus?.classList.add('away');
            this.locationIndicator?.classList.remove('active');
            this.locationIndicator?.classList.add('inactive');
            if (this.locationText) this.locationText.textContent = `📍 ${distance}m away`;
        }

        if (this.instrLocation) this.instrLocation.textContent = distance + 'm away';
    }

    updateStats(stats) {
        if (this.scaresCount) this.scaresCount.textContent = stats.scaresCount;
        if (this.comboStat) this.comboStat.textContent = stats.comboCount > 0 ? `${stats.comboCount}x` : '0x';
        if (this.highScore) this.highScore.textContent = stats.highScore;

        // Show combo animation
        if (stats.comboCount > this.lastCombo) {
            this.showComboAnimation(stats.comboCount);
        }
        this.lastCombo = stats.comboCount;
    }

    updateGhostCount(count) {
        if (this.ghostCount) this.ghostCount.textContent = count;
    }

    showComboAnimation(comboCount) {
        const cfg = UI_CONFIG;
        if (comboCount >= cfg.COMBO_THRESHOLD) {
            if (this.comboDisplay) {
                this.comboDisplay.textContent = `${comboCount}x`;
                this.comboDisplay.style.display = 'block';

                // Trigger pulse animation using CSS classes
                // Remove animation class to reset, then re-add to retrigger
                this.comboDisplay.classList.remove('pulse-combo');

                // Use requestAnimationFrame to avoid synchronous reflow stalls
                // This is much more efficient than void offsetWidth
                requestAnimationFrame(() => {
                    this.comboDisplay.classList.add('pulse-combo');
                });
            }
            if (this.comboLabel) {
                this.comboLabel.style.display = 'block';
            }
        }
    }

    showError(message) {
        console.error(message);
        // Could add a toast notification here
    }

    showNotification(message, duration = 2000) {
        // Toast notification system
        console.log(message);
    }

    /**
     * Update ghost tracker HUD with current creeping ghosts
     */
    updateGhostTracker(creepingGhosts, camera) {
        this.ghostTrackerHUD.update(
            creepingGhosts,
            camera,
            window.innerWidth,
            window.innerHeight
        );
    }
}
