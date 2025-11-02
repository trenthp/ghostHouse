// Game configuration constants
const GAME_CONFIG = {
    COMBO_RESET_TIMEOUT: 5, // seconds before combo resets
    SCORE_PER_SCARE: 1, // points earned per ghost scare
    LOCALSTORAGE_KEY: 'ghostHouseHighScore', // localStorage key for high score
};

export class GameManager {
    constructor() {
        this.scaresCount = 0;
        this.currentCombo = 0;
        this.highScore = this._loadHighScore();
        this.comboResetTimer = GAME_CONFIG.COMBO_RESET_TIMEOUT;
        this.comboResetTTL = 0;

        this.stats = {
            scares: 0,
            combo: 0,
            highScore: this.highScore
        };
    }

    _loadHighScore() {
        try {
            const stored = localStorage.getItem(GAME_CONFIG.LOCALSTORAGE_KEY);
            return stored ? parseInt(stored, 10) : 0;
        } catch (e) {
            console.warn('Could not load high score from localStorage:', e.message);
            return 0;
        }
    }

    _saveHighScore() {
        try {
            localStorage.setItem(GAME_CONFIG.LOCALSTORAGE_KEY, this.highScore);
        } catch (e) {
            console.warn('Could not save high score to localStorage:', e.message);
        }
    }

    onGhostScared() {
        this.scaresCount += GAME_CONFIG.SCORE_PER_SCARE;

        // Combo system
        this.currentCombo++;
        this.comboResetTTL = this.comboResetTimer;

        // Update high score
        const currentScore = this.scaresCount;
        if (currentScore > this.highScore) {
            this.highScore = currentScore;
            this._saveHighScore();
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
