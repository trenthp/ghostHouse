import * as THREE from 'three';
import { Ghost } from './Ghost.js';

export class GhostManager {
    constructor(scene, gameManager, audioManager) {
        this.scene = scene;
        this.gameManager = gameManager;
        this.audioManager = audioManager;

        this.ghosts = [];
        this.isActive = false;
        this.maxGhosts = 8; // Reduced from 15 for better performance and cleaner experience
        this.spawnRate = 2; // seconds between spawns
        this.spawnTimer = 0;

        // Spawn area - relative to target location
        this.spawnRadius = 20; // 20 meters radius
        this.minSpawnDistance = 8; // Minimum 8 meters from camera (safe distance)
        this.maxSpawnDistance = 20; // Maximum 20 meters from camera
        this.spawnHeight = 0.5;

        // Target location for spawning
        this.targetLocationPosition = new THREE.Vector3(0, 0, 0); // Will be set dynamically
        this.cameraPosition = new THREE.Vector3(0, 0, 0); // Updated each frame
    }

    setTargetLocation(targetPosition) {
        this.targetLocationPosition.copy(targetPosition);
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

            // Remove ghosts that are too far away from the target location (50 meter visibility radius)
            const distToTargetLocation = ghost.getPosition().distanceTo(this.targetLocationPosition);
            if (distToTargetLocation > 50) {
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
        let position = null;
        let attempts = 0;
        const maxAttempts = 10;

        // Try to find a safe spawn position
        while (attempts < maxAttempts) {
            const angle = Math.random() * Math.PI * 2;
            const distance = this.minSpawnDistance + Math.random() * (this.maxSpawnDistance - this.minSpawnDistance);
            const height = this.spawnHeight + Math.random() * 3;

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
            const height = this.spawnHeight + Math.random() * 3;
            position = new THREE.Vector3(
                this.targetLocationPosition.x + Math.cos(angle) * distance,
                height,
                this.targetLocationPosition.z + Math.sin(angle) * distance
            );
        }

        const ghost = new Ghost(position, this.ghosts.length);
        this.scene.add(ghost.getMesh());
        this.ghosts.push(ghost);

        // Play spawn sound
        this.audioManager?.playSound('spawn');
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
