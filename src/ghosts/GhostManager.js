import * as THREE from 'three';
import { Ghost } from './Ghost.js';

// Ghost Manager configuration constants
const GHOST_MANAGER_CONFIG = {
    // Spawning
    MAX_GHOSTS: 8, // Maximum concurrent ghosts (reduced from 15 for performance)
    SPAWN_RATE: 2, // seconds between ghost spawns
    SPAWN_HEIGHT_BASE: 0.8, // base height for ghost spawning (eye level - camera is at 1.6m)
    SPAWN_HEIGHT_VARIANCE: 0.6, // small variance around eye level

    // Spawn distance
    SPAWN_RADIUS: 20, // 20 meters radius
    MIN_SPAWN_DISTANCE: 8, // Minimum 8 meters from camera (safety distance)
    MAX_SPAWN_DISTANCE: 20, // Maximum 20 meters from camera
    SPAWN_POSITION_ATTEMPTS: 10, // Max attempts to find valid spawn position

    // Visibility
    VISIBILITY_RADIUS: 50, // meters - remove ghosts beyond this distance from target
};

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
        this.spawnHeight = GHOST_MANAGER_CONFIG.SPAWN_HEIGHT_BASE;

        // Target location for spawning
        this.targetLocationPosition = new THREE.Vector3(0, 0, 0); // Will be set dynamically
        this.cameraPosition = new THREE.Vector3(0, 0, 0); // Updated each frame
    }

    setTargetLocation(targetPosition) {
        this.targetLocationPosition.copy(targetPosition);
    }

    setCustomLocation(lat, lng) {
        // For custom locations, place ghosts at a fixed distance from camera
        // This allows the experience to work anywhere
        this.targetLocationPosition.set(0, 0, -15); // 15 meters in front of camera
        this.activate(); // Automatically activate when custom location is set
    }

    activate() {
        if (this.isActive) return;
        this.isActive = true;
        this.spawnTimer = 0;
        this.ghosts = [];
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
        if (this.spawnTimer <= 0 && this.ghosts.length < this.maxGhosts) {
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
    }

    /**
     * Spawn a ghost at a safe distance from the camera
     * Ghosts spawn between minSpawnDistance and maxSpawnDistance from the user
     */
    spawnGhost(camera) {
        const cfg = GHOST_MANAGER_CONFIG;
        let position = null;
        let attempts = 0;

        // Try to find a safe spawn position
        while (attempts < cfg.SPAWN_POSITION_ATTEMPTS) {
            const angle = Math.random() * Math.PI * 2;
            const distance = this.minSpawnDistance + Math.random() * (this.maxSpawnDistance - this.minSpawnDistance);
            const height = this.spawnHeight + Math.random() * cfg.SPAWN_HEIGHT_VARIANCE;

            position = new THREE.Vector3(
                this.targetLocationPosition.x + Math.cos(angle) * distance,
                height,
                this.targetLocationPosition.z + Math.sin(angle) * distance
            );

            // Check distance from camera - ensure safe minimum distance
            const distFromCamera = position.distanceTo(camera.position);
            if (distFromCamera >= this.minSpawnDistance) {
                // Valid spawn position found
                break;
            }

            attempts++;
        }

        // If no valid position found after max attempts, use the last generated one anyway
        if (position === null) {
            const angle = Math.random() * Math.PI * 2;
            const distance = this.minSpawnDistance + Math.random() * (this.maxSpawnDistance - this.minSpawnDistance);
            const height = this.spawnHeight + Math.random() * cfg.SPAWN_HEIGHT_VARIANCE;
            position = new THREE.Vector3(
                this.targetLocationPosition.x + Math.cos(angle) * distance,
                height,
                this.targetLocationPosition.z + Math.sin(angle) * distance
            );
        }

        const ghost = new Ghost(position, this.ghosts.length);
        this.scene.add(ghost.getMesh());
        this.ghosts.push(ghost);
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
}
