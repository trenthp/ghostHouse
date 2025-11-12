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
        this.scaredDuration = 4; // How long ghost stays scared (4 seconds)
        this.hoverRadius = 1 + Math.random() * 2;

        // Shake animation (when scared)
        this.shakeIntensity = 0.15; // How much to shake when scared
        this.shakeBasePosition = position.clone();

        // Animation
        this.scale = 1;
        this.baseOpacity = 1;
        this.isFading = false;
        this.fadeDuration = 0.5; // How long fade-out takes
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

        this.mesh.position.copy(this.position);

        // Face the camera - rotate the ghost to look at the camera
        this.mesh.lookAt(camera.position);

        // Scare behavior
        if (this.scared) {
            this.scareTTL -= deltaTime;

            // Flash opacity while scared (flashing effect)
            const flashSpeed = 4; // Flash frequency
            const flashAmount = Math.sin(this.scareTTL * flashSpeed * Math.PI) * 0.3;
            const opacity = Math.max(0.2, 1 - Math.abs(flashAmount));
            this.setOpacity(opacity);

            if (this.scareTTL <= 0) {
                this.scared = false;

                if (this.scareCount >= 2) {
                    // On second scare, fade out completely
                    this.isFading = true;
                    this.scareTTL = this.fadeDuration;
                } else {
                    // Reset opacity after first scare
                    this.setOpacity(1);
                }
            }
        }

        // Handle fade-out
        if (this.isFading) {
            this.scareTTL -= deltaTime;
            const fadeProgress = 1 - (this.scareTTL / this.fadeDuration);
            const fadeOpacity = Math.max(0, 1 - fadeProgress);
            this.setOpacity(fadeOpacity);

            if (this.scareTTL <= 0) {
                this.remove();
            }
        }

        // Distance-based scaling
        const distToCamera = this.position.distanceTo(camera.position);
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
