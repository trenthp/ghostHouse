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
        this.permissionState = 'pending'; // pending, checking, accepted, denied

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

        button.onclick = () => this.initiateARPermissions();
        document.body.appendChild(button);

        console.log('AR button created');
    }

    /**
     * Initiate AR permissions flow with user-friendly messaging
     * Shows a modal explaining what permissions are needed and why
     */
    initiateARPermissions() {
        if (this.hasAttemptedAR) {
            console.log('AR session already attempted');
            return;
        }

        if (!this.isARSupported) {
            console.error('AR not supported on this device');
            this.showPermissionModal(
                'AR Not Supported',
                'AR is not available on your device. Please ensure you have a compatible device with AR capabilities.',
                false
            );
            return;
        }

        this.showPermissionModal(
            'Camera Access Required',
            'To experience the spooky haunted house in AR, we need access to your camera. Your location may also be used to show ghosts near the target house. We do not store or share your data.',
            true
        );
    }

    /**
     * Show a clean permission modal to the user
     */
    showPermissionModal(title, message, showContinue = true) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'ar-permission-modal';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        // Create modal content
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: #1a1a2e;
            border-radius: 12px;
            padding: 24px;
            max-width: 400px;
            text-align: center;
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        // Title
        const titleEl = document.createElement('h2');
        titleEl.textContent = title;
        titleEl.style.cssText = `
            margin: 0 0 12px 0;
            font-size: 20px;
            font-weight: bold;
        `;
        modal.appendChild(titleEl);

        // Message
        const messageEl = document.createElement('p');
        messageEl.textContent = message;
        messageEl.style.cssText = `
            margin: 0 0 24px 0;
            font-size: 14px;
            line-height: 1.5;
            color: rgba(255, 255, 255, 0.9);
        `;
        modal.appendChild(messageEl);

        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: center;
        `;

        if (showContinue) {
            // Continue button
            const continueBtn = document.createElement('button');
            continueBtn.textContent = 'Continue to AR';
            continueBtn.style.cssText = `
                flex: 1;
                padding: 10px 16px;
                background: #ff6b35;
                color: white;
                border: none;
                border-radius: 6px;
                font-weight: bold;
                cursor: pointer;
                font-size: 14px;
            `;
            continueBtn.onclick = () => {
                modalOverlay.remove();
                this.startAR();
            };
            buttonContainer.appendChild(continueBtn);
        }

        // Cancel/Close button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = showContinue ? 'Cancel' : 'Close';
        cancelBtn.style.cssText = `
            ${showContinue ? 'flex: 1;' : ''}
            padding: 10px 16px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            font-size: 14px;
        `;
        cancelBtn.onclick = () => {
            modalOverlay.remove();
            if (!showContinue) {
                this.hasAttemptedAR = true;
            }
        };
        buttonContainer.appendChild(cancelBtn);

        modal.appendChild(buttonContainer);
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
    }

    async startAR() {
        if (this.hasAttemptedAR) {
            console.log('AR session already attempted');
            return;
        }

        this.hasAttemptedAR = true;
        this.permissionState = 'checking';

        if (!this.isARSupported) {
            console.error('AR not supported on this device');
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
            this.permissionState = 'accepted';

            // Hide AR button
            const arButton = document.getElementById('ar-button');
            if (arButton) arButton.style.display = 'none';

            // Set the XR session
            this.renderer.xr.setSession(this.xrSession);

        } catch (err) {
            console.error('❌ Failed to start AR session:', err);
            this.isARActive = false;
            this.permissionState = 'denied';
            this.hasAttemptedAR = false; // Allow retry

            // Show error modal
            this.showPermissionModal(
                'Permission Denied',
                'AR access was not granted. Please enable camera permissions in your device settings and try again.',
                false
            );
        }
    }

    stopAR() {
        if (this.xrSession) {
            this.xrSession.end();
            this.isARActive = false;
            this.hasAttemptedAR = false;
            this.permissionState = 'pending';
            console.log('AR session ended');
        }
    }

    getIsARActive() {
        return this.isARActive;
    }

    getIsARSupported() {
        return this.isARSupported;
    }

    getPermissionState() {
        return this.permissionState;
    }
}
