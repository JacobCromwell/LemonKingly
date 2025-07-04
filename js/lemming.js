// Updated lemming.js - Dynamic scaling based on zoom level with Floater ability
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

        // Store zoom for dynamic sizing
        this.zoom = zoom;
    }

    // Get current lemming dimensions based on zoom
    getWidth() {
        // Try multiple ways to access the function
        const func = window.getLemmingWidth || getLemmingWidth;
        if (func) {
            return func(this.zoom);
        } else {
            // Fallback calculation
            const baseZoom = window.LEMMING_BASE_ZOOM || 1.26;
            const baseWidth = window.LEMMING_BASE_WIDTH || 8;
            return (baseWidth * this.zoom) / baseZoom;
        }
    }

    getHeight() {
        // Try multiple ways to access the function
        const func = window.getLemmingHeight || getLemmingHeight;
        if (func) {
            return func(this.zoom);
        } else {
            // Fallback calculation
            const baseZoom = window.LEMMING_BASE_ZOOM || 1.26;
            const baseHeight = window.LEMMING_BASE_HEIGHT || 10;
            return (baseHeight * this.zoom) / baseZoom;
        }
    }

    // Update zoom level (called when zoom changes)
    updateZoom(zoom) {
        this.zoom = zoom;
    }

    update(terrain, lemmings) {
        if (this.state === LemmingState.DEAD || this.state === LemmingState.SAVED) {
            return;
        }

        if (this.explosionTimer > 0) {
            this.explosionTimer -= 1 / 60; // Assuming 60 FPS
            if (this.explosionTimer <= 0) {
                this.explode(terrain);
                return;
            }
        }

        // Check if lemming has fallen out of bounds
        if (this.y > terrain.height + 50) { // Give some buffer below canvas
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
            case LemmingState.CLIMBING:
                this.climb(terrain);
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

        // Only check lemmings that are blockers and nearby
        for (let i = 0; i < lemmings.length; i++) {
            const l = lemmings[i];
            if (l === this || l.state !== LemmingState.BLOCKING) continue;

            // Early exit if lemming is too far away - use scaled width
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
                // Start climbing
                this.originalDirection = this.direction;
                this.state = LemmingState.CLIMBING;
            } else {
                this.direction *= -1;
            }
        } else if (obstacleHeight > 0) {
            // Climb
            this.y -= obstacleHeight;
            this.x = nextX;
        } else {
            this.x = nextX;
        }
    }

    climb(terrain) {
        const lemmingWidth = this.getWidth();
        const lemmingHeight = this.getHeight();

        // Move up along the wall
        this.y -= 1;

        // Check for overhead obstacle
        const checkX = this.x + (this.originalDirection * (lemmingWidth / 2 + 1));
        if (terrain.hasGround(checkX, this.y - 1)) {
            // Hit overhead obstacle - fall and reverse direction
            this.state = LemmingState.FALLING;
            this.fallDistance = 0;
            this.direction = -this.originalDirection;
            return;
        }

        // Check if we've cleared the obstacle (can walk on top)
        const clearanceWidth = lemmingWidth * 2; // Double the lemming's width
        let canWalkOnTop = true;

        // Check for ground to stand on
        if (!terrain.hasGround(this.x, this.y + lemmingHeight)) {
            canWalkOnTop = false;
        }

        // Check for obstacles in the walking path ahead
        for (let checkOffset = 1; checkOffset <= clearanceWidth; checkOffset++) {
            const checkX = this.x + (this.originalDirection * checkOffset);

            // Check if there's an obstacle blocking the path at walking height
            for (let checkY = this.y; checkY < this.y + lemmingHeight; checkY++) {
                if (terrain.hasGround(checkX, checkY)) {
                    canWalkOnTop = false;
                    break;
                }
            }

            if (!canWalkOnTop) break;
        }

        if (canWalkOnTop) {
            // We've cleared the obstacle, resume walking in original direction
            this.state = LemmingState.WALKING;
            this.direction = this.originalDirection;
        }
    }

    fall(terrain) {
        const lemmingHeight = this.getHeight();

        // Apply gravity - floaters fall slower
        const fallSpeed = this.isFloater ? GRAVITY * 0.5 : GRAVITY;
        this.y += fallSpeed;
        this.fallDistance += fallSpeed;

        if (terrain.hasGround(this.x, this.y + lemmingHeight)) {
            // UPDATED: Floaters don't die from fall damage
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

            this.x += this.direction * 2;
        } else {
            // Check if we can walk forward (no obstacle)
            if (!terrain.hasGround(this.x + this.direction * WALK_SPEED, this.y + lemmingHeight / 2)) {
                // Done bashing, return to walking
                this.state = LemmingState.WALKING;
            } else {
                // Move forward slowly while bashing
                this.x += this.direction * 0.5;
            }
        }
    }

    dig(terrain) {
        const lemmingWidth = this.getWidth();
        const lemmingHeight = this.getHeight();

        // Dig vertically
        const digY = this.y + lemmingHeight;
        const digWidth = lemmingWidth + 4; // Slightly wider than lemming
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

            this.y += 2;
        } else {
            // No more ground to dig - check if we're standing on solid ground
            if (terrain.hasGround(this.x, this.y + lemmingHeight)) {
                // There's ground underneath, return to walking
                this.state = LemmingState.WALKING;
            } else {
                // No ground underneath, start falling
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

        // Build a staircase pattern that lemmings can walk up
        // Each step is 6 pixels wide and 4 pixels tall for a climbable slope
        const stepWidth = 8;
        const stepHeight = 3;

        // Calculate position for this building step
        const tileX = this.x + (this.direction * stepWidth - 2);
        let tileY = 0;

        if (this.buildTilesPlaced === 0) {
            tileY = this.y + lemmingHeight - 1;
        } else {
            tileY = this.y + lemmingHeight - stepHeight - 2;
        }

        // Add the building tile
        terrain.addTerrain(tileX - stepWidth / 2, tileY, stepWidth, stepHeight + 2);

        this.buildTilesPlaced++;

        // Move lemming to stand on the new tile
        this.x = tileX;
        this.y = tileY - lemmingHeight;

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
                case ActionType.CLIMBER:
                    this.isClimber = true;
                    audioManager.playSound('climber');
                    break;
                case ActionType.FLOATER:
                    this.isFloater = true;
                    audioManager.playSound('floater');
                    break;
                case ActionType.EXPLODER:
                    this.explosionTimer = 5; // 5 seconds
                    this.state = LemmingState.EXPLODING;
                    audioManager.playSound('exploder'); // Click/beep sound
                    return true;
            }
            this.action = action;
            return true;
        }
        return false;
    }

    explode(terrain) {
        this.state = LemmingState.DEAD;
        
        // Play explosion sound
        audioManager.playSound('explosion');
        
        // Remove terrain in circular area (10px radius)
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
            // Create 12 particles with different colors
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
                    Math.sin(angle) * speed - 2 // Initial upward velocity
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
            return; // Don't draw saved lemmings
        } else if (this.state === LemmingState.BLOCKING) {
            ctx.fillStyle = '#ff6600';
        } else if (this.state === LemmingState.BASHING) {
            ctx.fillStyle = '#ffff00';
        } else if (this.state === LemmingState.DIGGING) {
            ctx.fillStyle = '#00ffff';
        } else if (this.state === LemmingState.BUILDING) {
            ctx.fillStyle = '#ff00ff';
        } else if (this.state === LemmingState.CLIMBING) {
            ctx.fillStyle = '#ffaa00'; // Orange for climbing
        } else {
            ctx.fillStyle = '#00ff00';
        }

        // Add visual indicator for climbers
        if (this.isClimber && this.state !== LemmingState.CLIMBING) {
            // Draw a small climbing indicator (rope/hook) - scaled
            ctx.fillStyle = '#8B4513'; // Brown rope color
            const ropeWidth = Math.max(1, lemmingWidth * 0.25);
            const ropeHeight = Math.max(2, lemmingHeight * 0.4);
            ctx.fillRect(this.x - ropeWidth / 2, this.y - ropeHeight / 2, ropeWidth, ropeHeight);
        }

        // NEW: Draw parachute for floaters when falling
        if (this.isFloater && this.state === LemmingState.FALLING) {
            this.drawParachute(ctx, lemmingWidth, lemmingHeight);
        }

        // Draw lemming body - now uses dynamic size based on zoom
        ctx.fillRect(this.x - lemmingWidth / 2, this.y, lemmingWidth, lemmingHeight);

        // Draw direction indicator - scaled
        ctx.fillStyle = 'white';
        const eyeSize = Math.max(1, lemmingWidth * 0.25);
        const eyeX = this.x + (this.direction * (lemmingWidth * 0.25));
        const eyeY = this.y + (lemmingHeight * 0.2);
        ctx.fillRect(eyeX - eyeSize / 2, eyeY, eyeSize, eyeSize);

        // NEW: Add visual indicator for floaters when not falling (small parachute icon)
        if (this.isFloater && this.state !== LemmingState.FALLING) {
            // Draw a small parachute icon above the lemming
            ctx.fillStyle = '#FFD700'; // Gold color
            const iconSize = Math.max(2, lemmingWidth * 0.4);
            const iconX = this.x + (lemmingWidth * 0.3);
            const iconY = this.y - (lemmingHeight * 0.3);

            // Small parachute shape
            ctx.beginPath();
            ctx.arc(iconX, iconY, iconSize / 2, Math.PI, 0, false);
            ctx.fill();

            // Parachute strings
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = Math.max(0.5, iconSize * 0.1);
            ctx.beginPath();
            ctx.moveTo(iconX - iconSize / 2, iconY);
            ctx.lineTo(this.x, this.y + lemmingHeight * 0.1);
            ctx.moveTo(iconX + iconSize / 2, iconY);
            ctx.lineTo(this.x, this.y + lemmingHeight * 0.1);
            ctx.stroke();
        }

        if (this.explosionTimer > 0) {
            const seconds = Math.ceil(this.explosionTimer);
            
            // Draw countdown number above lemming
            ctx.save();
            ctx.font = `bold ${Math.max(10, this.getHeight())}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            
            const textX = this.x;
            const textY = this.y - 2; // 2px above lemming
            
            // Draw black outline
            ctx.strokeText(seconds.toString(), textX, textY);
            // Draw white text
            ctx.fillText(seconds.toString(), textX, textY);
            
            ctx.restore();
        }
    }

    // NEW: Draw parachute when falling
    drawParachute(ctx, lemmingWidth, lemmingHeight) {
        const parachuteSize = lemmingWidth * 3; // Parachute is 3x lemming width
        const parachuteY = this.y - lemmingHeight * 1.5; // Above the lemming

        // Parachute canopy
        ctx.fillStyle = '#FFD700'; // Gold color
        ctx.beginPath();
        ctx.arc(this.x, parachuteY, parachuteSize / 2, Math.PI, 0, false);
        ctx.fill();

        // Parachute details (panels)
        ctx.strokeStyle = '#FFA500'; // Orange lines
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
        ctx.strokeStyle = '#8B4513'; // Brown strings
        ctx.lineWidth = Math.max(0.5, lemmingWidth * 0.08);

        // Multiple strings for realism
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