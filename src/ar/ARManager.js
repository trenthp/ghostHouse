import * as THREE from 'three';

// AR configuration constants
const AR_CONFIG = {
    // UI
    BUTTON_TEXT: '📷 Start AR',
    BUTTON_TOP: '80px',
    BUTTON_RIGHT: '20px',
    BUTTON_PADDING: '12px 20px',
    BUTTON_COLOR: '#ff6b35',
    BUTTON_BORDER_RADIUS: '8px',
    BUTTON_FONT_SIZE: '14px',
    BUTTON_Z_INDEX: 150,

    // Modal
    MODAL_MAX_WIDTH: '400px',
    MODAL_PADDING: '24px',
    MODAL_BORDER_RADIUS: '12px',
    MODAL_BG_COLOR: '#1a1a2e',
    MODAL_TEXT_COLOR: 'white',
    MODAL_Z_INDEX: 1000,
    MODAL_BORDER_COLOR: 'rgba(255, 255, 255, 0.1)',
    MODAL_OVERLAY_BG: 'rgba(0, 0, 0, 0.7)',

    // Button sizes
    BUTTON_PADDING_VERTICAL: '10px',
    BUTTON_PADDING_HORIZONTAL: '16px',
    BUTTON_BORDER_RADIUS_SMALL: '6px',
    BUTTON_FONT_SIZE_SMALL: '14px',

    // Permission messages
    PERMISSION_TITLE_NOT_SUPPORTED: 'AR Not Supported',
    PERMISSION_MSG_NOT_SUPPORTED: 'AR is not available on your device. Please ensure you have a compatible device with AR capabilities.',
    PERMISSION_TITLE_CAMERA: 'Camera Access Required',
    PERMISSION_MSG_CAMERA: 'To experience the spooky haunted house in AR, we need access to your camera. Your location may also be used to show ghosts near the target house. We do not store or share your data.',
    PERMISSION_TITLE_DENIED: 'Permission Denied',
    PERMISSION_MSG_DENIED: 'AR access was not granted. Please enable camera permissions in your device settings and try again.',

    // Buttons
    BUTTON_TEXT_CONTINUE: 'Continue to AR',
    BUTTON_TEXT_CANCEL: 'Cancel',
    BUTTON_TEXT_CLOSE: 'Close',
};

export class ARManager {
    constructor(scene, renderer, camera, onARStarted) {
        this.scene = scene;
        this.renderer = renderer;
        this.camera = camera;
        this.onARStarted = onARStarted;
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
        const cfg = AR_CONFIG;
        const button = document.createElement('button');
        button.id = 'ar-button';
        button.textContent = cfg.BUTTON_TEXT;
        // Styles are now defined in stylesheet (index.html)

        button.onclick = () => this.initiateARPermissions();
        document.body.appendChild(button);

        console.log('AR button created');
    }

    /**
     * Initiate AR permissions flow with user-friendly messaging
     * Shows a modal explaining what permissions are needed and why
     */
    initiateARPermissions() {
        const cfg = AR_CONFIG;
        if (this.hasAttemptedAR) {
            console.log('AR session already attempted');
            return;
        }

        if (!this.isARSupported) {
            console.error('AR not supported on this device');
            this.showPermissionModal(
                cfg.PERMISSION_TITLE_NOT_SUPPORTED,
                cfg.PERMISSION_MSG_NOT_SUPPORTED,
                false
            );
            return;
        }

        this.showPermissionModal(
            cfg.PERMISSION_TITLE_CAMERA,
            cfg.PERMISSION_MSG_CAMERA,
            true
        );
    }

    /**
     * Show a clean permission modal to the user
     */
    showPermissionModal(title, message, showContinue = true) {
        const cfg = AR_CONFIG;

        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'ar-permission-modal';
        // Styles defined in stylesheet (index.html)

        // Create modal content
        const modal = document.createElement('div');

        // Title
        const titleEl = document.createElement('h2');
        titleEl.textContent = title;
        modal.appendChild(titleEl);

        // Message
        const messageEl = document.createElement('p');
        messageEl.textContent = message;
        modal.appendChild(messageEl);

        // Button container
        const buttonContainer = document.createElement('div');

        if (showContinue) {
            // Continue button
            const continueBtn = document.createElement('button');
            continueBtn.textContent = cfg.BUTTON_TEXT_CONTINUE;
            continueBtn.style.flex = '1';
            continueBtn.onclick = () => {
                modalOverlay.remove();
                this.startAR();
            };
            buttonContainer.appendChild(continueBtn);
        }

        // Cancel/Close button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = showContinue ? cfg.BUTTON_TEXT_CANCEL : cfg.BUTTON_TEXT_CLOSE;
        if (showContinue) cancelBtn.style.flex = '1';
        // Apply secondary button style for cancel
        cancelBtn.style.cssText = `${cancelBtn.style.cssText}; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.3);`;
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

            // Notify that AR has started
            if (this.onARStarted) {
                this.onARStarted();
            }

        } catch (err) {
            const cfg = AR_CONFIG;
            console.error('❌ Failed to start AR session:', err);
            this.isARActive = false;
            this.permissionState = 'denied';
            this.hasAttemptedAR = false; // Allow retry

            // Show error modal
            this.showPermissionModal(
                cfg.PERMISSION_TITLE_DENIED,
                cfg.PERMISSION_MSG_DENIED,
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
