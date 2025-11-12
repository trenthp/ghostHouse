import * as THREE from 'three';
import { ARManager } from './ar/ARManager.js';
import { GhostManager } from './ghosts/GhostManager.js';
import { LocationManager } from './location/LocationManager.js';
import { GameManager } from './game/GameManager.js';
import { UIManager } from './ui/UIManager.js';
import { ModalManager } from './ui/ModalManager.js';

class HalloweenGhostHouse {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;

        this.arManager = null;
        this.ghostManager = null;
        this.locationManager = null;
        this.gameManager = null;
        this.uiManager = null;
        this.modalManager = null;

        this.isRunning = false;
        this.arStarted = false; // Don't spawn ghosts until AR is started
        this.customLocation = null; // For "Custom House" feature
    }

    async init() {
        try {
            // Initialize Three.js scene
            this.initScene();

            // Initialize managers
            this.gameManager = new GameManager();
            this.uiManager = new UIManager();
            this.locationManager = new LocationManager();
            this.ghostManager = new GhostManager(this.scene, this.gameManager);
            this.modalManager = new ModalManager();

            // Set game complete callback
            this.ghostManager.setOnGameCompleteCallback(() => this.onGameComplete());

            // Register modals
            this.registerModals();

            // Pass modalManager to ARManager so it can navigate modals on errors
            this.arManager = new ARManager(this.scene, this.renderer, this.camera, () => this.onARStarted(), this.modalManager);

            // Check WebXR support
            const supportsWebXR = navigator.xr !== undefined;
            if (!supportsWebXR) {
                this.uiManager.showError('WebXR not supported on this device');
            }

            // Start location tracking
            this.locationManager.startTracking((data) => {
                this.onLocationUpdate(data);
            });

            // Setup event listeners
            this.setupEventListeners();

            // Start animation loop
            this.animate();

            this.isRunning = true;

            // Show AR intro modal on load
            setTimeout(() => this.modalManager.show('arIntroModal'), 500);
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

    registerModals() {
        // Register all modals with the modal manager
        const arIntroModal = document.getElementById('arIntroModal');
        const locationSelectionModal = document.getElementById('locationSelectionModal');
        const addressModal = document.getElementById('addressModal');
        const gameCompleteModal = document.getElementById('gameCompleteModal');

        if (arIntroModal) this.modalManager.registerModal('arIntroModal', arIntroModal);
        if (locationSelectionModal) this.modalManager.registerModal('locationSelectionModal', locationSelectionModal);
        if (addressModal) this.modalManager.registerModal('addressModal', addressModal);
        if (gameCompleteModal) this.modalManager.registerModal('gameCompleteModal', gameCompleteModal);
    }

    setupEventListeners() {
        // AR intro modal handlers
        const startGhostHouseBtn = document.getElementById('startGhostHouseButton');
        const hauntCustomHouseBtn = document.getElementById('hauntCustomHouseButton');
        if (startGhostHouseBtn) {
            startGhostHouseBtn.addEventListener('click', () => {
                this.modalManager.hide('arIntroModal');
                this.arManager?.initiateARPermissions();
            });
        }
        if (hauntCustomHouseBtn) {
            hauntCustomHouseBtn.addEventListener('click', () => {
                this.modalManager.hide('arIntroModal');
                this.modalManager.show('locationSelectionModal');
            });
        }

        // Location selection modal handlers
        const enterLocationBtn = document.getElementById('enterLocationButton');
        const hauntCurrentLocationBtn = document.getElementById('hauntCurrentLocationButton');
        const cancelLocationSelectionBtn = document.getElementById('cancelLocationSelection');

        if (enterLocationBtn) {
            enterLocationBtn.addEventListener('click', () => {
                this.modalManager.hide('locationSelectionModal');
                this.modalManager.show('addressModal');
                // Focus input field after modal is shown
                setTimeout(() => {
                    const input = document.getElementById('addressInput');
                    if (input) input.focus();
                }, 0);
            });
        }

        if (hauntCurrentLocationBtn) {
            hauntCurrentLocationBtn.addEventListener('click', () => {
                this.modalManager.hide('locationSelectionModal');
                // Clear any custom location so we use current GPS location
                this.customLocation = null;
                this.arManager?.initiateARPermissions();
            });
        }

        if (cancelLocationSelectionBtn) {
            cancelLocationSelectionBtn.addEventListener('click', () => {
                this.modalManager.hide('locationSelectionModal');
                this.modalManager.show('arIntroModal');
            });
        }

        // Restart experience button
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                this.resetExperience();
            });
        }

        // Address modal handlers
        const confirmBtn = document.getElementById('confirmAddress');
        const cancelBtn = document.getElementById('cancelAddress');
        const addressInput = document.getElementById('addressInput');

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.confirmCustomAddress();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.modalManager.hide('addressModal');
                if (addressInput) {
                    addressInput.value = '';
                }
                this.modalManager.show('locationSelectionModal');
            });
        }

        if (addressInput) {
            addressInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.confirmCustomAddress();
                }
            });
        }

        // Game complete modal handlers
        const restartGameBtn = document.getElementById('restartGameButton');
        const hauntAnotherHouseBtn = document.getElementById('hauntAnotherHouseButton');

        if (restartGameBtn) {
            restartGameBtn.addEventListener('click', () => {
                this.resetExperience();
            });
        }

        if (hauntAnotherHouseBtn) {
            hauntAnotherHouseBtn.addEventListener('click', () => {
                this.uiManager.hideGameComplete();
                this.modalManager.hide('gameCompleteModal');
                this.modalManager.show('locationSelectionModal');
            });
        }

        // Ghost interaction - raycaster for clicking ghosts
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        window.addEventListener('click', (event) => {
            // Ignore UI clicks
            if (event.target.closest('#restartButton, #startGhostHouseButton, #hauntCustomHouseButton, #enterLocationButton, #hauntCurrentLocationButton, #cancelLocationSelection, #restartGameButton, #hauntAnotherHouseButton, #ar-button, .modal-overlay, input, .score-display, .location-status')) {
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
                    this.uiManager.updateScore(this.gameManager.getStats().scaresCount);
                }
            }
        });

        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    confirmCustomAddress() {
        const input = document.getElementById('addressInput');
        if (!input || !input.value.trim()) {
            alert('Please enter coordinates in the format: 40.7128,-74.0060');
            return;
        }

        const coords = input.value.trim();

        // Parse as coordinates (lat,lng)
        const coordMatch = coords.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
        if (coordMatch) {
            const lat = parseFloat(coordMatch[1]);
            const lng = parseFloat(coordMatch[2]);

            // Validate coordinates
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                alert('Invalid coordinates. Latitude must be -90 to 90, Longitude must be -180 to 180');
                return;
            }

            this.setCustomLocation(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            this.modalManager.hide('addressModal');
            input.value = '';

            // Initiate AR permissions after setting custom location
            this.arManager?.initiateARPermissions();
            return;
        }

        alert('Invalid format. Please use: 40.7128,-74.0060\n\nTip: Find coordinates on Google Maps by right-clicking a location and selecting "What\'s here?"');
    }

    setCustomLocation(lat, lng, label) {
        this.customLocation = { lat, lng, label };
        console.log('Custom location set:', label);
        // Ghost spawning will be handled by the next onLocationUpdate call
        // which will now respect the custom location
    }

    resetExperience() {
        // Stop AR session
        this.arStarted = false;
        this.arManager?.stopAR();

        // Deactivate ghosts
        this.ghostManager.deactivate();

        // Clear custom location
        this.customLocation = null;

        // Reset score
        this.gameManager.resetGame();
        this.uiManager.updateScore(0);

        // Hide game complete modal
        this.uiManager.hideGameComplete();

        // Clear address input
        const addressInput = document.getElementById('addressInput');
        if (addressInput) {
            addressInput.value = '';
        }

        // Close any open modals and show intro modal
        this.modalManager.hideAll();
        this.modalManager.show('arIntroModal');

        // Reset location status to default
        this.uiManager.updateLocationStatus({
            distance: 0,
            address: 'Calculating...'
        }, false);

        console.log('Experience reset - showing intro modal');
    }

    onARStarted() {
        this.arStarted = true;

        // If custom location is set, activate ghosts
        if (this.customLocation && !this.ghostManager.isActive) {
            this.ghostManager.activate();
        }
    }

    onGameComplete() {
        // Game is complete - show victory modal with final score
        const finalScore = this.gameManager.getStats().scaresCount;
        this.uiManager.showGameComplete(finalScore);
        console.log('Game complete! Final score:', finalScore);
    }

    onLocationUpdate(data) {
        let targetLat, targetLng, label;
        let isAtLocation = false;

        // Determine which location to use
        if (this.customLocation) {
            // Using custom location
            targetLat = this.customLocation.lat;
            targetLng = this.customLocation.lng;
            label = this.customLocation.label;

            // Calculate distance to custom location
            const distance = this.locationManager.calculateDistance(
                data.currentLat,
                data.currentLng,
                targetLat,
                targetLng
            );
            isAtLocation = distance < 50;
        } else {
            // Using default/GPS tracked location
            targetLat = data.targetLat;
            targetLng = data.targetLng;
            label = data.address;
            isAtLocation = data.distance < 50;
        }

        // Update UI with location status
        const displayData = {
            currentLat: data.currentLat,
            currentLng: data.currentLng,
            targetLat: targetLat,
            targetLng: targetLng,
            distance: this.locationManager.calculateDistance(
                data.currentLat,
                data.currentLng,
                targetLat,
                targetLng
            ),
            address: label
        };
        this.uiManager.updateLocationStatus(displayData, isAtLocation);

        // Calculate world position for target location
        const targetPosition = this.calculateTargetWorldPosition({
            currentLat: data.currentLat,
            currentLng: data.currentLng,
            targetLat: targetLat,
            targetLng: targetLng
        });
        this.ghostManager.setTargetLocation(targetPosition);

        // Manage ghost spawning based on distance to target
        if (this.arStarted && isAtLocation && !this.ghostManager.isActive) {
            this.ghostManager.activate();
        } else if (!isAtLocation && this.ghostManager.isActive) {
            this.ghostManager.deactivate();
        }
    }

    calculateTargetWorldPosition(locationData) {
        // Convert GPS coordinates to world space relative to camera
        const R = 6371000; // Earth's radius in meters

        const dLat = (locationData.targetLat - locationData.currentLat) * Math.PI / 180;
        const dLng = (locationData.targetLng - locationData.currentLng) * Math.PI / 180;

        const y = dLat * R; // North-South (z in 3D)
        const x = dLng * R * Math.cos((locationData.currentLat) * Math.PI / 180); // East-West (x in 3D)

        const targetPos = new THREE.Vector3(x, 0, y);
        targetPos.add(this.camera.position);

        return targetPos;
    }

    animate() {
        this.renderer.setAnimationLoop((time, frame) => {
            const deltaTime = 0.016; // ~60fps

            // Update ghost manager
            if (this.ghostManager.isActive) {
                this.ghostManager.update(deltaTime, this.camera);
            }

            // Update game manager
            this.gameManager.update(deltaTime);

            // Render - renderer handles XR automatically when session is active
            this.renderer.render(this.scene, this.camera);
        });
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new HalloweenGhostHouse();
    app.init();
});
