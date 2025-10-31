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
                    if (supported) {
                        this.setupARButton();
                    }
                })
                .catch(() => {
                    console.log('AR not supported');
                });
        }
    }

    setupARButton() {
        // In a real app, you'd add an AR button
        // For this demo, AR is enabled by default if supported
        console.log('AR is supported on this device');
    }

    async startAR() {
        if (!this.isARSupported) return;

        try {
            this.xrSession = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test', 'dom-overlay'],
                domOverlay: { root: document.body }
            });

            this.isARActive = true;
            this.renderer.xr.setSession(this.xrSession);
        } catch (err) {
            console.warn('Failed to start AR:', err);
        }
    }

    stopAR() {
        if (this.xrSession) {
            this.xrSession.end();
            this.isARActive = false;
        }
    }

    getIsARActive() {
        return this.isARActive;
    }

    getIsARSupported() {
        return this.isARSupported;
    }
}
