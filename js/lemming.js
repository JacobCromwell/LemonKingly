// Updated lemming.js - Fixed climber ability
class Lemming {
    constructor(x, y, zoom = 1.0) {
        this.x = x;
        this.y = y;
        this.direction = 1; // 1 = right, -1 = left
        this.state = LemmingState.FALLING;
        this.fallDistance = 0;
        this.action = ActionType.NONE;
        this.actionProgress = 0;
        this.buildTilesPlaced = 0;
        this.isClimber = false; // Permanent climber ability
        this.isFloater = false; // Permanent floater ability
        this.originalDirection = 1; // Store original direction for climbing
        this.explosionTimer = -1; // -1 means no explosion scheduled
        this.explosionParticles = []; // Store particles for this lemming
        
        // Miner specific properties
        this.miningSwingTimer = 0; // Timer for pick swing animation
        this.miningProgress = 0; // How far along the tunnel

        // Store zoom for dynamic sizing
        this.zoom = zoom;
    }

    // UPDATED: Check if lemming already has the specified ability
    hasAbility(action) {
        switch (action) {
            case ActionType.CLIMBER:
                return this.isClimber;
            case ActionType.FLOATER:
                return this.isFloater;
            case ActionType.BLOCKER:
                return this.state === LemmingState.BLOCKING;
            case ActionType.BASHER:
                return this.state === LemmingState.BASHING;
            case ActionType.DIGGER:
                return this.state === LemmingState.DIGGING;
            case ActionType.BUILDER:
                return false; // Always allow builder (can reset)
            case ActionType.EXPLODER:
                return this.explosionTimer > 0;
            case ActionType.MINER:
                return this.state === LemmingState.MINING;
            default:
                return false;
        }
    }

    // Get current lemming dimensions based on zoom
    getWidth() {
        const func = window.getLemmingWidth || getLemmingWidth;
        if (func) {
            return func(this.zoom);
        } else {
            const baseZoom = window.LEMMING_BASE_ZOOM || 1.26;
            const baseWidth = window.LEMMING_BASE_WIDTH || 8;
            return (baseWidth * this.zoom) / baseZoom;
        }
    }

    getHeight() {
        const func = window.getLemmingHeight || getLemmingHeight;
        if (func) {
            return func(this.zoom);
        } else {
            const baseZoom = window.LEMMING_BASE_ZOOM || 1.26;
            const baseHeight = window.LEMMING_BASE_HEIGHT || 10;
            return (baseHeight * this.zoom) / baseZoom;
        }
    }

    updateZoom(zoom) {
        this.zoom = zoom;
    }

    update(terrain, lemmings) {
        if (this.state === LemmingState.DEAD || this.state === LemmingState.SAVED) {
            return;
        }

        // Handle explosion timer for all states (including blockers)
        if (this.explosionTimer > 0) {
            this.explosionTimer -= 1 / 60; // Assuming 60 FPS
            if (this.explosionTimer <= 0) {
                this.explode(terrain);
                return;
            }
        }

        // Check if lemming has fallen out of bounds
        if (this.y > terrain.height + 50) {
            this.state = LemmingState.DEAD;
            audioManager.playSound('death');
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
                // Blockers don't move but still countdown explosion timer
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
            case LemmingState.CLIMBING:
                this.climb(terrain);
                break;
            case LemmingState.MINING:
                this.mine(terrain);
                break;
            case LemmingState.EXPLODING:
                // Continue normal movement while counting down
                if (!terrain.hasGround(this.x, this.y + this.getHeight())) {
                    this.fall(terrain);
                } else {
                    this.walk(terrain, lemmings);
                }
        }
    }

    walk(terrain, lemmings) {
        const lemmingHeight = this.getHeight();
        const lemmingWidth = this.getWidth();

        if (!terrain.hasGround(this.x, this.y + lemmingHeight)) {
            this.state = LemmingState.FALLING;
            this.fallDistance = 0;
            return;
        }

        const nextX = this.x + this.direction * WALK_SPEED;
        let blocker = null;

        // Check for blocking lemmings
        for (let i = 0; i < lemmings.length; i++) {
            const l = lemmings[i];
            if (l === this || l.state !== LemmingState.BLOCKING) continue;

            const xDist = Math.abs(l.x - nextX);
            if (xDist >= lemmingWidth) continue;

            const yDist = Math.abs(l.y - this.y);
            if (yDist < lemmingHeight) {
                blocker = l;
                break;
            }
        }

        if (blocker) {
            this.direction *= -1;
            return;
        }

        // Check for obstacles
        const obstacleHeight = terrain.getObstacleHeight(nextX, this.y);
        if (obstacleHeight > CLIMB_HEIGHT) {
            if (this.isClimber) {
                // FIXED: Start climbing - store direction and transition to climbing state
                this.originalDirection = this.direction;
                this.state = LemmingState.CLIMBING;
                return;
            } else {
                this.direction *= -1;
            }
        } else if (obstacleHeight > 0) {
            // Small obstacle - climb over it
            this.y -= obstacleHeight;
            this.x = nextX;
        } else {
            // Normal walking
            this.x = nextX;
        }
    }

    // COMPLETELY REWRITTEN: Simplified climbing logic with top-clearing boost
    climb(terrain) {
        const lemmingWidth = this.getWidth();
        const lemmingHeight = this.getHeight();
        
        // Check for ceiling collision (terrain above lemming's head)
        const headY = this.y - 2; // Check 2 pixels above the lemming
        if (terrain.hasGround(this.x, headY)) {
            // Hit ceiling - fall and reverse direction
            this.state = LemmingState.FALLING;
            this.fallDistance = 0;
            this.direction = -this.originalDirection;
            return;
        }

        // Move up vertically
        this.y -= WALK_SPEED;

        // Check if still in contact with wall
        const wallCheckX = this.x + (this.originalDirection * (lemmingWidth / 2 + 1));
        
        // Check multiple points along the lemming's height to ensure wall contact
        let stillInContactWithWall = false;
        for (let checkY = this.y; checkY < this.y + lemmingHeight; checkY += 2) {
            if (terrain.hasGround(wallCheckX, checkY)) {
                stillInContactWithWall = true;
                break;
            }
        }

        // If no longer in contact with wall, we've reached the top
        if (!stillInContactWithWall) {
            // Apply boost to clear the wall top
            const heightBoost = 5;  // 5px upward boost
            const forwardBoost = 5; // 5px forward boost
            
            // Apply the boosts
            this.y -= heightBoost;
            this.x += this.originalDirection * forwardBoost;
            
            // Check if there's ground to stand on after the boost
            if (terrain.hasGround(this.x, this.y + lemmingHeight)) {
                // Resume walking in original direction
                this.state = LemmingState.WALKING;
                this.direction = this.originalDirection;
            } else {
                // No ground to stand on - start falling (but with the boost applied)
                this.state = LemmingState.FALLING;
                this.fallDistance = 0;
                this.direction = this.originalDirection;
            }
        }
    }

    fall(terrain) {
        const lemmingHeight = this.getHeight();

        // Apply gravity - floaters fall slower
        const fallSpeed = this.isFloater ? GRAVITY * 0.5 : GRAVITY;
        this.y += fallSpeed;
        this.fallDistance += fallSpeed;

        if (terrain.hasGround(this.x, this.y + lemmingHeight)) {
            // Floaters don't die from fall damage
            if (this.fallDistance >= MAX_FALL_HEIGHT && !this.isFloater) {
                this.state = LemmingState.DEAD;
                audioManager.playSound('death');
                // Create death particles
                if (window.game && window.game.particles) {
                    for (let i = 0; i < 20; i++) {
                        const angle = (Math.PI * 2 * i) / 20;
                        const speed = Math.random() * 3 + 1;
                        window.game.particles.push(new Particle(
                            this.x,
                            this.y + lemmingHeight / 2,
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
        const lemmingWidth = this.getWidth();
        const lemmingHeight = this.getHeight();

        // Bash horizontally
        const bashX = this.x + (this.direction * (lemmingWidth / 2 + 2));
        const bashWidth = 6;
        const bashHeight = lemmingHeight;

        let foundObstacle = false;

        // Check ahead for terrain to bash
        for (let checkX = bashX; checkX < bashX + (bashWidth * 2); checkX++) {
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
            const color = terrain.removeTerrain(bashX - bashWidth / 2, this.y, bashWidth * 2, bashHeight);

            // Create particles
            if (window.game && window.game.particles) {
                for (let i = 0; i < 10; i++) {
                    window.game.particles.push(new Particle(
                        bashX + Math.random() * bashWidth - bashWidth / 2,
                        this.y + Math.random() * bashHeight,
                        color,
                        this.direction * (Math.random() * 3 + 1),
                        Math.random() * 2 - 3
                    ));
                }
            }

            this.x += this.direction * 0.5;
        } else {
            // Check if we can walk forward (no obstacle)
            if (!terrain.hasGround(this.x + this.direction * WALK_SPEED, this.y + lemmingHeight / 2)) {
                // Done bashing, return to walking
                this.state = LemmingState.WALKING;
            } else {
                // Move forward slowly while bashing
                this.x += this.direction * 0.125;
            }
        }
    }

    dig(terrain) {
        const lemmingWidth = this.getWidth();
        const lemmingHeight = this.getHeight();

        // Dig vertically
        const digY = this.y + lemmingHeight;
        const digWidth = lemmingWidth + 4;
        const digHeight = 4;

        let foundGround = false;

        // Check if there's ground to dig
        for (let checkX = this.x - digWidth / 2; checkX < this.x + digWidth / 2; checkX++) {
            if (terrain.hasGround(checkX, digY + 2)) {
                foundGround = true;
                break;
            }
        }

        if (foundGround) {
            // Remove terrain below and get color
            const color = terrain.removeTerrain(this.x - digWidth / 2, digY, digWidth, digHeight);

            // Create particles
            if (window.game && window.game.particles) {
                for (let i = 0; i < 8; i++) {
                    window.game.particles.push(new Particle(
                        this.x + Math.random() * digWidth - digWidth / 2,
                        digY + Math.random() * digHeight,
                        color,
                        Math.random() * 2 - 1,
                        Math.random() * 2
                    ));
                }
            }

            this.y += 0.5;
        } else {
            // No more ground to dig
            if (terrain.hasGround(this.x, this.y + lemmingHeight)) {
                this.state = LemmingState.WALKING;
            } else {
                this.state = LemmingState.FALLING;
                this.fallDistance = 0;
            }
        }
    }

    build(terrain) {
        const lemmingHeight = this.getHeight();

        if (this.buildTilesPlaced >= MAX_BUILD_TILES) {
            this.state = LemmingState.WALKING;
            return;
        }

        const stepWidth = 6;
        const stepHeight = 2;

        const tileX = this.x + (this.direction * stepWidth - 2);
        let tileY = 0;

        if (this.buildTilesPlaced === 0) {
            tileY = this.y + lemmingHeight - 1;
        } else {
            tileY = this.y + lemmingHeight - stepHeight - 2;
        }

        if(this.direction === -1){
            terrain.addTerrain((tileX - stepWidth * 2) + 2, tileY, stepWidth, stepHeight + 1);
        } else {
            terrain.addTerrain(tileX - stepWidth / 2, tileY, stepWidth, stepHeight + 1);
        }

        this.buildTilesPlaced++;

        this.x = tileX;
        this.y = tileY - lemmingHeight;

        if (this.buildTilesPlaced >= MAX_BUILD_TILES) {
            this.state = LemmingState.WALKING;
        }
    }

    mine(terrain) {
        console.log('JRC 3')
        const lemmingWidth = this.getWidth();
        const lemmingHeight = this.getHeight();
        
        // Increment swing timer
        this.miningSwingTimer++;
        
        // Check if it's time for a swing
        if (this.miningSwingTimer >= MINER_SWING_DURATION) {
            this.miningSwingTimer = 0;
            
            // Calculate mining position (ahead and below at angle)
            const angleRad = (MINER_ANGLE * Math.PI) / 180;
            const tunnelRadius = lemmingHeight * 0.4; // Much smaller radius for gradual digging
            
            // Position for this swing - closer to the lemming
            const swingX = this.x + (this.direction * tunnelRadius * 1.5 * Math.cos(angleRad));
            const swingY = this.y + lemmingHeight + (tunnelRadius * Math.sin(angleRad));
            
            // Check if there's still terrain to mine at the swing position
            let foundTerrain = false;
            for (let angle = 0; angle < Math.PI * 2; angle += 0.5) {
                const checkX = swingX + Math.cos(angle) * tunnelRadius;
                const checkY = swingY + Math.sin(angle) * tunnelRadius;
                if (terrain.hasGround(checkX, checkY)) {
                    foundTerrain = true;
                    break;
                }
            }
            
            if (!foundTerrain) {
                // No more terrain to mine
                this.state = LemmingState.WALKING;
                this.miningProgress = 0;
                return;
            }
            
            // Check for level boundaries
            if (swingX < tunnelRadius || swingX > terrain.width - tunnelRadius ||
                swingY < 0 || swingY > terrain.height - tunnelRadius) {
                this.state = LemmingState.WALKING;
                this.miningProgress = 0;
                return;
            }
            
            // Check for indestructible terrain if editor is available
            if (window.editor && window.editor.terrainManager) {
                const checkBounds = {
                    x: swingX - tunnelRadius,
                    y: swingY - tunnelRadius,
                    width: tunnelRadius * 2,
                    height: tunnelRadius * 2
                };
                
                if (window.editor.checkIndestructibleCollision(checkBounds)) {
                    // Hit indestructible terrain, stop mining
                    this.state = LemmingState.WALKING;
                    this.miningProgress = 0;
                    audioManager.playSound('miner'); // Play clunk sound
                    return;
                }
            }
            
            // Remove terrain in circular area
            for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
                for (let r = 0; r < tunnelRadius; r += 1) {
                    const removeX = swingX + Math.cos(angle) * r;
                    const removeY = swingY + Math.sin(angle) * r;
                    terrain.removeTerrainPixel(Math.floor(removeX), Math.floor(removeY));
                }
            }
            terrain.updateImageData();
            
            // Get terrain color for particles
            const imageData = terrain.ctx.getImageData(swingX, swingY, 1, 1);
            const color = `rgb(${imageData.data[0]}, ${imageData.data[1]}, ${imageData.data[2]})`;
            
            // Create particles for removed terrain
            if (window.game && window.game.particles) {
                for (let i = 0; i < 12; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * tunnelRadius;
                    const particleX = swingX + Math.cos(angle) * distance;
                    const particleY = swingY + Math.sin(angle) * distance;
                    
                    window.game.particles.push(new Particle(
                        particleX,
                        particleY,
                        color,
                        Math.cos(angle) * (Math.random() * 2 + 1),
                        Math.sin(angle) * (Math.random() * 2 + 1) - 1
                    ));
                }
            }
            
            // Move lemming to the bottom edge of the hole
            // The lemming should be at the edge of the circle, not the center
            if (this.direction === 1) {
                // Moving right: position at right bottom edge of hole
                this.x = swingX + tunnelRadius - lemmingWidth / 2;
            } else {
                // Moving left: position at left bottom edge of hole
                this.x = swingX - tunnelRadius + lemmingWidth / 2;
            }
            // Position at bottom of hole
            this.y = swingY + tunnelRadius - lemmingHeight;
            
            // After moving, check if there's ground beneath the lemming's new position
            if (!terrain.hasGround(this.x, this.y + lemmingHeight)) {
                // No ground beneath after moving
                this.state = LemmingState.WALKING;
                this.miningProgress = 0;
                return;
            }
            
            // Play mining sound
            audioManager.playSound('miner');
        }
    }

    // Allow EXPLODER to be applied to blocking lemmings
    applyAction(action) {
        // Special case for EXPLODER - can be applied to any lemming except dead/saved
        if (action === ActionType.EXPLODER) {
            if (this.state !== LemmingState.DEAD && this.state !== LemmingState.SAVED && this.explosionTimer <= 0) {
                this.explosionTimer = 5; // 5 seconds
                // Don't change state for blockers - they remain blocking until explosion
                if (this.state !== LemmingState.BLOCKING) {
                    this.state = LemmingState.EXPLODING;
                }
                this.action = action;
                audioManager.playSound('exploder');
                return true;
            }
            return false;
        }

        // For all other actions, only allow on walking or falling lemmings
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
                case ActionType.CLIMBER:
                    this.isClimber = true;
                    audioManager.playSound('climber');
                    break;
                case ActionType.FLOATER:
                    this.isFloater = true;
                    audioManager.playSound('floater');
                    break;
                case ActionType.MINER:
                    if (this.state === LemmingState.WALKING) {
                        this.state = LemmingState.MINING;
                        this.miningSwingTimer = 0;
                        this.miningProgress = 0;
                        audioManager.playSound('miner');
                    }
                    break;
            }
            this.action = action;
            return true;
        }
        return false;
    }

    explode(terrain) {
        this.state = LemmingState.DEAD;
        
        audioManager.playSound('explosion');
        
        const explosionRadius = 10;
        const cx = this.x;
        const cy = this.y + this.getHeight() / 2;
        
        // Remove terrain in a circle
        for (let x = cx - explosionRadius; x <= cx + explosionRadius; x++) {
            for (let y = cy - explosionRadius; y <= cy + explosionRadius; y++) {
                const distance = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
                if (distance <= explosionRadius) {
                    terrain.removeTerrainPixel(Math.floor(x), Math.floor(y));
                }
            }
        }
        terrain.updateImageData();
        
        // Create explosion particles
        if (window.game) {
            const colors = ['#00ff00', '#ff0000', '#ffffff', '#0000ff'];
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
                const speed = Math.random() * 3 + 2;
                const color = colors[i % colors.length];
                
                window.game.addParticle(
                    cx,
                    cy,
                    color,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed - 2
                );
            }
        }
    }

    draw(ctx) {
        const lemmingWidth = this.getWidth();
        const lemmingHeight = this.getHeight();

        if (this.state === LemmingState.DEAD) {
            ctx.fillStyle = '#ff0000';
        } else if (this.state === LemmingState.SAVED) {
            return;
        } else if (this.state === LemmingState.BLOCKING) {
            if (this.explosionTimer > 0) {
                ctx.fillStyle = '#ff8800';
            } else {
                ctx.fillStyle = '#ff6600';
            }
        } else if (this.state === LemmingState.BASHING) {
            ctx.fillStyle = '#ffff00';
        } else if (this.state === LemmingState.DIGGING) {
            ctx.fillStyle = '#00ffff';
        } else if (this.state === LemmingState.BUILDING) {
            ctx.fillStyle = '#ff00ff';
        } else if (this.state === LemmingState.CLIMBING) {
            ctx.fillStyle = '#ffaa00';
        } else if (this.state === LemmingState.MINING) {
            ctx.fillStyle = '#8B4513'; // Brown color for miners
        } else {
            ctx.fillStyle = '#00ff00';
        }

        // Add visual indicator for climbers
        if (this.isClimber && this.state !== LemmingState.CLIMBING) {
            ctx.fillStyle = '#8B4513';
            const ropeWidth = Math.max(1, lemmingWidth * 0.25);
            const ropeHeight = Math.max(2, lemmingHeight * 0.4);
            ctx.fillRect(this.x - ropeWidth / 2, this.y - ropeHeight / 2, ropeWidth, ropeHeight);
        }

        // Draw parachute for floaters when falling
        if (this.isFloater && this.state === LemmingState.FALLING) {
            this.drawParachute(ctx, lemmingWidth, lemmingHeight);
        }

        // Draw lemming body
        ctx.fillRect(this.x - lemmingWidth / 2, this.y, lemmingWidth, lemmingHeight);

        // Draw direction indicator
        ctx.fillStyle = 'white';
        const eyeSize = Math.max(1, lemmingWidth * 0.25);
        const eyeX = this.x + (this.direction * (lemmingWidth * 0.25));
        const eyeY = this.y + (lemmingHeight * 0.2);
        ctx.fillRect(eyeX - eyeSize / 2, eyeY, eyeSize, eyeSize);

        // Add visual indicator for floaters when not falling
        if (this.isFloater && this.state !== LemmingState.FALLING) {
            ctx.fillStyle = '#FFD700';
            const iconSize = Math.max(2, lemmingWidth * 0.4);
            const iconX = this.x + (lemmingWidth * 0.3);
            const iconY = this.y - (lemmingHeight * 0.3);

            ctx.beginPath();
            ctx.arc(iconX, iconY, iconSize / 2, Math.PI, 0, false);
            ctx.fill();

            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = Math.max(0.5, iconSize * 0.1);
            ctx.beginPath();
            ctx.moveTo(iconX - iconSize / 2, iconY);
            ctx.lineTo(this.x, this.y + lemmingHeight * 0.1);
            ctx.moveTo(iconX + iconSize / 2, iconY);
            ctx.lineTo(this.x, this.y + lemmingHeight * 0.1);
            ctx.stroke();
        }

        // Draw countdown for explosion timer
        if (this.explosionTimer > 0) {
            const seconds = Math.ceil(this.explosionTimer);
            
            ctx.save();
            ctx.font = `bold ${Math.max(10, this.getHeight())}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            
            const textX = this.x;
            const textY = this.y - 2;
            
            ctx.strokeText(seconds.toString(), textX, textY);
            ctx.fillText(seconds.toString(), textX, textY);
            
            ctx.restore();
        }
    }

    // Draw parachute when falling
    drawParachute(ctx, lemmingWidth, lemmingHeight) {
        const parachuteSize = lemmingWidth * 3;
        const parachuteY = this.y - lemmingHeight * 1.5;

        // Parachute canopy
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, parachuteY, parachuteSize / 2, Math.PI, 0, false);
        ctx.fill();

        // Parachute details (panels)
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = Math.max(0.5, lemmingWidth * 0.1);
        for (let i = 1; i < 4; i++) {
            const angle = Math.PI * (i / 4);
            const startX = this.x + Math.cos(angle) * (parachuteSize / 2);
            const startY = parachuteY + Math.sin(angle) * (parachuteSize / 2);
            ctx.beginPath();
            ctx.moveTo(this.x, parachuteY);
            ctx.lineTo(startX, startY);
            ctx.stroke();
        }

        // Parachute strings
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = Math.max(0.5, lemmingWidth * 0.08);

        const stringPoints = [
            { x: this.x - parachuteSize * 0.3, y: parachuteY },
            { x: this.x - parachuteSize * 0.1, y: parachuteY },
            { x: this.x + parachuteSize * 0.1, y: parachuteY },
            { x: this.x + parachuteSize * 0.3, y: parachuteY }
        ];

        stringPoints.forEach(point => {
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(this.x, this.y + lemmingHeight * 0.2);
            ctx.stroke();
        });
    }
}