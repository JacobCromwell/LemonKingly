// js/animationController.js - Manages animation states and frame timing

class AnimationController {
    constructor() {
        this.currentAnimation = 'walk';
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameRate = 8; // 8 frames per second
        this.frameDuration = 1000 / this.frameRate; // milliseconds per frame
        this.lastFrameTime = Date.now();
        this.isAnimating = true;
        
        // Animation state mappings
        this.stateAnimations = {
            [LemmingState.WALKING]: 'walk',
            [LemmingState.FALLING]: 'fall',
            [LemmingState.CLIMBING]: 'climb',
            [LemmingState.BLOCKING]: 'block',
            [LemmingState.BASHING]: 'bash',
            [LemmingState.DIGGING]: 'dig',
            [LemmingState.BUILDING]: 'build',
            [LemmingState.MINING]: 'mine',
            [LemmingState.EXPLODING]: 'walk', // Use walk animation with countdown overlay
            [LemmingState.DEAD]: null // Will be set based on death type
        };
        
        // Death type to animation mapping
        this.deathAnimations = {
            fall: 'deathFall',
            drown: 'deathDrown',
            chop: 'deathChop',
            explode: 'deathExplode',
            default: 'deathFall' // Fallback
        };
        
        // Track death animation completion
        this.deathAnimationComplete = false;
        this.deathType = null;
    }
    
    /**
     * Update animation state based on lemming state
     * @param {string} lemmingState - Current lemming state
     * @param {Object} lemming - Reference to lemming for special cases
     */
    updateAnimationState(lemmingState, lemming) {
        let newAnimation = this.stateAnimations[lemmingState];
        
        // Special cases
        if (lemmingState === LemmingState.FALLING && lemming.isFloater) {
            newAnimation = 'float';
        }
        
        if (lemmingState === LemmingState.EXPLODING && lemming.explosionTimer <= 1) {
            newAnimation = 'explodeCountdown';
        }
        
        if (lemmingState === LemmingState.DEAD && this.deathType) {
            newAnimation = this.deathAnimations[this.deathType] || this.deathAnimations.default;
        }
        
        // Reset frame if animation changed
        if (newAnimation !== this.currentAnimation) {
            this.currentAnimation = newAnimation;
            this.currentFrame = 0;
            this.frameTimer = 0;
            this.lastFrameTime = Date.now();
            
            // For death animations, track completion
            if (newAnimation && newAnimation.startsWith('death')) {
                this.deathAnimationComplete = false;
            }
        }
    }
    
    /**
     * Set death type for death animation selection
     * @param {string} type - Type of death (fall, drown, chop, explode)
     */
    setDeathType(type) {
        this.deathType = type;
    }
    
    /**
     * Update animation frame timing
     * @returns {boolean} True if frame advanced
     */
    update() {
        if (!this.isAnimating || !this.currentAnimation) {
            return false;
        }
        
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastFrameTime;
        
        if (deltaTime >= this.frameDuration) {
            // Advance frame
            this.currentFrame++;
            this.lastFrameTime = currentTime;
            
            // Get sprite data to know frame count
            const sprite = window.spriteManager?.getSprite(this.currentAnimation);
            const frameCount = sprite?.frames || 4;
            
            // Handle frame wrapping
            if (this.currentFrame >= frameCount) {
                // For death animations, stop at last frame
                if (this.currentAnimation.startsWith('death')) {
                    this.currentFrame = frameCount - 1;
                    this.deathAnimationComplete = true;
                    this.isAnimating = false;
                } else {
                    // Loop other animations
                    this.currentFrame = 0;
                }
            }
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Get current frame index
     * @returns {number} Current frame (0-based)
     */
    getCurrentFrame() {
        return this.currentFrame;
    }
    
    /**
     * Get current animation key
     * @returns {string} Current animation sprite key
     */
    getCurrentAnimation() {
        return this.currentAnimation;
    }
    
    /**
     * Check if death animation has completed
     * @returns {boolean} True if death animation is complete
     */
    isDeathAnimationComplete() {
        return this.deathAnimationComplete;
    }
    
    /**
     * Reset animation state
     */
    reset() {
        this.currentAnimation = 'walk';
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.lastFrameTime = Date.now();
        this.isAnimating = true;
        this.deathAnimationComplete = false;
        this.deathType = null;
    }
    
    /**
     * Pause animation
     */
    pause() {
        this.isAnimating = false;
    }
    
    /**
     * Resume animation
     */
    resume() {
        this.isAnimating = true;
        this.lastFrameTime = Date.now();
    }
    
    /**
     * Set animation speed (frames per second)
     * @param {number} fps - Frames per second
     */
    setFrameRate(fps) {
        this.frameRate = fps;
        this.frameDuration = 1000 / fps;
    }
}

// Export globally
window.AnimationController = AnimationController;