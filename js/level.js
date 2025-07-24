class Level {
    constructor() {
        // Default spawn/exit positions - will be overridden when loading custom level
        this.spawnX = 100;
        this.spawnY = 100;
        this.exitX = 700;
        this.exitY = 350;
        this.exitWidth = 20;
        this.exitHeight = 15;
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
        // Note: Default hazards removed - will be loaded from custom level data
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
    
    // Draw exit - will be scaled by game's zoom level
    drawExit(ctx) {
        // Gate details
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.exitX, this.exitY, this.exitWidth, this.exitHeight);
    }
    
    // Draw spawner - will be scaled by game's zoom level
    drawSpawner(ctx) {
        const spawnerWidth = 20;
        const spawnerHeight = 15;

        ctx.strokeStyle = '#1565C0';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.spawnX - spawnerWidth/2, this.spawnY - spawnerHeight, spawnerWidth, spawnerHeight);
    }
    
    isAtExit(lemming) {
        return lemming.x >= this.exitX && 
               lemming.x <= this.exitX + this.exitWidth &&
               lemming.y >= this.exitY && 
               lemming.y <= this.exitY + this.exitHeight;
    }
}