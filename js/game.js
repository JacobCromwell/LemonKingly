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

        this.terrain = null;
        this.level = null;
        this.lemmings = [];

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

        // Add zoom support for game mode
        this.zoom = 1.0;
        this.minZoom = 0.2;
        this.maxZoom = 8.0;

        // Minimap interaction
        this.isDraggingMinimap = false;

        this.countdownActive = false;
        this.countdownStartTime = 0;
        this.countdownDuration = 3000; // 3 seconds total
        this.currentCountdownNumber = 3;

        this.isPaused = false;

        // NEW: Nuke state tracking
        this.nukeActivated = false;
        this.nukeInProgress = false;
        this.nukeLemmingIndex = 0;
        this.lastNukeTime = 0;
        this.nukeDelay = 25; // 25ms delay between each lemming

        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));

        // Add ESC key handler
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
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

    loadAndPlayLevel(file) {
        if (!file) {
            alert('Please select a level file to load.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const levelData = JSON.parse(e.target.result);

                // Validate that this is a proper level file
                if (!this.validateLevelData(levelData)) {
                    alert('Invalid level file format. Please select a valid .json level file.');
                    return;
                }

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

    // JRC TODO maybe remove this
    validateLevelData(levelData) {
        // Check for required properties
        const requiredFields = ['name', 'width', 'height', 'spawn', 'exit'];

        for (const field of requiredFields) {
            if (!levelData.hasOwnProperty(field)) {
                console.error(`Missing required field: ${field}`);
                return false;
            }
        }

        // Validate spawn and exit points
        if (!levelData.spawn || typeof levelData.spawn.x !== 'number' || typeof levelData.spawn.y !== 'number') {
            console.error('Invalid spawn point');
            return false;
        }

        if (!levelData.exit || typeof levelData.exit.x !== 'number' || typeof levelData.exit.y !== 'number' ||
            typeof levelData.exit.width !== 'number' || typeof levelData.exit.height !== 'number') {
            console.error('Invalid exit point');
            return false;
        }

        return true;
    }

    startLevel() {
        // Check if this is a custom level test
        const testLevelData = sessionStorage.getItem('testLevel');
        if (!testLevelData) {
            alert('No level data found. Please load a custom level file.');
            return;
        }

        this.menu.classList.add('hidden');
        this.canvas.classList.remove('hidden');
        this.gameUI.classList.remove('hidden');
        this.levelInfo.classList.remove('hidden');

        this.gameUI.style.display = '';

        this.setupMinimap();

        // Initialize game state
        this.lemmings = [];
        if (window.particleManager) {
            window.particleManager.clear();
        }
        this.lemmingsSpawned = 0;
        this.lemmingsSaved = 0;
        this.gameRunning = false; // Start as paused for countdown
        this.levelComplete = false;

        // Reset nuke state when starting a new level
        this.nukeActivated = false;
        this.nukeInProgress = false;
        this.nukeLemmingIndex = 0;
        this.lastNukeTime = 0;

        // Initialize countdown
        this.countdownActive = true;
        this.countdownStartTime = Date.now();
        this.currentCountdownNumber = 3;

        // Reset pause state when starting a new level
        this.isPaused = false;
        this.updatePauseButton();
        // Remove paused class from body if present
        document.body.classList.remove('game-paused');

        // Load custom level
        this.loadCustomLevel(JSON.parse(testLevelData));

        // Set spawn timing - but don't allow spawning during countdown
        this.lastSpawnTime = Date.now() + this.countdownDuration;

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

    // Updated loadEditorScripts method in game.js
    loadEditorScripts() {
        // Scripts to load in order - ALL PATHS ARE RELATIVE
        const editorScripts = [
            'js/editor/editorUIBuilder.js',
            'js/editor/editorBase.js',
            'js/editor/editorInputHandler.js',
            'js/editor/editorToolsHandler.js',
            'js/editor/editorImageHandler.js',
            'js/editor/editorFileHandler.js',
            'js/editor/levelEditor.js'
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
        if (window.particleManager) {
            window.particleManager.clear();
        }
        this.lemmingsSpawned = 0;
        this.lemmingsSaved = 0;
        this.gameRunning = false; // Start as paused for countdown
        this.levelComplete = false;

        // Reset nuke state
        this.nukeActivated = false;
        this.nukeInProgress = false;
        this.nukeLemmingIndex = 0;
        this.lastNukeTime = 0;

        // Initialize countdown
        this.countdownActive = true;
        this.countdownStartTime = Date.now();
        this.currentCountdownNumber = 3;

        // Create fresh terrain instance with correct dimensions
        const levelWidth = testLevelData?.width || 1200;
        const levelHeight = testLevelData?.height || 600;
        this.terrain = new Terrain(levelWidth, levelHeight);

        // Load custom level
        this.loadCustomLevel(testLevelData);

        // Set spawn timing - but don't allow spawning during countdown
        this.lastSpawnTime = Date.now() + this.countdownDuration;

        // Update UI
        this.updateActionCounts();
        this.updateStats();

        this.gameLoop();
    }

    // Updated loadCustomLevel method in js/game.js - Add IDT support

    loadCustomLevel(levelData) {
        console.log('Loading custom level:', levelData);

        // Create new level instance
        this.level = new Level();

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

        // Load level settings with validation
        if (levelData.levelSettings) {
            // Use the totalLemmings from the level editor, with validation
            const totalLemmings = levelData.levelSettings.totalLemmings;
            if (totalLemmings >= 1 && totalLemmings <= 100) {
                this.level.totalLemmings = totalLemmings;
            } else {
                console.warn('Invalid totalLemmings value:', totalLemmings, 'using default of 20');
                this.level.totalLemmings = 20;
            }

            this.level.requiredLemmings = levelData.levelSettings.requiredLemmings || 10;
            this.level.spawnRate = levelData.levelSettings.spawnRate || 2000;

            // Convert action counts to proper format with backward compatibility
            if (levelData.levelSettings.actionCounts) {
                this.level.actionCounts = {
                    [ActionType.BLOCKER]: levelData.levelSettings.actionCounts.blocker || 0,
                    [ActionType.BASHER]: levelData.levelSettings.actionCounts.basher || 0,
                    [ActionType.DIGGER]: levelData.levelSettings.actionCounts.digger || 0,
                    [ActionType.BUILDER]: levelData.levelSettings.actionCounts.builder || 0,
                    [ActionType.CLIMBER]: levelData.levelSettings.actionCounts.climber || 0,
                    [ActionType.FLOATER]: levelData.levelSettings.actionCounts.floater || 0,
                    [ActionType.EXPLODER]: levelData.levelSettings.actionCounts.exploder || 0,
                    [ActionType.MINER]: levelData.levelSettings.actionCounts.miner || 0
                };
            }
        } else {
            // Fallback to defaults if levelSettings doesn't exist
            this.level.totalLemmings = 20;
            this.level.requiredLemmings = 10;
            this.level.spawnRate = 2000;
            this.level.actionCounts = {
                [ActionType.BLOCKER]: 5,
                [ActionType.BASHER]: 5,
                [ActionType.DIGGER]: 5,
                [ActionType.BUILDER]: 5,
                [ActionType.CLIMBER]: 5,
                [ActionType.FLOATER]: 5,
                [ActionType.EXPLODER]: 5,
                [ActionType.MINER]: 5
            };
        }

        // Load terrain
        if (levelData.terrain) {
            const terrainImg = new Image();
            terrainImg.onload = () => {
                this.terrain.ctx.clearRect(0, 0, this.terrain.width, this.terrain.height);
                this.terrain.ctx.drawImage(terrainImg, 0, 0);
                this.terrain.updateImageData();

                // NEW: Load IDT areas after terrain is loaded
                if (levelData.idtAreas && Array.isArray(levelData.idtAreas)) {
                    this.terrain.loadIdtAreas(levelData.idtAreas);
                    console.log('Loaded', levelData.idtAreas.length, 'IDT areas for gameplay');
                }
            };
            terrainImg.onerror = () => {
                console.error('Failed to load terrain image');
                // Initialize with empty terrain if image fails to load
                this.terrain.updateImageData();

                // Still load IDT areas even if terrain image fails
                if (levelData.idtAreas && Array.isArray(levelData.idtAreas)) {
                    this.terrain.loadIdtAreas(levelData.idtAreas);
                    console.log('Loaded', levelData.idtAreas.length, 'IDT areas for gameplay (no terrain image)');
                }
            };
            terrainImg.src = levelData.terrain;
        } else {
            // No terrain data, just initialize empty terrain
            this.terrain.updateImageData();

            // Load IDT areas even without terrain image
            if (levelData.idtAreas && Array.isArray(levelData.idtAreas)) {
                this.terrain.loadIdtAreas(levelData.idtAreas);
                console.log('Loaded', levelData.idtAreas.length, 'IDT areas for gameplay (no terrain)');
            }
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

        if (levelData.levelSettings && levelData.levelSettings.musicFile) {
            this.loadLevelMusic(levelData.levelSettings.musicFile);
        } else {
            console.log('No music specified for this level');
        }

        console.log('Level loaded. Total lemmings:', this.level.totalLemmings, 'Required:', this.level.requiredLemmings, 'Spawn rate:', this.level.spawnRate);
        console.log('Action counts:', this.level.actionCounts);

        // NEW: Log IDT information
        if (levelData.idtAreas && levelData.idtAreas.length > 0) {
            console.log('IDT areas loaded:', levelData.idtAreas.length);
        }

        this.level.initializeExitAnimation();
    }

    async loadLevelMusic(musicPath) {
        try {
            // Load music manager if not already loaded
            if (!window.musicManager) {
                const script = document.createElement('script');
                script.src = 'js/musicManager.js';
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            // Play the track with fade in
            await window.musicManager.playTrack(musicPath, 2000);

        } catch (error) {
            console.error('Failed to load level music:', musicPath, error);
            // Continue without music
        }
    }

    // Center camera on spawn point
    centerCameraOnSpawn() {
        const viewportWidth = this.canvas.width / this.zoom;
        const viewportHeight = this.canvas.height / this.zoom;

        this.camera.x = this.level.spawnX - viewportWidth / 2;
        this.camera.y = this.level.spawnY - viewportHeight / 2;

        this.clampCamera();
    }

    // Clamp camera to level bounds
    clampCamera() {
        const viewportWidth = this.canvas.width / this.zoom;
        const viewportHeight = this.canvas.height / this.zoom;

        this.camera.x = Math.max(0, Math.min(this.levelWidth - viewportWidth, this.camera.x));
        this.camera.y = Math.max(0, Math.min(this.levelHeight - viewportHeight, this.camera.y));
    }

    // Handle click with zoom transformation and smart selection
    handleClick(e) {
        if (this.countdownActive || this.isPaused) return;
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Transform screen coordinates to world coordinates
        const worldX = (screenX / this.zoom) + this.camera.x;
        const worldY = (screenY / this.zoom) + this.camera.y;

        if (this.selectedAction === ActionType.NONE) return;

        // Increased click area for closely packed lemmings
        const clickPadding = 15; // Increased from 10 to 15 pixels

        // Find all lemmings within click area
        const candidateLemmings = this.lemmings.filter(l => {
            // Exclude saved lemmings and fully dead lemmings
            if (l.state === LemmingState.SAVED || l.isFullyDead) return false;

            // Exclude dead lemmings that are fading (can't apply actions to fading lemmings)
            if (l.state === LemmingState.DEAD) return false;

            const lemmingWidth = l.getWidth();
            const lemmingHeight = l.getHeight();

            return Math.abs(l.x - worldX) < lemmingWidth + clickPadding &&
                Math.abs(l.y + lemmingHeight / 2 - worldY) < lemmingHeight / 2 + clickPadding;
        });

        if (candidateLemmings.length === 0) return;

        // Filter out lemmings that already have the selected ability
        const validLemmings = candidateLemmings.filter(lemming => {
            return !lemming.hasAbility(this.selectedAction);
        });

        // If no valid lemmings (all already have the ability), don't waste the action
        if (validLemmings.length === 0) return;

        // Find closest valid lemming to click point
        let closestLemming = validLemmings[0];
        let closestDistance = this.getDistanceToClick(closestLemming, worldX, worldY);

        for (let i = 1; i < validLemmings.length; i++) {
            const distance = this.getDistanceToClick(validLemmings[i], worldX, worldY);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestLemming = validLemmings[i];
            }
        }

        // Apply action to closest valid lemming
        if (this.level.actionCounts[this.selectedAction] > 0) {
            if (closestLemming.applyAction(this.selectedAction)) {
                this.level.actionCounts[this.selectedAction]--;
                this.updateActionCounts();
            }
        }
    }

    // Helper function to calculate distance from lemming to click point
    getDistanceToClick(lemming, clickX, clickY) {
        const lemmingCenterX = lemming.x;
        const lemmingCenterY = lemming.y + lemming.getHeight() / 2;

        const dx = lemmingCenterX - clickX;
        const dy = lemmingCenterY - clickY;

        return Math.sqrt(dx * dx + dy * dy);
    }

    // Handle mouse move with zoom transformation
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Transform screen coordinates to world coordinates
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

    // UPDATED: Enhanced nuke action with sequential timing and spawn prevention
    applyNuke() {
        if (!this.gameRunning || this.nukeActivated) return;

        // Play nuke sound effect
        audioManager.playSound('nuke');

        // Activate nuke - this stops future spawning
        this.nukeActivated = true;
        this.nukeInProgress = true;
        this.nukeLemmingIndex = 0;
        this.lastNukeTime = Date.now();

        console.log(`Nuke activated! Stopping future spawns. Will explode ${this.lemmings.length} existing lemmings sequentially.`);
    }

    // NEW: Process nuke timing during game loop
    processNuke() {
        if (!this.nukeInProgress) return;

        const currentTime = Date.now();

        // Check if enough time has passed for the next lemming
        if (currentTime - this.lastNukeTime >= this.nukeDelay) {
            // Find the next lemming that hasn't been nuked yet
            while (this.nukeLemmingIndex < this.lemmings.length) {
                const lemming = this.lemmings[this.nukeLemmingIndex];

                // Skip lemmings that are already dead or saved
                if (lemming.state !== LemmingState.DEAD && lemming.state !== LemmingState.SAVED) {
                    // Apply exploder action to this lemming
                    if (lemming.applyAction(ActionType.EXPLODER)) {
                        console.log(`Nuke: Applied exploder to lemming ${this.nukeLemmingIndex + 1}`);
                    }

                    this.nukeLemmingIndex++;
                    this.lastNukeTime = currentTime;
                    return; // Exit to wait for next delay
                }

                // Skip this lemming and move to next
                this.nukeLemmingIndex++;
            }

            // All lemmings have been processed
            this.nukeInProgress = false;
            console.log('Nuke sequence complete');
        }
    }

    // Add countdown update method
    updateCountdown() {
        if (!this.countdownActive) return;

        const elapsedTime = Date.now() - this.countdownStartTime;

        if (elapsedTime >= this.countdownDuration) {
            // Countdown finished - start the game
            this.countdownActive = false;
            this.gameRunning = true;
            console.log('Countdown finished - game started!');
        } else {
            // Update countdown number based on elapsed time
            const secondsRemaining = Math.ceil((this.countdownDuration - elapsedTime) / 1000);
            this.currentCountdownNumber = Math.max(1, secondsRemaining);
        }
    }

    // Add countdown rendering method
    drawCountdown(ctx) {
        if (!this.countdownActive) return;

        // Save context
        ctx.save();

        // Create semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw countdown number
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Large, bold font for countdown
        ctx.font = 'bold 120px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // White text with black outline
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 8;
        ctx.fillStyle = 'white';

        const countdownText = this.currentCountdownNumber.toString();
        ctx.strokeText(countdownText, centerX, centerY);
        ctx.fillText(countdownText, centerX, centerY);

        // Add "Get Ready!" text above the number
        ctx.font = 'bold 36px Arial';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.fillStyle = '#FFD700'; // Gold color

        ctx.strokeText('Get Ready!', centerX, centerY - 100);
        ctx.fillText('Get Ready!', centerX, centerY - 100);

        // Restore context
        ctx.restore();
    }

    // Add pause toggle method
    togglePause() {
        if (this.countdownActive) {
            // Don't allow pausing during countdown
            return;
        }

        this.isPaused = !this.isPaused;
        this.updatePauseButton();

        // Add/remove class to body for CSS styling of disabled elements
        if (this.isPaused) {
            document.body.classList.add('game-paused');
        } else {
            document.body.classList.remove('game-paused');
        }

        console.log(this.isPaused ? 'Game paused' : 'Game resumed');
    }

    // Update pause button appearance
    updatePauseButton() {
        const pauseButton = document.querySelector('[data-action="pause"]');
        if (pauseButton) {
            const icon = pauseButton.querySelector('.pause-icon');
            const label = pauseButton.querySelector('.pause-label');

            if (this.isPaused) {
                icon.textContent = '▶️';
                label.textContent = 'Resume';
                pauseButton.classList.add('paused');
            } else {
                icon.textContent = '⏸️';
                label.textContent = 'Pause';
                pauseButton.classList.remove('paused');
            }
        }
    }

    // Game loop with zoom support
    gameLoop() {
    // Don't run game logic if paused (but still render current state)
    if (!this.gameRunning && !this.countdownActive) return;

    // Update countdown if active
    if (this.countdownActive) {
        this.updateCountdown();
        
        // NEW: Start spawn animation when countdown finishes
        if (!this.countdownActive && this.gameRunning) {
            // Countdown just finished, start spawn animation
            this.level.startSpawnAnimation();
        }
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply zoom and camera transformation
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

    // Draw hazards (before lemmings so they appear behind)
    this.level.drawHazards(this.ctx);

    // Draw terrain
    this.terrain.draw(this.ctx);

    // NEW: Update level animations (spawn and exit)
    if (this.level) {
        this.level.updateAnimations();
    }

    // Draw level elements (spawn, exit) - now with animations
    this.level.drawExit(this.ctx);
    this.level.drawSpawner(this.ctx);

    // Only update game elements if game is running AND not paused
    if (this.gameRunning && !this.isPaused) {
        // Update hazards
        this.level.updateHazards();

        // Process nuke timing if active
        this.processNuke();

        // Spawn lemmings (but not if nuke is activated)
        if (!this.nukeActivated) {
            this.spawnLemming();
        }

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

        // Update particles
        if (window.particleManager) {
            window.particleManager.update();
            window.particleManager.draw(this.ctx);
        }

        // Clean up fully faded lemmings every 5 seconds
        if (this.gameLoopCounter === undefined) {
            this.gameLoopCounter = 0;
        }

        this.gameLoopCounter++;
        if (this.gameLoopCounter % 300 === 0) {
            this.cleanupDeadLemmings();
        }
    } else {
        // During countdown or pause, still draw existing lemmings but don't update them
        this.lemmings.forEach(lemming => {
            lemming.draw(this.ctx);
        });

        // Draw particles even when paused (they look nice frozen)
        if (window.particleManager) {
            window.particleManager.draw(this.ctx);
        }
    }

    // Restore context (end zoom transformation)
    this.ctx.restore();

    // Draw countdown overlay (after restoring context, so it's not zoomed)
    if (this.countdownActive) {
        this.drawCountdown(this.ctx);
    }

    // Draw UI elements at normal scale (minimap, etc.)
    this.drawMinimap();

    // Update UI
    this.updateStats();

    // Check if level is complete (only if game is running and not paused)
    if (this.gameRunning && !this.isPaused) {
        this.checkLevelComplete();
    }

    // Continue game loop
    requestAnimationFrame(() => this.gameLoop());
}

    // Minimap drawing with proper world coordinates
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

        // Draw viewport rectangle (white) - shows current zoomed view
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

    // Updated minimap click to work with zoom
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
        this.isPaused = false; // Reset pause state
        document.body.classList.remove('game-paused'); // Remove pause styling
        this.canvas.classList.add('hidden');
        this.gameUI.style.display = 'none';
        this.levelInfo.classList.add('hidden');
        this.levelEditor.classList.add('hidden');
        this.menu.classList.remove('hidden');

        // Reset nuke state when returning to menu
        this.nukeActivated = false;
        this.nukeInProgress = false;
        this.nukeLemmingIndex = 0;
        this.lastNukeTime = 0;

        // Clear test level data
        sessionStorage.removeItem('testLevel');

        // Pause music when returning to menu
        audioManager.pauseMusic();

        // Stop music when returning to menu
        if (window.musicManager) {
            window.musicManager.stopMusic();
        }
    }

    quit() {
        if (confirm('Are you sure you want to quit?')) {
            window.close();
        }
    }

    selectAction(action) {
        if (action === 'pause') {
            this.togglePause();
            return;
        }

        // Don't allow action selection when paused
        if (this.isPaused) return;

        this.selectedAction = action;

        // Update UI
        document.querySelectorAll('.actionButton:not(.nuke):not([data-action="pause"])').forEach(btn => {
            btn.classList.remove('selected');
        });

        const actionButton = document.querySelector(`[data-action="${action}"]`);
        if (actionButton) {
            actionButton.classList.add('selected');
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

    // UPDATED: Modified to respect nuke activation
    spawnLemming() {
        if (this.isPaused || this.nukeActivated) return; // Don't spawn if nuke is activated

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

    // UPDATED: Modified to count unspawned lemmings as dead when nuke is activated
    updateStats() {
        document.getElementById('lemmingsOut').textContent = this.lemmingsSpawned;
        document.getElementById('totalLemmings').textContent = this.level.totalLemmings;
        document.getElementById('lemmingsSaved').textContent = this.lemmingsSaved;
        document.getElementById('requiredLemmings').textContent = this.level.requiredLemmings;

        // Count alive lemmings (not dead, not saved, and not fully faded)
        const alive = this.lemmings.filter(l =>
            l.state !== LemmingState.SAVED &&
            (l.state !== LemmingState.DEAD || !l.isFullyDead)
        ).length;
        document.getElementById('lemmingsAlive').textContent = alive;

        // Update spawn rate display
        document.getElementById('spawnRate').textContent = (this.level.spawnRate / 1000).toFixed(1) + 's';
    }

    // UPDATED: Modified to account for nuke preventing spawns
    checkLevelComplete() {
        const allSpawned = this.lemmingsSpawned >= this.level.totalLemmings || this.nukeActivated;

        // Check if all lemmings are either saved or fully dead (completely faded)
        const noActiveLemmings = this.lemmings.every(l =>
            l.state === LemmingState.SAVED || l.isFullyDead
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

            // Adjust minimap size for better fit underneath toolbar
            // You can modify these dimensions as needed
            this.minimapCanvas.width = 800;  // Reduced from 500
            this.minimapCanvas.height = 120; // Reduced from 200

            // Minimap event handlers
            this.minimapCanvas.addEventListener('mousedown', this.handleMinimapMouseDown.bind(this));
            this.minimapCanvas.addEventListener('mousemove', this.handleMinimapMouseMove.bind(this));
            this.minimapCanvas.addEventListener('mouseup', this.handleMinimapMouseUp.bind(this));
            this.minimapCanvas.addEventListener('mouseleave', this.handleMinimapMouseUp.bind(this));
            this.minimapCanvas.addEventListener('click', this.handleMinimapClick.bind(this));
        }
    }

    // NEW: Method to clean up fully faded lemmings from the array (optional optimization)
    cleanupDeadLemmings() {
        // Remove fully faded lemmings to prevent memory buildup
        // This is called periodically to keep the lemmings array from growing too large
        this.lemmings = this.lemmings.filter(lemming => !lemming.isFullyDead);
    }

    // Add these methods to the Game class in js/game.js

    // Add to Game constructor:
    // this.spritesLoaded = false;

    async loadGameAssets() {
        const loadingBar = document.getElementById('loadingBar');
        const loadingText = document.getElementById('loadingText');
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingFallback = document.getElementById('loadingFallback');

        try {
            // Update loading progress periodically
            const updateProgress = setInterval(() => {
                const progress = window.spriteManager.getLoadingProgress();
                const percentage = Math.round(progress * 100);

                if (loadingBar) {
                    loadingBar.style.width = percentage + '%';
                }
                if (loadingText) {
                    loadingText.textContent = `Loading sprites... ${percentage}%`;
                }
            }, 100);

            // Load all sprites
            const success = await window.spriteManager.preloadAll();

            clearInterval(updateProgress);

            if (success && window.spriteManager.isFullyLoaded()) {
                // All sprites loaded successfully
                this.spritesLoaded = true;
                this.hideLoadingScreen();
            } else {
                // Some sprites failed to load
                if (loadingFallback) {
                    loadingFallback.classList.remove('hidden');
                }

                // Check if we have at least fallback sprites
                const hasFallbacks = window.spriteManager.getLoadingProgress() > 0;
                if (hasFallbacks) {
                    // Auto-continue with fallbacks after a delay
                    setTimeout(() => this.continueWithFallback(), 3000);
                }
            }

        } catch (error) {
            console.error('Error loading game assets:', error);

            // Show fallback option
            if (loadingFallback) {
                loadingFallback.classList.remove('hidden');
            }
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            // Fade out animation
            loadingScreen.style.transition = 'opacity 0.5s ease';
            loadingScreen.style.opacity = '0';

            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    continueWithFallback() {
        console.log('Continuing with fallback graphics');
        this.spritesLoaded = true; // Mark as loaded even with fallbacks
        this.hideLoadingScreen();
    }

    // Update the draw loop in game.js to check if sprites are loaded:
    // In gameLoop() method, add at the beginning:
    // if (!this.spritesLoaded) return;
}