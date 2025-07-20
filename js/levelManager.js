// js/levelManager.js - New file for managing S3 level loading

class LevelManager {
    constructor() {
        this.envManager = window.environmentManager;
        this.availableLevels = [];
        this.currentLevelData = null;
    }

    /**
     * Fetch available levels from S3 assets folder
     * Since S3 doesn't provide directory listing, we'll use a manifest approach
     */
    async loadAvailableLevels() {
        try {
            // First, try to load a levels manifest file
            const manifestUrl = './assets/levels-manifest.json';
            const response = await fetch(manifestUrl);
            
            if (response.ok) {
                const manifest = await response.json();
                this.availableLevels = manifest.levels || [];
                this.envManager.devLog('Loaded levels from manifest:', this.availableLevels.length);
            } else {
                // Fallback: Use a predefined list of known levels
                this.availableLevels = this.getDefaultLevelList();
                this.envManager.devLog('Using default level list');
            }
            
            return this.availableLevels;
        } catch (error) {
            this.envManager.handleError(error, 'loading available levels');
            // Use fallback levels
            this.availableLevels = this.getDefaultLevelList();
            return this.availableLevels;
        }
    }

    /**
     * Default level list - update this with your actual level files
     */
    getDefaultLevelList() {
        return [
            {
                id: '04Fun',
                name: 'Fun Level 4',
                filename: '04Fun.json',
                difficulty: 'Easy',
                description: 'A fun introductory level'
            },
            // Add more levels here as you create them
            {
                id: 'sample1',
                name: 'Sample Level 1',
                filename: 'sample1.json',
                difficulty: 'Medium',
                description: 'A moderate challenge'
            },
            {
                id: 'sample2',
                name: 'Sample Level 2', 
                filename: 'sample2.json',
                difficulty: 'Hard',
                description: 'For experienced players'
            }
        ];
    }

    /**
     * Load a specific level from S3
     */
    async loadLevel(levelId) {
        try {
            const level = this.availableLevels.find(l => l.id === levelId);
            if (!level) {
                throw new Error(`Level ${levelId} not found`);
            }

            const levelUrl = `./assets/${level.filename}`;
            this.envManager.devLog(`Loading level from: ${levelUrl}`);

            const response = await fetch(levelUrl);
            if (!response.ok) {
                throw new Error(`Failed to load level: ${response.status} ${response.statusText}`);
            }

            const levelData = await response.json();
            
            // Validate level data
            if (!this.validateLevelData(levelData)) {
                throw new Error('Invalid level data format');
            }

            this.currentLevelData = levelData;
            this.envManager.devLog('Level loaded successfully:', levelData.name);
            
            return levelData;
        } catch (error) {
            this.envManager.handleError(error, `loading level ${levelId}`);
            throw error;
        }
    }

    /**
     * Validate level data structure
     */
    validateLevelData(levelData) {
        const requiredFields = ['name', 'width', 'height', 'spawn', 'exit'];
        
        for (const field of requiredFields) {
            if (!levelData.hasOwnProperty(field)) {
                this.envManager.errorLog(`Missing required field: ${field}`);
                return false;
            }
        }

        return true;
    }

    /**
     * Get level metadata for UI display
     */
    getLevelMetadata(levelId) {
        return this.availableLevels.find(l => l.id === levelId);
    }

    /**
     * Get all available levels for UI
     */
    getAllLevels() {
        return this.availableLevels;
    }
}

// Level Selection UI Manager
class LevelSelectionUI {
    constructor(levelManager, game) {
        this.levelManager = levelManager;
        this.game = game;
        this.container = null;
        this.isVisible = false;
    }

    /**
     * Create and show level selection dialog
     */
    async show() {
        if (this.isVisible) return;

        try {
            // Load available levels
            await this.levelManager.loadAvailableLevels();
            
            // Create UI
            this.createLevelSelectionUI();
            this.isVisible = true;
        } catch (error) {
            alert('Failed to load available levels. Please try again.');
        }
    }

    /**
     * Create the level selection interface
     */
    createLevelSelectionUI() {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'level-selection-dialog';
        this.container.innerHTML = `
            <div class="level-selection-content">
                <h2>Select a Level</h2>
                <div class="level-grid" id="levelGrid">
                    ${this.createLevelGrid()}
                </div>
                <div class="level-selection-buttons">
                    <button class="dialogButton cancel" onclick="levelSelectionUI.hide()">Cancel</button>
                    <label class="dialogButton fileLabel">
                        Load Custom Level
                        <input type="file" accept=".json" onchange="levelSelectionUI.handleCustomLevel(this.files[0])" style="display: none;">
                    </label>
                </div>
            </div>
        `;

        // Add styles
        this.addStyles();

        // Add to page
        document.body.appendChild(this.container);

        // Add event listeners
        this.bindEvents();
    }

    /**
     * Create the grid of available levels
     */
    createLevelGrid() {
        const levels = this.levelManager.getAllLevels();
        
        if (levels.length === 0) {
            return '<div class="no-levels">No levels available. Try loading a custom level.</div>';
        }

        return levels.map(level => `
            <div class="level-card" data-level-id="${level.id}">
                <div class="level-card-header">
                    <h3>${level.name}</h3>
                    <span class="level-difficulty ${level.difficulty?.toLowerCase() || 'unknown'}">${level.difficulty || 'Unknown'}</span>
                </div>
                <div class="level-description">
                    ${level.description || 'No description available'}
                </div>
                <button class="level-play-button" onclick="levelSelectionUI.playLevel('${level.id}')">
                    Play Level
                </button>
            </div>
        `).join('');
    }

    /**
     * Handle level selection
     */
    async playLevel(levelId) {
        try {
            // Show loading
            this.showLoading();

            // Load the level
            const levelData = await this.levelManager.loadLevel(levelId);
            
            // Store in session storage for the game to use
            sessionStorage.setItem('selectedLevel', JSON.stringify(levelData));
            
            // Hide level selection
            this.hide();
            
            // Start the game
            this.game.startLevel();
            
        } catch (error) {
            this.hideLoading();
            alert(`Failed to load level: ${error.message}`);
        }
    }

    /**
     * Handle custom level file selection
     */
    handleCustomLevel(file) {
        if (!file) return;
        
        this.game.loadAndPlayLevel(file);
        this.hide();
    }

    /**
     * Show loading state
     */
    showLoading() {
        const grid = document.getElementById('levelGrid');
        if (grid) {
            grid.innerHTML = '<div class="loading">Loading level...</div>';
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const grid = document.getElementById('levelGrid');
        if (grid) {
            grid.innerHTML = this.createLevelGrid();
        }
    }

    /**
     * Hide level selection dialog
     */
    hide() {
        if (this.container) {
            document.body.removeChild(this.container);
            this.container = null;
        }
        this.isVisible = false;
    }

    /**
     * Bind event handlers
     */
    bindEvents() {
        // Click outside to close
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.hide();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    /**
     * Add CSS styles for level selection
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .level-selection-dialog {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
            }

            .level-selection-content {
                background-color: #333;
                padding: 30px;
                border-radius: 10px;
                border: 2px solid #555;
                max-width: 800px;
                max-height: 80vh;
                overflow-y: auto;
                width: 90%;
            }

            .level-selection-content h2 {
                text-align: center;
                color: white;
                margin-top: 0;
                margin-bottom: 20px;
            }

            .level-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            }

            .level-card {
                background-color: #444;
                border: 2px solid #555;
                border-radius: 8px;
                padding: 15px;
                transition: all 0.2s;
                cursor: pointer;
            }

            .level-card:hover {
                border-color: #4CAF50;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }

            .level-card-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 10px;
            }

            .level-card h3 {
                color: white;
                margin: 0;
                font-size: 16px;
            }

            .level-difficulty {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }

            .level-difficulty.easy {
                background-color: #4CAF50;
                color: white;
            }

            .level-difficulty.medium {
                background-color: #FF9800;
                color: white;
            }

            .level-difficulty.hard {
                background-color: #f44336;
                color: white;
            }

            .level-difficulty.unknown {
                background-color: #666;
                color: white;
            }

            .level-description {
                color: #ccc;
                font-size: 14px;
                margin-bottom: 15px;
                line-height: 1.4;
            }

            .level-play-button {
                width: 100%;
                padding: 10px;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: background-color 0.3s;
            }

            .level-play-button:hover {
                background-color: #45a049;
            }

            .level-selection-buttons {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-top: 20px;
            }

            .no-levels {
                text-align: center;
                color: #ccc;
                font-style: italic;
                padding: 40px;
            }

            .loading {
                text-align: center;
                color: white;
                padding: 40px;
                font-size: 18px;
            }
        `;
        document.head.appendChild(style);
    }
}

// Integration with existing game system
class GameIntegration {
    static initializeLevelSelection(game) {
        // Create level manager and UI
        window.levelManager = new LevelManager();
        window.levelSelectionUI = new LevelSelectionUI(window.levelManager, game);

        // Modify the game's startLevel method to check for selected level
        const originalStartLevel = game.startLevel.bind(game);
        
        game.startLevel = function() {
            // Check if we have a selected level from the level selection
            const selectedLevelData = sessionStorage.getItem('selectedLevel');
            if (selectedLevelData) {
                // Use selected level
                sessionStorage.removeItem('selectedLevel');
                sessionStorage.setItem('testLevel', selectedLevelData);
            }
            
            // Call original startLevel method
            return originalStartLevel();
        };

        // Add new menu option for level selection
        GameIntegration.addLevelSelectionButton();
    }

    static addLevelSelectionButton() {
        const menu = document.getElementById('menu');
        const existingButtons = menu.querySelectorAll('.menuButton');
        
        // Create new button for level selection
        const levelSelectButton = document.createElement('button');
        levelSelectButton.className = 'menuButton';
        levelSelectButton.textContent = 'Play Level';
        levelSelectButton.onclick = () => window.levelSelectionUI.show();
        
        // Insert before the "Level Editor" button
        const loadCustomLevelBtn = Array.from(existingButtons).find(btn => 
            btn.textContent.includes('Load Custom Level')
        );
        
        if (loadCustomLevelBtn) {
            menu.insertBefore(levelSelectButton, loadCustomLevelBtn);
        } else {
            // Insert before last button (Quit)
            const lastButton = existingButtons[existingButtons.length - 1];
            menu.insertBefore(levelSelectButton, lastButton);
        }
    }
}

// Auto-initialize when the game is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for game to be created
    setTimeout(() => {
        if (window.game) {
            GameIntegration.initializeLevelSelection(window.game);
        }
    }, 100);
});