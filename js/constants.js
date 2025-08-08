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
    maxFallHeight: 64,
    climbHeight: 5,
    gravity: 1,
    walkSpeed: 0.4,
    floaterGravityMultiplier: 0.5
};

// Building constants
const BUILDING = {
    tileWidth: 6,
    tileHeight: 3,
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

const commonColors = {
    terrainBrown: '#8B4513'
}

const LEVEL_EDITOR = {
    BASIC_TOOLS: {
        EXIT_WIDTH: 40,
        EXIT_HEIGHT: 26,
        SPAWN_WIDTH: 40,
        SPAWN_HEIGHT: 30

    }
}