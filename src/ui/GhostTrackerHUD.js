import * as THREE from 'three';

/**
 * Ghost Tracker HUD System
 * Displays indicators around the viewport edge showing direction and proximity of creeping ghosts
 * Provides a radar-like tracking system for ghosts approaching off-screen
 */
export class GhostTrackerHUD {
    constructor() {
        this.container = null;
        this.indicators = new Map(); // Map of ghost ID to indicator element
        this.radarElement = null;
        this.isActive = false;

        this.indicatorSize = 40; // Size of tracker indicator in pixels
        this.edgePadding = 10; // Distance from viewport edge
        this.maxTrackedDistance = 50; // Maximum distance to show on radar

        this.init();
    }

    init() {
        // Create main tracker HUD container
        this.container = document.createElement('div');
        this.container.id = 'ghost-tracker-hud';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
        `;

        // Create border tracking indicators (around viewport edges)
        this.createBorderIndicators();

        document.body.appendChild(this.container);
    }

    createBorderIndicators() {
        // Create four edge regions for indicators
        const edges = ['top', 'bottom', 'left', 'right'];

        edges.forEach(edge => {
            const edgeContainer = document.createElement('div');
            edgeContainer.className = `ghost-tracker-edge ghost-tracker-${edge}`;
            edgeContainer.style.cssText = this.getEdgeStyle(edge);
            edgeContainer.id = `ghost-tracker-${edge}`;
            this.container.appendChild(edgeContainer);
        });
    }

    getEdgeStyle(edge) {
        const baseStyle = `
            position: fixed;
            pointer-events: none;
            z-index: 100;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
        `;

        const edgeStyles = {
            top: `
                ${baseStyle}
                top: ${this.edgePadding}px;
                left: 50%;
                transform: translateX(-50%);
                height: 50px;
                width: 100%;
            `,
            bottom: `
                ${baseStyle}
                bottom: ${this.edgePadding}px;
                left: 50%;
                transform: translateX(-50%);
                height: 50px;
                width: 100%;
            `,
            left: `
                ${baseStyle}
                flex-direction: column;
                left: ${this.edgePadding}px;
                top: 50%;
                transform: translateY(-50%);
                width: 50px;
                height: 100%;
            `,
            right: `
                ${baseStyle}
                flex-direction: column;
                right: ${this.edgePadding}px;
                top: 50%;
                transform: translateY(-50%);
                width: 50px;
                height: 100%;
            `
        };

        return edgeStyles[edge];
    }

    /**
     * Create a visual indicator for a creeping ghost
     */
    createIndicator(ghostId) {
        const indicator = document.createElement('div');
        indicator.className = 'ghost-tracker-indicator';
        indicator.id = `indicator-${ghostId}`;
        indicator.style.cssText = `
            position: fixed;
            width: ${this.indicatorSize}px;
            height: ${this.indicatorSize}px;
            border: 2px solid #ff6b35;
            border-radius: 50%;
            background: rgba(255, 107, 53, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            z-index: 101;
            pointer-events: none;
            box-shadow: 0 0 10px rgba(255, 107, 53, 0.5), inset 0 0 10px rgba(255, 107, 53, 0.3);
            animation: pulse-indicator 1s ease-in-out infinite;
        `;

        // Add ghost emoji
        const ghostEmoji = document.createElement('span');
        ghostEmoji.textContent = '👻';
        ghostEmoji.style.cssText = `
            font-size: 18px;
            filter: drop-shadow(0 0 4px rgba(255, 107, 53, 0.8));
        `;
        indicator.appendChild(ghostEmoji);

        // Add distance label
        const distanceLabel = document.createElement('div');
        distanceLabel.className = 'distance-label';
        distanceLabel.style.cssText = `
            position: absolute;
            bottom: -20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 10px;
            color: #ff6b35;
            font-weight: bold;
            white-space: nowrap;
            text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
        `;
        indicator.appendChild(distanceLabel);

        this.container.appendChild(indicator);
        this.indicators.set(ghostId, { element: indicator, distanceLabel });

        return indicator;
    }

    /**
     * Update tracker HUD based on creeping ghosts
     */
    update(creepingGhosts, camera, viewportWidth, viewportHeight) {
        if (!this.isActive && creepingGhosts.length > 0) {
            this.isActive = true;
            this.addPulseAnimation();
        } else if (this.isActive && creepingGhosts.length === 0) {
            this.isActive = false;
            this.clearAllIndicators();
            return;
        }

        // Update or create indicators for each creeping ghost
        creepingGhosts.forEach(({ ghost, direction, distance }) => {
            const ghostId = ghost.id;

            // Create indicator if it doesn't exist
            if (!this.indicators.has(ghostId)) {
                this.createIndicator(ghostId);
            }

            const { element, distanceLabel } = this.indicators.get(ghostId);

            // Calculate screen position for the indicator
            const screenPos = this.calculateScreenPosition(
                direction,
                camera,
                viewportWidth,
                viewportHeight,
                distance
            );

            // Update indicator position
            element.style.left = screenPos.x + 'px';
            element.style.top = screenPos.y + 'px';

            // Update distance label
            const distanceM = Math.max(2, Math.round(distance));
            distanceLabel.textContent = `${distanceM}m`;

            // Update indicator color based on proximity
            const proximityRatio = Math.min(distance / this.maxTrackedDistance, 1);
            const intensity = 1 - proximityRatio;
            element.style.borderColor = `rgba(255, 107, 53, ${0.5 + intensity * 0.5})`;
            element.style.boxShadow = `0 0 ${10 + intensity * 15}px rgba(255, 107, 53, ${0.5 + intensity * 0.5}), inset 0 0 10px rgba(255, 107, 53, 0.3)`;
            element.style.background = `rgba(255, 107, 53, ${0.05 + intensity * 0.15})`;
        });

        // Remove indicators for ghosts no longer creeping
        const creepingIds = new Set(creepingGhosts.map(g => g.ghost.id));
        for (const [ghostId, { element }] of this.indicators) {
            if (!creepingIds.has(ghostId)) {
                element.remove();
                this.indicators.delete(ghostId);
            }
        }
    }

    /**
     * Calculate screen position for an off-screen ghost indicator
     * Projects the direction vector to the edge of the viewport
     */
    calculateScreenPosition(direction, camera, viewportWidth, viewportHeight, distance) {
        // Get camera forward direction
        const cameraForward = new THREE.Vector3(0, 0, -1);
        cameraForward.applyQuaternion(camera.quaternion);

        // Get camera right direction
        const cameraRight = new THREE.Vector3(1, 0, 0);
        cameraRight.applyQuaternion(camera.quaternion);

        // Get camera up direction
        const cameraUp = new THREE.Vector3(0, 1, 0);

        // Project direction onto screen space
        const forward = direction.clone().dot(cameraForward);
        const right = direction.clone().dot(cameraRight);
        const up = direction.clone().dot(cameraUp);

        // Calculate screen coordinates (center is 0,0)
        let screenX = (right / forward) * (viewportWidth / 2);
        let screenY = -(up / forward) * (viewportHeight / 2);

        // Clamp to viewport edges with padding
        const padding = this.edgePadding + this.indicatorSize / 2;
        const maxX = viewportWidth / 2 - padding;
        const maxY = viewportHeight / 2 - padding;

        const magnitude = Math.sqrt(screenX * screenX + screenY * screenY);
        if (magnitude > Math.max(maxX, maxY)) {
            const scale = Math.max(maxX, maxY) / magnitude;
            screenX *= scale;
            screenY *= scale;
        }

        // Convert to absolute coordinates
        const absoluteX = viewportWidth / 2 + screenX;
        const absoluteY = viewportHeight / 2 + screenY;

        return { x: absoluteX, y: absoluteY };
    }

    /**
     * Add pulse animation CSS if not already present
     */
    addPulseAnimation() {
        if (document.getElementById('ghost-tracker-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'ghost-tracker-styles';
        style.textContent = `
            @keyframes pulse-indicator {
                0% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.1);
                }
                100% {
                    transform: scale(1);
                }
            }

            @keyframes edge-glow {
                0%, 100% {
                    border-color: rgba(255, 107, 53, 0.3);
                }
                50% {
                    border-color: rgba(255, 107, 53, 0.8);
                }
            }

            .ghost-tracker-edge {
                border-top: 2px solid rgba(255, 107, 53, 0.3);
                border-bottom: 2px solid rgba(255, 107, 53, 0.3);
            }

            .ghost-tracker-top, .ghost-tracker-bottom {
                border-left: 1px solid rgba(255, 107, 53, 0.2);
                border-right: 1px solid rgba(255, 107, 53, 0.2);
            }

            .ghost-tracker-left, .ghost-tracker-right {
                border-top: 1px solid rgba(255, 107, 53, 0.2);
                border-bottom: 1px solid rgba(255, 107, 53, 0.2);
            }

            .ghost-tracker-indicator:hover {
                box-shadow: 0 0 20px rgba(255, 107, 53, 0.8), inset 0 0 15px rgba(255, 107, 53, 0.6) !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Clear all indicator elements
     */
    clearAllIndicators() {
        for (const { element } of this.indicators.values()) {
            element.remove();
        }
        this.indicators.clear();
    }

    /**
     * Remove the entire HUD from the DOM
     */
    destroy() {
        this.clearAllIndicators();
        this.container?.remove();
    }
}
