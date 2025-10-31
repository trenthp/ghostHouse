export class GameManager {
    constructor() {
        this.scaresCount = 0;
        this.currentCombo = 0;
        this.highScore = localStorage.getItem('ghostHouseHighScore') || 0;
        this.comboResetTimer = 5; // seconds
        this.comboResetTTL = 0;

        this.stats = {
            scares: 0,
            combo: 0,
            highScore: this.highScore
        };
    }

    onGhostScared() {
        this.scaresCount++;

        // Combo system
        this.currentCombo++;
        this.comboResetTTL = this.comboResetTimer;

        // Update high score
        const currentScore = this.scaresCount;
        if (currentScore > this.highScore) {
            this.highScore = currentScore;
            localStorage.setItem('ghostHouseHighScore', this.highScore);
        }

        this.updateStats();
    }

    update(deltaTime) {
        if (this.comboResetTTL > 0) {
            this.comboResetTTL -= deltaTime;
        } else if (this.currentCombo > 0) {
            this.currentCombo = 0;
            this.updateStats();
        }
    }

    updateStats() {
        this.stats = {
            scares: this.scaresCount,
            combo: this.currentCombo,
            highScore: this.highScore
        };
    }

    getStats() {
        return {
            scaresCount: this.scaresCount,
            comboCount: this.currentCombo,
            highScore: this.highScore
        };
    }

    resetGame() {
        this.scaresCount = 0;
        this.currentCombo = 0;
        this.updateStats();
    }
}
