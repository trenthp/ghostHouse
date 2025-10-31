import * as THREE from 'three';

export class ARManager {
    constructor(scene, renderer, camera) {
        this.scene = scene;
        this.renderer = renderer;
        this.camera = camera;
        this.xrSession = null;
        this.isARSupported = false;
        this.isARActive = false;

        this.checkARSupport();
    }

    checkARSupport() {
        if (navigator.xr) {
            navigator.xr.isSessionSupported('immersive-ar')
                .then((supported) => {
                    this.isARSupported = supported;
                    console.log('AR Supported:', supported);
                    if (supported) {
                        console.log('AR is available on this device!');
                        // Auto-start AR if supported
                        this.startAR();
                    } else {
                        console.log('AR not supported, using fallback camera view');
                    }
                })
                .catch((err) => {
                    console.warn('Error checking AR support:', err);
                });
        } else {
            console.warn('WebXR not available');
        }
    }

    async startAR() {
        if (!this.isARSupported) {
            console.log('AR not supported, skipping AR session');
            return;
        }

        try {
            console.log('Requesting AR session...');
            this.xrSession = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay', 'dom-overlay-for-handheld-ar'],
                domOverlay: { root: document.body }
            });

            console.log('AR Session started successfully');
            this.isARActive = true;
            this.renderer.xr.setSession(this.xrSession);
        } catch (err) {
            console.warn('Failed to start AR session:', err);
            this.isARActive = false;
        }
    }

    stopAR() {
        if (this.xrSession) {
            this.xrSession.end();
            this.isARActive = false;
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
