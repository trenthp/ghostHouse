import * as THREE from 'three';
import { ARManager } from './ar/ARManager.js';
import { GhostManager } from './ghosts/GhostManager.js';
import { LocationManager } from './location/LocationManager.js';
import { GameManager } from './game/GameManager.js';
import { UIManager } from './ui/UIManager.js';

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
            this.arManager = new ARManager(this.scene, this.renderer, this.camera, () => this.onARStarted());

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

    setupEventListeners() {
        // AR button - show intro modal
        const arButton = document.getElementById('ar-button');
        if (arButton) {
            arButton.addEventListener('click', () => {
                this.showARIntroModal();
            });
        }

        // AR intro modal handlers
        const startARBtn = document.getElementById('startARButton');
        const cancelARBtn = document.getElementById('cancelARButton');
        if (startARBtn) {
            startARBtn.addEventListener('click', () => {
                this.closeARIntroModal();
                this.arManager?.initiateARPermissions();
            });
        }
        if (cancelARBtn) {
            cancelARBtn.addEventListener('click', () => {
                this.closeARIntroModal();
            });
        }

        // Toggle custom house
        const toggleButton = document.getElementById('toggleButton');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.openAddressModal();
            });
        }

        // Address modal handlers
        const addressModal = document.getElementById('addressModal');
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
                this.closeAddressModal();
            });
        }

        if (addressInput) {
            addressInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.confirmCustomAddress();
                }
            });
        }

        // Ghost interaction - raycaster for clicking ghosts
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        window.addEventListener('click', (event) => {
            // Ignore UI clicks
            if (event.target.closest('#toggleButton, #ar-button, .modal-overlay, input, .score-display, .location-status')) {
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

    showARIntroModal() {
        const modal = document.getElementById('arIntroModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeARIntroModal() {
        const modal = document.getElementById('arIntroModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    openAddressModal() {
        const modal = document.getElementById('addressModal');
        const input = document.getElementById('addressInput');
        if (modal) {
            modal.classList.add('active');
            if (input) input.focus();
        }
    }

    closeAddressModal() {
        const modal = document.getElementById('addressModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    confirmCustomAddress() {
        const input = document.getElementById('addressInput');
        if (!input || !input.value.trim()) {
            alert('Please enter an address or coordinates');
            return;
        }

        const address = input.value.trim();

        // Try to parse as coordinates (lat,lng)
        const coordMatch = address.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
        if (coordMatch) {
            const lat = parseFloat(coordMatch[1]);
            const lng = parseFloat(coordMatch[2]);
            this.setCustomLocation(lat, lng, address);
            this.closeAddressModal();
            input.value = '';
            return;
        }

        // For addresses, we'd need a geocoding API
        // For now, show a simple alert
        alert('Direct address lookup not yet implemented. Please use coordinates format: "40.7128,-74.0060"');
    }

    setCustomLocation(lat, lng, label) {
        this.customLocation = { lat, lng, label };
        this.ghostManager.setCustomLocation(lat, lng);
        this.uiManager.updateLocationStatus({
            distance: 0,
            address: label || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        }, true);

        // Activate ghosts if AR has been started
        if (this.arStarted && !this.ghostManager.isActive) {
            this.ghostManager.activate();
        }

        console.log('Custom location set:', label);
    }

    onARStarted() {
        this.arStarted = true;

        // If custom location is set, activate ghosts
        if (this.customLocation && !this.ghostManager.isActive) {
            this.ghostManager.activate();
        }
    }

    onLocationUpdate(data) {
        // Only update location if not using custom location
        if (!this.customLocation) {
            const isAtLocation = data.distance < 50; // 50 meters from target
            this.uiManager.updateLocationStatus(data, isAtLocation);

            // Set target location for GhostManager
            const targetPosition = this.calculateTargetWorldPosition(data);
            this.ghostManager.setTargetLocation(targetPosition);

            // Only activate if AR has been started and we're at location
            if (this.arStarted && isAtLocation && !this.ghostManager.isActive) {
                this.ghostManager.activate();
            } else if (!isAtLocation && this.ghostManager.isActive) {
                this.ghostManager.deactivate();
            }
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
