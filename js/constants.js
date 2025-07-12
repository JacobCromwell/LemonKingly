// Game Constants

// When adding new actions, update:
// 1. ActionType enum below
// 2. ACTIONS object above  
// 3. lemming.js - applyAction() and draw()
// 4. audioManager.js - generateSoundEffects()
// 5. index.html - toolbar button
// 6. level.js - default actionCounts
// 7. game.js - loadCustomLevel() fallbacks

const LEMMING_BASE_ZOOM = 2.8; // 126% zoom where lemmings are their base size
const LEMMING_BASE_HEIGHT = 10; // Height at base zoom (126%)
const LEMMING_BASE_WIDTH = 6; // Width at base zoom (126%)

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

const MAX_FALL_HEIGHT = 60;
const CLIMB_HEIGHT = 10;
const GRAVITY = 2;
const WALK_SPEED = 1;
const BUILD_TILE_WIDTH = 4;
const BUILD_TILE_HEIGHT = 2;
const MAX_BUILD_TILES = 12;

// Miner constants
const MINER_SWING_DURATION = 60; // 1 second at 60 FPS
const MINER_ANGLE = 35; // degrees (gentler than 45 for better gameplay)
const MINER_PROGRESS_PER_SWING = 2; // pixels to move forward/down per swing - reduced for gradual progress

// Action types
const ActionType = {
    NONE: 'none',
    BLOCKER: 'blocker',
    BASHER: 'basher',
    DIGGER: 'digger',
    BUILDER: 'builder',
    CLIMBER: 'climber',
    FLOATER: 'floater',
    EXPLODER: 'exploder',
    MINER: 'miner'
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
    EXPLODING: 'exploding',
    MINING: 'mining',
    DEAD: 'dead',
    SAVED: 'saved'
};

// Make MAX_FALL_HEIGHT available globally for editor
window.MAX_FALL_HEIGHT = MAX_FALL_HEIGHT;