// Game Constants
const LEMMING_BASE_ZOOM = 1.26; // 126% zoom where lemmings are their base size
const LEMMING_BASE_HEIGHT = 10; // Height at base zoom (126%)
const LEMMING_BASE_WIDTH = 8; // Width at base zoom (126%)

// Dynamic lemming size functions
function getLemmingWidth(zoom) {
    return (LEMMING_BASE_WIDTH * zoom) / LEMMING_BASE_ZOOM;
}

function getLemmingHeight(zoom) {
    return (LEMMING_BASE_HEIGHT * zoom) / LEMMING_BASE_ZOOM;
}

// Make functions globally available
window.getLemmingWidth = getLemmingWidth;
window.getLemmingHeight = getLemmingHeight;
window.LEMMING_BASE_ZOOM = LEMMING_BASE_ZOOM;
window.LEMMING_BASE_WIDTH = LEMMING_BASE_WIDTH;
window.LEMMING_BASE_HEIGHT = LEMMING_BASE_HEIGHT;

// Legacy constants for backward compatibility (will be calculated dynamically)
const LEMMING_HEIGHT = LEMMING_BASE_HEIGHT; // 10px at base zoom
const LEMMING_WIDTH = LEMMING_BASE_WIDTH; // 8px at base zoom

const MAX_FALL_HEIGHT = 1000;
const CLIMB_HEIGHT = 10;
const GRAVITY = 2;
const WALK_SPEED = 1;
const BUILD_TILE_WIDTH = 4;
const BUILD_TILE_HEIGHT = 2;
const MAX_BUILD_TILES = 20;

// Action types
const ActionType = {
    NONE: 'none',
    BLOCKER: 'blocker',
    BASHER: 'basher',
    DIGGER: 'digger',
    BUILDER: 'builder',
    CLIMBER: 'climber'
};

// Lemming states
const LemmingState = {
    WALKING: 'walking',
    FALLING: 'falling',
    BLOCKING: 'blocking',
    BASHING: 'bashing',
    DIGGING: 'digging',
    BUILDING: 'building',
    CLIMBING: 'climbing',
    DEAD: 'dead',
    SAVED: 'saved'
};

// Make MAX_FALL_HEIGHT available globally for editor
window.MAX_FALL_HEIGHT = MAX_FALL_HEIGHT;