// Enhanced Hazard class with animated sprite support
class Hazard {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.animationFrame = 0;
        this.animationSpeed = 0.1;
        this.triggered = false;
        this.triggerTime = 0;
        
        // Animation controller for synchronized animations
        this.animationController = new AnimationController();
        this.setupAnimation();
        
        // Generate random frame offsets for tiled animations
        this.tileFrameOffsets = this.generateTileFrameOffsets();
    }
    
    setupAnimation() {
        // Map hazard types to their sprite animations
        const animationMap = {
            'lava': 'hazardLava',
            'acid': 'hazardAcid',
            'water': 'hazardWater'
        };
        
        if (animationMap[this.type]) {
            this.animationController.currentAnimation = animationMap[this.type];
            this.animationController.currentFrame = 0;
            this.animationController.frameTimer = 0;
            this.animationController.lastFrameTime = Date.now();
            this.animationController.isAnimating = true;
            this.animationController.setFrameRate(4); // Slower animation for hazards
        }
    }
    
    generateTileFrameOffsets() {
        // Calculate how many tiles we'll need
        const tileWidth = 32; // Based on sprite width
        const tilesNeeded = Math.ceil(this.width / tileWidth);
        
        // Generate random offsets for each tile
        const offsets = [];
        for (let i = 0; i < tilesNeeded; i++) {
            offsets.push(Math.floor(Math.random() * 4)); // 4 frames available
        }
        
        return offsets;
    }
    
    update() {
        this.animationFrame += this.animationSpeed;
        
        // Update animation controller for sprite-based hazards
        if (this.animationController.currentAnimation) {
            this.animationController.update();
        }
        
        // Update specific hazard animations
        switch(this.type) {
            case 'bearTrap':
                // Bear trap snaps shut when triggered
                if (this.triggered && this.triggerTime < 10) {
                    this.triggerTime++;
                }
                break;
        }
    }
    
    checkCollision(lemming) {
        // Check if lemming is within hazard bounds
        return lemming.x > this.x - this.width/2 && 
               lemming.x < this.x + this.width/2 &&
               lemming.y + lemming.getHeight() > this.y - this.height/2 && 
               lemming.y < this.y + this.height/2;
    }
    
    killLemming(lemming) {
        if (lemming.state === LemmingState.DEAD || lemming.state === LemmingState.SAVED) {
            return;
        }
        
        lemming.setDead();
        
        // Only create particles for non-liquid hazards
        if (window.particleManager && this.type !== 'lava' && this.type !== 'acid' && this.type !== 'water') {
            switch(this.type) {
                case 'bearTrap':
                    this.triggered = true;
                    this.triggerTime = 0;
                    window.particleManager.createTrapParticles(lemming.x, lemming.y + lemming.getHeight()/2);
                    break;
                    
                case 'spikes':
                    window.particleManager.createSpikeParticles(lemming.x, lemming.y + lemming.getHeight());
                    break;
            }
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        switch(this.type) {
            case 'lava':
            case 'acid':
            case 'water':
                this.drawAnimatedHazard(ctx);
                break;
            case 'bearTrap':
                this.drawBearTrap(ctx);
                break;
            case 'spikes':
                this.drawSpikes(ctx);
                break;
        }
        
        ctx.restore();
    }
    
    drawAnimatedHazard(ctx) {
        // Map hazard types to their sprite keys
        const spriteMap = {
            'lava': 'hazardLava',
            'acid': 'hazardAcid',
            'water': 'hazardWater'
        };
        
        const spriteKey = spriteMap[this.type];
        
        // Check if we have the sprite animation
        if (window.spriteManager && window.spriteManager.getSprite(spriteKey)) {
            const frameIndex = this.animationController.getCurrentFrame();
            
            // Use the tiled sprite drawing method with random offsets
            window.spriteManager.drawTiledSpriteWithOffsets(
                ctx,
                spriteKey,
                frameIndex,
                this.x - this.width/2,  // Left edge
                this.y - this.height/2,  // Top edge
                this.width,              // Total width to fill
                this.height,             // Total height (will stretch vertically if > 40px)
                this.tileFrameOffsets    // Pass the random offsets
            );
        } else {
            // Fallback to colored rectangle if sprite not available
            this.drawFallback(ctx);
        }
    }
    
    drawFallback(ctx) {
        // Fallback colors for when sprites aren't loaded
        const colors = {
            'lava': '#ff3300',
            'acid': '#00ff00',
            'water': '#0099ff'
        };
        
        ctx.fillStyle = colors[this.type] || '#ff00ff';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Add some visual interest to the fallback
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        const waveOffset = Math.sin(this.animationFrame) * 3;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2 + waveOffset, this.width, 3);
    }
    
    drawLava(ctx) {
        // Legacy lava drawing - now handled by drawAnimatedHazard
        this.drawAnimatedHazard(ctx);
    }
    
    drawBearTrap(ctx) {
        const trapOpen = !this.triggered || this.triggerTime < 5;
        
        // Base
        ctx.fillStyle = '#444444';
        ctx.fillRect(this.x - this.width/2, this.y, this.width, 4);
        
        if (trapOpen) {
            // Open jaws
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 2;
            
            // Left jaw
            ctx.beginPath();
            ctx.moveTo(this.x - this.width/2, this.y);
            ctx.lineTo(this.x - this.width/4, this.y - this.height/2);
            ctx.lineTo(this.x, this.y);
            ctx.stroke();
            
            // Right jaw
            ctx.beginPath();
            ctx.moveTo(this.x + this.width/2, this.y);
            ctx.lineTo(this.x + this.width/4, this.y - this.height/2);
            ctx.lineTo(this.x, this.y);
            ctx.stroke();
            
            // Teeth
            ctx.fillStyle = '#cccccc';
            for (let i = 0; i < 4; i++) {
                // Left teeth
                const leftX = this.x - this.width/2 + i * (this.width/8);
                ctx.beginPath();
                ctx.moveTo(leftX, this.y - 2);
                ctx.lineTo(leftX + 3, this.y - 6);
                ctx.lineTo(leftX + 6, this.y - 2);
                ctx.fill();
                
                // Right teeth
                const rightX = this.x + this.width/2 - i * (this.width/8);
                ctx.beginPath();
                ctx.moveTo(rightX, this.y - 2);
                ctx.lineTo(rightX - 3, this.y - 6);
                ctx.lineTo(rightX - 6, this.y - 2);
                ctx.fill();
            }
        } else {
            // Closed jaws
            ctx.fillStyle = '#666666';
            ctx.fillRect(this.x - this.width/2, this.y - 5, this.width, 5);
            
            // Blood effect
            if (this.triggerTime < 10) {
                ctx.fillStyle = '#cc0000';
                ctx.globalAlpha = 1 - this.triggerTime / 10;
                ctx.fillRect(this.x - this.width/2, this.y - 8, this.width, 3);
                ctx.globalAlpha = 1;
            }
        }
    }
    
    drawSpikes(ctx) {
        // Draw spike pit
        ctx.fillStyle = '#333333';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Draw individual spikes
        ctx.fillStyle = '#999999';
        const spikeCount = Math.floor(this.width / 8);
        
        for (let i = 0; i < spikeCount; i++) {
            const spikeX = this.x - this.width/2 + (i + 0.5) * (this.width / spikeCount);
            const wobble = Math.sin(this.animationFrame + i) * 1;
            
            ctx.beginPath();
            ctx.moveTo(spikeX - 3, this.y + this.height/2);
            ctx.lineTo(spikeX, this.y - this.height/2 + wobble);
            ctx.lineTo(spikeX + 3, this.y + this.height/2);
            ctx.fill();
        }
        
        // Metallic shine
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        for (let i = 0; i < spikeCount; i++) {
            const spikeX = this.x - this.width/2 + (i + 0.5) * (this.width / spikeCount);
            const wobble = Math.sin(this.animationFrame + i) * 1;
            ctx.beginPath();
            ctx.moveTo(spikeX, this.y - this.height/2 + wobble);
            ctx.lineTo(spikeX + 1, this.y - this.height/2 + wobble + 5);
            ctx.stroke();
        }
    }
    
    // Static method to synchronize all hazard animations (call once per frame)
    static synchronizeAnimations(hazards) {
        // Use a global animation timer based on current time
        const globalFrame = Math.floor((Date.now() / 250) % 4); // 4 frames, 250ms per frame
        
        hazards.forEach(hazard => {
            if (hazard.animationController && hazard.animationController.currentAnimation) {
                hazard.animationController.currentFrame = globalFrame;
            }
        });
    }
}