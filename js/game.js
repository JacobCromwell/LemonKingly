class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.menu = document.getElementById('menu');
        this.gameUI = document.getElementById('gameUI');
        this.levelInfo = document.getElementById('levelInfo');
        this.levelEditor = document.getElementById('levelEditor');
        
        this.terrain = new Terrain(800, 600);
        this.level = new Level();
        this.lemmings = [];
        this.particles = [];
        this.selectedAction = ActionType.NONE;
        
        this.lemmingsSpawned = 0;
        this.lemmingsSaved = 0;
        this.lastSpawnTime = 0;
        this.gameRunning = false;
        this.levelComplete = false;
        
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        this.updateActionCounts();
    }
    
    startLevel() {
        this.menu.classList.add('hidden');
        this.canvas.classList.remove('hidden');
        this.gameUI.classList.remove('hidden');
        this.levelInfo.classList.remove('hidden');
        
        this.terrain.loadLevel();
        this.lemmings = [];
        this.particles = [];
        this.lemmingsSpawned = 0;
        this.lemmingsSaved = 0;
        this.lastSpawnTime = 0;
        this.gameRunning = true;
        this.levelComplete = false;
        
        this.gameLoop();
    }
    
    openLevelEditor() {
        this.menu.classList.add('hidden');
        this.levelEditor.classList.remove('hidden');
    }
    
    returnToMenu() {
        this.gameRunning = false;
        this.canvas.classList.add('hidden');
        this.gameUI.style.display = 'none';
        this.levelInfo.classList.add('hidden');
        this.levelEditor.classList.add('hidden');
        this.menu.classList.remove('hidden');
    }
    
    quit() {
        if (confirm('Are you sure you want to quit?')) {
            window.close();
        }
    }
    
    selectAction(action) {
        this.selectedAction = action;
        
        // Update UI
        document.querySelectorAll('.actionButton').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-action="${action}"]`).classList.add('selected');
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.selectedAction === ActionType.NONE) return;
        
        // Find clicked lemming with larger click area
        const clickPadding = 10; // Extra pixels around lemming for easier clicking
        const lemming = this.lemmings.find(l => 
            l.state !== LemmingState.DEAD && 
            l.state !== LemmingState.SAVED &&
            Math.abs(l.x - x) < LEMMING_WIDTH + clickPadding &&
            Math.abs(l.y + LEMMING_HEIGHT/2 - y) < LEMMING_HEIGHT/2 + clickPadding
        );
        
        if (lemming && this.level.actionCounts[this.selectedAction] > 0) {
            if (lemming.applyAction(this.selectedAction)) {
                this.level.actionCounts[this.selectedAction]--;
                this.updateActionCounts();
            }
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if hovering over a lemming
        const clickPadding = 10;
        const hoveredLemming = this.lemmings.find(l => 
            l.state !== LemmingState.DEAD && 
            l.state !== LemmingState.SAVED &&
            Math.abs(l.x - x) < LEMMING_WIDTH + clickPadding &&
            Math.abs(l.y + LEMMING_HEIGHT/2 - y) < LEMMING_HEIGHT/2 + clickPadding
        );
        
        // Change cursor based on hover state and selected action
        if (hoveredLemming && this.selectedAction !== ActionType.NONE) {
            this.canvas.style.cursor = 'pointer';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }
    
    updateActionCounts() {
        for (const action in this.level.actionCounts) {
            const button = document.querySelector(`[data-action="${action}"]`);
            const count = button.querySelector('.actionCount');
            count.textContent = this.level.actionCounts[action];
        }
    }
    
    increaseSpawnRate() {
        this.level.spawnRate = Math.max(250, this.level.spawnRate - 250);
        document.getElementById('spawnRate').textContent = (this.level.spawnRate / 1000).toFixed(1) + 's';
    }
    
    decreaseSpawnRate() {
        this.level.spawnRate = Math.min(5000, this.level.spawnRate + 250);
        document.getElementById('spawnRate').textContent = (this.level.spawnRate / 1000).toFixed(1) + 's';
    }
    
    spawnLemming() {
        if (this.lemmingsSpawned < this.level.totalLemmings) {
            const currentTime = Date.now();
            if (currentTime - this.lastSpawnTime >= this.level.spawnRate) {
                this.lemmings.push(new Lemming(this.level.spawnX, this.level.spawnY));
                this.lemmingsSpawned++;
                this.lastSpawnTime = currentTime;
            }
        }
    }
    
    updateStats() {
        document.getElementById('lemmingsOut').textContent = this.lemmingsSpawned;
        document.getElementById('totalLemmings').textContent = this.level.totalLemmings;
        document.getElementById('lemmingsSaved').textContent = this.lemmingsSaved;
        document.getElementById('requiredLemmings').textContent = this.level.requiredLemmings;
        
        const alive = this.lemmings.filter(l => 
            l.state !== LemmingState.DEAD && l.state !== LemmingState.SAVED
        ).length;
        document.getElementById('lemmingsAlive').textContent = alive;
    }
    
    checkLevelComplete() {
        const allSpawned = this.lemmingsSpawned >= this.level.totalLemmings;
        const noActiveLemmings = this.lemmings.every(l => 
            l.state === LemmingState.DEAD || l.state === LemmingState.SAVED
        );
        
        if (allSpawned && noActiveLemmings && !this.levelComplete) {
            this.levelComplete = true;
            
            setTimeout(() => {
                if (this.lemmingsSaved >= this.level.requiredLemmings) {
                    alert(`Level Complete!\nYou saved ${this.lemmingsSaved} lemmings!`);
                } else {
                    alert(`Level Failed!\nYou only saved ${this.lemmingsSaved} of ${this.level.requiredLemmings} required lemmings.`);
                }
                this.returnToMenu();
            }, 500);
        }
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw terrain
        this.terrain.draw(this.ctx);
        
        // Draw level elements
        this.level.drawExit(this.ctx);
        this.level.drawSpawner(this.ctx);
        
        // Spawn lemmings
        this.spawnLemming();
        
        // Update and draw lemmings
        this.lemmings.forEach(lemming => {
            lemming.update(this.terrain, this.lemmings);
            
            // Check if lemming reached exit
            if (lemming.state !== LemmingState.SAVED && this.level.isAtExit(lemming)) {
                lemming.state = LemmingState.SAVED;
                this.lemmingsSaved++;
            }
            
            lemming.draw(this.ctx);
        });
        
        // Update and draw particles
        this.particles = this.particles.filter(particle => {
            particle.update();
            particle.draw(this.ctx);
            return !particle.isDead();
        });
        
        // Update UI
        this.updateStats();
        
        // Check if level is complete
        this.checkLevelComplete();
        
        // Continue game loop
        requestAnimationFrame(() => this.gameLoop());
    }
}