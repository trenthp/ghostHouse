import * as THREE from 'three';

// Ghost configuration constants
const GHOST_CONFIG = {
    // Movement speeds (m/s)
    HOVER_SPEED_MIN: 0.5,
    HOVER_SPEED_MAX: 1.0,
    CREEP_SPEED_MIN: 0.3,
    CREEP_SPEED_MAX: 0.5,
    FLEE_SPEED_MIN: 3.0,
    FLEE_SPEED_MAX: 4.0,

    // Animation
    BOB_AMOUNT: 0.3,
    BOB_SPEED: 1.5,
    ROTATION_SPEED_HOVER: 0.02,
    ROTATION_SPEED_CREEP: 0.04,
    ROTATION_SPEED_FLEE: 0.1,

    // Visual
    MAX_VIEW_DISTANCE: 50, // meters
    SPAWN_DURATION: 0.5, // seconds
    SCARE_DURATION: 0.5, // seconds
    CREEP_START_DELAY: 0.5, // seconds before ghost starts creeping when out of view

    // Distance effects
    MIN_SCALE: 0.3,
    MAX_SCALE: 1.0,
    MIN_OPACITY: 0.2,
    MAX_OPACITY: 1.0,

    // Mesh sizes
    BODY_RADIUS: 0.35,
    BODY_HEIGHT: 0.8,
    EYE_RADIUS: 0.07,
    MOUTH_RADIUS: 0.06,
    AURA_RADIUS: 0.45,

    // Eye positions
    EYE_LEFT_X: -0.1,
    EYE_RIGHT_X: 0.1,
    EYE_Y: 0.15,
    EYE_Z: 0.3,

    // Mouth position
    MOUTH_Y: -0.05,
    MOUTH_Z: 0.3,
    MOUTH_SCALE_X: 1.2,
    MOUTH_SCALE_Y: 0.8,

    // Camera view detection
    VIEW_CONE_THRESHOLD: 0.3, // ~70 degree cone
    CREEP_SAFETY_DISTANCE: 2, // meters - stop creeping when this close
    HOVER_RADIUS_MIN: 1,
    HOVER_RADIUS_MAX: 3
};

export class Ghost {
    constructor(position, id = 0) {
        this.id = id;
        this.mesh = this.createMesh();
        this.mesh.position.copy(position);
        this.position = position.clone();
        this.targetPosition = position.clone();
        this.hoverCenter = position.clone(); // Center point when hovering

        // Movement properties
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.hoverSpeed = GHOST_CONFIG.HOVER_SPEED_MIN + Math.random() * (GHOST_CONFIG.HOVER_SPEED_MAX - GHOST_CONFIG.HOVER_SPEED_MIN);
        this.creepSpeed = GHOST_CONFIG.CREEP_SPEED_MIN + Math.random() * (GHOST_CONFIG.CREEP_SPEED_MAX - GHOST_CONFIG.CREEP_SPEED_MIN);
        this.fleeSpeed = GHOST_CONFIG.FLEE_SPEED_MIN + Math.random() * (GHOST_CONFIG.FLEE_SPEED_MAX - GHOST_CONFIG.FLEE_SPEED_MIN);
        this.bobAmount = GHOST_CONFIG.BOB_AMOUNT;
        this.bobSpeed = GHOST_CONFIG.BOB_SPEED;
        this.bobTime = Math.random() * Math.PI * 2;

        // Behavior
        this.state = 'hovering'; // 'hovering', 'creeping', 'scared', 'fleeing'
        this.scared = false;
        this.scareTTL = 0;
        this.scareIntensity = 0;

        // Animation & Rotation
        this.rotation = 0;
        this.rotationSpeed = GHOST_CONFIG.ROTATION_SPEED_HOVER;
        this.targetRotation = 0; // Target rotation when facing camera
        this.facingCameraBlend = 0; // 0-1: blend between wandering and facing camera
        this.scale = 1;

        // Distance-based effects
        this.distanceToCamera = 0;
        this.maxViewDistance = GHOST_CONFIG.MAX_VIEW_DISTANCE;

        // Spawning effect
        this.spawnTime = 0;
        this.spawnDuration = GHOST_CONFIG.SPAWN_DURATION;
        this.isSpawning = true;

        // View direction tracking
        this.isInViewport = false;
        this.creepingAudioPlaying = false;
        this.outOfViewTimer = 0;
        this.creepStartDelay = GHOST_CONFIG.CREEP_START_DELAY;

        // Hover target selection - use timer instead of probability
        this.hoverTargetTimer = 0;
        this.hoverTargetInterval = 0.2; // seconds - select new target every 200ms
    }

    createMesh() {
        const group = new THREE.Group();
        const cfg = GHOST_CONFIG;

        // Ghost body - cone shape (like a sheet)
        const bodyGeometry = new THREE.ConeGeometry(cfg.BODY_RADIUS, cfg.BODY_HEIGHT, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xcccccc,
            emissiveIntensity: 0.2,
            roughness: 0.6,
            metalness: 0,
            transparent: true
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Create shared eye and mouth materials to reduce memory usage
        const featureMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0x000000,
            emissiveIntensity: 0.2,
            roughness: 0.8
        });

        // Ghost eyes - black circles
        const eyeGeometry = new THREE.SphereGeometry(cfg.EYE_RADIUS, 8, 8);

        const leftEye = new THREE.Mesh(eyeGeometry, featureMaterial);
        leftEye.position.set(cfg.EYE_LEFT_X, cfg.EYE_Y, cfg.EYE_Z);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, featureMaterial);
        rightEye.position.set(cfg.EYE_RIGHT_X, cfg.EYE_Y, cfg.EYE_Z);
        group.add(rightEye);

        // Ghost mouth - black oval
        const mouthGeometry = new THREE.SphereGeometry(cfg.MOUTH_RADIUS, 8, 8);
        const mouth = new THREE.Mesh(mouthGeometry, featureMaterial);
        mouth.position.set(0, cfg.MOUTH_Y, cfg.MOUTH_Z);
        mouth.scale.set(cfg.MOUTH_SCALE_X, cfg.MOUTH_SCALE_Y, 1);
        group.add(mouth);

        // Ghostly aura (subtle glow)
        const auraGeometry = new THREE.SphereGeometry(cfg.AURA_RADIUS, 8, 8);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.05,
            wireframe: false
        });
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        aura.name = 'aura';
        group.add(aura);

        // Store body for easy access
        group.userData.body = body;
        group.userData.eyes = [leftEye, rightEye];
        group.userData.mouth = mouth;
        group.userData.aura = aura;

        return group;
    }

    update(deltaTime, camera) {
        // Calculate distance to camera for visual effects
        this.distanceToCamera = this.position.distanceTo(camera.position);

        // Update spawning
        if (this.isSpawning) {
            this.spawnTime += deltaTime;
            if (this.spawnTime >= this.spawnDuration) {
                this.isSpawning = false;
                this.spawnTime = 0;
            } else {
                const spawnProgress = this.spawnTime / this.spawnDuration;
                this.scale = spawnProgress;
                this.mesh.scale.setScalar(spawnProgress);
            }
        }

        // Update scare state
        if (this.scared) {
            this.scareTTL -= deltaTime;
            this.scareIntensity = this.scareTTL / 0.5;

            if (this.scareTTL <= 0) {
                this.scared = false;
                this.state = 'hovering';
            }
        }

        // Check if ghost is being looked at by camera
        this.updateCameraViewTracking(camera);

        // Movement behavior
        if (this.state === 'hovering') {
            // Hover in small area when visible
            this.hoveringUpdate(deltaTime, camera);
        } else if (this.state === 'creeping') {
            // Slowly creep toward camera when out of view
            this.creepingUpdate(deltaTime, camera);
        } else if (this.state === 'fleeing') {
            this.fleeing(deltaTime, camera);
        }

        // Apply bobbing motion
        this.bobTime += deltaTime * this.bobSpeed;
        const bobOffset = Math.sin(this.bobTime) * this.bobAmount;
        this.mesh.position.copy(this.position);
        this.mesh.position.y += bobOffset;

        // Update rotation - blend between wandering and facing camera
        this.updateRotation(deltaTime);

        // Apply distance-based visual effects
        this.updateDistanceEffects();

        // Update scare visual effect
        if (this.scared) {
            this.mesh.userData.aura.material.opacity = 0.2 + 0.1 * Math.sin(deltaTime * 20);
            this.mesh.userData.eyes.forEach(eye => {
                eye.material.emissiveIntensity = 0.5;
            });
        } else {
            this.mesh.userData.eyes.forEach(eye => {
                eye.material.emissiveIntensity = 0.2;
            });
        }
    }

    updateDistanceEffects() {
        const cfg = GHOST_CONFIG;
        // Scale ghost based on distance (smaller when far away)
        const distanceRatio = this.distanceToCamera / this.maxViewDistance;
        const minScale = cfg.MIN_SCALE;
        const maxScale = cfg.MAX_SCALE;
        let scaleFactor = maxScale - (distanceRatio * (maxScale - minScale));

        // Apply spawn scale
        if (this.isSpawning) {
            scaleFactor *= this.scale;
        }

        this.mesh.scale.setScalar(scaleFactor);

        // Transparency based on distance (more transparent when far away)
        const minOpacity = cfg.MIN_OPACITY;
        const maxOpacity = cfg.MAX_OPACITY;
        const opacity = maxOpacity - (distanceRatio * (maxOpacity - minOpacity));

        const body = this.mesh.userData.body;
        if (body && body.material) {
            body.material.opacity = opacity;
        }

        // Adjust aura opacity
        const auraOpacity = opacity * 0.1;
        this.mesh.userData.aura.material.opacity = auraOpacity;
    }

    /**
     * Check if the ghost is visible in the camera's view
     * Uses a simple cone check based on camera forward direction
     */
    updateCameraViewTracking(camera) {
        const cfg = GHOST_CONFIG;
        // Get direction from camera to ghost
        const dirToGhost = this.position.clone().sub(camera.position);

        // Get camera forward direction
        const cameraForward = new THREE.Vector3(0, 0, -1);
        cameraForward.applyQuaternion(camera.quaternion);

        // Calculate angle between camera forward and ghost direction
        dirToGhost.normalize();
        const viewAngle = cameraForward.dot(dirToGhost);

        // Ghost is visible if angle is > threshold (roughly 70 degree cone in front)
        this.isInViewport = viewAngle > cfg.VIEW_CONE_THRESHOLD;

        if (this.isInViewport) {
            // Ghost is in viewport - stay hovering
            this.outOfViewTimer = 0;
            this.creepingAudioPlaying = false;

            // Blend towards facing camera when being watched
            this.facingCameraBlend = Math.min(this.facingCameraBlend + 0.1, 1.0);

            // Switch to hovering state when back in view
            if (this.state === 'creeping') {
                this.state = 'hovering';
            }
        } else {
            // Ghost is out of viewport
            this.outOfViewTimer += deltaTime; // Use delta-time (frame-rate independent)
            this.facingCameraBlend = Math.max(this.facingCameraBlend - 0.1, 0.0);

            // Switch to creeping after delay (frame-rate independent)
            if (this.outOfViewTimer >= this.creepStartDelay && this.state === 'hovering') {
                this.state = 'creeping';
            }
        }
    }

    /**
     * Update rotation to face the camera while blending with wander rotation
     */
    updateRotation(deltaTime) {
        // Calculate target rotation to face camera
        // We'll use a simple approach: rotate toward camera's direction

        // Increment wander rotation
        this.rotation += deltaTime * this.rotationSpeed;

        // Apply blend between wander rotation and facing camera
        let finalRotation = this.rotation;
        if (this.facingCameraBlend > 0) {
            // Smoothly blend toward target rotation
            const rotationBlend = this.rotation * (1 - this.facingCameraBlend) + this.targetRotation * this.facingCameraBlend;
            finalRotation = rotationBlend;
        }

        this.mesh.rotation.y = finalRotation;
    }

    /**
     * Hover in a small area around the spawn point when visible
     * Ghost gently floats back and forth in a confined space
     */
    hoveringUpdate(deltaTime, camera) {
        const cfg = GHOST_CONFIG;

        // Pick a new small hover target on timer (frame-rate independent)
        this.hoverTargetTimer += deltaTime;
        if (this.hoverTargetTimer >= this.hoverTargetInterval) {
            this.hoverTargetTimer = 0;
            const angle = Math.random() * Math.PI * 2;
            const distance = cfg.HOVER_RADIUS_MIN + Math.random() * (cfg.HOVER_RADIUS_MAX - cfg.HOVER_RADIUS_MIN);
            this.targetPosition.x = this.hoverCenter.x + Math.cos(angle) * distance;
            this.targetPosition.z = this.hoverCenter.z + Math.sin(angle) * distance;
            this.targetPosition.y = this.hoverCenter.y + (Math.random() - 0.5) * 1; // Small vertical movement
        }

        // Move slowly towards target
        const direction = this.targetPosition.clone().sub(this.position);
        if (direction.length() > 0.2) {
            direction.normalize();
            this.position.add(direction.multiplyScalar(deltaTime * this.hoverSpeed));
        }

        // Gentle rotation while hovering
        this.rotationSpeed = cfg.ROTATION_SPEED_HOVER;
    }

    /**
     * Creep slowly toward the camera when out of view
     * Ghost moves deliberately and ominously, with eerie sound
     */
    creepingUpdate(deltaTime, camera) {
        const cfg = GHOST_CONFIG;
        // Move slowly and deliberately toward camera
        const direction = camera.position.clone().sub(this.position);
        const distance = direction.length();

        // Stop creeping when very close to camera (safety distance)
        if (distance > cfg.CREEP_SAFETY_DISTANCE) {
            direction.normalize();
            this.position.add(direction.multiplyScalar(deltaTime * this.creepSpeed));

            // Slightly increase rotation speed when creeping for unsettling effect
            this.rotationSpeed = cfg.ROTATION_SPEED_CREEP;
        } else {
            // Very close - return to hovering state
            this.state = 'hovering';
            this.outOfViewTimer = 0;
            this.creepingAudioPlaying = false;
        }
    }

    fleeing(deltaTime, camera) {
        const cfg = GHOST_CONFIG;
        // Run away from camera position
        const direction = this.position.clone().sub(camera.position);
        direction.normalize();
        this.position.add(direction.multiplyScalar(deltaTime * this.fleeSpeed));

        // Rotate away frantically
        this.rotationSpeed = cfg.ROTATION_SPEED_FLEE;
    }

    scare() {
        this.scared = true;
        this.scareTTL = GHOST_CONFIG.SCARE_DURATION;
        this.state = 'fleeing';
    }

    getMesh() {
        return this.mesh;
    }

    getPosition() {
        return this.position.clone();
    }

    setPosition(position) {
        this.position.copy(position);
    }

    isScared() {
        return this.scared;
    }

    /**
     * Check if ghost is currently creeping toward the camera
     */
    isCreeping() {
        return this.state === 'creeping';
    }

    /**
     * Get the direction from camera to this ghost (for HUD indicator)
     */
    getDirectionToGhost(camera) {
        return this.position.clone().sub(camera.position);
    }

    remove() {
        this.mesh.parent?.remove(this.mesh);
    }
}
