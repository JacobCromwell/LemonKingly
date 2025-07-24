// Handles saving and loading level files - Environment Aware
class EditorFileHandler {
    constructor(editor) {
        this.editor = editor;
        this.envManager = window.environmentManager;
        this.fileAPI = this.envManager.fileAPI;
    }

    async saveLevel() {
        try {
            // Update level settings from UI with validation
            const totalLemmingsInput = document.getElementById('totalLemmingsInput');
            const totalLemmingsValue = parseInt(totalLemmingsInput.value);

            // Validate total lemmings range (1-100)
            if (totalLemmingsValue < 1 || totalLemmingsValue > 100 || isNaN(totalLemmingsValue)) {
                totalLemmingsInput.style.color = 'red';
                alert('Total Lemmings must be between 1 and 100');
                return; // Don't save if invalid
            } else {
                totalLemmingsInput.style.color = ''; // Reset color if valid
            }

            this.editor.levelName = document.getElementById('levelName').value;
            this.editor.levelWidth = parseInt(document.getElementById('levelWidth').value);
            this.editor.levelHeight = parseInt(document.getElementById('levelHeight').value);
            this.editor.levelData.totalLemmings = totalLemmingsValue; // Use validated value
            this.editor.levelData.requiredLemmings = parseInt(document.getElementById('requiredLemmings').value);
            this.editor.levelData.spawnRate = parseInt(document.getElementById('spawnRate').value);

            // Normalize music file path for saving
            let normalizedMusicFile = null;
            if (this.editor.levelData.musicFile) {
                normalizedMusicFile = this.normalizeMusicPath(this.editor.levelData.musicFile);
            }

            const levelData = {
                name: this.editor.levelName,
                width: this.editor.levelWidth,
                height: this.editor.levelHeight,
                spawn: this.editor.spawnPoint,
                exit: this.editor.exitPoint,
                levelSettings: {
                    ...this.editor.levelData,
                    musicFile: normalizedMusicFile // Use normalized path
                },
                hazards: this.editor.hazards.map(h => ({
                    x: h.x,
                    y: h.y,
                    width: h.width,
                    height: h.height,
                    type: h.type
                })),
                terrain: this.editor.terrain.canvas.toDataURL(),
                background: this.editor.backgroundImage ? this.editor.backgroundImage.src : null,
                zoom: this.editor.zoom,
                camera: {
                    x: this.editor.camera.x,
                    y: this.editor.camera.y
                },
                // Add environment info
                environment: this.envManager.environment,
                savedAt: new Date().toISOString()
            };

            // Use environment-aware file saving
            const filename = `${this.editor.levelName}.json`;
            this.fileAPI.saveFile(levelData, filename, 'application/json');

            this.envManager.devLog('Level saved successfully:', filename);

            // Show success message
            if (this.envManager.isProduction()) {
                this.showNotification('Level saved successfully!', 'success');
            }

        } catch (error) {
            this.envManager.handleError(error, 'level saving');
        }
    }

    /**
     * Normalize music file path for consistent saving
     * Converts any local or development paths to standard assets/music format
     * @param {string} musicPath - Original music path
     * @returns {string} Normalized path
     */
    normalizeMusicPath(musicPath) {
        if (!musicPath) return null;

        // Remove LOCAL: prefix if present
        if (musicPath.startsWith('LOCAL:')) {
            const filename = musicPath.substring(6); // Remove 'LOCAL:' prefix
            return `assets/music/${filename}`;
        }

        // If it already starts with assets/music, keep it as is
        if (musicPath.startsWith('assets/music/')) {
            return musicPath;
        }

        // If it starts with ./assets/music, remove the leading ./
        if (musicPath.startsWith('./assets/music/')) {
            return musicPath.substring(2); // Remove './' prefix
        }

        // If it's just a filename, add the assets/music path
        if (!musicPath.includes('/')) {
            return `assets/music/${musicPath}`;
        }

        // For any other case, try to extract just the filename and add proper path
        const filename = musicPath.split('/').pop();
        return `assets/music/${filename}`;
    }

    async loadLevel(file) {
        try {
            if (!file) {
                throw new Error('No file selected');
            }

            this.envManager.devLog('Loading level file:', file.name);

            // Use environment-aware file reading
            const fileContent = await this.fileAPI.readFile(file, { encoding: 'utf8' });
            const levelData = JSON.parse(fileContent);

            await this.loadLevelData(levelData);

            this.envManager.devLog('Level loaded successfully');

        } catch (error) {
            this.envManager.handleError(error, 'level loading');
        }
    }

    async loadLevelData(data) {
        try {
            // Validate level data
            if (!this.validateLevelData(data)) {
                throw new Error('Invalid level data format');
            }

            this.editor.levelName = data.name || 'untitled';
            this.editor.levelWidth = data.width || 1200;
            this.editor.levelHeight = data.height || 160;
            this.editor.spawnPoint = data.spawn;
            this.editor.exitPoint = data.exit;
            this.editor.levelData = data.levelSettings;

            // Update music display if music file is set
            if (data.levelSettings && data.levelSettings.musicFile) {
                const selectedMusicDiv = document.getElementById('selectedMusic');
                if (selectedMusicDiv) {
                    const filename = data.levelSettings.musicFile.split('/').pop();
                    selectedMusicDiv.innerHTML = `<span>🎵 ${filename}</span>`;
                }
            }

            // Load zoom and camera position if available
            if (data.zoom !== undefined) {
                this.editor.zoom = Math.max(this.editor.minZoom, Math.min(this.editor.maxZoom, data.zoom));
                this.editor.updateZoomDisplay();
            }

            if (data.camera) {
                this.editor.camera.x = data.camera.x;
                this.editor.camera.y = data.camera.y;
                this.editor.clampCamera();
            }

            // Recreate terrain at correct size
            this.editor.terrain = new Terrain(this.editor.levelWidth, this.editor.levelHeight);

            // Load hazards
            this.editor.hazards = data.hazards.map(h =>
                new EditorHazard(h.x, h.y, h.width, h.height, h.type)
            );

            // Load background
            if (data.background) {
                await this.loadImageFromDataURL(data.background, 'background');
            }

            // Load terrain
            if (data.terrain) {
                await this.loadImageFromDataURL(data.terrain, 'terrain');
            }

            // Update UI inputs
            this.updateUIFromLevelData();

            this.envManager.devLog('Level data loaded and applied');

        } catch (error) {
            this.envManager.handleError(error, 'level data loading');
        }
    }

    /**
     * Load image from data URL
     * @param {string} dataURL - Base64 data URL
     * @param {string} type - 'background' or 'terrain'
     * @returns {Promise} Resolves when image is loaded
     */
    loadImageFromDataURL(dataURL, type) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                if (type === 'background') {
                    this.editor.backgroundImage = img;
                } else if (type === 'terrain') {
                    this.editor.terrain.ctx.clearRect(0, 0, this.editor.terrain.width, this.editor.terrain.height);
                    this.editor.terrain.ctx.drawImage(img, 0, 0);
                    this.editor.terrain.updateImageData();

                    // Auto-adjust zoom if no zoom was saved
                    if (!this.editor.zoom || this.editor.zoom === 1) {
                        const zoomX = this.editor.displayWidth / this.editor.levelWidth;
                        const zoomY = this.editor.displayHeight / this.editor.levelHeight;
                        this.editor.zoom = Math.min(zoomX, zoomY) * 0.9;
                        this.editor.zoom = Math.max(this.editor.minZoom, Math.min(this.editor.maxZoom, this.editor.zoom));
                        this.editor.updateZoomDisplay();
                        this.editor.centerCamera();
                    }
                }

                this.editor.draw();
                resolve();
            };

            img.onerror = () => {
                const errorMsg = `Failed to load ${type} image`;
                this.envManager.errorLog(errorMsg);
                reject(new Error(errorMsg));
            };

            img.src = dataURL;
        });
    }

    /**
     * Validate level data structure
     * @param {Object} data - Level data to validate
     * @returns {boolean} True if valid
     */
    validateLevelData(data) {
        const requiredFields = ['name', 'width', 'height', 'spawn', 'exit'];

        for (const field of requiredFields) {
            if (!data.hasOwnProperty(field)) {
                this.envManager.errorLog(`Missing required field: ${field}`);
                return false;
            }
        }

        // Validate spawn and exit points
        if (!data.spawn.x || !data.spawn.y) {
            this.envManager.errorLog('Invalid spawn point');
            return false;
        }

        if (!data.exit.x || !data.exit.y || !data.exit.width || !data.exit.height) {
            this.envManager.errorLog('Invalid exit point');
            return false;
        }

        return true;
    }

    /**
     * Update UI inputs from loaded level data
     */
    updateUIFromLevelData() {
        const elements = {
            levelName: this.editor.levelName,
            totalLemmingsInput: this.editor.levelData.totalLemmings,
            requiredLemmings: this.editor.levelData.requiredLemmings,
            spawnRate: this.editor.levelData.spawnRate
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });
    }

    /**
     * Show notification to user
     * @param {string} message - Message to show
     * @param {string} type - 'success', 'error', or 'info'
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `editor-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async testLevel() {
        try {
            this.envManager.devLog('Testing level...');

            // Prepare test level data with normalized music path
            let normalizedMusicFile = null;
            if (this.editor.levelData.musicFile) {
                normalizedMusicFile = this.normalizeMusicPath(this.editor.levelData.musicFile);
            }

            const testLevelData = {
                name: this.editor.levelName || 'Test Level',
                width: this.editor.levelWidth,
                height: this.editor.levelHeight,
                spawn: this.editor.spawnPoint,
                exit: this.editor.exitPoint,
                levelSettings: {
                    ...this.editor.levelData,
                    totalLemmings: parseInt(document.getElementById('totalLemmingsInput')?.value) || 20,
                    musicFile: normalizedMusicFile // Use normalized path for testing too
                },
                hazards: this.editor.hazards.map(h => ({
                    x: h.x,
                    y: h.y,
                    width: h.width,
                    height: h.height,
                    type: h.type
                })),
                terrain: this.editor.terrain.canvas.toDataURL(),
                background: this.editor.backgroundImage ? this.editor.backgroundImage.src : null,
                zoom: this.editor.zoom,
                camera: {
                    x: this.editor.camera.x,
                    y: this.editor.camera.y
                }
            };

            // Store test level in session storage
            sessionStorage.setItem('testLevel', JSON.stringify(testLevelData));

            // Switch to game mode
            if (window.game && window.game.testLevelFromEditor) {
                window.game.testLevelFromEditor();
            } else {
                throw new Error('Game instance not available');
            }

        } catch (error) {
            this.envManager.handleError(error, 'level testing');
        }
    }

    /**
     * Environment-specific file operations
     */
    getEnvironmentInfo() {
        return {
            environment: this.envManager.environment,
            isDevelopment: this.envManager.isDevelopment(),
            isProduction: this.envManager.isProduction(),
            fileSystemSupported: this.fileAPI.isFileSystemSupported(),
            features: this.envManager.getConfig().features
        };
    }
}