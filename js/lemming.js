class Lemming {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = 1; // 1 = right, -1 = left
        this.state = LemmingState.FALLING;
        this.fallDistance = 0;
        this.action = ActionType.NONE;
        this.actionProgress = 0;
        this.buildTilesPlaced = 0;
    }
    
    update(terrain, lemmings) {
        if (this.state === LemmingState.DEAD || this.state === LemmingState.SAVED) {
            return;
        }
        
        switch (this.state) {
            case LemmingState.WALKING:
                this.walk(terrain, lemmings);
                break;
            case LemmingState.FALLING:
                this.fall(terrain);
                break;
            case LemmingState.BLOCKING:
                // Blockers don't move
                break;
            case LemmingState.BASHING:
                this.bash(terrain);
                break;
            case LemmingState.DIGGING:
                this.dig(terrain);
                break;
            case LemmingState.BUILDING:
                this.build(terrain);
                break;
        }
    }
    
    walk(terrain, lemmings) {
        // Check for ground
        if (!terrain.hasGround(this.x, this.y + LEMMING_HEIGHT)) {
            this.state = LemmingState.FALLING;
            this.fallDistance = 0;
            return;
        }
        
        // Check for other blocking lemmings
        const nextX = this.x + this.direction * WALK_SPEED;
        const blocker = lemmings.find(l => 
            l !== this && 
            l.state === LemmingState.BLOCKING &&
            Math.abs(l.x - nextX) < LEMMING_WIDTH &&
            Math.abs(l.y - this.y) < LEMMING_HEIGHT
        );
        
        if (blocker) {
            this.direction *= -1;
            return;
        }
        
        // Check for obstacles
        const obstacleHeight = terrain.getObstacleHeight(nextX, this.y);
        if (obstacleHeight > CLIMB_HEIGHT) {
            this.direction *= -1;
        } else if (obstacleHeight > 0) {
            // Climb
            this.y -= obstacleHeight;
            this.x = nextX;
        } else {
            this.x = nextX;
        }
    }
    
    fall(terrain) {
        this.y += GRAVITY;
        this.fallDistance += GRAVITY;
        
        if (terrain.hasGround(this.x, this.y + LEMMING_HEIGHT)) {
            if (this.fallDistance >= MAX_FALL_HEIGHT) {
                this.state = LemmingState.DEAD;
                audioManager.playSound('death');
                // Create death particles
                if (window.game && window.game.particles) {
                    for (let i = 0; i < 20; i++) {
                        const angle = (Math.PI * 2 * i) / 20;
                        const speed = Math.random() * 3 + 1;
                        window.game.particles.push(new Particle(
                            this.x,
                            this.y + LEMMING_HEIGHT/2,
                            '#ff0000',
                            Math.cos(angle) * speed,
                            Math.sin(angle) * speed - 2
                        ));
                    }
                }
            } else {
                this.state = LemmingState.WALKING;
                this.fallDistance = 0;
            }
        }
    }
    
    bash(terrain) {
        // Bash horizontally
        const bashX = this.x + (this.direction * (LEMMING_WIDTH/2 + 2));
        const bashWidth = 4;
        const bashHeight = LEMMING_HEIGHT;
        
        let foundObstacle = false;
        
        // Check ahead for terrain to bash
        for (let checkX = bashX; checkX < bashX + bashWidth; checkX++) {
            for (let checkY = this.y; checkY < this.y + bashHeight; checkY++) {
                if (terrain.hasGround(checkX, checkY)) {
                    foundObstacle = true;
                    break;
                }
            }
            if (foundObstacle) break;
        }
        
        if (foundObstacle) {
            // Remove terrain in front and get color
            const color = terrain.removeTerrain(bashX - bashWidth/2, this.y, bashWidth * 2, bashHeight);
            
            // Create particles
            if (window.game && window.game.particles) {
                for (let i = 0; i < 10; i++) {
                    window.game.particles.push(new Particle(
                        bashX + Math.random() * bashWidth - bashWidth/2,
                        this.y + Math.random() * bashHeight,
                        color,
                        this.direction * (Math.random() * 3 + 1),
                        Math.random() * 2 - 3
                    ));
                }
            }
            
            this.x += this.direction * 2;
        } else {
            // Check if we can walk forward (no obstacle)
            if (!terrain.hasGround(this.x + this.direction * WALK_SPEED, this.y + LEMMING_HEIGHT/2)) {
                // Done bashing, return to walking
                this.state = LemmingState.WALKING;
            } else {
                // Move forward slowly while bashing
                this.x += this.direction * 0.5;
            }
        }
    }
    
    dig(terrain) {
        // Dig vertically
        const digY = this.y + LEMMING_HEIGHT;
        const digWidth = LEMMING_WIDTH + 4; // Slightly wider than lemming
        const digHeight = 4;
        
        let foundGround = false;
        
        // Check if there's ground to dig
        for (let checkX = this.x - digWidth/2; checkX < this.x + digWidth/2; checkX++) {
            if (terrain.hasGround(checkX, digY + 2)) {
                foundGround = true;
                break;
            }
        }
        
        if (foundGround) {
            // Remove terrain below and get color
            const color = terrain.removeTerrain(this.x - digWidth/2, digY, digWidth, digHeight);
            
            // Create particles
            if (window.game && window.game.particles) {
                for (let i = 0; i < 8; i++) {
                    window.game.particles.push(new Particle(
                        this.x + Math.random() * digWidth - digWidth/2,
                        digY + Math.random() * digHeight,
                        color,
                        Math.random() * 2 - 1,
                        Math.random() * 2
                    ));
                }
            }
            
            this.y += 2;
        } else {
            // No more ground to dig, return to walking
            this.state = LemmingState.WALKING;
        }
    }
    
    build(terrain) {
        if (this.buildTilesPlaced >= MAX_BUILD_TILES) {
            this.state = LemmingState.WALKING;
            return;
        }
        
        // Build a staircase pattern that lemmings can walk up
        // Each step is 6 pixels wide and 4 pixels tall for a climbable slope
        const stepWidth = 6;
        const stepHeight = 4;
        
        // Calculate position for this building step
        const tileX = this.x + (this.direction * stepWidth);
        const tileY = this.y + LEMMING_HEIGHT - stepHeight - 2;
        
        // Add the building tile
        terrain.addTerrain(tileX - stepWidth/2, tileY, stepWidth, stepHeight + 2);
        
        this.buildTilesPlaced++;
        
        // Move lemming to stand on the new tile
        this.x = tileX;
        this.y = tileY - LEMMING_HEIGHT;
        
        // Add a small delay effect (handled by game loop timing)
        if (this.buildTilesPlaced >= MAX_BUILD_TILES) {
            this.state = LemmingState.WALKING;
        }
    }
    
    applyAction(action) {
        if (this.state === LemmingState.WALKING || this.state === LemmingState.FALLING) {
            switch (action) {
                case ActionType.BLOCKER:
                    this.state = LemmingState.BLOCKING;
                    audioManager.playSound('blocker');
                    break;
                case ActionType.BASHER:
                    this.state = LemmingState.BASHING;
                    audioManager.playSound('basher');
                    break;
                case ActionType.DIGGER:
                    if (this.state === LemmingState.WALKING) {
                        this.state = LemmingState.DIGGING;
                        audioManager.playSound('digger');
                    }
                    break;
                case ActionType.BUILDER:
                    this.state = LemmingState.BUILDING;
                    this.buildTilesPlaced = 0;
                    audioManager.playSound('builder');
                    break;
            }
            this.action = action;
            return true;
        }
        return false;
    }
    
    draw(ctx) {
        if (this.state === LemmingState.DEAD) {
            ctx.fillStyle = '#ff0000';
        } else if (this.state === LemmingState.SAVED) {
            return; // Don't draw saved lemmings
        } else if (this.state === LemmingState.BLOCKING) {
            ctx.fillStyle = '#ff6600';
        } else if (this.state === LemmingState.BASHING) {
            ctx.fillStyle = '#ffff00';
        } else if (this.state === LemmingState.DIGGING) {
            ctx.fillStyle = '#00ffff';
        } else if (this.state === LemmingState.BUILDING) {
            ctx.fillStyle = '#ff00ff';
        } else {
            ctx.fillStyle = '#00ff00';
        }
        
        ctx.fillRect(this.x - LEMMING_WIDTH/2, this.y, LEMMING_WIDTH, LEMMING_HEIGHT);
        
        // Draw direction indicator
        ctx.fillStyle = 'white';
        const eyeX = this.x + (this.direction * 2);
        ctx.fillRect(eyeX - 1, this.y + 4, 2, 2);
    }
}