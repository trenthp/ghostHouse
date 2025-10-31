import * as THREE from 'three';

export class ARManager {
    constructor(scene, renderer, camera) {
        this.scene = scene;
        this.renderer = renderer;
        this.camera = camera;
        this.xrSession = null;
        this.isARSupported = false;
        this.isARActive = false;
        this.hasAttemptedAR = false;

        this.checkARSupport();
    }

    checkARSupport() {
        console.log('Checking WebXR support...');

        if (!navigator.xr) {
            console.warn('WebXR not available on this browser');
            this.isARSupported = false;
            return;
        }

        // Check for AR support
        navigator.xr.isSessionSupported('immersive-ar')
            .then((supported) => {
                this.isARSupported = supported;
                console.log('immersive-ar supported:', supported);

                if (supported) {
                    console.log('✅ AR is available! Creating AR start button.');
                    this.createARButton();
                } else {
                    console.log('❌ immersive-ar not supported. Checking for inline session...');
                    // Try inline session as fallback
                    return navigator.xr.isSessionSupported('inline');
                }
            })
            .then((inlineSupported) => {
                if (inlineSupported) {
                    console.log('✅ Inline XR session available as fallback');
                }
            })
            .catch((err) => {
                console.error('Error checking AR support:', err);
            });
    }

    createARButton() {
        const button = document.createElement('button');
        button.id = 'ar-button';
        button.textContent = '📷 Start AR';
        button.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 12px 20px;
            background: #ff6b35;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            z-index: 150;
            font-size: 14px;
        `;

        button.onclick = () => this.startAR();
        document.body.appendChild(button);

        console.log('AR button created');
    }

    async startAR() {
        if (this.hasAttemptedAR) {
            console.log('AR session already attempted');
            return;
        }

        this.hasAttemptedAR = true;

        if (!this.isARSupported) {
            console.error('AR not supported on this device');
            alert('AR is not supported on your device. Please ensure you have a compatible device with AR capabilities.');
            return;
        }

        try {
            console.log('🚀 Requesting AR session...');

            this.xrSession = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test', 'dom-overlay'],
                optionalFeatures: ['dom-overlay-for-handheld-ar', 'camera-access'],
                domOverlay: { root: document.body },
                camera: {
                    width: { ideal: window.innerWidth },
                    height: { ideal: window.innerHeight }
                }
            });

            console.log('✅ AR Session started successfully!');
            this.isARActive = true;

            // Hide AR button
            const arButton = document.getElementById('ar-button');
            if (arButton) arButton.style.display = 'none';

            // Set the XR session
            this.renderer.xr.setSession(this.xrSession);

        } catch (err) {
            console.error('❌ Failed to start AR session:', err);
            this.isARActive = false;
            this.hasAttemptedAR = false; // Allow retry
            alert('Failed to start AR: ' + err.message);
        }
    }

    stopAR() {
        if (this.xrSession) {
            this.xrSession.end();
            this.isARActive = false;
            this.hasAttemptedAR = false;
            console.log('AR session ended');
        }
    }

    getIsARActive() {
        return this.isARActive;
    }

    getIsARSupported() {
        return this.isARSupported;
    }
}
