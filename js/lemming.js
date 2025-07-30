// Updated js/lemming.js - Add IDT collision checking for terrain removal actions

// Simplified Lemming class with dead code removed and IDT support
class Lemming {
    constructor(x, y, zoom = 1.0) {
        this.x = x;
        this.y = y;
        this.direction = 1; // 1 = right, -1 = left
        this.state = LemmingState.FALLING;
        this.fallDistance = 0;
        this.buildTilesPlaced = 0;
        this.isClimber = false; // Permanent climber ability
        this.isFloater = false; // Permanent floater ability
        this.explosionTimer = -1; // -1 means no explosion scheduled

        // Death fade effect properties
        this.deathTime = 0;
        this.deathFadeDuration = 2000; // 2 seconds
        this.isFullyDead = false;

        // Miner specific properties
        this.miningSwingTimer = 0;
        this.miningProgress = 0;

        // Store zoom for dynamic sizing
        this.zoom = zoom;

        // Builder specific properties (new for timed building)
        this.lastBuildTime = 0; // Tracks the timestamp of the last tile placed.
    }

    // Check if lemming already has the specified ability
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
        return LEMMING_CONFIG.getWidth(this.zoom);
    }

    getHeight() {
        return LEMMING_CONFIG.getHeight(this.zoom);
    }

    updateZoom(zoom) {
        this.zoom = zoom;
    }

    // Set lemming as dead and start fade timer
    setDead() {
        if (this.state !== LemmingState.DEAD) {
            this.state = LemmingState.DEAD;
            this.deathTime = Date.now();
            this.isFullyDead = false;
            audioManager.playSound('death');
        }
    }

    // Check if lemming should still be rendered
    shouldRender() {
        if (this.state === LemmingState.SAVED) {
            return false;
        }

        if (this.state === LemmingState.DEAD) {
            const timeSinceDeath = Date.now() - this.deathTime;
            if (timeSinceDeath >= this.deathFadeDuration) {
                this.isFullyDead = true;
                return false;
            }
        }

        return true;
    }

    // Get current opacity based on death fade
    getOpacity() {
        if (this.state !== LemmingState.DEAD) {
            return 1.0;
        }

        const timeSinceDeath = Date.now() - this.deathTime;
        if (timeSinceDeath >= this.deathFadeDuration) {
            return 0;
        }

        const fadeProgress = timeSinceDeath / this.deathFadeDuration;
        return Math.max(0, 1.0 - fadeProgress);
    }

    update(terrain, lemmings) {
        if (this.state === LemmingState.SAVED || this.isFullyDead) {
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

        // Skip updates for dead lemmings
        if (this.state === LemmingState.DEAD) {
            return;
        }

        // Check if lemming has fallen out of bounds
        if (this.y > terrain.height + 50) {
            this.setDead();
            if (window.particleManager) {
                window.particleManager.createDeathParticles(this.x, this.y + this.getHeight() / 2);
            }
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
                this.build(terrain); // Call the updated build method
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

        const nextX = this.x + this.direction * PHYSICS.walkSpeed;
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
        if (obstacleHeight > PHYSICS.climbHeight) {
            if (this.isClimber) {
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

    climb(terrain) {
        const lemmingWidth = this.getWidth();
        const lemmingHeight = this.getHeight();

        // Check for ceiling collision
        const headY = this.y - 2;
        if (terrain.hasGround(this.x, headY)) {
            // Hit ceiling - fall and reverse direction
            this.state = LemmingState.FALLING;
            this.fallDistance = 0;
            this.direction *= -1;
            return;
        }

        // Move up vertically
        this.y -= PHYSICS.walkSpeed;

        // Check if still in contact with wall
        const wallCheckX = this.x + (this.direction * (lemmingWidth / 2 + 1));

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
            const heightBoost = 5;
            const forwardBoost = 5;

            this.y -= heightBoost;
            this.x += this.direction * forwardBoost;

            // Check if there's ground to stand on after the boost
            if (terrain.hasGround(this.x, this.y + lemmingHeight)) {
                this.state = LemmingState.WALKING;
            } else {
                this.state = LemmingState.FALLING;
                this.fallDistance = 0;
            }
        }
    }

    fall(terrain) {
        const lemmingHeight = this.getHeight();

        // Apply gravity - floaters fall slower
        const fallSpeed = this.isFloater ? PHYSICS.gravity * PHYSICS.floaterGravityMultiplier : PHYSICS.gravity;
        this.y += fallSpeed;
        this.fallDistance += fallSpeed;

        if (terrain.hasGround(this.x, this.y + lemmingHeight)) {
            // Floaters don't die from fall damage
            if (this.fallDistance >= PHYSICS.maxFallHeight && !this.isFloater) {
                this.setDead();
                if (window.particleManager) {
                    window.particleManager.createDeathParticles(this.x, lemmingHeight / 2);
                }
            } else {
                this.state = LemmingState.WALKING;
                this.fallDistance = 0;
            }
        }
    }

    // UPDATED: Check for IDT before bashing
    bash(terrain) {
        const lemmingWidth = this.getWidth();
        const lemmingHeight = this.getHeight();

        const bashX = this.x + (this.direction * (lemmingWidth / 2 + 2));
        const bashWidth = 6;
        const bashHeight = lemmingHeight;

        // NEW: Check if bashing area contains indestructible terrain
        if (terrain.hasIndestructibleTerrain(bashX - bashWidth / 2, this.y + 1, bashWidth * 2, bashHeight)) {
            // Hit IDT - stop bashing and return to walking
            this.state = LemmingState.WALKING;
            console.log('Basher stopped by indestructible terrain');
            return;
        }

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
            const color = terrain.removeTerrain((bashX - 1) - bashWidth / 2, this.y + 1, bashWidth * 2, bashHeight);

            // Only create particles and advance if terrain was actually removed
            if (color) {
                // Create particles with directional velocity
                if (window.particleManager) {
                    for (let i = 0; i < 10; i++) {
                        window.particleManager.getParticle(
                            bashX + Math.random() * bashWidth - bashWidth / 2,
                            this.y + Math.random() * bashHeight,
                            color || '#8B4513',
                            this.direction * (Math.random() * 3 + 1), // Particles fly in bash direction
                            Math.random() * 2 - 3
                        );
                    }
                }

                this.x += this.direction * 0.25;
                audioManager.playSound('basher'); // Add sound effect
            } else {
                // Could not remove terrain (IDT encountered) - stop bashing
                this.state = LemmingState.WALKING;
            }
        } else {
            // Check if we can walk forward
            if (!terrain.hasGround(this.x + this.direction * PHYSICS.walkSpeed, this.y + lemmingHeight / 2)) {
                this.state = LemmingState.WALKING;
            } else {
                this.x += this.direction * 0.125;
            }
        }
    }

    // UPDATED: Check for IDT before digging
    dig(terrain) {
        const lemmingWidth = this.getWidth();
        const lemmingHeight = this.getHeight();

        const digY = this.y + lemmingHeight;
        const digWidth = lemmingWidth + 4;
        const digHeight = 4;

        // NEW: Check if digging area contains indestructible terrain
        if (terrain.hasIndestructibleTerrain(this.x - digWidth / 2, digY - 1, digWidth, digHeight)) {
            // Hit IDT - stop digging and return to walking
            this.state = LemmingState.WALKING;
            console.log('Digger stopped by indestructible terrain');
            return;
        }

        let foundGround = false;

        for (let checkX = this.x - digWidth / 2; checkX < this.x + digWidth / 2; checkX++) {
            if (terrain.hasGround(checkX, digY + 2)) {
                foundGround = true;
                break;
            }
        }

        if (foundGround) {
            const color = terrain.removeTerrain(this.x - digWidth / 2, (digY - 1), digWidth, digHeight);

            // Only advance if terrain was actually removed
            if (color) {
                if (window.particleManager) {
                    for (let i = 0; i < 10; i++) {
                        window.particleManager.getParticle(
                            this.x + Math.random() * digWidth - digHeight / 2,
                            this.y + Math.random() * digHeight,
                            color || '#8B4513',
                            this.direction * (Math.random() * 3 + 1),
                            Math.random() * 2 - 3
                        );
                    }
                }

                this.y += 0.5;
            } else {
                // Could not remove terrain (IDT encountered) - stop digging
                this.state = LemmingState.WALKING;
            }
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

    // Updated build method for timed tile placement with collision detection (unchanged - builders not affected by IDT)
    build(terrain) {
        const lemmingHeight = this.getHeight();
        const lemmingWidth = this.getWidth();
        const currentTime = Date.now();

        // If all tiles are placed, transition to walking state
        if (this.buildTilesPlaced >= BUILDING.maxTiles) {
            this.state = LemmingState.WALKING;
            return;
        }

        // If not enough time has passed since the last tile was placed, do nothing
        if (currentTime - this.lastBuildTime < BUILDING.tileDelay) {
            return;
        }

        // COLLISION CHECK: Before placing the next tile, check for terrain collision
        if (this.checkBuildingCollision(terrain)) {
            // Collision detected! Place current tile and cancel building
            this.placeBuildTile(terrain);

            // Turn around and switch to walking
            this.direction *= -1;
            this.state = LemmingState.WALKING;
            this.buildTilesPlaced = 0; // Reset for future building actions

            // Play a sound to indicate building was blocked
            audioManager.playSound('lastBricks');
            return;
        }

        // It's time to place a new tile.
        if (this.buildTilesPlaced >= (BUILDING.maxTiles - 3) && this.buildTilesPlaced < BUILDING.maxTiles) {
            audioManager.playSound('lastBricks');
        }

        this.placeBuildTile(terrain);
    }

    // Updated building methods for lemming.js
    calculateNextBuildPosition() {
        const lemmingHeight = this.getHeight();

        let tileX, tileY, lemmingX, lemmingY;

        if (this.buildTilesPlaced === 110) {
            // First tile: place it at ground level where lemming is standing
            tileY = this.y + lemmingHeight; // 2px high tile at ground level
            tileX = this.x + (this.direction * (BUILDING.tileWidth / 2));
            lemmingX = this.x;
            lemmingY = this.y;
        } else {

            tileY = (this.y + lemmingHeight) - BUILDING.tileHeight; // Position for new tile
            tileX = this.x + (this.direction * (BUILDING.tileWidth / 2));

            // Lemming moves forward and up by 1px
            lemmingX = tileX;
            lemmingY = this.y - 2; // Move up 1px for each tile
        }

        return { tileX, tileY, lemmingX, lemmingY };
    }

    placeBuildTile(terrain) {
        const currentTime = Date.now();
        this.lastBuildTime = currentTime;

        const { tileX, tileY, lemmingX, lemmingY } = this.calculateNextBuildPosition();

        if (this.direction === -1) {
            // Building left
            terrain.addTerrain(tileX - BUILDING.tileWidth, tileY, BUILDING.tileWidth, BUILDING.tileHeight);
        } else {
            // Building right  
            terrain.addTerrain(tileX - BUILDING.tileWidth / 2, tileY, BUILDING.tileWidth, BUILDING.tileHeight);
        }

        this.buildTilesPlaced++;

        // Update lemming position
        this.x = lemmingX;
        this.y = lemmingY;
    }

    checkBuildingCollision(terrain) {
        const lemmingHeight = this.getHeight();
        const lemmingWidth = this.getWidth();

        const { lemmingX: nextLemmingX, lemmingY: nextLemmingY } = this.calculateNextBuildPosition();

        // Check for ceiling collision
        const headY = nextLemmingY - 2;
        for (let checkX = nextLemmingX - lemmingWidth / 2; checkX <= nextLemmingX + lemmingWidth / 2; checkX += 2) {
            if (terrain.hasGround(checkX, headY)) {
                return true;
            }
        }

        // Check front body collision
        const frontHalfStartX = nextLemmingX;
        const frontHalfEndX = nextLemmingX + (this.direction * lemmingWidth / 2);

        const startX = Math.min(frontHalfStartX, frontHalfEndX);
        const endX = Math.max(frontHalfStartX, frontHalfEndX);

        for (let checkX = startX; checkX <= endX; checkX += 2) {
            for (let checkY = nextLemmingY; checkY < nextLemmingY + lemmingHeight - 2; checkY += 2) {
                if (terrain.hasGround(checkX, checkY)) {
                    return true;
                }
            }
        }

        return false;
    }

    // UPDATED: Check for IDT before mining
    mine(terrain) {
        const lemmingHeight = this.getHeight();

        this.miningSwingTimer++;

        if (this.miningSwingTimer >= MINING.swingDuration) {
            this.miningSwingTimer = 0;

            const angleRad = (MINING.angle * Math.PI) / 180;
            const tunnelRadius = lemmingHeight * 0.4;

            const swingX = this.x + (this.direction * tunnelRadius * 1.5 * Math.cos(angleRad));
            const swingY = this.y + lemmingHeight + (tunnelRadius * Math.sin(angleRad));

            // NEW: Check if mining area contains indestructible terrain
            if (terrain.hasIndestructibleTerrain(
                swingX - tunnelRadius,
                swingY - tunnelRadius,
                tunnelRadius * 2,
                tunnelRadius * 2
            )) {
                // Hit IDT - stop mining and return to walking
                this.state = LemmingState.WALKING;
                this.miningProgress = 0;
                console.log('Miner stopped by indestructible terrain');
                return;
            }

            // Check if there's still terrain to mine
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

            // Remove terrain in circular area - but skip IDT pixels
            let removedAnyTerrain = false;
            for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
                for (let r = 0; r < tunnelRadius; r += 1) {
                    const removeX = swingX + Math.cos(angle) * r;
                    const removeY = swingY + Math.sin(angle) * r;
                    const pixelX = Math.floor(removeX);
                    const pixelY = Math.floor(removeY);

                    // Only remove if not indestructible
                    if (terrain.hasGround(pixelX, pixelY) && !terrain.isIndestructible(pixelX, pixelY)) {
                        terrain.removeTerrainPixel(pixelX, pixelY);
                        removedAnyTerrain = true;
                    }
                }
            }
            terrain.updateImageData();

            // If no terrain could be removed (all IDT), stop mining
            if (!removedAnyTerrain) {
                this.state = LemmingState.WALKING;
                this.miningProgress = 0;
                console.log('Miner stopped - all terrain in area is indestructible');
                return;
            }

            // Get terrain color for particles
            const imageData = terrain.ctx.getImageData(swingX, swingY, 1, 1);
            const color = `rgb(${imageData.data[0]}, ${imageData.data[1]}, ${imageData.data[2]})`;

            // Create particles for mining
            if (window.particleManager) {
                for (let i = 0; i < 12; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * tunnelRadius;
                    const particleX = swingX + Math.cos(angle) * distance;
                    const particleY = swingY + Math.sin(angle) * distance;

                    window.particleManager.getParticle(
                        particleX,
                        particleY,
                        color,
                        Math.cos(angle) * (Math.random() * 2 + 1),
                        Math.sin(angle) * (Math.random() * 2 + 1) - 1
                    );
                }
            }

            // Move lemming to the bottom edge of the hole
            const lemmingWidth = this.getWidth();
            if (this.direction === 1) {
                this.x = swingX + tunnelRadius - lemmingWidth / 2;
            } else {
                this.x = swingX - tunnelRadius + lemmingWidth / 2;
            }
            this.y = swingY + tunnelRadius - lemmingHeight;

            // After moving, check if there's ground beneath
            if (!terrain.hasGround(this.x, this.y + lemmingHeight)) {
                this.state = LemmingState.WALKING;
                this.miningProgress = 0;
                return;
            }

            audioManager.playSound('miner');
        }
    }

    applyAction(action) {
        // Special case for EXPLODER - can be applied to any lemming except dead/saved
        if (action === ActionType.EXPLODER) {
            if (this.state !== LemmingState.DEAD && this.state !== LemmingState.SAVED && this.explosionTimer <= 0) {
                this.explosionTimer = 5; // 5 seconds
                if (this.state !== LemmingState.BLOCKING) {
                    this.state = LemmingState.EXPLODING;
                }
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
                    this.lastBuildTime = Date.now();
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
            return true;
        }
        return false;
    }

    // UPDATED: Explosion respects IDT terrain
    explode(terrain) {
        this.setDead();

        audioManager.playSound('explosion');

        const explosionRadius = 10;
        const cx = this.x;
        const cy = this.y + this.getHeight() / 2;

        // Remove terrain in a circle - but preserve IDT terrain
        for (let x = cx - explosionRadius; x <= cx + explosionRadius; x++) {
            for (let y = cy - explosionRadius; y <= cy + explosionRadius; y++) {
                const distance = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
                if (distance <= explosionRadius) {
                    const pixelX = Math.floor(x);
                    const pixelY = Math.floor(y);

                    // Only remove terrain if it's not indestructible
                    if (terrain.hasGround(pixelX, pixelY) && !terrain.isIndestructible(pixelX, pixelY)) {
                        terrain.removeTerrainPixel(pixelX, pixelY);
                    }
                }
            }
        }
        terrain.updateImageData();

        // Create explosion particles
        if (window.particleManager) {
            window.particleManager.createExplosionParticles(cx, cy);
        }
    }

    draw(ctx) {
        if (!this.shouldRender()) {
            return;
        }

        const lemmingWidth = this.getWidth();
        const lemmingHeight = this.getHeight();

        // Apply opacity for death fade effect
        const opacity = this.getOpacity();
        if (opacity <= 0) {
            return;
        }

        ctx.save();
        ctx.globalAlpha = opacity;

        // Set lemming color based on state
        if (this.state === LemmingState.DEAD) {
            ctx.fillStyle = '#ff0000';
        } else if (this.state === LemmingState.BLOCKING) {
            ctx.fillStyle = this.explosionTimer > 0 ? '#ff8800' : '#ff6600';
        } else if (this.state === LemmingState.BASHING) {
            ctx.fillStyle = '#ffff00';
        } else if (this.state === LemmingState.DIGGING) {
            ctx.fillStyle = '#00ffff';
        } else if (this.state === LemmingState.BUILDING) {
            ctx.fillStyle = '#ff00ff';
        } else if (this.state === LemmingState.CLIMBING) {
            ctx.fillStyle = '#ffaa00';
        } else if (this.state === LemmingState.MINING) {
            ctx.fillStyle = '#8B4513';
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

            ctx.font = `bold ${Math.max(10, this.getHeight())}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;

            const textX = this.x;
            const textY = this.y - 2;

            ctx.strokeText(seconds.toString(), textX, textY);
            ctx.fillText(seconds.toString(), textX, textY);
        }

        ctx.restore();
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