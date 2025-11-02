import * as THREE from 'three';

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
        this.hoverSpeed = 0.5 + Math.random() * 0.5; // 0.5-1.0 m/s hovering in small area
        this.creepSpeed = 0.3 + Math.random() * 0.2; // 0.3-0.5 m/s when creeping toward user
        this.bobAmount = 0.3;
        this.bobSpeed = 1.5;
        this.bobTime = Math.random() * Math.PI * 2;

        // Behavior
        this.state = 'hovering'; // 'hovering', 'creeping', 'scared', 'fleeing'
        this.scared = false;
        this.scareTTL = 0;
        this.scareIntensity = 0;

        // Animation & Rotation
        this.rotation = 0;
        this.rotationSpeed = 0.02;
        this.targetRotation = 0; // Target rotation when facing camera
        this.facingCameraBlend = 0; // 0-1: blend between wandering and facing camera
        this.scale = 1;

        // Distance-based effects
        this.distanceToCamera = 0;
        this.maxViewDistance = 50; // Maximum distance to see ghost

        // Spawning effect
        this.spawnTime = 0;
        this.spawnDuration = 0.5;
        this.isSpawning = true;

        // View direction tracking
        this.isInViewport = false;
        this.creepingAudioPlaying = false;
        this.outOfViewTimer = 0;
        this.creepStartDelay = 0.5; // Delay before starting to creep (0.5 seconds)
    }

    createMesh() {
        const group = new THREE.Group();

        // Ghost body - cone shape (like a sheet)
        const bodyGeometry = new THREE.ConeGeometry(0.35, 0.8, 16);
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

        // Ghost eyes - black circles
        const eyeGeometry = new THREE.SphereGeometry(0.07, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0x000000,
            emissiveIntensity: 0.2,
            roughness: 0.8
        });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1, 0.15, 0.3);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1, 0.15, 0.3);
        group.add(rightEye);

        // Ghost mouth - black oval
        const mouthGeometry = new THREE.SphereGeometry(0.06, 8, 8);
        const mouthMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0x000000,
            emissiveIntensity: 0.1,
            roughness: 0.8
        });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, -0.05, 0.3);
        mouth.scale.set(1.2, 0.8, 1);
        group.add(mouth);

        // Ghostly aura (subtle glow)
        const auraGeometry = new THREE.SphereGeometry(0.45, 8, 8);
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
                this.state = 'flying';
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
        // Scale ghost based on distance (smaller when far away)
        const distanceRatio = this.distanceToCamera / this.maxViewDistance;
        const minScale = 0.3; // Smallest scale at max distance
        const maxScale = 1.0; // Full scale when close
        let scaleFactor = maxScale - (distanceRatio * (maxScale - minScale));

        // Apply spawn scale
        if (this.isSpawning) {
            scaleFactor *= this.scale;
        }

        this.mesh.scale.setScalar(scaleFactor);

        // Transparency based on distance (more transparent when far away)
        const minOpacity = 0.2; // Minimum opacity at max distance
        const maxOpacity = 1.0; // Full opacity when close
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
        // Get direction from camera to ghost
        const dirToGhost = this.position.clone().sub(camera.position);

        // Get camera forward direction
        const cameraForward = new THREE.Vector3(0, 0, -1);
        cameraForward.applyQuaternion(camera.quaternion);

        // Calculate angle between camera forward and ghost direction
        dirToGhost.normalize();
        const viewAngle = cameraForward.dot(dirToGhost);

        // Ghost is visible if angle is > ~0.3 (roughly 70 degree cone in front)
        this.isInViewport = viewAngle > 0.3;

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
            this.outOfViewTimer += 1; // Increment out-of-view counter (counts frames, ~60 per second)
            this.facingCameraBlend = Math.max(this.facingCameraBlend - 0.1, 0.0);

            // Switch to creeping after delay
            if (this.outOfViewTimer > (this.creepStartDelay * 60) && this.state === 'hovering') {
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
        // Occasionally pick a new small hover target
        if (Math.random() < 0.005) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 1 + Math.random() * 2; // Only 1-3 meters from hover center
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
        this.rotationSpeed = 0.02;
    }

    /**
     * Creep slowly toward the camera when out of view
     * Ghost moves deliberately and ominously, with eerie sound
     */
    creepingUpdate(deltaTime, camera) {
        // Move slowly and deliberately toward camera
        const direction = camera.position.clone().sub(this.position);
        const distance = direction.length();

        // Stop creeping when very close to camera (2 meter safety distance)
        if (distance > 2) {
            direction.normalize();
            this.position.add(direction.multiplyScalar(deltaTime * this.creepSpeed));

            // Slightly increase rotation speed when creeping for unsettling effect
            this.rotationSpeed = 0.04;
        } else {
            // Very close - return to hovering state
            this.state = 'hovering';
            this.outOfViewTimer = 0;
            this.creepingAudioPlaying = false;
        }
    }

    fleeing(deltaTime, camera) {
        // Run away from click position
        const direction = this.position.clone().sub(camera.position);
        direction.normalize();
        this.position.add(direction.multiplyScalar(deltaTime * this.speed * 2));

        // Rotate away frantically
        this.rotationSpeed = 0.1;
    }

    scare() {
        this.scared = true;
        this.scareTTL = 0.5;
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
