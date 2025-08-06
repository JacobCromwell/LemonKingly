// js/animationController.js - Add support for one-time animations

class AnimationController {
    constructor() {
        this.currentAnimation = 'walk';
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameRate = 8; // 8 frames per second
        this.frameDuration = 1000 / this.frameRate; // milliseconds per frame
        this.lastFrameTime = Date.now();
        this.isAnimating = true;
        
        // NEW: Support for one-time animations
        this.isLooping = true; // Most animations loop
        this.hasCompleted = false; // Track if non-looping animation completed
        
        // Animation state mappings (existing code)
        this.stateAnimations = {
            [LemmingState.WALKING]: 'walk',
            [LemmingState.FALLING]: 'fall',
            [LemmingState.CLIMBING]: 'climb',
            [LemmingState.BLOCKING]: 'block',
            [LemmingState.BASHING]: 'bash',
            [LemmingState.DIGGING]: 'dig',
            [LemmingState.BUILDING]: 'build',
            [LemmingState.MINING]: 'mine',
            [LemmingState.EXPLODING]: 'walk',
            [LemmingState.DEAD]: null
        };
        
        // Death type to animation mapping (existing code)
        this.deathAnimations = {
            fall: 'deathFall',
            drown: 'deathDrown',
            chop: 'deathChop',
            explode: 'deathExplode',
            default: 'deathFall'
        };
        
        // Track death animation completion (existing code)
        this.deathAnimationComplete = false;
        this.deathType = null;
    }

    updateAnimationState(lemmingState, lemming) {
        let newAnimation = this.stateAnimations[lemmingState];
        
        if (lemmingState === LemmingState.FALLING && lemming.isFloater) {
            newAnimation = 'float';
        }
        
        if (lemmingState === LemmingState.DEAD && this.deathType) {
            newAnimation = this.deathAnimations[this.deathType] || this.deathAnimations.default;
        }
        
        if (newAnimation !== this.currentAnimation) {
            this.currentAnimation = newAnimation;
            this.currentFrame = 0;
            this.frameTimer = 0;
            this.lastFrameTime = Date.now();
            this.isLooping = true; // Lemming animations are typically looping
            this.hasCompleted = false;
            
            if (newAnimation && newAnimation.startsWith('death')) {
                this.deathAnimationComplete = false;
            }
        }
    }
    
    // NEW: Set animation as one-time (non-looping)
    setOneTimeAnimation(animationKey) {
        this.currentAnimation = animationKey;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.lastFrameTime = Date.now();
        this.isAnimating = true;
        this.isLooping = false;
        this.hasCompleted = false;
    }
    
    // NEW: Set animation as looping (default behavior)
    setLoopingAnimation(animationKey) {
        this.currentAnimation = animationKey;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.lastFrameTime = Date.now();
        this.isAnimating = true;
        this.isLooping = true;
        this.hasCompleted = false;
    }
    
    // UPDATED: Update animation frame timing with one-time support
    update() {
        if (!this.isAnimating || !this.currentAnimation || this.hasCompleted) {
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
            
            // Handle frame wrapping/completion
            if (this.currentFrame >= frameCount) {
                if (this.isLooping) {
                    // Loop animation - restart from frame 0
                    this.currentFrame = 0;
                } else {
                    // One-time animation - stop at last frame and mark complete
                    this.currentFrame = frameCount - 1;
                    this.hasCompleted = true;
                    this.isAnimating = false;
                }
            }
            
            // Special handling for death animations (existing code)
            if (this.currentAnimation.startsWith('death') && this.currentFrame >= frameCount - 1) {
                this.deathAnimationComplete = true;
                this.isAnimating = false;
            }
            
            return true;
        }
        
        return false;
    }
    
    // NEW: Check if one-time animation has completed
    isCompleted() {
        return this.hasCompleted;
    }
    
    // UPDATED: Reset method with one-time animation support
    reset() {
        this.currentAnimation = 'walk';
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.lastFrameTime = Date.now();
        this.isAnimating = true;
        this.isLooping = true;
        this.hasCompleted = false;
        this.deathAnimationComplete = false;
        this.deathType = null;
    }
    
    setDeathType(type) {
        this.deathType = type;
    }
    
    getCurrentFrame() {
        return this.currentFrame;
    }
    
    getCurrentAnimation() {
        return this.currentAnimation;
    }
    
    isDeathAnimationComplete() {
        return this.deathAnimationComplete;
    }
    
    pause() {
        this.isAnimating = false;
    }
    
    resume() {
        this.isAnimating = true;
        this.lastFrameTime = Date.now();
    }
    
    setFrameRate(fps) {
        this.frameRate = fps;
        this.frameDuration = 1000 / fps;
    }
}

// Export globally
window.AnimationController = AnimationController;