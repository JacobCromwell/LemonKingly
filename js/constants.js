// Game Constants - Centralized configuration

// Lemming configuration
const LEMMING_CONFIG = {
    baseZoom: 2.8,    // 126% zoom where lemmings are their base size
    baseWidth: 6,     // Width at base zoom
    baseHeight: 10,   // Height at base zoom
    
    // Dynamic size calculations
    getWidth: (zoom) => (LEMMING_CONFIG.baseWidth * zoom) / LEMMING_CONFIG.baseZoom,
    getHeight: (zoom) => (LEMMING_CONFIG.baseHeight * zoom) / LEMMING_CONFIG.baseZoom
};

// Physics constants
const PHYSICS = {
    maxFallHeight: 60,
    climbHeight: 10,
    gravity: 2,
    walkSpeed: 1,
    floaterGravityMultiplier: 0.5
};

// Building constants
const BUILDING = {
    tileWidth: 4,
    tileHeight: 2,
    maxTiles: 12,
    tileDelay: 700 // The delay in milliseconds (1 second) between placing each tile.
};

// Mining constants
const MINING = {
    swingDuration: 60,      // 1 second at 60 FPS
    angle: 35,              // degrees
    progressPerSwing: 2     // pixels to move forward/down per swing
};

// Action types enum
const ActionType = {
    NONE: 'none',
    BLOCKER: 'blocker',
    BASHER: 'basher',
    DIGGER: 'digger',
    BUILDER: 'builder',
    CLIMBER: 'climber',
    FLOATER: 'floater',
    EXPLODER: 'exploder',
    MINER: 'miner',
    NUKE: 'nuke'
};

// Lemming states enum
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

// Export for global access
window.LEMMING_CONFIG = LEMMING_CONFIG;
window.PHYSICS = PHYSICS;
window.BUILDING = BUILDING;
window.MINING = MINING;
window.ActionType = ActionType;
window.LemmingState = LemmingState;

// Legacy support (deprecated - will be removed in future)
window.LEMMING_HEIGHT = LEMMING_CONFIG.baseHeight;
window.LEMMING_WIDTH = LEMMING_CONFIG.baseWidth;
window.MAX_FALL_HEIGHT = PHYSICS.maxFallHeight;
window.CLIMB_HEIGHT = PHYSICS.climbHeight;
window.GRAVITY = PHYSICS.gravity;
window.WALK_SPEED = PHYSICS.walkSpeed;
window.BUILD_TILE_WIDTH = BUILDING.tileWidth;
window.BUILD_TILE_HEIGHT = BUILDING.tileHeight;
window.MAX_BUILD_TILES = BUILDING.maxTiles;
window.MINER_SWING_DURATION = MINING.swingDuration;
window.MINER_ANGLE = MINING.angle;
window.MINER_PROGRESS_PER_SWING = MINING.progressPerSwing;