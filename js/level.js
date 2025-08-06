class Level {
    constructor() {
        // Default spawn/exit positions - will be overridden when loading custom level
        this.spawnX = 100;
        this.spawnY = 100;
        this.exitX = 700;
        this.exitY = 350;
        
        // UPDATED: Smaller exit size
        this.exitWidth = LEVEL_EDITOR.BASIC_TOOLS.EXIT_WIDTH;
        this.exitHeight = LEVEL_EDITOR.BASIC_TOOLS.EXIT_HEIGHT;
        
        this.totalLemmings = 20;
        this.requiredLemmings = 10;
        this.spawnRate = 2000; // milliseconds
        this.actionCounts = {
            [ActionType.BLOCKER]: 50,
            [ActionType.BASHER]: 50,
            [ActionType.DIGGER]: 50,
            [ActionType.BUILDER]: 50,
            [ActionType.CLIMBER]: 50,
            [ActionType.FLOATER]: 50,
            [ActionType.EXPLODER]: 50,
            [ActionType.MINER]: 50
        };
        this.hazards = [];

        // NEW: Animation controllers for spawn and exit
        this.spawnAnimationController = new AnimationController();
        this.exitAnimationController = new AnimationController();
        
        // NEW: Spawn animation state
        this.spawnAnimationPlayed = false;
        this.spawnAnimationStarted = false;
    }

    // NEW: Start the spawn animation (call this when the level begins)
    startSpawnAnimation() {
        if (!this.spawnAnimationStarted) {
            this.spawnAnimationStarted = true;
            this.spawnAnimationController.currentAnimation = 'spawn';
            this.spawnAnimationController.currentFrame = 0;
            this.spawnAnimationController.frameTimer = 0;
            this.spawnAnimationController.lastFrameTime = Date.now();
            this.spawnAnimationController.isAnimating = true;
            console.log('Spawn animation started');
        }
    }

    // NEW: Initialize exit animation (continuous loop)
    initializeExitAnimation() {
        this.exitAnimationController.currentAnimation = 'exit';
        this.exitAnimationController.currentFrame = 0;
        this.exitAnimationController.frameTimer = 0;
        this.exitAnimationController.lastFrameTime = Date.now();
        this.exitAnimationController.isAnimating = true;
        this.exitAnimationController.setFrameRate(6); // Slightly slower for exit
    }

    // NEW: Update animations
    updateAnimations() {
        // Update spawn animation (only if started and not completed)
        if (this.spawnAnimationStarted && !this.spawnAnimationPlayed) {
            const frameAdvanced = this.spawnAnimationController.update();
            
            // Check if spawn animation completed
            const sprite = window.spriteManager?.getSprite('spawn');
            const frameCount = sprite?.frames || 4;
            
            if (this.spawnAnimationController.currentFrame >= frameCount - 1) {
                // Animation completed, stop it on final frame
                this.spawnAnimationController.isAnimating = false;
                this.spawnAnimationController.currentFrame = frameCount - 1; // Stay on final frame
                this.spawnAnimationPlayed = true;
                console.log('Spawn animation completed, staying on final frame');
            }
        }

        // Update exit animation (continuous)
        this.exitAnimationController.update();
    }
    
    updateHazards() {
        this.hazards.forEach(hazard => hazard.update());
    }
    
    drawHazards(ctx) {
        this.hazards.forEach(hazard => hazard.draw(ctx));
    }
    
    checkHazardCollisions(lemming) {
        for (let hazard of this.hazards) {
            if (hazard.checkCollision(lemming)) {
                hazard.killLemming(lemming);
                break; // One hazard kill per frame
            }
        }
    }
    
    // UPDATED: Draw exit with animation support
    drawExit(ctx) {
        // Check if we have exit sprite animation
        if (window.spriteManager && window.spriteManager.getSprite('exit')) {
            const animationKey = 'exit';
            const frameIndex = this.exitAnimationController.getCurrentFrame();
            
            // Draw animated exit sprite centered on exit position
            window.spriteManager.drawFrame(
                ctx,
                animationKey,
                frameIndex,
                this.exitX + this.exitWidth / 2,  // Center X
                this.exitY,                       // Top Y
                1.0,                             // Scale
                false                            // No flip
            );
        } else {
            // Fallback to colored rectangle
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(this.exitX, this.exitY, this.exitWidth, this.exitHeight);
            
            ctx.strokeStyle = '#2E7D32';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.exitX, this.exitY, this.exitWidth, this.exitHeight);
            
            // Add "EXIT" text
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('EXIT', this.exitX + this.exitWidth/2, this.exitY + this.exitHeight/2 + 3);
        }
    }
    
    // UPDATED: Draw spawner with animation support
    drawSpawner(ctx) {
        // Draw spawn animation if it has started (either animating or on final frame)
        const shouldDrawAnimation = this.spawnAnimationStarted;
        
        if (shouldDrawAnimation && window.spriteManager && window.spriteManager.getSprite('spawn')) {
            const animationKey = 'spawn';
            const frameIndex = this.spawnAnimationController.getCurrentFrame();
            
            // Draw animated spawn sprite centered on spawn position
            window.spriteManager.drawFrame(
                ctx,
                animationKey,
                frameIndex,
                this.spawnX,      // Center X
                this.spawnY - 15, // Slightly above spawn point
                1.0,              // Scale
                false             // No flip
            );
        } else if (!this.spawnAnimationStarted) {
            // Fallback to colored rectangle (only if animation hasn't started yet)
            const spawnerWidth = 20;
            const spawnerHeight = 15;

            ctx.fillStyle = '#2196F3';
            ctx.fillRect(this.spawnX - spawnerWidth/2, this.spawnY - spawnerHeight, spawnerWidth, spawnerHeight);
            
            ctx.strokeStyle = '#1565C0';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.spawnX - spawnerWidth/2, this.spawnY - spawnerHeight, spawnerWidth, spawnerHeight);
        }
        // Now spawner always shows either the fallback or the animated sprite (including final frame)
    }
    
    isAtExit(lemming) {
        return lemming.x >= this.exitX && 
               lemming.x <= this.exitX + this.exitWidth &&
               lemming.y >= this.exitY && 
               lemming.y <= this.exitY + this.exitHeight;
    }
}