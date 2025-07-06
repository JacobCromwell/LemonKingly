// Main Level Editor class that ties all modules together
class LevelEditor extends EditorBase {
    constructor() {
        super();
        
        // Initialize handlers
        this.inputHandler = new EditorInputHandler(this);
        this.toolsHandler = new EditorToolsHandler(this);
        this.imageHandler = new EditorImageHandler(this);
        this.fileHandler = new EditorFileHandler(this);
        
        // Initialize terrain system
        this.terrainManager = new IndestructibleTerrain();
        this.terrainMenu = null;
        this.audioContext = null;
        
        // Test lemmings for preview
        this.testLemmings = [];
        this.showLemmingPreview = false;
        
        // Initialize terrain system
        this.initializeTerrain();
        
        // Initial setup
        this.centerCamera();
        this.draw();
    }
    
    /**
     * Initialize the indestructible terrain system
     */
    async initializeTerrain() {
        try {
            // Setup audio context for terrain sounds
            await this.setupTerrainAudio();
            
            // Create terrain menu
            this.terrainMenu = new TerrainMenu(this);
            
            console.log('Indestructible terrain system initialized');
            
        } catch (error) {
            console.warn('Could not fully initialize terrain system:', error);
            // Continue without audio - not critical for functionality
        }
    }
    
    /**
     * Setup audio context for terrain collision sounds
     */
    async setupTerrainAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Handle browsers that require user gesture to start audio
            if (this.audioContext.state === 'suspended') {
                // Add one-time click listener to resume audio context
                const resumeAudio = async () => {
                    await this.audioContext.resume();
                    document.removeEventListener('click', resumeAudio);
                    console.log('Audio context resumed after user interaction');
                };
                document.addEventListener('click', resumeAudio);
            }
            
            // Initialize terrain manager audio
            this.terrainManager.initAudio(this.audioContext);
            
        } catch (error) {
            console.warn('Audio context initialization failed:', error);
        }
    }
    
    // Add method to toggle lemming preview
    toggleLemmingPreview() {
        this.showLemmingPreview = !this.showLemmingPreview;
        
        if (this.showLemmingPreview) {
            // Create a test lemming at spawn point with current zoom
            this.testLemmings = [new Lemming(this.spawnPoint.x, this.spawnPoint.y, this.zoom)];
        } else {
            this.testLemmings = [];
        }
        
        this.draw();
    }
    
    // Update zoom method to also update test lemmings
    updateZoom() {
        super.updateZoomDisplay();
        
        // Update test lemmings with new zoom
        this.testLemmings.forEach(lemming => {
            lemming.updateZoom(this.zoom);
        });
        
        this.draw();
    }
    
    /**
     * Check collision with indestructible terrain
     * @param {Object} bounds - Entity bounds {x, y, width, height}
     * @returns {boolean} True if collision detected
     */
    checkIndestructibleCollision(bounds) {
        return this.terrainManager.checkCollisionWithSound(bounds);
    }
    
    /**
     * Get all indestructible terrain shapes
     * @returns {Array} Array of shape objects
     */
    getIndestructibleShapes() {
        return this.terrainManager.getAllShapes();
    }
    
    /**
     * Clear all indestructible terrain
     */
    clearIndestructibleTerrain() {
        this.terrainManager.clearAllShapes();
        if (this.terrainMenu) {
            this.terrainMenu.updateStats();
        }
    }
    
    /**
     * Check if any lemming action would be blocked by indestructible terrain
     * @param {Object} actionBounds - Action area bounds {x, y, width, height}
     * @returns {boolean} True if action is blocked by indestructible terrain
     */
    isActionBlockedByTerrain(actionBounds) {
        const intersectingShapes = this.terrainManager.getIntersectingShapes(actionBounds);
        
        if (intersectingShapes.length > 0) {
            // Play clunk sound to indicate blocked action
            if (this.terrainManager.clunkSound) {
                this.terrainManager.clunkSound();
            }
            return true;
        }
        
        return false;
    }
    
    /**
     * Enhanced save method that includes terrain data
     */
    save(filename) {
        // Get base save data from parent class or file handler
        let saveData = {};
        
        // If parent has save method, call it
        if (super.save) {
            saveData = super.save(filename);
        } else if (this.fileHandler && this.fileHandler.save) {
            saveData = this.fileHandler.save(filename);
        }
        
        // Ensure saveData is an object
        if (typeof saveData === 'string') {
            try {
                saveData = JSON.parse(saveData);
            } catch (e) {
                saveData = {};
            }
        } else if (!saveData || typeof saveData !== 'object') {
            saveData = {};
        }
        
        // Add terrain data
        saveData.indestructibleTerrain = this.terrainManager.serialize();
        saveData.terrainVersion = '1.0';
        
        console.log('Saved level with indestructible terrain:', {
            shapes: saveData.indestructibleTerrain.shapes.length,
            totalVertices: this.terrainManager.getTotalVertices()
        });
        
        return saveData;
    }
    
    /**
     * Enhanced load method that includes terrain data
     */
    load(data) {
        // Call base load method first
        let result;
        if (super.load) {
            result = super.load(data);
        } else if (this.fileHandler && this.fileHandler.load) {
            result = this.fileHandler.load(data);
        }
        
        // Process terrain data
        let levelData = data;
        if (typeof data === 'string') {
            try {
                levelData = JSON.parse(data);
            } catch (e) {
                console.warn('Could not parse level data for terrain loading');
                return result;
            }
        }
        
        // Load terrain data if present
        if (levelData && levelData.indestructibleTerrain) {
            const success = this.terrainManager.deserialize(levelData.indestructibleTerrain);
            
            if (success) {
                console.log('Loaded indestructible terrain:', {
                    shapes: this.terrainManager.getAllShapes().length,
                    version: levelData.terrainVersion || 'unknown'
                });
                
                // Update terrain menu stats
                if (this.terrainMenu) {
                    this.terrainMenu.updateStats();
                }
            } else {
                console.warn('Failed to load indestructible terrain data');
            }
        }
        
        // Redraw to show loaded terrain
        this.draw();
        
        return result;
    }
    
    /**
     * Enhanced clear/new level method that clears terrain
     */
    clearLevel() {
        // Call parent clear method if it exists
        if (super.clearLevel) {
            super.clearLevel();
        }
        
        // Clear terrain data
        this.terrainManager.clearAllShapes();
        
        // Update terrain menu
        if (this.terrainMenu) {
            this.terrainMenu.updateStats();
            this.terrainMenu.deselectCurrentTool();
        }
        
        console.log('Cleared level including indestructible terrain');
        this.draw();
    }
    
    /**
     * Create new level (alias for clearLevel for compatibility)
     */
    newLevel() {
        this.clearLevel();
    }
    
    // Override draw method to include tool overlays, lemming preview, and terrain
    draw() {
        super.draw();
        
        // Save context state for tool overlays and lemming preview
        this.ctx.save();
        
        // Apply zoom and camera transform for tool overlays
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw test lemmings if preview is enabled
        if (this.showLemmingPreview) {
            this.testLemmings.forEach(lemming => {
                lemming.draw(this.ctx);
            });
        }
        
        // Draw tool-specific overlays
        this.toolsHandler.drawToolOverlays(this.ctx);
        
        // Restore context
        this.ctx.restore();
        
        // Draw terrain menu overlays (these should be drawn in screen space, not world space)
        if (this.terrainMenu) {
            this.terrainMenu.render();
        }
    }
    
    /**
     * Handle window resize to update terrain menu if needed
     */
    onResize() {
        if (super.onResize) {
            super.onResize();
        }
        
        // Terrain menu handles its own positioning, but we might need to redraw
        this.draw();
    }
    
    /**
     * Cleanup method for proper disposal
     */
    destroy() {
        // Cleanup terrain system
        if (this.terrainMenu) {
            this.terrainMenu.destroy();
        }
        
        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        // Call parent destroy if it exists
        if (super.destroy) {
            super.destroy();
        }
        
        console.log('Level editor destroyed');
    }
}