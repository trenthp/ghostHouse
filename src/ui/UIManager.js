export class UIManager {
    constructor() {
        this.locationStatus = document.getElementById('locationStatus');
        this.locationText = document.getElementById('locationText');
        this.locationIndicator = document.getElementById('locationIndicator');
        this.scaresCount = document.getElementById('scaresCount');
    }

    updateLocationStatus(data, isAtLocation) {
        const distance = Math.round(data.distance);

        if (this.locationStatus) {
            if (isAtLocation) {
                this.locationStatus.classList.remove('away');
                this.locationStatus.classList.add('at-location');
            } else {
                this.locationStatus.classList.remove('at-location');
                this.locationStatus.classList.add('away');
            }
        }

        if (this.locationIndicator) {
            if (isAtLocation) {
                this.locationIndicator.classList.remove('inactive');
                this.locationIndicator.classList.add('active');
            } else {
                this.locationIndicator.classList.remove('active');
                this.locationIndicator.classList.add('inactive');
            }
        }

        if (this.locationText) {
            if (isAtLocation) {
                this.locationText.textContent = `🎃 At ${data.address}!`;
            } else {
                this.locationText.textContent = `📍 ${distance}m away`;
            }
        }
    }

    updateScore(score) {
        if (this.scaresCount) {
            this.scaresCount.textContent = score;
        }
    }

    showError(message) {
        console.error(message);
    }
}
