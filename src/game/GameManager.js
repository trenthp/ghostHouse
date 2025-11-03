// Game configuration constants
const GAME_CONFIG = {
    SCORE_PER_SCARE: 1, // points earned per ghost scare
};

export class GameManager {
    constructor() {
        this.scaresCount = 0;
    }

    onGhostScared() {
        this.scaresCount += GAME_CONFIG.SCORE_PER_SCARE;
    }

    update(deltaTime) {
        // Nothing to update
    }

    getStats() {
        return {
            scaresCount: this.scaresCount,
        };
    }

    resetGame() {
        this.scaresCount = 0;
    }
}
