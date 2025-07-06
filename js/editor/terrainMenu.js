/**
 * Terrain Menu Integration for Level Editor
 * Manages terrain-related tools including Indestructible Terrain
 */
class TerrainMenu {
    constructor(levelEditor) {
        this.levelEditor = levelEditor;
        this.canvas = levelEditor.canvas;
        this.terrainManager = levelEditor.terrainManager || new IndestructibleTerrain();
        
        // Tool instances
        this.tools = {
            indestructible: null
        };
        
        // Current active tool
        this.activeTool = null;
        
        // Menu state
        this.isMenuOpen = false;
        this.menuElement = null;
        
        // Tool configurations
        this.toolConfigs = {
            indestructible: {
                id: 'indestructible',
                name: 'Indestructible',
                description: 'Draw indestructible terrain that cannot be destroyed by lemmings',
                icon: '🛡️', // Shield emoji as placeholder - can be replaced with SVG
                hotkey: 'I',
                cursor: 'crosshair'
            }
        };
        
        // Initialize components
        this.init();
    }
    
    /**
     * Initialize the terrain menu system
     */
    init() {
        this.createMenuHTML();
        this.initializeTools();
        this.bindEvents();
        this.setupHotkeys();
        
        console.log('Terrain menu initialized');
    }
    
    /**
     * Create the HTML structure for the terrain menu
     */
    createMenuHTML() {
        // Create menu container
        this.menuElement = document.createElement('div');
        this.menuElement.className = 'terrain-menu';
        this.menuElement.innerHTML = `
            <div class="menu-header">
                <h3>Terrain Tools</h3>
                <button class="menu-toggle" data-action="toggle">▼</button>
            </div>
            <div class="menu-content">
                <div class="tool-grid">
                    ${this.createToolButtons()}
                </div>
                <div class="tool-info">
                    <div class="tool-description" id="tool-description">
                        Select a terrain tool to begin editing
                    </div>
                    <div class="tool-stats" id="tool-stats">
                        <span class="stat-item">
                            <label>IDT Shapes:</label>
                            <span id="idt-count">0</span>
                        </span>
                        <span class="stat-item">
                            <label>Total Vertices:</label>
                            <span id="vertex-count">0</span>
                        </span>
                        <span class="stat-item">
                            <label>Performance:</label>
                            <span id="performance-status" class="good">Good</span>
                        </span>
                    </div>
                    <div class="tool-controls" id="tool-controls">
                        <!-- Dynamic controls will be inserted here -->
                    </div>
                </div>
            </div>
        `;
        
        // Add CSS styles
        this.addMenuStyles();
        
        // Insert into level editor
        const editorContainer = this.levelEditor.container || document.body;
        editorContainer.appendChild(this.menuElement);
    }
    
    /**
     * Create HTML for tool buttons
     */
    createToolButtons() {
        return Object.values(this.toolConfigs).map(config => `
            <button class="tool-button" 
                    data-tool="${config.id}" 
                    data-hotkey="${config.hotkey}"
                    title="${config.description} (${config.hotkey})">
                <div class="tool-icon">${config.icon}</div>
                <div class="tool-name">${config.name}</div>
                <div class="tool-hotkey">${config.hotkey}</div>
            </button>
        `).join('');
    }
    
    /**
     * Add CSS styles for the menu
     */
    addMenuStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .terrain-menu {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 280px;
                background: #2c2c2c;
                border: 2px solid #444;
                border-radius: 8px;
                color: #fff;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 1000;
            }
            
            .menu-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: #3c3c3c;
                border-radius: 6px 6px 0 0;
                border-bottom: 1px solid #555;
            }
            
            .menu-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: bold;
            }
            
            .menu-toggle {
                background: none;
                border: none;
                color: #fff;
                cursor: pointer;
                font-size: 14px;
                padding: 4px;
                border-radius: 3px;
                transition: background 0.2s;
            }
            
            .menu-toggle:hover {
                background: #555;
            }
            
            .menu-content {
                padding: 16px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .menu-content.collapsed {
                display: none;
            }
            
            .tool-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 8px;
                margin-bottom: 16px;
            }
            
            .tool-button {
                display: flex;
                align-items: center;
                padding: 12px;
                background: #404040;
                border: 2px solid #555;
                border-radius: 6px;
                color: #fff;
                cursor: pointer;
                transition: all 0.2s;
                text-align: left;
            }
            
            .tool-button:hover {
                background: #4a4a4a;
                border-color: #666;
            }
            
            .tool-button.active {
                background: #8B4CBF;
                border-color: #A855F7;
                box-shadow: 0 0 8px rgba(139, 76, 191, 0.4);
            }
            
            .tool-icon {
                font-size: 24px;
                margin-right: 12px;
            }
            
            .tool-name {
                flex: 1;
                font-weight: bold;
                font-size: 14px;
            }
            
            .tool-hotkey {
                background: #555;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 11px;
                font-family: monospace;
            }
            
            .tool-info {
                border-top: 1px solid #555;
                padding-top: 16px;
            }
            
            .tool-description {
                font-size: 13px;
                color: #ccc;
                margin-bottom: 12px;
                line-height: 1.4;
            }
            
            .tool-stats {
                display: flex;
                flex-direction: column;
                gap: 6px;
                margin-bottom: 12px;
                font-size: 12px;
            }
            
            .stat-item {
                display: flex;
                justify-content: space-between;
            }
            
            .stat-item label {
                color: #aaa;
            }
            
            #performance-status.good { color: #4ade80; }
            #performance-status.warning { color: #fbbf24; }
            #performance-status.poor { color: #f87171; }
            
            .tool-controls {
                display: none;
            }
            
            .tool-controls.active {
                display: block;
            }
            
            .control-group {
                margin-bottom: 12px;
            }
            
            .control-group label {
                display: block;
                font-size: 12px;
                color: #aaa;
                margin-bottom: 4px;
            }
            
            .control-input {
                width: 100%;
                padding: 6px 8px;
                background: #555;
                border: 1px solid #666;
                border-radius: 4px;
                color: #fff;
                font-size: 12px;
            }
            
            .action-buttons {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }
            
            .action-button {
                flex: 1;
                padding: 8px 12px;
                background: #555;
                border: 1px solid #666;
                border-radius: 4px;
                color: #fff;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.2s;
            }
            
            .action-button:hover {
                background: #666;
            }
            
            .action-button.danger {
                background: #dc2626;
                border-color: #ef4444;
            }
            
            .action-button.danger:hover {
                background: #b91c1c;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Initialize all terrain tools
     */
    initializeTools() {
        // Initialize Indestructible Terrain tool
        this.tools.indestructible = new ShapeDrawer(this.canvas, this.terrainManager);
        
        // Set up callbacks
        this.tools.indestructible.setOnShapeCreated((shape) => {
            this.onShapeCreated(shape);
        });
        
        this.tools.indestructible.setOnShapeCreationFailed(() => {
            this.onShapeCreationFailed();
        });
        
        console.log('Terrain tools initialized');
    }
    
    /**
     * Bind event handlers
     */
    bindEvents() {
        // Menu toggle
        this.menuElement.querySelector('.menu-toggle').addEventListener('click', () => {
            this.toggleMenu();
        });
        
        // Tool buttons
        this.menuElement.querySelectorAll('.tool-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const toolId = e.currentTarget.dataset.tool;
                this.selectTool(toolId);
            });
        });
        
        // Update stats periodically
        setInterval(() => {
            this.updateStats();
        }, 1000);
    }
    
    /**
     * Setup keyboard hotkeys
     */
    setupHotkeys() {
        document.addEventListener('keydown', (e) => {
            // Only handle hotkeys when level editor is active and no input is focused
            if (!this.levelEditor.isActive || e.target.tagName === 'INPUT') return;
            
            Object.values(this.toolConfigs).forEach(config => {
                if (e.key.toLowerCase() === config.hotkey.toLowerCase()) {
                    e.preventDefault();
                    this.selectTool(config.id);
                }
            });
            
            // ESC to deselect tool
            if (e.key === 'Escape') {
                this.deselectCurrentTool();
            }
        });
    }
    
    /**
     * Select a terrain tool
     */
    selectTool(toolId) {
        // Deselect current tool
        this.deselectCurrentTool();
        
        // Select new tool
        if (this.tools[toolId]) {
            this.activeTool = toolId;
            this.tools[toolId].activate();
            
            // Update UI
            this.updateToolSelection();
            this.showToolControls(toolId);
            this.updateToolDescription(toolId);
            
            // Update cursor
            const config = this.toolConfigs[toolId];
            this.canvas.style.cursor = config.cursor;
            
            console.log(`Selected terrain tool: ${toolId}`);
        }
    }
    
    /**
     * Deselect current tool
     */
    deselectCurrentTool() {
        if (this.activeTool && this.tools[this.activeTool]) {
            this.tools[this.activeTool].deactivate();
            this.activeTool = null;
            
            // Reset UI
            this.updateToolSelection();
            this.hideToolControls();
            this.canvas.style.cursor = 'default';
            
            console.log('Deselected terrain tool');
        }
    }
    
    /**
     * Update tool selection UI
     */
    updateToolSelection() {
        this.menuElement.querySelectorAll('.tool-button').forEach(button => {
            const toolId = button.dataset.tool;
            button.classList.toggle('active', toolId === this.activeTool);
        });
    }
    
    /**
     * Show controls for specific tool
     */
    showToolControls(toolId) {
        const controlsContainer = this.menuElement.querySelector('#tool-controls');
        
        switch (toolId) {
            case 'indestructible':
                controlsContainer.innerHTML = this.createIndestructibleControls();
                break;
        }
        
        controlsContainer.className = 'tool-controls active';
        this.bindToolControls(toolId);
    }
    
    /**
     * Hide tool controls
     */
    hideToolControls() {
        const controlsContainer = this.menuElement.querySelector('#tool-controls');
        controlsContainer.className = 'tool-controls';
        controlsContainer.innerHTML = '';
    }
    
    /**
     * Create controls for indestructible terrain tool
     */
    createIndestructibleControls() {
        return `
            <div class="control-group">
                <label>Drawing Instructions</label>
                <div style="font-size: 11px; color: #aaa; line-height: 1.3;">
                    • Click and drag to draw<br>
                    • Right-click to cancel<br>
                    • Get close to start point to close shape<br>
                    • Press Enter to force close<br>
                    • Backspace to remove last point
                </div>
            </div>
            
            <div class="control-group">
                <label>Drawing Settings</label>
                <label style="font-size: 11px; margin-top: 8px;">
                    <input type="checkbox" id="show-vertices" checked> Show vertices while drawing
                </label>
                <label style="font-size: 11px;">
                    <input type="checkbox" id="real-time-preview" checked> Real-time preview
                </label>
            </div>
            
            <div class="action-buttons">
                <button class="action-button" data-action="clear-all">Clear All</button>
                <button class="action-button" data-action="optimize">Optimize</button>
            </div>
        `;
    }
    
    /**
     * Bind events for tool-specific controls
     */
    bindToolControls(toolId) {
        const controlsContainer = this.menuElement.querySelector('#tool-controls');
        
        if (toolId === 'indestructible') {
            // Checkbox controls
            const showVertices = controlsContainer.querySelector('#show-vertices');
            const realTimePreview = controlsContainer.querySelector('#real-time-preview');
            
            showVertices?.addEventListener('change', (e) => {
                this.tools.indestructible.updateSettings({
                    showVertices: e.target.checked
                });
            });
            
            realTimePreview?.addEventListener('change', (e) => {
                this.tools.indestructible.updateSettings({
                    realTimePreview: e.target.checked
                });
            });
            
            // Action buttons
            controlsContainer.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                
                switch (action) {
                    case 'clear-all':
                        if (confirm('Clear all indestructible terrain? This cannot be undone.')) {
                            this.terrainManager.clearAllShapes();
                            this.updateStats();
                        }
                        break;
                        
                    case 'optimize':
                        this.terrainManager.optimizeShapes();
                        this.updateStats();
                        break;
                }
            });
        }
    }
    
    /**
     * Update tool description
     */
    updateToolDescription(toolId) {
        const descriptionElement = this.menuElement.querySelector('#tool-description');
        const config = this.toolConfigs[toolId];
        
        if (config) {
            descriptionElement.textContent = config.description;
        }
    }
    
    /**
     * Update statistics display
     */
    updateStats() {
        const stats = this.terrainManager.getPerformanceStats();
        
        // Update counts
        this.menuElement.querySelector('#idt-count').textContent = stats.totalShapes;
        this.menuElement.querySelector('#vertex-count').textContent = stats.totalVertices;
        
        // Update performance status
        const perfElement = this.menuElement.querySelector('#performance-status');
        let status = 'Good';
        let className = 'good';
        
        if (stats.budgetUtilization > 75) {
            status = 'Poor';
            className = 'poor';
        } else if (stats.budgetUtilization > 50) {
            status = 'Warning';
            className = 'warning';
        }
        
        perfElement.textContent = `${status} (${stats.budgetUtilization.toFixed(1)}%)`;
        perfElement.className = className;
    }
    
    /**
     * Toggle menu open/closed
     */
    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        const content = this.menuElement.querySelector('.menu-content');
        const toggle = this.menuElement.querySelector('.menu-toggle');
        
        content.classList.toggle('collapsed', !this.isMenuOpen);
        toggle.textContent = this.isMenuOpen ? '▼' : '▶';
    }
    
    /**
     * Handle shape creation success
     */
    onShapeCreated(shape) {
        console.log('IDT shape created successfully:', shape.id);
        this.updateStats();
        
        // Show success feedback
        this.showNotification('Indestructible terrain created', 'success');
    }
    
    /**
     * Handle shape creation failure
     */
    onShapeCreationFailed() {
        console.warn('IDT shape creation failed');
        this.showNotification('Failed to create terrain - check shape validity', 'error');
    }
    
    /**
     * Show notification message
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 12px 16px;
            background: ${type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#3b82f6'};
            color: white;
            border-radius: 6px;
            z-index: 1001;
            font-size: 13px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    /**
     * Render terrain tools (call from main render loop)
     */
    render() {
        if (this.activeTool && this.tools[this.activeTool]) {
            this.tools[this.activeTool].render();
        }
    }
    
    /**
     * Get the terrain manager instance
     */
    getTerrainManager() {
        return this.terrainManager;
    }
    
    /**
     * Get current active tool
     */
    getActiveTool() {
        return this.activeTool;
    }
    
    /**
     * Check if any tool is active
     */
    isToolActive() {
        return this.activeTool !== null;
    }
    
    /**
     * Cleanup and destroy menu
     */
    destroy() {
        // Deactivate current tool
        this.deselectCurrentTool();
        
        // Destroy tools
        Object.values(this.tools).forEach(tool => {
            if (tool && tool.destroy) {
                tool.destroy();
            }
        });
        
        // Remove menu element
        if (this.menuElement && this.menuElement.parentNode) {
            this.menuElement.parentNode.removeChild(this.menuElement);
        }
        
        console.log('Terrain menu destroyed');
    }
}

// Make TerrainMenu globally available (no module export needed)