import { GhostTrackerHUD } from './GhostTrackerHUD.js';

export class UIManager {
    constructor() {
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

        // Initialize ghost tracker HUD
        this.ghostTrackerHUD = new GhostTrackerHUD();
    }

    updateLocationStatus(data, isAtLocation) {
        const distance = Math.round(data.distance);

        if (isAtLocation) {
            this.locationStatus.classList.remove('away');
            this.locationStatus.classList.add('at-location');
            this.locationIndicator.classList.remove('inactive');
            this.locationIndicator.classList.add('active');
            this.locationText.textContent = `🎃 At ${data.address}!`;
        } else {
            this.locationStatus.classList.remove('at-location');
            this.locationStatus.classList.add('away');
            this.locationIndicator.classList.remove('active');
            this.locationIndicator.classList.add('inactive');
            this.locationText.textContent = `📍 ${distance}m away`;
        }

        this.instrLocation.textContent = distance + 'm away';
    }

    updateStats(stats) {
        this.scaresCount.textContent = stats.scaresCount;
        this.comboStat.textContent = stats.comboCount > 0 ? `${stats.comboCount}x` : '0x';
        this.highScore.textContent = stats.highScore;

        // Show combo animation
        if (stats.comboCount > this.lastCombo) {
            this.showComboAnimation(stats.comboCount);
        }
        this.lastCombo = stats.comboCount;
    }

    updateGhostCount(count) {
        this.ghostCount.textContent = count;
    }

    showComboAnimation(comboCount) {
        if (comboCount >= 3) {
            this.comboDisplay.textContent = `${comboCount}x`;
            this.comboDisplay.style.display = 'block';
            this.comboLabel.style.display = 'block';

            // Pulse animation
            this.comboDisplay.style.animation = 'none';
            setTimeout(() => {
                this.comboDisplay.style.animation = 'pulse 0.3s';
            }, 10);
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
