import * as THREE from 'three';

export class Ghost {
    constructor(position, id = 0) {
        this.id = id;
        this.mesh = this.createMesh();
        this.mesh.position.copy(position);
        this.position = position.clone();
        this.targetPosition = position.clone();

        // Movement properties
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 3 + Math.random() * 2; // 3-5 m/s
        this.bobAmount = 0.3;
        this.bobSpeed = 1.5;
        this.bobTime = Math.random() * Math.PI * 2;

        // Behavior
        this.state = 'flying'; // 'flying', 'scared', 'fleeing'
        this.scared = false;
        this.scareTTL = 0;
        this.scareIntensity = 0;

        // Animation
        this.rotation = 0;
        this.rotationSpeed = 0.02;
        this.scale = 1;

        // Distance-based effects
        this.distanceToCamera = 0;
        this.maxViewDistance = 50; // Maximum distance to see ghost

        // Spawning effect
        this.spawnTime = 0;
        this.spawnDuration = 0.5;
        this.isSpawning = true;
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

        // Movement behavior
        if (this.state === 'flying') {
            // Gentle wander
            this.wanderUpdate(deltaTime, camera);
        } else if (this.state === 'fleeing') {
            this.fleeing(deltaTime, camera);
        }

        // Apply bobbing motion
        this.bobTime += deltaTime * this.bobSpeed;
        const bobOffset = Math.sin(this.bobTime) * this.bobAmount;
        this.mesh.position.copy(this.position);
        this.mesh.position.y += bobOffset;

        // Update rotation
        this.rotation += deltaTime * this.rotationSpeed;
        this.mesh.rotation.y = this.rotation;

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

    wanderUpdate(deltaTime, camera) {
        // Random wander in a small area
        if (Math.random() < 0.01) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 5 + Math.random() * 10;
            this.targetPosition.x = Math.cos(angle) * distance;
            this.targetPosition.z = Math.sin(angle) * distance;
            this.targetPosition.y = 0.5 + Math.random() * 2;
        }

        // Move towards target
        const direction = this.targetPosition.clone().sub(this.position);
        if (direction.length() > 0.5) {
            direction.normalize();
            this.position.add(direction.multiplyScalar(deltaTime * this.speed));
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

    remove() {
        this.mesh.parent?.remove(this.mesh);
    }
}
