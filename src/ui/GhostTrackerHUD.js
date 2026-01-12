import * as THREE from 'three';

// Ghost Tracker HUD configuration constants
const HUD_CONFIG = {
    // Visual
    INDICATOR_SIZE: 56, // pixels - larger for better visibility
    EDGE_PADDING: 20, // pixels from viewport edge
    EDGE_HEIGHT: 60, // pixels
    EDGE_WIDTH: 60, // pixels
    MAX_TRACKED_DISTANCE: 50, // meters

    // Colors
    INDICATOR_COLOR_RGB: '255, 107, 53', // Orange/red (#ff6b35)
    INDICATOR_BORDER_WIDTH: 3,
    INDICATOR_OPACITY_MIN: 0.15,
    INDICATOR_OPACITY_MAX: 0.3,
    GLOW_BLUR_MIN: 12,
    GLOW_BLUR_MAX: 30,

    // Animation
    PULSE_DURATION: '1.5s',
    DISTANCE_LABEL_OFFSET: -22, // pixels below indicator
    DISTANCE_LABEL_FONT_SIZE: 12, // pixels
};

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

        this.indicatorSize = HUD_CONFIG.INDICATOR_SIZE;
        this.edgePadding = HUD_CONFIG.EDGE_PADDING;
        this.maxTrackedDistance = HUD_CONFIG.MAX_TRACKED_DISTANCE;

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
        const base = `position: fixed; pointer-events: none; z-index: 100; display: flex; justify-content: center; align-items: center; gap: 8px;`;
        const padding = this.edgePadding;

        const edgeStyles = {
            top: `${base} top: ${padding}px; left: 50%; transform: translateX(-50%); height: 50px; width: 100%;`,
            bottom: `${base} bottom: ${padding}px; left: 50%; transform: translateX(-50%); height: 50px; width: 100%;`,
            left: `${base} flex-direction: column; left: ${padding}px; top: 50%; transform: translateY(-50%); width: 50px; height: 100%;`,
            right: `${base} flex-direction: column; right: ${padding}px; top: 50%; transform: translateY(-50%); width: 50px; height: 100%;`
        };

        return edgeStyles[edge];
    }

    /**
     * Create a visual indicator for a creeping ghost
     */
    createIndicator(ghostId) {
        const cfg = HUD_CONFIG;
        const indicator = document.createElement('div');
        indicator.className = 'ghost-tracker-indicator';
        indicator.id = `indicator-${ghostId}`;
        indicator.style.cssText = `
            position: fixed;
            width: ${this.indicatorSize}px;
            height: ${this.indicatorSize}px;
            border: ${cfg.INDICATOR_BORDER_WIDTH}px solid rgb(${cfg.INDICATOR_COLOR_RGB});
            border-radius: 50%;
            background: rgba(${cfg.INDICATOR_COLOR_RGB}, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            z-index: 101;
            pointer-events: none;
            box-shadow: 0 0 ${cfg.GLOW_BLUR_MIN}px rgba(${cfg.INDICATOR_COLOR_RGB}, 0.5), inset 0 0 10px rgba(${cfg.INDICATOR_COLOR_RGB}, 0.3);
            animation: pulse-indicator ${cfg.PULSE_DURATION} ease-in-out infinite;
        `;

        // Add ghost emoji
        const ghostEmoji = document.createElement('span');
        ghostEmoji.textContent = '👻';
        ghostEmoji.style.cssText = `
            font-size: 18px;
            filter: drop-shadow(0 0 4px rgba(${cfg.INDICATOR_COLOR_RGB}, 0.8));
        `;
        indicator.appendChild(ghostEmoji);

        // Add distance label
        const distanceLabel = document.createElement('div');
        distanceLabel.className = 'distance-label';
        distanceLabel.style.cssText = `
            position: absolute;
            bottom: ${cfg.DISTANCE_LABEL_OFFSET}px;
            left: 50%;
            transform: translateX(-50%);
            font-size: ${cfg.DISTANCE_LABEL_FONT_SIZE}px;
            color: rgb(${cfg.INDICATOR_COLOR_RGB});
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
            const distanceM = Math.max(1, Math.round(distance));
            distanceLabel.textContent = `${distanceM}m`;

            // Update indicator intensity based on proximity (closer = brighter)
            const cfg = HUD_CONFIG;
            const proximityRatio = Math.min(distance / this.maxTrackedDistance, 1);
            const intensity = 1 - proximityRatio;
            const rgb = cfg.INDICATOR_COLOR_RGB;
            const opacity = cfg.INDICATOR_OPACITY_MIN + intensity * (cfg.INDICATOR_OPACITY_MAX - cfg.INDICATOR_OPACITY_MIN);
            const glowSize = cfg.GLOW_BLUR_MIN + intensity * (cfg.GLOW_BLUR_MAX - cfg.GLOW_BLUR_MIN);
            const shadowOpacity = 0.5 + intensity * 0.5;

            // Update only the dynamic styles (preserve position styles)
            element.style.borderColor = `rgba(${rgb}, ${shadowOpacity})`;
            element.style.boxShadow = `0 0 ${glowSize}px rgba(${rgb}, ${shadowOpacity}), inset 0 0 10px rgba(${rgb}, 0.3)`;
            element.style.background = `rgba(${rgb}, ${opacity})`;
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
        cameraUp.applyQuaternion(camera.quaternion);

        // Project direction onto screen space
        const forward = direction.dot(cameraForward);
        const right = direction.dot(cameraRight);
        const up = direction.dot(cameraUp);

        // Calculate screen coordinates (center is 0,0)
        let screenX, screenY;

        if (forward > 0.1) {
            // Ghost is in front - project to screen space
            screenX = (right / forward) * (viewportWidth / 2);
            screenY = -(up / forward) * (viewportHeight / 2);
        } else {
            // Ghost is behind or beside camera - use direction directly
            screenX = right * viewportWidth;
            screenY = -up * viewportHeight;
        }

        // Clamp to viewport edges with padding
        const padding = this.edgePadding + this.indicatorSize / 2;
        const maxX = viewportWidth / 2 - padding;
        const maxY = viewportHeight / 2 - padding;

        // Project to edge of screen (not just scale uniformly)
        // Find where the line from center to (screenX, screenY) intersects the edge
        if (Math.abs(screenX) > 0.001 || Math.abs(screenY) > 0.001) {
            const scaleX = Math.abs(screenX) > 0.001 ? maxX / Math.abs(screenX) : Infinity;
            const scaleY = Math.abs(screenY) > 0.001 ? maxY / Math.abs(screenY) : Infinity;
            const scale = Math.min(scaleX, scaleY, 1);

            if (scale < 1) {
                screenX *= scale;
                screenY *= scale;
            }
        }

        // Convert to absolute coordinates (top-left origin)
        const absoluteX = viewportWidth / 2 + screenX - this.indicatorSize / 2;
        const absoluteY = viewportHeight / 2 + screenY - this.indicatorSize / 2;

        return { x: absoluteX, y: absoluteY };
    }

    /**
     * Add pulse animation CSS if not already present
     */
    addPulseAnimation() {
        if (document.getElementById('ghost-tracker-styles')) {
            return;
        }

        const cfg = HUD_CONFIG;
        const rgb = cfg.INDICATOR_COLOR_RGB;
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
                    border-color: rgba(${rgb}, 0.3);
                }
                50% {
                    border-color: rgba(${rgb}, 0.8);
                }
            }

            .ghost-tracker-edge {
                border-top: 2px solid rgba(${rgb}, 0.3);
                border-bottom: 2px solid rgba(${rgb}, 0.3);
            }

            .ghost-tracker-top, .ghost-tracker-bottom {
                border-left: 1px solid rgba(${rgb}, 0.2);
                border-right: 1px solid rgba(${rgb}, 0.2);
            }

            .ghost-tracker-left, .ghost-tracker-right {
                border-top: 1px solid rgba(${rgb}, 0.2);
                border-bottom: 1px solid rgba(${rgb}, 0.2);
            }

            .ghost-tracker-indicator:hover {
                box-shadow: 0 0 20px rgba(${rgb}, 0.8), inset 0 0 15px rgba(${rgb}, 0.6) !important;
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
