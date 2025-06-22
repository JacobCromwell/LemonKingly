class Level {
    constructor() {
        this.spawnX = 100;
        this.spawnY = 100;
        this.exitX = 700;
        this.exitY = 350;
        this.exitWidth = 30; // Reduced from 60
        this.exitHeight = 25; // Reduced from 50
        this.totalLemmings = 20;
        this.requiredLemmings = 10;
        this.spawnRate = 2000; // milliseconds
        this.actionCounts = {
            [ActionType.BLOCKER]: 50,
            [ActionType.BASHER]: 50,
            [ActionType.DIGGER]: 50,
            [ActionType.BUILDER]: 50,
            [ActionType.CLIMBER]: 50,
            [ActionType.FLOATER]: 50
        };
        this.hazards = [];
        this.initializeHazards();
    }
    
    initializeHazards() {
        // Add a lava pit
        this.hazards.push(new Hazard(50, 410, 60, 30, 'lava'));
        
        // Add a bear trap
        this.hazards.push(new Hazard(383, 400, 40, 20, 'bearTrap'));
        
        // Add a spike pit
        this.hazards.push(new Hazard(575, 385, 50, 30, 'spikes'));
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
        // Draw exit gate
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(this.exitX, this.exitY, this.exitWidth, this.exitHeight);
        
        // Gate details
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.exitX, this.exitY, this.exitWidth, this.exitHeight);
        
        // Draw "field" beyond gate
        ctx.fillStyle = '#81C784';
        ctx.fillRect(this.exitX + 5, this.exitY + 5, this.exitWidth - 10, this.exitHeight - 10);
        
        // Add EXIT text that scales appropriately
        ctx.fillStyle = 'white';
        ctx.font = `${Math.max(8, this.exitWidth / 4)}px Arial`; // Scale font with exit size
        ctx.textAlign = 'center';
        ctx.fillText('EXIT', this.exitX + this.exitWidth/2, this.exitY + this.exitHeight/2 + 3);
        ctx.textAlign = 'start'; // Reset text alignment
    }
    
    // UPDATED: Draw spawner - will be scaled by game's zoom level
    drawSpawner(ctx) {
        const spawnerWidth = 20;
        const spawnerHeight = 15;
        
        // Draw spawner
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(this.spawnX - spawnerWidth/2, this.spawnY - spawnerHeight, spawnerWidth, spawnerHeight);
        
        ctx.strokeStyle = '#1565C0';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.spawnX - spawnerWidth/2, this.spawnY - spawnerHeight, spawnerWidth, spawnerHeight);
        
        // Add SPAWN text that scales appropriately
        ctx.fillStyle = 'white';
        ctx.font = `${Math.max(6, spawnerWidth / 3)}px Arial`; // Scale font with spawner size
        ctx.textAlign = 'center';
        ctx.fillText('SPAWN', this.spawnX, this.spawnY - spawnerHeight/2 + 2);
        ctx.textAlign = 'start'; // Reset text alignment
    }
    
    isAtExit(lemming) {
        return lemming.x >= this.exitX && 
               lemming.x <= this.exitX + this.exitWidth &&
               lemming.y >= this.exitY && 
               lemming.y <= this.exitY + this.exitHeight;
    }
}