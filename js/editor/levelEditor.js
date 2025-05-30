class LevelEditor {
    constructor() {
        this.canvas = document.getElementById('editorCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.backgroundImage = null;
        this.foregroundImage = null;
        this.transparentColor = { r: 255, g: 255, b: 255, a: 255 }; // Default white
        this.pickingTransparentColor = false;
        
        this.terrain = new Terrain(800, 600);
        this.hazards = [];
        this.spawnPoint = { x: 100, y: 100 };
        this.exitPoint = { x: 700, y: 350, width: 60, height: 50 };
        
        this.selectedTool = null;
        this.selectedHazard = null;
        this.draggedItem = null;
        this.gridVisible = false;
        this.deathHeightVisible = false;
        
        this.levelName = 'untitled';
        this.levelData = {
            totalLemmings: 20,
            requiredLemmings: 10,
            spawnRate: 2000,
            actionCounts: {
                blocker: 5,
                basher: 5,
                digger: 5,
                builder: 5
            }
        };
        
        this.setupEventListeners();
        this.setupUI();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // File input handlers
        document.getElementById('backgroundInput').addEventListener('change', this.loadBackgroundImage.bind(this));
        document.getElementById('foregroundInput').addEventListener('change', this.loadForegroundImage.bind(this));
    }
    
    setupUI() {
        // Create toolbar if it doesn't exist
        const toolbar = document.getElementById('editorToolbar');
        if (!toolbar) return;
        
        // Tool buttons will be created by editorUI.js
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.pickingTransparentColor && this.foregroundImage) {
            this.pickTransparentColor(x, y);
            return;
        }
        
        if (!this.selectedTool) return;
        
        switch (this.selectedTool) {
            case 'spawn':
                this.spawnPoint = { x, y };
                this.selectedTool = null;
                this.updateToolSelection();
                break;
                
            case 'exit':
                this.exitPoint = { 
                    x: x - 30, 
                    y: y - 25, 
                    width: 60, 
                    height: 50 
                };
                this.selectedTool = null;
                this.updateToolSelection();
                break;
                
            case 'lava':
            case 'bearTrap':
            case 'spikes':
                const size = this.getHazardSize();
                this.hazards.push(new EditorHazard(x, y, size.width, size.height, this.selectedTool));
                break;
        }
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if clicking on an existing hazard
        for (let i = this.hazards.length - 1; i >= 0; i--) {
            const hazard = this.hazards[i];
            if (hazard.containsPoint(x, y)) {
                if (this.selectedTool === 'eraser') {
                    this.hazards.splice(i, 1);
                } else {
                    this.draggedItem = hazard;
                    this.dragOffset = {
                        x: x - hazard.x,
                        y: y - hazard.y
                    };
                }
                return;
            }
        }
        
        // Check spawn point
        if (Math.abs(x - this.spawnPoint.x) < 20 && Math.abs(y - this.spawnPoint.y) < 20) {
            this.draggedItem = this.spawnPoint;
            this.dragOffset = { x: 0, y: 0 };
            return;
        }
        
        // Check exit
        if (x >= this.exitPoint.x && x <= this.exitPoint.x + this.exitPoint.width &&
            y >= this.exitPoint.y && y <= this.exitPoint.y + this.exitPoint.height) {
            this.draggedItem = this.exitPoint;
            this.dragOffset = {
                x: x - this.exitPoint.x,
                y: y - this.exitPoint.y
            };
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.mouseX = x;
        this.mouseY = y;
        
        if (this.draggedItem) {
            this.draggedItem.x = x - this.dragOffset.x;
            this.draggedItem.y = y - this.dragOffset.y;
        }
        
        // Update cursor
        if (this.selectedTool === 'eraser') {
            this.canvas.style.cursor = 'crosshair';
        } else if (this.draggedItem) {
            this.canvas.style.cursor = 'move';
        } else {
            this.canvas.style.cursor = 'default';
        }
        
        this.draw();
    }
    
    handleMouseUp(e) {
        this.draggedItem = null;
    }
    
    pickTransparentColor(x, y) {
        // Create a temporary canvas to get pixel data from the image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.foregroundImage.width;
        tempCanvas.height = this.foregroundImage.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.foregroundImage, 0, 0);
        
        // Get pixel color
        const imageData = tempCtx.getImageData(x, y, 1, 1);
        const data = imageData.data;
        
        this.transparentColor = {
            r: data[0],
            g: data[1],
            b: data[2],
            a: data[3]
        };
        
        this.pickingTransparentColor = false;
        this.processForegroundImage();
        
        alert(`Transparent color set to RGB(${data[0]}, ${data[1]}, ${data[2]})`);
    }
    
    loadBackgroundImage(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                this.backgroundImage = img;
                this.draw();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    loadForegroundImage(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                this.foregroundImage = img;
                // Draw the image first so user can see it
                this.draw();
                // Then prompt for transparent color
                setTimeout(() => {
                    alert('Click on a color in the image to set it as transparent (non-terrain)');
                    this.pickingTransparentColor = true;
                }, 100);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    processForegroundImage() {
        if (!this.foregroundImage) return;
        
        // Clear existing terrain
        this.terrain.ctx.clearRect(0, 0, this.terrain.width, this.terrain.height);
        
        // Draw foreground image to terrain canvas
        this.terrain.ctx.drawImage(this.foregroundImage, 0, 0);
        
        // Get image data and make transparent color actually transparent
        const imageData = this.terrain.ctx.getImageData(0, 0, this.terrain.width, this.terrain.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] === this.transparentColor.r &&
                data[i + 1] === this.transparentColor.g &&
                data[i + 2] === this.transparentColor.b) {
                data[i + 3] = 0; // Make transparent
            }
        }
        
        this.terrain.ctx.putImageData(imageData, 0, 0);
        this.terrain.updateImageData();
        this.draw();
    }
    
    getHazardSize() {
        // Get size from UI inputs or use defaults
        const widthInput = document.getElementById('hazardWidth');
        const heightInput = document.getElementById('hazardHeight');
        
        return {
            width: widthInput ? parseInt(widthInput.value) : 50,
            height: heightInput ? parseInt(heightInput.value) : 30
        };
    }
    
    selectTool(tool) {
        this.selectedTool = tool;
        this.updateToolSelection();
    }
    
    updateToolSelection() {
        // Update button highlighting
        document.querySelectorAll('.toolButton').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.tool === this.selectedTool) {
                btn.classList.add('selected');
            }
        });
    }
    
    toggleGrid() {
        this.gridVisible = !this.gridVisible;
        document.querySelector('[data-tool="grid"]').classList.toggle('selected');
        this.draw();
    }
    
    toggleDeathHeight() {
        this.deathHeightVisible = !this.deathHeightVisible;
        document.querySelector('[data-tool="deathHeight"]').classList.toggle('selected');
        this.draw();
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        if (this.backgroundImage) {
            this.ctx.drawImage(this.backgroundImage, 0, 0);
        } else {
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Draw terrain
        this.terrain.draw(this.ctx);
        
        // Draw hazards
        this.hazards.forEach(hazard => hazard.draw(this.ctx));
        
        // Draw spawn point
        this.drawSpawnPoint();
        
        // Draw exit
        this.drawExit();
        
        // Draw grid overlay
        if (this.gridVisible) {
            this.drawGrid();
        }
        
        // Draw death height indicator
        if (this.deathHeightVisible && this.mouseY !== undefined) {
            this.drawDeathHeight();
        }
        
        // Draw current tool preview
        if (this.selectedTool && this.mouseX !== undefined && this.mouseY !== undefined) {
            this.drawToolPreview();
        }
    }
    
    drawSpawnPoint() {
        // Draw spawner
        this.ctx.fillStyle = '#2196F3';
        this.ctx.fillRect(this.spawnPoint.x - 20, this.spawnPoint.y - 30, 40, 30);
        
        this.ctx.strokeStyle = '#1565C0';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.spawnPoint.x - 20, this.spawnPoint.y - 30, 40, 30);
        
        // Label
        this.ctx.fillStyle = 'white';
        this.ctx.font = '10px Arial';
        this.ctx.fillText('SPAWN', this.spawnPoint.x - 18, this.spawnPoint.y - 12);
    }
    
    drawExit() {
        // Draw exit gate
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(this.exitPoint.x, this.exitPoint.y, this.exitPoint.width, this.exitPoint.height);
        
        this.ctx.strokeStyle = '#2E7D32';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.exitPoint.x, this.exitPoint.y, this.exitPoint.width, this.exitPoint.height);
        
        // Label
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('EXIT', this.exitPoint.x + 18, this.exitPoint.y + 28);
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = 0; x <= this.canvas.width; x += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.canvas.height; y += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawDeathHeight() {
        const deathDistance = MAX_FALL_HEIGHT / 10; // Scale for visibility
        
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.mouseX, this.mouseY);
        this.ctx.lineTo(this.mouseX, this.mouseY + deathDistance);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        
        // Draw skull icon at bottom
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = 'red';
        this.ctx.fillText('💀', this.mouseX - 10, this.mouseY + deathDistance + 5);
    }
    
    drawToolPreview() {
        this.ctx.globalAlpha = 0.5;
        
        const size = this.getHazardSize();
        
        switch (this.selectedTool) {
            case 'lava':
                this.ctx.fillStyle = '#ff3300';
                this.ctx.fillRect(this.mouseX - size.width/2, this.mouseY - size.height/2, size.width, size.height);
                break;
            case 'bearTrap':
                this.ctx.fillStyle = '#666666';
                this.ctx.fillRect(this.mouseX - size.width/2, this.mouseY - size.height/2, size.width, size.height);
                break;
            case 'spikes':
                this.ctx.fillStyle = '#999999';
                this.ctx.fillRect(this.mouseX - size.width/2, this.mouseY - size.height/2, size.width, size.height);
                break;
        }
        
        this.ctx.globalAlpha = 1.0;
    }
    
    saveLevel() {
        const levelData = {
            name: this.levelName,
            width: this.canvas.width,
            height: this.canvas.height,
            spawn: this.spawnPoint,
            exit: this.exitPoint,
            levelSettings: this.levelData,
            hazards: this.hazards.map(h => ({
                x: h.x,
                y: h.y,
                width: h.width,
                height: h.height,
                type: h.type
            })),
            terrain: this.terrain.canvas.toDataURL(),
            background: this.backgroundImage ? this.backgroundImage.src : null
        };
        
        // Create download link
        const dataStr = JSON.stringify(levelData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.levelName}.json`;
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
        this.levelName = data.name || 'untitled';
        this.spawnPoint = data.spawn;
        this.exitPoint = data.exit;
        this.levelData = data.levelSettings;
        
        // Load hazards
        this.hazards = data.hazards.map(h => 
            new EditorHazard(h.x, h.y, h.width, h.height, h.type)
        );
        
        // Load background
        if (data.background) {
            const img = new Image();
            img.onload = () => {
                this.backgroundImage = img;
                this.draw();
            };
            img.src = data.background;
        }
        
        // Load terrain
        const terrainImg = new Image();
        terrainImg.onload = () => {
            this.terrain.ctx.clearRect(0, 0, this.terrain.width, this.terrain.height);
            this.terrain.ctx.drawImage(terrainImg, 0, 0);
            this.terrain.updateImageData();
            this.draw();
        };
        terrainImg.src = data.terrain;
    }
    
    testLevel() {
        // Update level data from inputs
        this.levelName = document.getElementById('levelName').value;
        this.levelData.totalLemmings = parseInt(document.getElementById('totalLemmings').value);
        this.levelData.requiredLemmings = parseInt(document.getElementById('requiredLemmings').value);
        this.levelData.spawnRate = parseInt(document.getElementById('spawnRate').value);
        
        // Save current level to temporary storage
        const levelData = {
            spawn: this.spawnPoint,
            exit: this.exitPoint,
            hazards: this.hazards,
            terrain: this.terrain.canvas.toDataURL(),
            background: this.backgroundImage ? this.backgroundImage.src : null,
            levelSettings: this.levelData
        };
        
        // Store in sessionStorage for game to load
        sessionStorage.setItem('testLevel', JSON.stringify(levelData));
        
        // Switch to game mode
        window.game.testLevelFromEditor();
    }
}

// Simple hazard class for editor
class EditorHazard {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
    }
    
    containsPoint(x, y) {
        return x >= this.x - this.width/2 && 
               x <= this.x + this.width/2 &&
               y >= this.y - this.height/2 && 
               y <= this.y + this.height/2;
    }
    
    draw(ctx) {
        ctx.save();
        
        switch(this.type) {
            case 'lava':
                ctx.fillStyle = '#ff3300';
                break;
            case 'bearTrap':
                ctx.fillStyle = '#666666';
                break;
            case 'spikes':
                ctx.fillStyle = '#999999';
                break;
        }
        
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Draw border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        ctx.restore();
    }
}