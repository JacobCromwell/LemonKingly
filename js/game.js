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
        
        // Add ESC key handler
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        this.updateActionCounts();
    }
    
    showSettings() {
        document.getElementById('settingsDialog').classList.remove('hidden');
    }
    
    closeSettings() {
        document.getElementById('settingsDialog').classList.add('hidden');
    }
    
    showAudioSettings() {
        document.getElementById('settingsDialog').classList.add('hidden');
        document.getElementById('audioSettingsDialog').classList.remove('hidden');
        
        // Update sliders with current values
        document.getElementById('soundVolumeSlider').value = audioManager.soundVolume;
        document.getElementById('soundVolumeLabel').textContent = audioManager.soundVolume;
        document.getElementById('musicVolumeSlider').value = audioManager.musicVolume;
        document.getElementById('musicVolumeLabel').textContent = audioManager.musicVolume;
    }
    
    closeAudioSettings() {
        document.getElementById('audioSettingsDialog').classList.add('hidden');
        document.getElementById('settingsDialog').classList.remove('hidden');
    }
    
    updateSoundVolume(value) {
        audioManager.setSoundVolume(value);
        document.getElementById('soundVolumeLabel').textContent = value;
    }
    
    updateMusicVolume(value) {
        audioManager.setMusicVolume(value);
        document.getElementById('musicVolumeLabel').textContent = value;
    }
    
    loadMusicFile(file) {
        if (!file) return;
        
        const url = URL.createObjectURL(file);
        audioManager.loadMusic(url);
        audioManager.playMusic();
    }
    
    showLevelSelect() {
        document.getElementById('levelSelectDialog').classList.remove('hidden');
    }
    
    closeLevelSelect() {
        document.getElementById('levelSelectDialog').classList.add('hidden');
    }
    
    playDefaultLevel() {
        this.closeLevelSelect();
        // Clear any test level data to ensure we load default
        sessionStorage.removeItem('testLevel');
        this.startLevel();
    }
    
    loadAndPlayLevel(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const levelData = JSON.parse(e.target.result);
                this.closeLevelSelect();
                
                // Store as test level temporarily
                sessionStorage.setItem('testLevel', JSON.stringify(levelData));
                
                // Load the custom level
                this.startLevel();
                this.loadCustomLevel(levelData);
            } catch (err) {
                alert('Error loading level: ' + err.message);
            }
        };
        reader.readAsText(file);
    }
    
    startLevel() {
        this.menu.classList.add('hidden');
        this.canvas.classList.remove('hidden');
        this.gameUI.classList.remove('hidden');
        this.levelInfo.classList.remove('hidden');

        this.gameUI.style.display = '';
        
        // Reset to default level if not testing
        if (!sessionStorage.getItem('testLevel')) {
            // Create fresh instances
            this.terrain = new Terrain(800, 600);
            this.terrain.loadLevel();
            this.level = new Level();
            this.customBackground = null;
        }
        
        this.lemmings = [];
        this.particles = [];
        this.lemmingsSpawned = 0;
        this.lemmingsSaved = 0;
        this.lastSpawnTime = Date.now(); // Initialize spawn time
        this.gameRunning = true;
        this.levelComplete = false;
        
        // Start music if loaded
        audioManager.playMusic();
        
        this.gameLoop();
    }
    
    openLevelEditor() {
        this.menu.classList.add('hidden');
        this.levelEditor.classList.remove('hidden');
        this.levelEditor.style.display = 'flex';
        
        // Dynamically load editor scripts if not already loaded
        if (!window.editor) {
            // Create editor UI first
            if (typeof createEditorUI === 'function') {
                createEditorUI();
            } else {
                // Load editor UI script
                const uiScript = document.createElement('script');
                uiScript.src = 'js/editor/editorUI.js';
                uiScript.onload = () => {
                    createEditorUI();
                    this.loadEditorScripts();
                };
                document.head.appendChild(uiScript);
                return;
            }
            
            this.loadEditorScripts();
        }
    }
    
    loadEditorScripts() {
        // Load level editor script
        const editorScript = document.createElement('script');
        editorScript.src = 'js/editor/levelEditor.js';
        editorScript.onload = () => {
            window.editor = new LevelEditor();
        };
        document.head.appendChild(editorScript);
    }
    
    testLevelFromEditor() {
        // Get test level data from sessionStorage
        const testLevelData = JSON.parse(sessionStorage.getItem('testLevel'));
        if (!testLevelData) return;
        
        // Hide editor, show game
        this.levelEditor.classList.add('hidden');
        this.levelEditor.style.display = 'none';
        this.canvas.classList.remove('hidden');
        this.gameUI.classList.remove('hidden');
        this.levelInfo.classList.remove('hidden');
        
        // Create fresh terrain instance
        this.terrain = new Terrain(800, 600);
        
        // Load custom level
        this.loadCustomLevel(testLevelData);
        
        // Start game
        this.lemmings = [];
        this.particles = [];
        this.lemmingsSpawned = 0;
        this.lemmingsSaved = 0;
        this.lastSpawnTime = Date.now(); // Initialize spawn time
        this.gameRunning = true;
        this.levelComplete = false;
        
        this.gameLoop();
    }
    
    loadCustomLevel(levelData) {
        // Update level settings
        this.level.spawnX = levelData.spawn.x;
        this.level.spawnY = levelData.spawn.y;
        this.level.exitX = levelData.exit.x;
        this.level.exitY = levelData.exit.y;
        this.level.exitWidth = levelData.exit.width;
        this.level.exitHeight = levelData.exit.height;
        
        if (levelData.levelSettings) {
            this.level.totalLemmings = levelData.levelSettings.totalLemmings;
            this.level.requiredLemmings = levelData.levelSettings.requiredLemmings;
            this.level.spawnRate = levelData.levelSettings.spawnRate;
            
            // Convert action counts to proper format
            if (levelData.levelSettings.actionCounts) {
                this.level.actionCounts = {
                    [ActionType.BLOCKER]: levelData.levelSettings.actionCounts.blocker || 50,
                    [ActionType.BASHER]: levelData.levelSettings.actionCounts.basher || 50,
                    [ActionType.DIGGER]: levelData.levelSettings.actionCounts.digger || 50,
                    [ActionType.BUILDER]: levelData.levelSettings.actionCounts.builder || 50,
                    [ActionType.CLIMBER]: levelData.levelSettings.actionCounts.climber || 50
                };
            }
        }
        
        // Load terrain
        if (levelData.terrain) {
            const terrainImg = new Image();
            terrainImg.onload = () => {
                this.terrain.ctx.clearRect(0, 0, this.terrain.width, this.terrain.height);
                this.terrain.ctx.drawImage(terrainImg, 0, 0);
                this.terrain.updateImageData();
            };
            terrainImg.src = levelData.terrain;
        }
        
        // Load hazards
        this.level.hazards = [];
        if (levelData.hazards) {
            levelData.hazards.forEach(h => {
                this.level.hazards.push(new Hazard(h.x, h.y, h.width, h.height, h.type));
            });
        }
        
        // Store background for rendering
        this.customBackground = null;
        if (levelData.background) {
            const bgImg = new Image();
            bgImg.onload = () => {
                this.customBackground = bgImg;
            };
            bgImg.src = levelData.background;
        }
        
        // Update action counts in UI
        this.updateActionCounts();
    }
    
    returnToMenu() {
        this.gameRunning = false;
        this.canvas.classList.add('hidden');
        this.gameUI.style.display = 'none';
        this.levelInfo.classList.add('hidden');
        this.levelEditor.classList.add('hidden');
        this.menu.classList.remove('hidden');
        
        // Clear test level data
        sessionStorage.removeItem('testLevel');
        
        // Pause music when returning to menu
        audioManager.pauseMusic();
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
    
    handleKeyDown(e) {
        if (e.key === 'Escape' && this.gameRunning) {
            this.endLevel();
        }
    }
    
    endLevel() {
        if (!this.gameRunning) return;
        
        this.gameRunning = false;
        this.levelComplete = true;
        
        // Calculate results
        const success = this.lemmingsSaved >= this.level.requiredLemmings;
        const message = success
            ? `Level Complete!\nYou saved ${this.lemmingsSaved} of ${this.level.requiredLemmings} required lemmings!`
            : `Level Failed!\nYou only saved ${this.lemmingsSaved} of ${this.level.requiredLemmings} required lemmings.`;
        
        setTimeout(() => {
            alert(message);
            this.returnToMenu();
        }, 100);
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
        if (this.customBackground) {
            this.ctx.drawImage(this.customBackground, 0, 0);
        } else {
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Draw terrain
        this.terrain.draw(this.ctx);
        
        // Draw hazards (before lemmings so they appear behind)
        this.level.drawHazards(this.ctx);
        
        // Draw level elements
        this.level.drawExit(this.ctx);
        this.level.drawSpawner(this.ctx);
        
        // Update hazards
        this.level.updateHazards();
        
        // Spawn lemmings
        this.spawnLemming();
        
        // Update and draw lemmings
        this.lemmings.forEach(lemming => {
            lemming.update(this.terrain, this.lemmings);
            
            // Check hazard collisions
            if (lemming.state !== LemmingState.DEAD && lemming.state !== LemmingState.SAVED) {
                this.level.checkHazardCollisions(lemming);
            }
            
            // Check if lemming reached exit
            if (lemming.state !== LemmingState.SAVED && this.level.isAtExit(lemming)) {
                lemming.state = LemmingState.SAVED;
                this.lemmingsSaved++;
                audioManager.playSound('save');
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