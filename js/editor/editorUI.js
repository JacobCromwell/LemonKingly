function createEditorUI() {
    const editorContainer = document.getElementById('levelEditor');
    
    editorContainer.innerHTML = `
        <div class="editorLayout">
            <div id="editorToolbar" class="editorToolbar">
                <h3>Tools</h3>
                
                <div class="toolSection">
                    <h4>Basic</h4>
                    <button class="toolButton" data-tool="spawn" onclick="editor.selectTool('spawn')" title="Place Spawn Point">
                        <span class="toolIcon">🚪</span>
                        <span class="toolLabel">Spawn</span>
                    </button>
                    <button class="toolButton" data-tool="exit" onclick="editor.selectTool('exit')" title="Place Exit">
                        <span class="toolIcon">🏁</span>
                        <span class="toolLabel">Exit</span>
                    </button>
                    <button class="toolButton" data-tool="eraser" onclick="editor.selectTool('eraser')" title="Eraser">
                        <span class="toolIcon">🧹</span>
                        <span class="toolLabel">Erase</span>
                    </button>
                </div>
                
                <div class="toolSection">
                    <h4>Hazards</h4>
                    <button class="toolButton" data-tool="lava" onclick="editor.selectTool('lava')" title="Place Lava">
                        <span class="toolIcon">🔥</span>
                        <span class="toolLabel">Lava</span>
                    </button>
                    <button class="toolButton" data-tool="bearTrap" onclick="editor.selectTool('bearTrap')" title="Place Bear Trap">
                        <span class="toolIcon">🪤</span>
                        <span class="toolLabel">Trap</span>
                    </button>
                    <button class="toolButton" data-tool="spikes" onclick="editor.selectTool('spikes')" title="Place Spikes">
                        <span class="toolIcon">⚔️</span>
                        <span class="toolLabel">Spikes</span>
                    </button>
                    
                    <div class="hazardSize">
                        <label>Width: <input type="number" id="hazardWidth" value="50" min="20" max="200"></label>
                        <label>Height: <input type="number" id="hazardHeight" value="30" min="10" max="100"></label>
                    </div>
                </div>
                
                <div class="toolSection">
                    <h4>View</h4>
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
                    <button class="toolButton" data-tool="grid" onclick="editor.toggleGrid()" title="Toggle Grid">
                        <span class="toolIcon">⊞</span>
                        <span class="toolLabel">Grid</span>
                    </button>
                    <button class="toolButton" data-tool="deathHeight" onclick="editor.toggleDeathHeight()" title="Show Death Height">
                        <span class="toolIcon">📏</span>
                        <span class="toolLabel">Fall</span>
                    </button>
                </div>
                
                <div class="toolSection">
                    <h4>Images</h4>
                    <label class="fileLabel">
                        <span class="toolIcon">🖼️</span> Background
                        <input type="file" id="backgroundInput" accept="image/*" style="display: none;">
                    </label>
                    <label class="fileLabel">
                        <span class="toolIcon">🏔️</span> Terrain
                        <input type="file" id="foregroundInput" accept="image/*" style="display: none;">
                    </label>
                </div>
                
                <div class="toolSection">
                    <h4>Level Settings</h4>
                    <div class="levelSettings">
                        <label>Name: <input type="text" id="levelName" value="untitled"></label>
                        <label>Lemmings: <input type="number" id="totalLemmingsInput" value="20" min="1" max="100"></label>
                        <label>Required: <input type="number" id="requiredLemmings" value="10" min="1" max="100"></label>
                        <label>Spawn Rate: <input type="number" id="spawnRate" value="2000" min="250" max="5000" step="250">ms</label>
                    </div>
                </div>
                
                <div class="toolSection">
                    <h4>Actions</h4>
                    <button class="actionButton small" onclick="editor.testLevel()">
                        <span class="toolIcon">▶️</span> Test
                    </button>
                    <button class="actionButton small" onclick="editor.saveLevel()">
                        <span class="toolIcon">💾</span> Save
                    </button>
                    <label class="fileLabel small">
                        <span class="toolIcon">📁</span> Load
                        <input type="file" id="loadLevel" accept=".json" onchange="editor.loadLevel(this.files[0])" style="display: none;">
                    </label>
                    <button class="actionButton small" onclick="game.returnToMenu()">
                        <span class="toolIcon">🏠</span> Menu
                    </button>
                </div>
            </div>
            
            <div class="editorMain">
                <canvas id="editorCanvas"></canvas>
            </div>
        </div>
    `;
    
    // Add editor-specific styles
    const style = document.createElement('style');
    style.textContent = `
        .editorLayout {
            display: flex;
            height: 100vh;
            background-color: #222;
        }
        
        .editorToolbar {
            width: 200px;
            background-color: #333;
            padding: 10px;
            overflow-y: auto;
            border-right: 2px solid #444;
        }
        
        .editorToolbar h3 {
            margin: 0 0 10px 0;
            color: white;
            text-align: center;
        }
        
        .toolSection {
            margin-bottom: 20px;
            border-bottom: 1px solid #444;
            padding-bottom: 10px;
        }
        
        .toolSection h4 {
            margin: 5px 0;
            color: #aaa;
            font-size: 14px;
        }
        
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
    `;
    document.head.appendChild(style);
}