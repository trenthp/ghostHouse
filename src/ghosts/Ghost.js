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

        // Facing behavior
        this.facingTimer = 0;
        this.shouldFaceUser = Math.random() < GHOST_CONFIG.FACE_USER_PROBABILITY;
        this.randomLookTarget = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 10
        );
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

        // Update facing direction behavior
        this.facingTimer += deltaTime;
        if (this.facingTimer >= GHOST_CONFIG.FACE_CHANGE_INTERVAL) {
            this.facingTimer = 0;
            // Randomly decide whether to face user or look elsewhere
            this.shouldFaceUser = Math.random() < GHOST_CONFIG.FACE_USER_PROBABILITY;
            // If looking elsewhere, pick a new random target
            if (!this.shouldFaceUser) {
                this.randomLookTarget.set(
                    this.position.x + (Math.random() - 0.5) * 8,
                    this.position.y + (Math.random() - 0.5) * 4,
                    this.position.z + (Math.random() - 0.5) * 8
                );
            }
        }

        // Face the camera or a random direction based on behavior
        if (this.shouldFaceUser) {
            this.mesh.lookAt(camera.position);
        } else {
            this.mesh.lookAt(this.randomLookTarget);
        }

        // Scare behavior
        if (this.scared) {
            this.scareTTL -= deltaTime;

            // Reduce opacity while scared, but apply proximity opacity as multiplier
            this.setOpacity(0.35 * this.proximityOpacity);

            if (this.scareTTL <= 0) {
                this.scared = false;

                if (this.scareCount >= 2) {
                    // On second scare, fade out completely
                    this.isFading = true;
                    this.scareTTL = this.fadeDuration;
                } else {
                    // Reset opacity after first scare (apply proximity opacity)
                    this.setOpacity(this.proximityOpacity);
                }
            }
        }

        // Handle fade-out
        if (this.isFading) {
            this.scareTTL -= deltaTime;
            const fadeProgress = 1 - (this.scareTTL / this.fadeDuration);
            const fadeOpacity = Math.max(0, 1 - fadeProgress);
            this.setOpacity(fadeOpacity * this.proximityOpacity);

            if (this.scareTTL <= 0) {
                this.remove();
            }
        }

        // Apply proximity opacity during normal state
        if (!this.scared && !this.isFading) {
            this.setOpacity(this.proximityOpacity);
        }

        // Distance-based scaling (reuse distToCamera calculated above)
        const maxDist = 50;
        this.scale = Math.max(0.3, 1 - (distToCamera / maxDist) * 0.7);
        this.mesh.scale.setScalar(this.scale);
    }

    scare() {
        if (!this.scared && !this.isFading && this.scareCount < 2) {
            this.scared = true;
            this.scareCount++;
            this.scareTTL = this.scaredDuration; // Scared for 4 seconds
        }
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
