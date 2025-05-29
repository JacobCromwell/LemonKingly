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
    }
    
    update() {
        this.animationFrame += this.animationSpeed;
        
        // Update specific hazard animations
        switch(this.type) {
            case 'lava':
                // Lava bubbles continuously
                break;
            case 'bearTrap':
                // Bear trap snaps shut when triggered
                if (this.triggered && this.triggerTime < 10) {
                    this.triggerTime++;
                }
                break;
            case 'spikes':
                // Spikes animate slightly up/down
                break;
        }
    }
    
    checkCollision(lemming) {
        // Check if lemming is within hazard bounds
        return lemming.x > this.x - this.width/2 && 
               lemming.x < this.x + this.width/2 &&
               lemming.y + LEMMING_HEIGHT > this.y - this.height/2 && 
               lemming.y < this.y + this.height/2;
    }
    
    killLemming(lemming) {
        if (lemming.state === LemmingState.DEAD || lemming.state === LemmingState.SAVED) {
            return;
        }
        
        lemming.state = LemmingState.DEAD;
        
        // Create death particles based on hazard type
        if (window.game && window.game.particles) {
            switch(this.type) {
                case 'lava':
                    // Fire/ash particles
                    for (let i = 0; i < 25; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = Math.random() * 4 + 1;
                        window.game.particles.push(new Particle(
                            lemming.x,
                            lemming.y + LEMMING_HEIGHT/2,
                            i < 15 ? '#ff6600' : '#333333', // Orange fire and grey ash
                            Math.cos(angle) * speed * 0.5,
                            -Math.abs(Math.sin(angle) * speed) - 2 // Upward motion
                        ));
                    }
                    break;
                    
                case 'bearTrap':
                    // Blood splatter
                    this.triggered = true;
                    this.triggerTime = 0;
                    for (let i = 0; i < 15; i++) {
                        const angle = Math.random() * Math.PI - Math.PI/2; // Upward arc
                        const speed = Math.random() * 3 + 2;
                        window.game.particles.push(new Particle(
                            lemming.x,
                            lemming.y + LEMMING_HEIGHT/2,
                            '#cc0000',
                            Math.cos(angle) * speed,
                            Math.sin(angle) * speed
                        ));
                    }
                    break;
                    
                case 'spikes':
                    // Blood drops
                    for (let i = 0; i < 20; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = Math.random() * 2 + 1;
                        window.game.particles.push(new Particle(
                            lemming.x,
                            lemming.y + LEMMING_HEIGHT,
                            '#990000',
                            Math.cos(angle) * speed * 0.3,
                            Math.abs(Math.sin(angle) * speed)
                        ));
                    }
                    break;
            }
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        switch(this.type) {
            case 'lava':
                this.drawLava(ctx);
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
    
    drawLava(ctx) {
        // Draw lava pool
        ctx.fillStyle = '#ff3300';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Draw lava surface with bubbles
        const bubbleY = Math.sin(this.animationFrame) * 2;
        ctx.fillStyle = '#ff6600';
        
        // Animated bubbles
        for (let i = 0; i < 5; i++) {
            const bubbleX = this.x - this.width/2 + (i + 0.5) * (this.width / 5);
            const offset = Math.sin(this.animationFrame + i) * 3;
            ctx.beginPath();
            ctx.arc(bubbleX, this.y - this.height/2 + offset, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Glowing effect
        ctx.fillStyle = '#ffaa00';
        ctx.globalAlpha = 0.5 + Math.sin(this.animationFrame * 2) * 0.2;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, 3);
        ctx.globalAlpha = 1;
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
}