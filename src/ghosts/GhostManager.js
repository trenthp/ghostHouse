import * as THREE from 'three';
import { Ghost } from './Ghost.js';
import { APP_CONFIG } from '../config/AppConfig.js';

const GHOST_MANAGER_CONFIG = APP_CONFIG.ghostManager;

export class GhostManager {
    constructor(scene, gameManager) {
        this.scene = scene;
        this.gameManager = gameManager;

        this.ghosts = [];
        this.isActive = false;
        this.maxGhosts = GHOST_MANAGER_CONFIG.MAX_GHOSTS;
        this.spawnRate = GHOST_MANAGER_CONFIG.SPAWN_RATE;
        this.spawnTimer = 0;

        // Spawn area - relative to target location
        this.spawnRadius = GHOST_MANAGER_CONFIG.SPAWN_RADIUS;
        this.minSpawnDistance = GHOST_MANAGER_CONFIG.MIN_SPAWN_DISTANCE;
        this.maxSpawnDistance = GHOST_MANAGER_CONFIG.MAX_SPAWN_DISTANCE;
        this.minSpawnDistanceFromCamera = GHOST_MANAGER_CONFIG.MIN_SPAWN_DISTANCE_FROM_CAMERA;
        this.spawnHeight = GHOST_MANAGER_CONFIG.SPAWN_HEIGHT_BASE;

        // Target location for spawning
        this.targetLocationPosition = new THREE.Vector3(0, 0, 0); // Will be set dynamically
        this.cameraPosition = new THREE.Vector3(0, 0, 0); // Updated each frame

        // Game completion tracking
        this.ghostsSpawned = 0;
        this.gameComplete = false;
        this.onGameCompleteCallback = null;
    }

    setTargetLocation(targetPosition) {
        this.targetLocationPosition.copy(targetPosition);
    }

    activate() {
        if (this.isActive) return;
        this.isActive = true;
        this.spawnTimer = 0;
        this.ghosts = [];
        this.ghostsSpawned = 0;
        this.gameComplete = false;
    }

    deactivate() {
        this.isActive = false;
        this.ghosts.forEach(ghost => ghost.remove());
        this.ghosts = [];
    }

    update(deltaTime, camera) {
        if (!this.isActive) return;

        // Update camera position for spawn distance checking
        this.cameraPosition.copy(camera.position);

        // Spawn new ghosts
        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0 && this.ghostsSpawned < this.maxGhosts && this.ghosts.length < this.maxGhosts) {
            this.spawnGhost(camera);
            this.spawnTimer = this.spawnRate;
        }

        // Update all ghosts
        for (let i = this.ghosts.length - 1; i >= 0; i--) {
            const ghost = this.ghosts[i];
            ghost.update(deltaTime, camera);

            // Remove ghosts that are too far away from the target location
            const distToTargetLocation = ghost.getPosition().distanceTo(this.targetLocationPosition);
            if (distToTargetLocation > GHOST_MANAGER_CONFIG.VISIBILITY_RADIUS) {
                ghost.remove();
                this.ghosts.splice(i, 1);
            }
        }

        // Check if game is complete (all ghosts spawned and all removed)
        if (!this.gameComplete && this.ghostsSpawned >= this.maxGhosts && this.ghosts.length === 0) {
            this.gameComplete = true;
            if (this.onGameCompleteCallback) {
                this.onGameCompleteCallback();
            }
        }
    }

    /**
     * Generate a random spawn position around the target location
     * @returns {THREE.Vector3} - A random position within spawn radius
     */
    generateSpawnPosition() {
        const cfg = GHOST_MANAGER_CONFIG;
        const angle = Math.random() * Math.PI * 2;
        const distance = this.minSpawnDistance + Math.random() * (this.maxSpawnDistance - this.minSpawnDistance);
        const height = this.spawnHeight + Math.random() * cfg.SPAWN_HEIGHT_VARIANCE;

        return new THREE.Vector3(
            this.targetLocationPosition.x + Math.cos(angle) * distance,
            height,
            this.targetLocationPosition.z + Math.sin(angle) * distance
        );
    }

    /**
     * Spawn a ghost at a safe distance from the camera
     * Ghosts spawn between minSpawnDistance and maxSpawnDistance from the target location
     * and at least minSpawnDistanceFromCamera away from the user
     */
    spawnGhost(camera) {
        const cfg = GHOST_MANAGER_CONFIG;
        let position = null;
        let attempts = 0;

        // Try to find a safe spawn position
        while (attempts < cfg.SPAWN_POSITION_ATTEMPTS) {
            position = this.generateSpawnPosition();

            // Check distance from camera - ensure safe minimum distance from user
            const distFromCamera = position.distanceTo(camera.position);
            if (distFromCamera >= this.minSpawnDistanceFromCamera) {
                // Valid spawn position found
                break;
            }

            attempts++;
        }

        // If no valid position found after max attempts, use a generated position anyway
        if (position === null) {
            position = this.generateSpawnPosition();
        }

        const ghost = new Ghost(position, this.ghosts.length);
        this.scene.add(ghost.getMesh());
        this.ghosts.push(ghost);
        this.ghostsSpawned++;
    }

    getGhostByMesh(mesh) {
        for (const ghost of this.ghosts) {
            if (ghost.getMesh() === mesh || ghost.getMesh().children.includes(mesh)) {
                return ghost;
            }
        }
        return null;
    }

    getGhostMeshes() {
        return this.ghosts.map(g => g.getMesh());
    }

    getGhostCount() {
        return this.ghosts.length;
    }

    getScaredGhosts() {
        return this.ghosts.filter(g => g.isScared()).length;
    }

    setOnGameCompleteCallback(callback) {
        this.onGameCompleteCallback = callback;
    }
}
