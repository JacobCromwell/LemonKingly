// Builds the editor UI dynamically
class EditorUIBuilder {
    constructor() {
        this.activeSubmenu = null;
    }

    createEditorUI() {
        const editorContainer = document.getElementById('levelEditor');

        editorContainer.innerHTML = `
            <div class="editorLayout">
                <div id="editorToolbar" class="editorToolbar">
                    <h3>Level Editor</h3>
                    
                    <!-- Main menu buttons -->
                    <div class="toolSection mainMenu">
                        <button class="menuButtonLarge" onclick="editorUI.toggleSubmenu('basic')">
                            <span class="menuIcon">🛠️</span>
                            <span class="menuLabel">Basic Tools</span>
                        </button>
                        <button class="menuButtonLarge" onclick="editorUI.toggleSubmenu('entities')">
                            <span class="menuIcon">⚡</span>
                            <span class="menuLabel">Entities</span>
                        </button>
                        <button class="menuButtonLarge" onclick="editorUI.toggleSubmenu('tools')">
                            <span class="menuIcon">📐</span>
                            <span class="menuLabel">View Tools</span>
                        </button>
                        <button class="menuButtonLarge" onclick="editorUI.toggleSubmenu('images')">
                            <span class="menuIcon">🖼️</span>
                            <span class="menuLabel">Images</span>
                        </button>
                        <button class="menuButtonLarge" onclick="editorUI.toggleSubmenu('settings')">
                            <span class="menuIcon">⚙️</span>
                            <span class="menuLabel">Level Settings</span>
                        </button>
                        <button class="menuButtonLarge" onclick="editorUI.toggleSubmenu('actions')">
                            <span class="menuIcon">💾</span>
                            <span class="menuLabel">Actions</span>
                        </button>
                    </div>
                    
                    <!-- Submenu containers -->
                    <div id="submenuContainer" class="submenuContainer">
                        <!-- Basic Tools Submenu -->
                        <div id="basicSubmenu" class="submenu hidden">
                            <h4>Basic Tools</h4>
                            <button class="toolButton" data-tool="spawn" onclick="editor.toolsHandler.selectTool('spawn')" title="Place Spawn Point">
                                <span class="toolIcon">🚪</span>
                                <span class="toolLabel">Spawn</span>
                            </button>
                            <button class="toolButton" data-tool="exit" onclick="editor.toolsHandler.selectTool('exit')" title="Place Exit">
                                <span class="toolIcon">🏁</span>
                                <span class="toolLabel">Exit</span>
                            </button>
                            <button class="toolButton" data-tool="eraser" onclick="editor.toolsHandler.selectTool('eraser')" title="Eraser">
                                <span class="toolIcon">🧹</span>
                                <span class="toolLabel">Erase</span>
                            </button>
                        </div>
                        
                        <!-- Entities Submenu -->
                        <div id="entitiesSubmenu" class="submenu hidden">
                            <h4>Hazards</h4>
                            <button class="toolButton" data-tool="lava" onclick="editor.toolsHandler.selectTool('lava')" title="Place Lava">
                                <span class="toolIcon">🔥</span>
                                <span class="toolLabel">Lava</span>
                            </button>
                            <button class="toolButton" data-tool="bearTrap" onclick="editor.toolsHandler.selectTool('bearTrap')" title="Place Bear Trap">
                                <span class="toolIcon">🪤</span>
                                <span class="toolLabel">Trap</span>
                            </button>
                            <button class="toolButton" data-tool="spikes" onclick="editor.toolsHandler.selectTool('spikes')" title="Place Spikes">
                                <span class="toolIcon">⚔️</span>
                                <span class="toolLabel">Spikes</span>
                            </button>
                            
                            <div class="hazardSize">
                                <label>Width: <input type="number" id="hazardWidth" value="50" min="20" max="200"></label>
                                <label>Height: <input type="number" id="hazardHeight" value="30" min="10" max="100"></label>
                            </div>
                            
                            <div class="separator"></div>
                            <h4>Interactive Objects</h4>
                            <p class="comingSoon">Coming Soon: Doors, Keys, Treasure, Work Rooms</p>
                        </div>
                        
                        <!-- View Tools Submenu -->
                        <div id="toolsSubmenu" class="submenu hidden">
                            <h4>View Options</h4>
                            <div class="zoomControls">
                                <button class="zoomButton" onclick="editor.zoom = Math.max(editor.minZoom, editor.zoom - editor.zoomStep); editor.updateZoomDisplay(); editor.draw();" title="Zoom Out">
                                    <span class="toolIcon">➖</span>
                                </button>
                                <span id="zoomLabel" class="zoomLabel">100%</span>
                                <button class="zoomButton" onclick="editor.zoom = Math.min(editor.maxZoom, editor.zoom + editor.zoomStep); editor.updateZoomDisplay(); editor.draw();" title="Zoom In">
                                    <span class="toolIcon">➕</span>
                                </button>
                            </div>
                            <button class="toolButton" onclick="editor.centerCamera(); editor.draw();" title="Center View">
                                <span class="toolIcon">⊙</span>
                                <span class="toolLabel">Center</span>
                            </button>
                            <button class="toolButton" data-tool="grid" onclick="editor.toolsHandler.toggleGrid()" title="Toggle Grid">
                                <span class="toolIcon">⊞</span>
                                <span class="toolLabel">Grid</span>
                            </button>
                            <button class="toolButton" data-tool="deathHeight" onclick="editor.toolsHandler.toggleDeathHeight()" title="Show Death Height">
                                <span class="toolIcon">📏</span>
                                <span class="toolLabel">Fall Height</span>
                            </button>
                        </div>
                        
                        <!-- Images Submenu -->
                        <div id="imagesSubmenu" class="submenu hidden">
                            <h4>Level Graphics</h4>
                            <label class="fileLabel">
                                <span class="toolIcon">🖼️</span> Background
                                <input type="file" id="backgroundInput" accept="image/*" style="display: none;">
                            </label>
                            <label class="fileLabel">
                                <span class="toolIcon">🏔️</span> Terrain
                                <input type="file" id="foregroundInput" accept="image/*" style="display: none;">
                            </label>
                            
                            <div class="separator"></div>
                            <h4>Background Color</h4>
                            <button class="toolButton" onclick="editor.imageHandler.selectBackgroundColor()" title="Select Background Color">
                                <span class="toolIcon">🎨</span>
                                <span class="toolLabel">Pick Color</span>
                            </button>
                            <p class="settingNote">Click to select a custom transparent color from the terrain image. Default is black (0,0,0).</p>
                        </div>
                        
                        <!-- Level Settings Submenu -->
                        <div id="settingsSubmenu" class="submenu hidden">
                            <h4>Level Properties</h4>
                            <div class="levelSettings">
                                <label>Name: <input type="text" id="levelName" value="untitled"></label>
                                <label>Width: <input type="number" id="levelWidth" value="1200" min="1200" max="6000" step="100"></label>
                                <label>Height: <input type="number" id="levelHeight" value="600" min="400" max="1200" step="100"></label>
                                <label>Total Lemmings: <input type="number" id="totalLemmingsInput" value="20" min="1" max="100"></label>
                                <label>Required to Save: <input type="number" id="requiredLemmings" value="10" min="1" max="100"></label>
                                <label>Spawn Rate: <input type="number" id="spawnRate" value="2000" min="250" max="5000" step="250">ms</label>
                            </div>
                            
                            <div class="separator"></div>
                            <h4>Music</h4>
                            <button class="toolButton" onclick="editorUI.showMusicSelector()">
                                <span class="toolIcon">🎵</span>
                                <span class="toolLabel">Select Music</span>
                            </button>
                            <div id="selectedMusic" class="selectedMusic">
                                <span>No music selected</span>
                            </div>

                            <!-- Music selection dialog (hidden by default) -->
                            <div id="musicSelectorDialog" class="musicSelector hidden">
                                <div class="musicSelectorContent">
                                    <h4>Choose Background Music</h4>
                                    <div id="musicList" class="musicList">
                                        <div class="loading">Loading available music...</div>
                                    </div>
                                    <div class="musicSelectorButtons">
                                        <button class="toolButton small" onclick="editorUI.selectMusic(null)">No Music</button>
                                        <button class="toolButton small" onclick="editorUI.closeMusicSelector()">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Actions Submenu -->
                        <div id="actionsSubmenu" class="submenu hidden">
                            <h4>File Actions</h4>
                            <button class="actionButton small" onclick="editor.fileHandler.testLevel()">
                                <span class="toolIcon">▶️</span> Test Level
                            </button>
                            <button class="actionButton small" onclick="editor.fileHandler.saveLevel()">
                                <span class="toolIcon">💾</span> Save Level
                            </button>
                            <label class="fileLabel small">
                                <span class="toolIcon">📁</span> Load Level
                                <input type="file" id="loadLevel" accept=".json" onchange="editor.fileHandler.loadLevel(this.files[0])" style="display: none;">
                            </label>
                            <button class="actionButton small" onclick="game.returnToMenu()">
                                <span class="toolIcon">🏠</span> Main Menu
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="editorMain">
                    <canvas id="editorCanvas"></canvas>
                </div>
            </div>
        `;

        this.addStyles();
    }

    toggleSubmenu(submenuName) {
        const submenuId = submenuName + 'Submenu';
        const submenu = document.getElementById(submenuId);
        const allSubmenus = document.querySelectorAll('.submenu');

        // Hide all submenus
        allSubmenus.forEach(menu => {
            if (menu.id !== submenuId) {
                menu.classList.add('hidden');
            }
        });

        // Toggle the selected submenu
        submenu.classList.toggle('hidden');

        // Update active submenu
        this.activeSubmenu = submenu.classList.contains('hidden') ? null : submenuName;

        // Update button states
        document.querySelectorAll('.menuButtonLarge').forEach(btn => {
            btn.classList.remove('active');
        });

        if (!submenu.classList.contains('hidden')) {
            const activeButton = document.querySelector(`[onclick*="${submenuName}"]`);
            if (activeButton) {
                activeButton.classList.add('active');
            }
        }
    }

    /**
     * Show music selector dialog
     */
    async showMusicSelector() {
        const dialog = document.getElementById('musicSelectorDialog');
        if (!dialog) return;

        dialog.classList.remove('hidden');

        // Load available music
        const musicList = document.getElementById('musicList');
        musicList.innerHTML = '<div class="loading">Loading available music...</div>';

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

            const tracks = await window.musicManager.loadAvailableMusic();

            if (tracks.length === 0) {
                musicList.innerHTML = '<div class="no-music">No music files found in assets/music/</div>';
            } else {
                musicList.innerHTML = tracks.map(track => {
                    if (track.isLocalOption) {
                        // Special handling for local file browse option
                        return `
                            <label class="musicItem localBrowse">
                                <input type="file" accept="audio/*" onchange="editorUI.handleLocalMusicFile(this.files[0])" style="display: none;">
                                <span class="musicIcon">📁</span>
                                <span class="musicName">${track.name}</span>
                            </label>
                        `;
                    } else {
                        return `
                            <div class="musicItem" onclick="editorUI.selectMusic('${track.path}')">
                                <span class="musicIcon">🎵</span>
                                <span class="musicName">${track.name}</span>
                            </div>
                        `;
                    }
                }).join('');
            }
        } catch (error) {
            console.error('Error loading music:', error);
            musicList.innerHTML = '<div class="error">Error loading music files</div>';
        }
    }

    /**
     * Handle local music file selection
     */
    async handleLocalMusicFile(file) {
        if (!file) return;

        try {
            const localTrack = await window.musicManager.handleLocalFileSelect(file);
            if (localTrack) {
                this.selectMusic(localTrack.path);
            }
        } catch (error) {
            console.error('Error handling local file:', error);
            alert('Error loading local music file');
        }
    }

    /**
     * Close music selector dialog
     */
    closeMusicSelector() {
        const dialog = document.getElementById('musicSelectorDialog');
        if (dialog) {
            dialog.classList.add('hidden');
        }
    }

    /**
     * Select a music track
     */
    selectMusic(musicPath) {
        // Update the editor's level data
        if (window.editor) {
            window.editor.levelData.musicFile = musicPath;
        }

        // Update the display
        const selectedMusicDiv = document.getElementById('selectedMusic');
        if (selectedMusicDiv) {
            if (musicPath) {
                const filename = musicPath.split('/').pop();
                selectedMusicDiv.innerHTML = `<span>🎵 ${filename}</span>`;
            } else {
                selectedMusicDiv.innerHTML = '<span>No music selected</span>';
            }
        }

        // Close the dialog
        this.closeMusicSelector();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .localBrowse {
                display: flex;
                align-items: center;
                padding: 10px;
                margin: 5px 0;
                background-color: #4a4a4a;
                border: 2px dashed #666;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .localBrowse:hover {
                background-color: #5a5a5a;
                border-color: #888;
                transform: translateX(5px);
            }

            .selectedMusic {
                margin-top: 10px;
                padding: 10px;
                background-color: #3a3a3a;
                border-radius: 4px;
                font-size: 13px;
                color: #ccc;
                text-align: center;
            }

            .musicSelector {
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

            .musicSelectorContent {
                background-color: #2a2a2a;
                padding: 20px;
                border-radius: 8px;
                border: 2px solid #444;
                max-width: 400px;
                max-height: 60vh;
                width: 90%;
                display: flex;
                flex-direction: column;
            }

            .musicSelectorContent h4 {
                margin-top: 0;
                margin-bottom: 15px;
                text-align: center;
            }

            .musicList {
                flex: 1;
                overflow-y: auto;
                margin-bottom: 15px;
                max-height: 300px;
            }

            .musicItem {
                display: flex;
                align-items: center;
                padding: 10px;
                margin: 5px 0;
                background-color: #3a3a3a;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .musicItem:hover {
                background-color: #4a4a4a;
                transform: translateX(5px);
            }

            .musicIcon {
                font-size: 20px;
                margin-right: 10px;
            }

            .musicName {
                flex: 1;
                font-size: 14px;
            }

            .musicSelectorButtons {
                display: flex;
                gap: 10px;
                justify-content: center;
            }

            .no-music {
                text-align: center;
                color: #888;
                font-style: italic;
                padding: 20px;
            }

            .loading {
                text-align: center;
                color: #ccc;
                padding: 20px;
            }

            .error {
                text-align: center;
                color: #f44336;
                padding: 20px;
            }
                
            .editorLayout {
                display: flex;
                height: 100vh;
                background-color: #222;
            }
            
            .editorToolbar {
                width: 250px;
                background-color: #2a2a2a;
                padding: 10px;
                overflow-y: auto;
                border-right: 2px solid #444;
                display: flex;
                flex-direction: column;
            }
            
            .editorToolbar h3 {
                margin: 0 0 15px 0;
                color: white;
                text-align: center;
                font-size: 20px;
            }
            
            /* Main menu styling */
            .mainMenu {
                display: flex;
                flex-direction: column;
                gap: 5px;
                margin-bottom: 15px;
            }
            
            .menuButtonLarge {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px;
                background-color: #3a3a3a;
                color: white;
                border: 2px solid #4a4a4a;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 14px;
            }
            
            .menuButtonLarge:hover {
                background-color: #4a4a4a;
                border-color: #5a5a5a;
                transform: translateX(3px);
            }
            
            .menuButtonLarge.active {
                background-color: #2a5a8a;
                border-color: #3a6a9a;
            }
            
            .menuIcon {
                font-size: 20px;
            }
            
            .menuLabel {
                font-weight: 500;
            }
            
            /* Submenu styling */
            .submenuContainer {
                flex: 1;
                overflow-y: auto;
            }
            
            .submenu {
                animation: slideIn 0.2s ease-out;
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .submenu h4 {
                margin: 10px 0 8px 0;
                color: #aaa;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .separator {
                height: 1px;
                background-color: #444;
                margin: 15px 0;
            }
            
            .comingSoon {
                color: #666;
                font-style: italic;
                font-size: 12px;
                text-align: center;
                margin: 10px 0;
            }
            
            /* NEW: Setting note styling */
            .settingNote {
                color: #888;
                font-size: 11px;
                line-height: 1.3;
                margin: 8px 0;
                padding: 8px;
                background-color: #333;
                border-radius: 4px;
                border-left: 3px solid #666;
            }
            
            /* Tool button styling */
            .toolButton {
                width: 100%;
                padding: 8px;
                margin: 2px 0;
                background-color: #444;
                color: white;
                border: 2px solid #555;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s;
            }
            
            .toolButton:hover {
                background-color: #555;
                border-color: #666;
            }
            
            .toolButton.selected {
                background-color: #4CAF50;
                border-color: #6FCF70;
            }
            
            .toolIcon {
                font-size: 20px;
            }
            
            .toolLabel {
                font-size: 12px;
            }
            
            /* Rest of the styles remain the same */
            .fileLabel {
                display: block;
                width: 100%;
                padding: 8px;
                margin: 2px 0;
                background-color: #444;
                color: white;
                border: 2px solid #555;
                border-radius: 4px;
                cursor: pointer;
                text-align: center;
                transition: all 0.2s;
            }
            
            .fileLabel:hover {
                background-color: #555;
                border-color: #666;
            }
            
            .hazardSize {
                margin-top: 10px;
            }
            
            .hazardSize label {
                display: block;
                color: white;
                font-size: 12px;
                margin: 5px 0;
            }
            
            .hazardSize input {
                width: 100%;
                padding: 4px;
                background-color: #555;
                color: white;
                border: 1px solid #666;
                border-radius: 3px;
            }
            
            .levelSettings label {
                display: block;
                color: white;
                font-size: 12px;
                margin: 5px 0;
            }
            
            .levelSettings input {
                width: 100%;
                padding: 4px;
                background-color: #555;
                color: white;
                border: 1px solid #666;
                border-radius: 3px;
            }
            
            .actionButton.small {
                padding: 6px;
                font-size: 12px;
            }
            
            .fileLabel.small {
                padding: 6px;
                font-size: 12px;
            }
            
            .editorMain {
                flex: 1;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: #111;
                padding: 20px;
                position: relative;
            }
            
            #editorCanvas {
                border: 2px solid #444;
                background-color: white;
                max-width: 100%;
                max-height: 100%;
            }
            
            .zoomControls {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin: 5px 0;
                background-color: #555;
                border-radius: 4px;
                padding: 4px;
            }
            
            .zoomButton {
                width: 30px;
                height: 30px;
                border: none;
                background-color: #666;
                color: white;
                cursor: pointer;
                border-radius: 3px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                transition: background-color 0.2s;
            }
            
            .zoomButton:hover {
                background-color: #777;
            }
            
            .zoomLabel {
                color: white;
                font-size: 14px;
                font-weight: bold;
                min-width: 50px;
                text-align: center;
            }
            
            .hidden {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    setupLemmingInputValidation() {
        const totalLemmingsInput = document.getElementById('totalLemmingsInput');
        if (totalLemmingsInput) {
            totalLemmingsInput.addEventListener('input', function () {
                const value = parseInt(this.value);
                if (value < 1 || value > 100 || isNaN(value)) {
                    this.style.color = 'red';
                } else {
                    this.style.color = '';
                }
            });

            // Also validate on blur (when user leaves the field)
            totalLemmingsInput.addEventListener('blur', function () {
                const value = parseInt(this.value);
                if (value < 1 || value > 101 || isNaN(value)) {
                    this.style.color = 'red';
                    alert('Total Lemmings must be between 1 and 100');
                    this.focus(); // Keep focus on invalid field
                }
            });
        }
    }
}

// Create global instance
window.editorUI = new EditorUIBuilder();