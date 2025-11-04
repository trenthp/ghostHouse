import { APP_CONFIG } from '../config/AppConfig.js';

const GAME_CONFIG = APP_CONFIG.game;

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
