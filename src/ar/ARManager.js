import * as THREE from 'three';
import { APP_CONFIG } from '../config/AppConfig.js';

const AR_CONFIG = APP_CONFIG.ar;

export class ARManager {
    constructor(scene, renderer, camera, onARStarted, modalManager) {
        this.scene = scene;
        this.renderer = renderer;
        this.camera = camera;
        this.onARStarted = onARStarted;
        this.modalManager = modalManager;
        this.xrSession = null;
        this.isARSupported = false;
        this.isARActive = false;
        this.hasAttemptedAR = false;
        this.permissionState = 'pending'; // pending, checking, accepted, denied

        this.checkARSupport();
    }

    checkARSupport() {
        if (!navigator.xr) {
            this.isARSupported = false;
            return;
        }

        // Check for AR support
        navigator.xr.isSessionSupported('immersive-ar')
            .then((supported) => {
                this.isARSupported = supported;

                if (!supported) {
                    // Try inline session as fallback
                    return navigator.xr.isSessionSupported('inline');
                }
            })
            .catch(() => {
                this.isARSupported = false;
            });
    }

    /**
     * Initiate AR permissions flow with user-friendly messaging
     * Shows a modal explaining what permissions are needed and why
     */
    initiateARPermissions() {
        const cfg = AR_CONFIG;
        if (this.hasAttemptedAR) {
            return;
        }

        if (!this.isARSupported) {
            this.showPermissionModal(
                cfg.PERMISSION_TITLE_NOT_SUPPORTED,
                cfg.PERMISSION_MSG_NOT_SUPPORTED,
                false,
                true // returnToIntro = true (blocking error)
            );
            return;
        }

        this.showPermissionModal(
            cfg.PERMISSION_TITLE_CAMERA,
            cfg.PERMISSION_MSG_CAMERA,
            true,
            false // returnToIntro = false (user can try again later)
        );
    }

    /**
     * Show a clean permission modal to the user
     * @param {string} title - Modal title
     * @param {string} message - Modal message
     * @param {boolean} showContinue - Show "Continue" button (vs just "Close")
     * @param {boolean} returnToIntro - On close, return to intro modal instead of just closing
     */
    showPermissionModal(title, message, showContinue = true, returnToIntro = false) {
        const cfg = AR_CONFIG;

        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'ar-permission-modal';
        modalOverlay.className = 'modal-overlay active'; // Add the modal-overlay class with active state

        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'modal-content'; // Add the modal-content class

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
        buttonContainer.className = 'modal-buttons';

        if (showContinue) {
            // Continue button
            const continueBtn = document.createElement('button');
            continueBtn.textContent = cfg.BUTTON_TEXT_CONTINUE;
            continueBtn.style.cssText = 'flex: 1; padding: 10px 16px; background: #ff6b35; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px;';
            continueBtn.onclick = () => {
                modalOverlay.remove();
                this.startAR();
            };
            buttonContainer.appendChild(continueBtn);
        }

        // Cancel/Close button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = showContinue ? cfg.BUTTON_TEXT_CANCEL : cfg.BUTTON_TEXT_CLOSE;
        cancelBtn.style.cssText = `flex: 1; padding: 10px 16px; background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px;`;
        cancelBtn.onclick = () => {
            modalOverlay.remove();
            if (!showContinue) {
                this.hasAttemptedAR = true;
            }
            // Return to intro modal if this is a blocking error
            if (returnToIntro && this.modalManager) {
                this.modalManager.show('arIntroModal');
            }
        };
        buttonContainer.appendChild(cancelBtn);

        modal.appendChild(buttonContainer);
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
    }

    async startAR() {
        if (this.hasAttemptedAR) {
            return;
        }

        this.hasAttemptedAR = true;
        this.permissionState = 'checking';

        if (!this.isARSupported) {
            return;
        }

        try {
            // Request with only essential features, rest are optional
            const sessionInit = {
                optionalFeatures: [
                    'dom-overlay',
                    'dom-overlay-for-handheld-ar',
                    'hit-test',
                    'camera-access'
                ]
            };

            // Only set domOverlay if requesting the feature
            if (sessionInit.optionalFeatures.includes('dom-overlay')) {
                sessionInit.domOverlay = { root: document.body };
            }

            this.xrSession = await navigator.xr.requestSession('immersive-ar', sessionInit);

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

            this.isARActive = false;
            this.permissionState = 'denied';
            this.hasAttemptedAR = false; // Allow retry

            // Show error modal and return to intro
            this.showPermissionModal(
                cfg.PERMISSION_TITLE_DENIED,
                `${cfg.PERMISSION_MSG_DENIED}\n\nError: ${err.message}`,
                false,
                true // returnToIntro = true (blocking error)
            );
        }
    }

    stopAR() {
        if (this.xrSession) {
            this.xrSession.end();
            this.isARActive = false;
            this.hasAttemptedAR = false;
            this.permissionState = 'pending';
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
