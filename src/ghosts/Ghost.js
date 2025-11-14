import * as THREE from 'three';
import { APP_CONFIG } from '../config/AppConfig.js';

const GHOST_CONFIG = APP_CONFIG.ghost;

export class Ghost {
    constructor(position, id = 0) {
        this.id = id;
        this.mesh = this.createMesh();
        this.mesh.position.copy(position);
        this.position = position.clone();
        this.hoverCenter = position.clone();

        // Movement
        this.hoverSpeed = GHOST_CONFIG.HOVER_SPEED_MIN + Math.random() * (GHOST_CONFIG.HOVER_SPEED_MAX - GHOST_CONFIG.HOVER_SPEED_MIN);
        this.bobAmount = GHOST_CONFIG.BOB_AMOUNT;
        this.bobSpeed = GHOST_CONFIG.BOB_SPEED;
        this.bobTime = Math.random() * Math.PI * 2;

        // Behavior
        this.scared = false;
        this.scareCount = 0; // 0 = not scared yet, 1 = scared once, 2 = scared twice (should fade)
        this.scareTTL = 0; // Time left in scared state
        this.scaredDuration = 2; // How long ghost stays scared (2 seconds)
        this.hoverRadius = GHOST_CONFIG.HOVER_RADIUS_MIN + Math.random() * (GHOST_CONFIG.HOVER_RADIUS_MAX - GHOST_CONFIG.HOVER_RADIUS_MIN);

        // Shake animation (when scared)
        this.shakeIntensity = 0.15; // How much to shake when scared
        this.shakeBasePosition = position.clone();

        // Animation
        this.scale = 1;
        this.baseOpacity = 1;
        this.isFading = false;
        this.fadeDuration = 0.5; // How long fade-out takes
        this.proximityOpacity = 1.0; // Opacity based on distance to camera

        // Spawn area for repositioning
        this.spawnAreaCenter = position.clone();
        this.spawnRadius = GHOST_CONFIG.SPAWN_RADIUS;

        // Fade in/out visibility behavior
        this.isInvisible = false;
        this.visibleDuration = GHOST_CONFIG.VISIBLE_DURATION_MIN + Math.random() * (GHOST_CONFIG.VISIBLE_DURATION_MAX - GHOST_CONFIG.VISIBLE_DURATION_MIN);
        this.invisibleDuration = GHOST_CONFIG.INVISIBLE_DURATION_MIN + Math.random() * (GHOST_CONFIG.INVISIBLE_DURATION_MAX - GHOST_CONFIG.INVISIBLE_DURATION_MIN);
        this.visibilityTimer = 0;
        this.visibilityOpacity = 1.0; // Opacity for fade in/out effect
        this.isAtMaxOpacity = false; // Track if ghost is at max opacity for scoring
        this.hasBeenScoredThisScare = false; // Prevent multiple scores for one scare
    }

    createMesh() {
        const group = new THREE.Group();

        // Body - cone shape
        const bodyGeometry = new THREE.ConeGeometry(GHOST_CONFIG.BODY_RADIUS, GHOST_CONFIG.BODY_HEIGHT, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x6699ff,
            emissiveIntensity: 0.3,
            metalness: 0.2,
            roughness: 0.8,
            fog: true,
            transparent: true,
            opacity: 1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0;
        group.add(body);

        // Left eye
        const eyeGeometry = new THREE.SphereGeometry(GHOST_CONFIG.EYE_RADIUS, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 1
        });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1, 0.15, GHOST_CONFIG.BODY_RADIUS + 0.05);
        group.add(leftEye);

        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1, 0.15, GHOST_CONFIG.BODY_RADIUS + 0.05);
        group.add(rightEye);

        // Mouth
        const mouthGeometry = new THREE.SphereGeometry(GHOST_CONFIG.MOUTH_RADIUS, 8, 8);
        const mouth = new THREE.Mesh(mouthGeometry, eyeMaterial);
        mouth.position.set(0, -0.05, GHOST_CONFIG.BODY_RADIUS + 0.05);
        mouth.scale.set(1.2, 0.8, 1);
        group.add(mouth);

        // Aura - glowing outline
        const auraGeometry = new THREE.IcosahedronGeometry(GHOST_CONFIG.AURA_RADIUS, 3);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: 0x6699ff,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        group.add(aura);

        return group;
    }

    update(deltaTime, camera) {
        // Bobbing motion (only when not scared)
        if (!this.scared && !this.isFading) {
            this.bobTime += this.bobSpeed * deltaTime;
        }
        const bobOffset = !this.scared && !this.isFading ? Math.sin(this.bobTime) * this.bobAmount : 0;

        // Hover around center point (only when not scared)
        let hoverX = 0;
        let hoverZ = 0;
        if (!this.scared && !this.isFading) {
            // Apply speed multiplier if previously scared (slightly faster)
            const speedMultiplier = this.scareCount > 0 ? 1.15 : 1.0;
            hoverX = Math.cos(this.bobTime * 0.5 * speedMultiplier) * this.hoverRadius;
            hoverZ = Math.sin(this.bobTime * 0.3 * speedMultiplier) * this.hoverRadius;
        }

        this.position.copy(this.hoverCenter);
        this.position.x += hoverX;
        this.position.y += bobOffset;
        this.position.z += hoverZ;

        // Add shake when scared
        if (this.scared) {
            this.position.x += (Math.random() - 0.5) * this.shakeIntensity;
            this.position.y += (Math.random() - 0.5) * this.shakeIntensity;
            this.position.z += (Math.random() - 0.5) * this.shakeIntensity;
        }

        // Calculate opacity based on proximity to camera (fade when user gets too close)
        const distToCamera = this.position.distanceTo(camera.position);
        const fadeStartDistance = 1.0; // Full opacity at 1m
        const fadeEndDistance = 0.5; // Invisible at 0.5m
        const fadeRange = fadeStartDistance - fadeEndDistance;
        this.proximityOpacity = Math.max(0, Math.min(1, (distToCamera - fadeEndDistance) / fadeRange));

        this.mesh.position.copy(this.position);

        // Always face the camera
        this.mesh.lookAt(camera.position);

        // Handle visibility fade in/out behavior
        this.visibilityTimer += deltaTime;
        const targetDuration = this.isInvisible ? this.invisibleDuration : this.visibleDuration;

        if (this.visibilityTimer >= targetDuration) {
            this.visibilityTimer = 0;

            if (this.isInvisible) {
                // Transitioning from invisible to visible
                this.isInvisible = false;
                this.visibleDuration = GHOST_CONFIG.VISIBLE_DURATION_MIN + Math.random() * (GHOST_CONFIG.VISIBLE_DURATION_MAX - GHOST_CONFIG.VISIBLE_DURATION_MIN);
                // Reposition to a new location in the spawn area
                this.repositionInSpawnArea();
            } else {
                // Transitioning from visible to invisible
                this.isInvisible = true;
                this.invisibleDuration = GHOST_CONFIG.INVISIBLE_DURATION_MIN + Math.random() * (GHOST_CONFIG.INVISIBLE_DURATION_MAX - GHOST_CONFIG.INVISIBLE_DURATION_MIN);
            }
        }

        // Update visibility opacity based on fade state
        if (this.isInvisible) {
            // Fade out when transitioning to invisible
            const fadeProgress = this.visibilityTimer / 0.5; // 0.5 second fade
            this.visibilityOpacity = Math.max(0, 1 - fadeProgress) * GHOST_CONFIG.MAX_OPACITY;
            this.isAtMaxOpacity = false;
        } else {
            // Fade in when transitioning to visible
            const fadeProgress = this.visibilityTimer / 0.5; // 0.5 second fade
            this.visibilityOpacity = Math.min(1, fadeProgress) * GHOST_CONFIG.MAX_OPACITY;
            // Only at max opacity after fade-in is complete (fadeProgress >= 1)
            this.isAtMaxOpacity = fadeProgress >= 1.0;
        }

        // Scare behavior
        if (this.scared) {
            this.scareTTL -= deltaTime;

            // Reduce opacity while scared, apply both proximity and visibility opacity
            this.setOpacity(0.35 * this.proximityOpacity * this.visibilityOpacity);

            if (this.scareTTL <= 0) {
                this.scared = false;

                if (this.scareCount >= 2) {
                    // On second scare, fade out completely
                    this.isFading = true;
                    this.scareTTL = this.fadeDuration;
                } else {
                    // Reset opacity after first scare (apply proximity and visibility opacity)
                    this.setOpacity(this.proximityOpacity * this.visibilityOpacity);
                }
            }
        }

        // Handle fade-out
        if (this.isFading) {
            this.scareTTL -= deltaTime;
            const fadeProgress = 1 - (this.scareTTL / this.fadeDuration);
            const fadeOpacity = Math.max(0, 1 - fadeProgress);
            this.setOpacity(fadeOpacity * this.proximityOpacity * this.visibilityOpacity);

            if (this.scareTTL <= 0) {
                this.remove();
            }
        }

        // Apply proximity and visibility opacity during normal state
        if (!this.scared && !this.isFading) {
            this.setOpacity(this.proximityOpacity * this.visibilityOpacity);
        }

        // Distance-based scaling (reuse distToCamera calculated above)
        const maxDist = 50;
        this.scale = Math.max(0.3, 1 - (distToCamera / maxDist) * 0.7);
        this.mesh.scale.setScalar(this.scale);
    }

    repositionInSpawnArea() {
        // Pick a random location within the spawn radius
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.spawnRadius;
        const height = this.spawnAreaCenter.y + (Math.random() - 0.5) * 0.3; // Small vertical variance

        const newPosition = new THREE.Vector3(
            this.spawnAreaCenter.x + Math.cos(angle) * distance,
            height,
            this.spawnAreaCenter.z + Math.sin(angle) * distance
        );

        // Update hover center to the new position
        this.hoverCenter.copy(newPosition);
        this.position.copy(newPosition);
    }

    scare() {
        if (!this.scared && !this.isFading && this.scareCount < 2) {
            this.scared = true;
            this.scareCount++;
            this.scareTTL = this.scaredDuration; // Scared for 4 seconds
            this.hasBeenScoredThisScare = false; // Reset scoring flag for this scare
        }
    }

    canBeScored() {
        // Can only score if ghost is at max opacity and hasn't been scored yet for this scare
        return this.isAtMaxOpacity && this.scareCount > 0 && !this.hasBeenScoredThisScare;
    }

    markScored() {
        this.hasBeenScoredThisScare = true;
    }

    setOpacity(opacity) {
        // Set opacity for all materials in the mesh
        if (this.mesh) {
            this.mesh.traverse((child) => {
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.opacity = opacity;
                        });
                    } else {
                        child.material.opacity = opacity;
                    }
                }
            });
        }
    }

    remove() {
        this.mesh.parent?.remove(this.mesh);
    }

    getMesh() {
        return this.mesh;
    }

    getPosition() {
        return this.position.clone();
    }

    isScared() {
        return this.scared;
    }
}
