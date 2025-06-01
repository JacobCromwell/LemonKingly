// Handles saving and loading level files
class EditorFileHandler {
    constructor(editor) {
        this.editor = editor;
    }
    
    saveLevel() {
        // Update level settings from UI
        this.editor.levelName = document.getElementById('levelName').value;
        this.editor.levelData.totalLemmings = parseInt(document.getElementById('totalLemmings').value);
        this.editor.levelData.requiredLemmings = parseInt(document.getElementById('requiredLemmings').value);
        this.editor.levelData.spawnRate = parseInt(document.getElementById('spawnRate').value);
        
        const levelData = {
            name: this.editor.levelName,
            width: this.editor.levelWidth,
            height: this.editor.levelHeight,
            spawn: this.editor.spawnPoint,
            exit: this.editor.exitPoint,
            levelSettings: this.editor.levelData,
            hazards: this.editor.hazards.map(h => ({
                x: h.x,
                y: h.y,
                width: h.width,
                height: h.height,
                type: h.type
            })),
            terrain: this.editor.terrain.canvas.toDataURL(),
            background: this.editor.backgroundImage ? this.editor.backgroundImage.src : null
        };
        
        const dataStr = JSON.stringify(levelData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.editor.levelName}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
    
    loadLevel(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const levelData = JSON.parse(e.target.result);
                this.loadLevelData(levelData);
            } catch (err) {
                alert('Error loading level: ' + err.message);
            }
        };
        reader.readAsText(file);
    }
    
    loadLevelData(data) {
        this.editor.levelName = data.name || 'untitled';
        this.editor.levelWidth = data.width || 1200;
        this.editor.levelHeight = data.height || 160;
        this.editor.spawnPoint = data.spawn;
        this.editor.exitPoint = data.exit;
        this.editor.levelData = data.levelSettings;
        
        // Recreate terrain at correct size
        this.editor.terrain = new Terrain(this.editor.levelWidth, this.editor.levelHeight);
        
        // Load hazards
        this.editor.hazards = data.hazards.map(h => 
            new EditorHazard(h.x, h.y, h.width, h.height, h.type)
        );
        
        // Load background
        if (data.background) {
            const img = new Image();
            img.onload = () => {
                this.editor.backgroundImage = img;
                this.editor.draw();
            };
            img.src = data.background;
        }
        
        // Load terrain
        const terrainImg = new Image();
        terrainImg.onload = () => {
            this.editor.terrain.ctx.clearRect(0, 0, this.editor.terrain.width, this.editor.terrain.height);
            this.editor.terrain.ctx.drawImage(terrainImg, 0, 0);
            this.editor.terrain.updateImageData();
            
            // Auto-adjust zoom
            const zoomX = this.editor.displayWidth / this.editor.levelWidth;
            const zoomY = this.editor.displayHeight / this.editor.levelHeight;
            this.editor.zoom = Math.min(zoomX, zoomY) * 0.9;
            this.editor.zoom = Math.max(this.editor.minZoom, Math.min(this.editor.maxZoom, this.editor.zoom));
            
            this.editor.updateZoomDisplay();
            this.editor.centerCamera();
            this.editor.draw();
        };
        terrainImg.src = data.terrain;
        
        // Update UI inputs
        document.getElementById('levelName').value = this.editor.levelName;
        document.getElementById('totalLemmings').value = this.editor.levelData.totalLemmings;
        document.getElementById('requiredLemmings').value = this.editor.levelData.requiredLemmings;
        document.getElementById('spawnRate').value = this.editor.levelData.spawnRate;
    }
    
    testLevel() {
        // Update level data from inputs
        this.editor.levelName = document.getElementById('levelName').value;
        this.editor.levelData.totalLemmings = parseInt(document.getElementById('totalLemmings').value);
        this.editor.levelData.requiredLemmings = parseInt(document.getElementById('requiredLemmings').value);
        this.editor.levelData.spawnRate = parseInt(document.getElementById('spawnRate').value);
        
        // Save current level to temporary storage
        const levelData = {
            spawn: this.editor.spawnPoint,
            exit: this.editor.exitPoint,
            hazards: this.editor.hazards,
            terrain: this.editor.terrain.canvas.toDataURL(),
            background: this.editor.backgroundImage ? this.editor.backgroundImage.src : null,
            levelSettings: this.editor.levelData,
            width: this.editor.levelWidth,
            height: this.editor.levelHeight
        };
        
        // Store in sessionStorage for game to load
        sessionStorage.setItem('testLevel', JSON.stringify(levelData));
        
        // Switch to game mode
        window.game.testLevelFromEditor();
    }
}