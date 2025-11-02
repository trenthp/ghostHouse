import * as THREE from 'three';
import { ARManager } from './ar/ARManager.js';
import { GhostManager } from './ghosts/GhostManager.js';
import { AudioManager } from './audio/AudioManager.js';
import { UIManager } from './ui/UIManager.js';
import { LocationManager } from './location/LocationManager.js';
import { GameManager } from './game/GameManager.js';

class HalloweenGhostHouse {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.xrSession = null;

        this.arManager = null;
        this.ghostManager = null;
        this.audioManager = null;
        this.uiManager = null;
        this.locationManager = null;
        this.gameManager = null;

        this.isRunning = false;
        this.enableGhostsAnywhere = false;
    }

    async init() {
        try {
            // Initialize Three.js scene
            this.initScene();

            // Initialize managers
            this.audioManager = new AudioManager();
            this.uiManager = new UIManager();
            this.locationManager = new LocationManager();
            this.gameManager = new GameManager();
            this.arManager = new ARManager(this.scene, this.renderer, this.camera);
            this.ghostManager = new GhostManager(this.scene, this.gameManager, this.audioManager);

            // Check WebXR support
            const supportsWebXR = navigator.xr !== undefined;
            if (!supportsWebXR) {
                this.uiManager.showError('WebXR not supported on this device');
                return;
            }

            // Start location tracking
            this.locationManager.startTracking((data) => {
                this.onLocationUpdate(data);
            });

            // Set up event listeners
            this.setupEventListeners();

            // Start animation loop
            this.animate();

            this.isRunning = true;

            // Hide instruction overlay after 2 seconds
            setTimeout(() => {
                window.closeInstructions?.();
            }, 2000);

        } catch (error) {
            console.error('Failed to initialize:', error);
            this.uiManager.showError('Failed to initialize AR experience');
        }
    }

    initScene() {
        const canvas = document.getElementById('canvas');

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = null; // Transparent for AR
        this.scene.fog = new THREE.Fog(0x000000, 50, 200);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1.6, 0); // User's head height

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            precision: 'mediump'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.xr.enabled = true;
        this.renderer.xr.setReferenceSpaceType('local');

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onLocationUpdate(data) {
        const isAtLocation = data.distance < 50; // 50 meters from target
        const shouldShowGhosts = isAtLocation || this.enableGhostsAnywhere;

        this.uiManager.updateLocationStatus(data, isAtLocation);

        // Set target location for GhostManager
        // Calculate relative position based on direction and distance from current user position
        const targetPosition = this.calculateTargetWorldPosition(data);
        this.ghostManager.setTargetLocation(targetPosition);

        if (shouldShowGhosts && !this.ghostManager.isActive) {
            this.ghostManager.activate();
        } else if (!shouldShowGhosts && this.ghostManager.isActive) {
            this.ghostManager.deactivate();
        }
    }

    calculateTargetWorldPosition(locationData) {
        // Convert GPS coordinates to world space relative to camera
        // Using simple latitude/longitude to meters conversion
        const R = 6371000; // Earth's radius in meters

        // Convert lat/lng differences to meters
        const dLat = (locationData.targetLat - locationData.currentLat) * Math.PI / 180;
        const dLng = (locationData.targetLng - locationData.currentLng) * Math.PI / 180;

        const y = dLat * R; // North-South (z in 3D)
        const x = dLng * R * Math.cos((locationData.currentLat) * Math.PI / 180); // East-West (x in 3D)

        // Place target in world space relative to camera
        const targetPos = new THREE.Vector3(x, 0, y);
        targetPos.add(this.camera.position); // Relative to camera position

        return targetPos;
    }

    setupEventListeners() {
        // Toggle ghosts anywhere
        document.getElementById('toggleButton').addEventListener('click', () => {
            this.enableGhostsAnywhere = !this.enableGhostsAnywhere;
            document.getElementById('toggleButton').classList.toggle('active');

            if (this.enableGhostsAnywhere) {
                this.ghostManager.activate();
            }
        });

        // Raycaster for ghost interaction
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        window.addEventListener('click', (event) => {
            // Ignore UI clicks
            if (event.target.closest('.ui-top, .stats-panel, .combo-counter, .instruction-overlay')) {
                return;
            }

            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);
            const ghosts = this.ghostManager.getGhostMeshes();
            const intersects = raycaster.intersectObjects(ghosts);

            if (intersects.length > 0) {
                const ghostMesh = intersects[0].object;
                const ghost = this.ghostManager.getGhostByMesh(ghostMesh);
                if (ghost) {
                    ghost.scare();
                    this.gameManager.onGhostScared();
                    this.uiManager.updateStats(this.gameManager.getStats());
                }
            }
        });

        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        this.renderer.setAnimationLoop((time, frame) => {
            const deltaTime = 0.016; // ~60fps

            // Update managers
            if (this.ghostManager.isActive) {
                this.ghostManager.update(deltaTime, this.camera);
            }

            // Update game manager
            this.gameManager.update(deltaTime);

            // Update ghost tracker HUD with creeping ghosts
            const creepingGhosts = this.ghostManager.getCreepingGhosts(this.camera);
            this.uiManager.updateGhostTracker(creepingGhosts, this.camera);

            // Render - works with both XR and non-XR
            if (this.arManager.isARActive && frame) {
                // XR rendering handled by WebXR
                this.renderer.render(this.scene, this.camera);
            } else {
                // Fallback regular rendering
                this.renderer.render(this.scene, this.camera);
            }
        });
    }
}

// Initialize when DOM is ready
window.closeInstructions = function() {
    const overlay = document.getElementById('instructionOverlay');
    overlay.style.display = 'none';
};

document.addEventListener('DOMContentLoaded', () => {
    const app = new HalloweenGhostHouse();
    app.init();
});
