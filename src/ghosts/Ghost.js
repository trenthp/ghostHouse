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
        this.scareTTL = 0;
        this.hoverRadius = 1 + Math.random() * 2;

        // Animation
        this.scale = 1;
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
            fog: true
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0;
        group.add(body);

        // Left eye
        const eyeGeometry = new THREE.SphereGeometry(GHOST_CONFIG.EYE_RADIUS, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
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
        // Bobbing motion
        this.bobTime += this.bobSpeed * deltaTime;
        const bobOffset = Math.sin(this.bobTime) * this.bobAmount;

        // Hover around center point
        const hoverX = Math.cos(this.bobTime * 0.5) * this.hoverRadius;
        const hoverZ = Math.sin(this.bobTime * 0.3) * this.hoverRadius;

        this.position.copy(this.hoverCenter);
        this.position.x += hoverX;
        this.position.y += bobOffset;
        this.position.z += hoverZ;

        this.mesh.position.copy(this.position);

        // Face the camera - rotate the ghost to look at the camera
        this.mesh.lookAt(camera.position);

        // Scare behavior
        if (this.scared) {
            this.scareTTL -= deltaTime;
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
        if (!this.scared) {
            this.scared = true;
            this.scareTTL = 0.5; // Remove after 0.5 seconds
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
