class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1200;
        this.canvas.height = 600;

        this.menu = document.getElementById('menu');
        this.gameUI = document.getElementById('gameUI');
        this.levelInfo = document.getElementById('levelInfo');
        this.levelEditor = document.getElementById('levelEditor');

        this.terrain = new Terrain(1200, 600);
        this.level = new Level();
        this.lemmings = [];
        this.particles = [];
        this.particlePool = [];
        this.maxParticlePool = 100;
        this.selectedAction = ActionType.NONE;

        this.lemmingsSpawned = 0;
        this.lemmingsSaved = 0;
        this.lastSpawnTime = 0;
        this.gameRunning = false;
        this.levelComplete = false;

        // Camera position for scrolling
        this.camera = { x: 0, y: 0 };
        this.levelWidth = 1200;
        this.levelHeight = 600;

        // NEW: Add zoom support for game mode
        this.zoom = 1.0;
        this.minZoom = 0.2;
        this.maxZoom = 8.0;

        // Minimap interaction
        this.isDraggingMinimap = false;

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

        this.setupMinimap();

        // Initialize game state
        this.lemmings = [];
        this.particles = [];
        this.lemmingsSpawned = 0;
        this.lemmingsSaved = 0;
        this.gameRunning = true;
        this.levelComplete = false;

        // Check if this is a custom level test
        const testLevelData = sessionStorage.getItem('testLevel');
        if (testLevelData) {
            // Load custom level
            this.loadCustomLevel(JSON.parse(testLevelData));
        } else {
            // Reset to default level
            this.terrain = new Terrain(1200, 600);
            this.terrain.loadLevel();
            this.level = new Level();
            this.customBackground = null;
            this.zoom = 1.0; // Default zoom for built-in levels
            this.camera = { x: 0, y: 0 };
        }

        // Set spawn timing - allow first lemming to spawn immediately
        this.lastSpawnTime = Date.now() - this.level.spawnRate;

        // Start music if loaded
        audioManager.playMusic();

        // Update UI to show current level settings
        this.updateActionCounts();
        this.updateStats();

        this.gameLoop();
    }

    openLevelEditor() {
        this.menu.classList.add('hidden');
        this.levelEditor.classList.remove('hidden');
        this.levelEditor.style.display = 'flex';

        // Dynamically load editor scripts if not already loaded
        if (!window.editor) {
            this.loadEditorScripts();
        }
    }

    loadEditorScripts() {
        // Scripts to load in order
        const editorScripts = [
            'js/editor/EditorUIBuilder.js',
            'js/editor/EditorBase.js',
            'js/editor/EditorInputHandler.js',
            'js/editor/EditorToolsHandler.js',
            'js/editor/EditorImageHandler.js',
            'js/editor/EditorFileHandler.js',
            'js/editor/LevelEditor.js'
        ];

        let loadIndex = 0;

        const loadNextScript = () => {
            if (loadIndex >= editorScripts.length) {
                // All scripts loaded, create UI and initialize editor
                window.editorUI.createEditorUI();
                window.editor = new LevelEditor();
                return;
            }

            const script = document.createElement('script');
            script.src = editorScripts[loadIndex];
            script.onload = () => {
                loadIndex++;
                loadNextScript();
            };
            script.onerror = () => {
                console.error('Failed to load script:', editorScripts[loadIndex]);
                loadIndex++;
                loadNextScript();
            };
            document.head.appendChild(script);
        };

        loadNextScript();
    }

    testLevelFromEditor() {
        // Get test level data from sessionStorage
        const testLevelData = JSON.parse(sessionStorage.getItem('testLevel'));
        if (!testLevelData) {
            console.error('No test level data found');
            return;
        }

        // Hide editor, show game
        this.levelEditor.classList.add('hidden');
        this.levelEditor.style.display = 'none';
        this.canvas.classList.remove('hidden');
        this.gameUI.classList.remove('hidden');
        this.levelInfo.classList.remove('hidden');

        // Initialize game state
        this.lemmings = [];
        this.particles = [];
        this.lemmingsSpawned = 0;
        this.lemmingsSaved = 0;
        this.gameRunning = true;
        this.levelComplete = false;

        // Create fresh terrain instance with correct dimensions
        const levelWidth = testLevelData?.width || 1200;
        const levelHeight = testLevelData?.height || 600;
        this.terrain = new Terrain(levelWidth, levelHeight);

        // Load custom level
        this.loadCustomLevel(testLevelData);

        // Set spawn timing - allow first lemming to spawn immediately
        this.lastSpawnTime = Date.now() - this.level.spawnRate;

        // Update UI
        this.updateActionCounts();
        this.updateStats();

        this.gameLoop();
    }

    loadCustomLevel(levelData) {
        console.log('Loading custom level:', levelData);

        // Update level settings
        this.level.spawnX = levelData.spawn.x;
        this.level.spawnY = levelData.spawn.y;
        this.level.exitX = levelData.exit.x;
        this.level.exitY = levelData.exit.y;
        this.level.exitWidth = levelData.exit.width;
        this.level.exitHeight = levelData.exit.height;

        // Update level dimensions and create properly sized terrain
        this.levelWidth = levelData.width || 1200;
        this.levelHeight = levelData.height || 600;

        // Create terrain with correct dimensions
        this.terrain = new Terrain(this.levelWidth, this.levelHeight);

        // Apply saved zoom and camera settings
        if (levelData.zoom !== undefined) {
            this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, levelData.zoom));
            console.log('Applied saved zoom:', this.zoom);
        } else {
            this.zoom = 1.0; // Default zoom for levels without zoom data
        }

        if (levelData.camera) {
            this.camera.x = levelData.camera.x;
            this.camera.y = levelData.camera.y;
            this.clampCamera();
            console.log('Applied saved camera position:', this.camera);
        } else {
            // Default camera behavior - center on spawn point
            this.centerCameraOnSpawn();
        }

        if (levelData.levelSettings) {
            this.level.totalLemmings = levelData.levelSettings.totalLemmings;
            this.level.requiredLemmings = levelData.levelSettings.requiredLemmings;
            this.level.spawnRate = levelData.levelSettings.spawnRate;

            // Use default values if properties are missing or null
            this.level.totalLemmings = levelData.levelSettings.totalLemmings || 20;
            this.level.requiredLemmings = levelData.levelSettings.requiredLemmings || 10;
            this.level.spawnRate = levelData.levelSettings.spawnRate || 2000;

            // FIXED: Convert action counts to proper format with backward compatibility
            if (levelData.levelSettings.actionCounts) {
                this.level.actionCounts = {
                    [ActionType.BLOCKER]: levelData.levelSettings.actionCounts.blocker || 5,
                    [ActionType.BASHER]: levelData.levelSettings.actionCounts.basher || 5,
                    [ActionType.DIGGER]: levelData.levelSettings.actionCounts.digger || 5,
                    [ActionType.BUILDER]: levelData.levelSettings.actionCounts.builder || 5,
                    [ActionType.CLIMBER]: levelData.levelSettings.actionCounts.climber || 5,
                    [ActionType.FLOATER]: levelData.levelSettings.actionCounts.floater || 5,
                    [ActionType.EXPLODER]: levelData.levelSettings.actionCounts.exploder || 50 
                };
            } else {
                // FIXED: Ensure all action types are included with defaults
                this.level.actionCounts = {
                    [ActionType.BLOCKER]: 5,
                    [ActionType.BASHER]: 5,
                    [ActionType.DIGGER]: 5,
                    [ActionType.BUILDER]: 5,
                    [ActionType.CLIMBER]: 5,
                    [ActionType.FLOATER]: 5,
                    [ActionType.EXPLODER]: 5
                };
            }
        } else {
            // FIXED: Fallback to defaults if levelSettings doesn't exist - include floater
            this.level.totalLemmings = 20;
            this.level.requiredLemmings = 10;
            this.level.spawnRate = 2000;
            this.level.actionCounts = {
                [ActionType.BLOCKER]: 5,
                [ActionType.BASHER]: 5,
                [ActionType.DIGGER]: 5,
                [ActionType.BUILDER]: 5,
                [ActionType.CLIMBER]: 5,
                [ActionType.FLOATER]: 5  // NEW: Add floater default
            };
        }

        // Load terrain
        if (levelData.terrain) {
            const terrainImg = new Image();
            terrainImg.onload = () => {
                this.terrain.ctx.clearRect(0, 0, this.terrain.width, this.terrain.height);
                this.terrain.ctx.drawImage(terrainImg, 0, 0);
                this.terrain.updateImageData();
            };
            terrainImg.onerror = () => {
                console.error('Failed to load terrain image');
                // Initialize with empty terrain if image fails to load
                this.terrain.updateImageData();
            };
            terrainImg.src = levelData.terrain;
        } else {
            // No terrain data, just initialize empty terrain
            this.terrain.updateImageData();
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

        console.log('Level loaded. Total lemmings:', this.level.totalLemmings, 'Required:', this.level.requiredLemmings, 'Spawn rate:', this.level.spawnRate);
        console.log('Action counts:', this.level.actionCounts); // DEBUG: Log action counts to verify floater is included
    }

    // NEW: Center camera on spawn point
    centerCameraOnSpawn() {
        const viewportWidth = this.canvas.width / this.zoom;
        const viewportHeight = this.canvas.height / this.zoom;

        this.camera.x = this.level.spawnX - viewportWidth / 2;
        this.camera.y = this.level.spawnY - viewportHeight / 2;

        this.clampCamera();
    }

    // NEW: Clamp camera to level bounds
    clampCamera() {
        const viewportWidth = this.canvas.width / this.zoom;
        const viewportHeight = this.canvas.height / this.zoom;

        this.camera.x = Math.max(0, Math.min(this.levelWidth - viewportWidth, this.camera.x));
        this.camera.y = Math.max(0, Math.min(this.levelHeight - viewportHeight, this.camera.y));
    }

    // UPDATED: Handle click with zoom transformation
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // NEW: Transform screen coordinates to world coordinates
        const worldX = (screenX / this.zoom) + this.camera.x;
        const worldY = (screenY / this.zoom) + this.camera.y;

        if (this.selectedAction === ActionType.NONE) return;

        // Find clicked lemming with larger click area
        const clickPadding = 10; // Extra pixels around lemming for easier clicking
        const lemming = this.lemmings.find(l => {
            if (l.state === LemmingState.DEAD || l.state === LemmingState.SAVED) return false;

            const lemmingWidth = l.getWidth();
            const lemmingHeight = l.getHeight();

            return Math.abs(l.x - worldX) < lemmingWidth + clickPadding &&
                Math.abs(l.y + lemmingHeight / 2 - worldY) < lemmingHeight / 2 + clickPadding;
        });

        if (lemming && this.level.actionCounts[this.selectedAction] > 0) {
            if (lemming.applyAction(this.selectedAction)) {
                this.level.actionCounts[this.selectedAction]--;
                this.updateActionCounts();
            }
        }
    }

    // UPDATED: Handle mouse move with zoom transformation
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // NEW: Transform screen coordinates to world coordinates
        const worldX = (screenX / this.zoom) + this.camera.x;
        const worldY = (screenY / this.zoom) + this.camera.y;

        // Check if hovering over a lemming
        const clickPadding = 10;
        const hoveredLemming = this.lemmings.find(l => {
            if (l.state === LemmingState.DEAD || l.state === LemmingState.SAVED) return false;

            const lemmingWidth = l.getWidth();
            const lemmingHeight = l.getHeight();

            return Math.abs(l.x - worldX) < lemmingWidth + clickPadding &&
                Math.abs(l.y + lemmingHeight / 2 - worldY) < lemmingHeight / 2 + clickPadding;
        });

        // Change cursor based on hover state and selected action
        if (hoveredLemming && this.selectedAction !== ActionType.NONE) {
            this.canvas.style.cursor = 'pointer';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }

    // UPDATED: Game loop with zoom support
    gameLoop() {
        if (!this.gameRunning) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // NEW: Apply zoom and camera transformation
        this.ctx.save();
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Draw background
        if (this.customBackground) {
            this.ctx.drawImage(this.customBackground, 0, 0, this.levelWidth, this.levelHeight);
        } else {
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.fillRect(0, 0, this.levelWidth, this.levelHeight);
        }

        // Draw terrain
        this.terrain.draw(this.ctx);

        // Draw hazards (before lemmings so they appear behind)
        this.level.drawHazards(this.ctx);

        // Draw level elements (spawn, exit) - these will be scaled by zoom
        this.level.drawExit(this.ctx);
        this.level.drawSpawner(this.ctx);

        // Update hazards
        this.level.updateHazards();

        // Spawn lemmings
        this.spawnLemming();

        // Update and draw lemmings
        this.lemmings.forEach(lemming => {
            // Update lemming zoom if it has changed
            if (lemming.zoom !== this.zoom) {
                lemming.updateZoom(this.zoom);
            }

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

            // Draw lemming (will be scaled by zoom)
            lemming.draw(this.ctx);
        });

        // Update and draw particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();

            if (particle.isDead()) {
                this.particles.splice(i, 1);
                if (this.particlePool.length < this.maxParticlePool) {
                    this.particlePool.push(particle);
                }
            } else {
                particle.draw(this.ctx);
            }
        }

        // NEW: Restore context (end zoom transformation)
        this.ctx.restore();

        // Draw UI elements at normal scale (minimap, etc.)
        this.drawMinimap();

        // Update UI
        this.updateStats();

        // Check if level is complete
        this.checkLevelComplete();

        // Continue game loop
        requestAnimationFrame(() => this.gameLoop());
    }

    // UPDATED: Minimap drawing with proper world coordinates
    drawMinimap() {
        if (!this.minimapCanvas || !this.minimapCtx) return;

        // Clear minimap
        this.minimapCtx.fillStyle = '#000000';
        this.minimapCtx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

        // Calculate scale
        const scaleX = this.minimapCanvas.width / this.levelWidth;
        const scaleY = this.minimapCanvas.height / this.levelHeight;

        // Draw terrain (green)
        if (this.terrain && this.terrain.canvas) {
            this.minimapCtx.save();
            this.minimapCtx.scale(scaleX, scaleY);

            // Create temporary canvas for terrain processing
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.levelWidth;
            tempCanvas.height = this.levelHeight;
            const tempCtx = tempCanvas.getContext('2d');

            // Draw terrain
            tempCtx.drawImage(this.terrain.canvas, 0, 0);

            // Get image data and convert to green
            const imageData = tempCtx.getImageData(0, 0, this.levelWidth, this.levelHeight);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] > 0) { // If pixel is not transparent
                    data[i] = 0;     // Red
                    data[i + 1] = 255; // Green
                    data[i + 2] = 0;   // Blue
                }
            }

            tempCtx.putImageData(imageData, 0, 0);
            this.minimapCtx.drawImage(tempCanvas, 0, 0);

            this.minimapCtx.restore();
        }

        // Draw spawn point (teal)
        this.minimapCtx.fillStyle = '#00ffff';
        this.minimapCtx.fillRect(
            this.level.spawnX * scaleX - 3,
            this.level.spawnY * scaleY - 3,
            6,
            6
        );

        // Draw exit (light purple)
        this.minimapCtx.fillStyle = '#ff99ff';
        this.minimapCtx.fillRect(
            this.level.exitX * scaleX,
            this.level.exitY * scaleY,
            this.level.exitWidth * scaleX,
            this.level.exitHeight * scaleY
        );

        // Draw lemmings (yellow)
        this.minimapCtx.fillStyle = '#ffff00';
        this.lemmings.forEach(lemming => {
            if (lemming.state !== LemmingState.DEAD && lemming.state !== LemmingState.SAVED) {
                this.minimapCtx.fillRect(
                    lemming.x * scaleX - 1,
                    lemming.y * scaleY - 1,
                    2,
                    2
                );
            }
        });

        // NEW: Draw viewport rectangle (white) - shows current zoomed view
        this.minimapCtx.strokeStyle = '#ffffff';
        this.minimapCtx.lineWidth = 2;
        const viewportWidth = this.canvas.width / this.zoom;
        const viewportHeight = this.canvas.height / this.zoom;
        this.minimapCtx.strokeRect(
            this.camera.x * scaleX,
            this.camera.y * scaleY,
            viewportWidth * scaleX,
            viewportHeight * scaleY
        );
    }

    // NEW: Updated minimap click to work with zoom
    handleMinimapClick(e) {
        const rect = this.minimapCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert minimap coordinates to level coordinates
        const scaleX = this.levelWidth / this.minimapCanvas.width;
        const scaleY = this.levelHeight / this.minimapCanvas.height;

        // Center camera on clicked position (accounting for current zoom)
        const viewportWidth = this.canvas.width / this.zoom;
        const viewportHeight = this.canvas.height / this.zoom;

        this.camera.x = (x * scaleX) - (viewportWidth / 2);
        this.camera.y = (y * scaleY) - (viewportHeight / 2);

        // Clamp camera to level bounds
        this.clampCamera();
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
            if (button) {
                const count = button.querySelector('.actionCount');
                if (count) {
                    count.textContent = this.level.actionCounts[action];
                }
            }
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
                console.log('Spawning lemming', this.lemmingsSpawned + 1, 'at', this.level.spawnX, this.level.spawnY);
                // Pass current zoom to lemming constructor
                this.lemmings.push(new Lemming(this.level.spawnX, this.level.spawnY, this.zoom));
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

        // Update spawn rate display
        document.getElementById('spawnRate').textContent = (this.level.spawnRate / 1000).toFixed(1) + 's';
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

    // Add minimap click handlers - these methods were referenced but missing implementations
    handleMinimapMouseDown(e) {
        this.isDraggingMinimap = true;
        this.handleMinimapClick(e);
    }

    handleMinimapMouseMove(e) {
        if (this.isDraggingMinimap) {
            this.handleMinimapClick(e);
        }
    }

    handleMinimapMouseUp(e) {
        this.isDraggingMinimap = false;
    }

    addParticle(x, y, color, vx, vy) {
        let particle;
        if (this.particlePool.length > 0) {
            // Reuse particle from pool
            particle = this.particlePool.pop();
            particle.reset(x, y, color, vx, vy);
        } else {
            // Create new particle
            particle = new Particle(x, y, color, vx, vy);
        }
        this.particles.push(particle);
    }

    setupMinimap() {
        // Minimap setup
        this.minimapCanvas = document.getElementById('minimapCanvas');
        if (this.minimapCanvas) {
            // Ensure minimap is visible
            this.minimapCanvas.classList.remove('hidden');
            this.minimapCanvas.style.display = 'block';

            this.minimapCtx = this.minimapCanvas.getContext('2d');
            this.minimapCanvas.width = 500;
            this.minimapCanvas.height = 200;

            // Minimap event handlers
            this.minimapCanvas.addEventListener('mousedown', this.handleMinimapMouseDown.bind(this));
            this.minimapCanvas.addEventListener('mousemove', this.handleMinimapMouseMove.bind(this));
            this.minimapCanvas.addEventListener('mouseup', this.handleMinimapMouseUp.bind(this));
            this.minimapCanvas.addEventListener('mouseleave', this.handleMinimapMouseUp.bind(this));
            this.minimapCanvas.addEventListener('click', this.handleMinimapClick.bind(this));
        }
    }
}