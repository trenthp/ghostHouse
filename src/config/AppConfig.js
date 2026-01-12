/**
 * Centralized application configuration
 * Single source of truth for all game constants and settings
 */

export const APP_CONFIG = {
    // ==================== AR / PERMISSIONS ====================
    ar: {
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
    },

    // ==================== GHOST MANAGER ====================
    ghostManager: {
        // Spawning
        MAX_GHOSTS: 4, // Maximum concurrent ghosts (4 total for the game)
        SPAWN_RATE: 2, // seconds between ghost spawns
        SPAWN_HEIGHT_BASE: 0.8, // base height for ghost spawning (eye level - camera is at 1.6m)
        SPAWN_HEIGHT_VARIANCE: 0.6, // small variance around eye level

        // Spawn distance (relative to target location)
        SPAWN_RADIUS: 2, // 2 meters radius around target (tight cluster)
        MIN_SPAWN_DISTANCE: 0.5, // Minimum 0.5 meters from target location
        MAX_SPAWN_DISTANCE: 2, // Maximum 2 meters from target location
        MIN_SPAWN_DISTANCE_FROM_CAMERA: 1.5, // Minimum safe distance from user (prevents spawning at user)
        SPAWN_POSITION_ATTEMPTS: 10, // Max attempts to find valid spawn position

        // Visibility
        VISIBILITY_RADIUS: 50, // meters - remove ghosts beyond this distance from target
    },

    // ==================== GHOST INDIVIDUAL ====================
    ghost: {
        HOVER_SPEED_MIN: 0.15,
        HOVER_SPEED_MAX: 0.25,
        BOB_AMOUNT: 0.03, // Subtle vertical bob (3cm) - feels more anchored in AR
        BOB_SPEED: 0.6,
        HOVER_RADIUS_MIN: 0.03, // Minimal horizontal drift (3cm)
        HOVER_RADIUS_MAX: 0.08, // Max 8cm drift - ghosts stay mostly in place
        BODY_RADIUS: 0.35,
        BODY_HEIGHT: 0.8,
        EYE_RADIUS: 0.07,
        MOUTH_RADIUS: 0.06,
        AURA_RADIUS: 0.45,
        MAX_OPACITY: 0.8, // Maximum opacity for ghostly see-through effect

        // Distance maintenance from user
        MIN_DISTANCE_FROM_CAMERA: 1.0, // meters - keep at least 1m from user

        // Fade in/out behavior
        VISIBLE_DURATION_MIN: 2.0, // seconds - minimum time ghost stays visible
        VISIBLE_DURATION_MAX: 5.0, // seconds - maximum time ghost stays visible
        INVISIBLE_DURATION_MIN: 1.5, // seconds - minimum time ghost stays invisible
        INVISIBLE_DURATION_MAX: 3.0, // seconds - maximum time ghost stays invisible
        SPAWN_RADIUS: 0.5, // meters - small radius so ghosts reappear near same spot
    },

    // ==================== GAME ====================
    game: {
        SCORE_PER_SCARE: 1, // points earned per ghost scare
        WIN_SCORE_THRESHOLD: 8, // 4 ghosts × 2 scares each = 8 total scares to win
        LOCATION_ACTIVATION_DISTANCE: 50, // meters - ghosts spawn when within this distance
    },
};
