// Game Constants
const LEMMING_HEIGHT = 20;
const LEMMING_WIDTH = 10;
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
    BUILDER: 'builder'
};

// Lemming states
const LemmingState = {
    WALKING: 'walking',
    FALLING: 'falling',
    BLOCKING: 'blocking',
    BASHING: 'bashing',
    DIGGING: 'digging',
    BUILDING: 'building',
    DEAD: 'dead',
    SAVED: 'saved'
};