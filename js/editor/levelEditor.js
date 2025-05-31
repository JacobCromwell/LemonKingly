// Enhanced Level Editor with zoom and viewport system
class LevelEditor {
    constructor() {
        // Main display canvas (what the user sees)
        this.canvas = document.getElementById('editorCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set display size
        this.displayWidth = 800;
        this.displayHeight = 600;
        this.canvas.width = this.displayWidth;
        this.canvas.height = this.displayHeight;
        
        // Actual level dimensions (can be smaller than display)
        this.levelWidth = 800;
        this.levelHeight = 160; // For your 160px tall images
        
        // Viewport and zoom settings
        this.zoom = 2.0; // Start at 2x zoom for 160px images
        this.minZoom = 1.0;
        this.maxZoom = 8.0;
        this.zoomStep = 0.5;
        
        // Camera position (top-left corner of viewport in level coordinates)
        this.camera = {
            x: 0,
            y: 0
        };
        
        // Dragging/panning
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        
        // Images
        this.backgroundImage = null;
        this.foregroundImage = null;
        this.transparentColor = { r: 255, g: 255, b: 255, a: 255 };
        this.pickingTransparentColor = false;
        
        // Create internal canvases at actual level size
        this.terrainCanvas = document.createElement('canvas');
        this.terrainCanvas.width = this.levelWidth;
        this.terrainCanvas.height = this.levelHeight;
        this.terrainCtx = this.terrainCanvas.getContext('2d');
        
        // Terrain data at actual resolution
        this.terrain = new Terrain(this.levelWidth, this.levelHeight);
        
        // Level elements
        this.hazards = [];
        this.spawnPoint = { x: 100, y: 80 };
        this.exitPoint = { x: 700, y: 80, width: 6, height: 5 };
        
        // Editor state
        this.selectedTool = null;
        this.selectedHazard = null;
        this.draggedItem = null;
        this.gridVisible = false;
        this.deathHeightVisible = false;
        
        // Level data
        this.levelName = 'untitled';
        this.levelData = {
            totalLemmings: 20,
            requiredLemmings: 10,
            spawnRate: 2000,
            actionCounts: {
                blocker: 5,
                basher: 5,
                digger: 5,
                builder: 5,
                climber: 5
            }
        };
        
        this.setupEventListeners();
        this.centerCamera();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        
        // Keyboard controls
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // File input handlers
        document.getElementById('backgroundInput').addEventListener('change', this.loadBackgroundImage.bind(this));
        document.getElementById('foregroundInput').addEventListener('change', this.loadForegroundImage.bind(this));
    }
    
    // Convert screen coordinates to level coordinates
    screenToLevel(screenX, screenY) {
        return {
            x: (screenX / this.zoom) + this.camera.x,
            y: (screenY / this.zoom) + this.camera.y
        };
    }
    
    // Convert level coordinates to screen coordinates
    levelToScreen(levelX, levelY) {
        return {
            x: (levelX - this.camera.x) * this.zoom,
            y: (levelY - this.camera.y) * this.zoom
        };
    }
    
    centerCamera() {
        // Center the level in the viewport
        const viewportWidth = this.displayWidth / this.zoom;
        const viewportHeight = this.displayHeight / this.zoom;
        
        this.camera.x = (this.levelWidth - viewportWidth) / 2;
        this.camera.y = (this.levelHeight - viewportHeight) / 2;
        
        this.clampCamera();
    }
    
    clampCamera() {
        // Prevent camera from going outside level bounds
        const viewportWidth = this.displayWidth / this.zoom;
        const viewportHeight = this.displayHeight / this.zoom;
        
        // Allow some padding so you can see edges
        const padding = 50;
        
        this.camera.x = Math.max(-padding, Math.min(this.levelWidth - viewportWidth + padding, this.camera.x));
        this.camera.y = Math.max(-padding, Math.min(this.levelHeight - viewportHeight + padding, this.camera.y));
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Get mouse position in level coordinates before zoom
        const levelPosBefore = this.screenToLevel(mouseX, mouseY);
        
        // Adjust zoom
        const delta = e.deltaY > 0 ? -this.zoomStep : this.zoomStep;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom + delta));
        
        // Update zoom display
        this.updateZoomDisplay();
        
        // Get mouse position in level coordinates after zoom
        const levelPosAfter = this.screenToLevel(mouseX, mouseY);
        
        // Adjust camera to keep mouse position fixed
        this.camera.x += levelPosBefore.x - levelPosAfter.x;
        this.camera.y += levelPosBefore.y - levelPosAfter.y;
        
        this.clampCamera();
        this.draw();
    }
    
    handleKeyDown(e) {
        const panSpeed = 20 / this.zoom;
        
        switch(e.key) {
            case 'ArrowLeft':
                this.camera.x -= panSpeed;
                break;
            case 'ArrowRight':
                this.camera.x += panSpeed;
                break;
            case 'ArrowUp':
                this.camera.y -= panSpeed;
                break;
            case 'ArrowDown':
                this.camera.y += panSpeed;
                break;
            case '+':
            case '=':
                this.zoom = Math.min(this.maxZoom, this.zoom + this.zoomStep);
                this.updateZoomDisplay();
                break;
            case '-':
            case '_':
                this.zoom = Math.max(this.minZoom, this.zoom - this.zoomStep);
                this.updateZoomDisplay();
                break;
            case 'Home':
                this.centerCamera();
                break;
            default:
                return;
        }
        
        this.clampCamera();
        this.draw();
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const levelPos = this.screenToLevel(screenX, screenY);
        
        if (this.pickingTransparentColor && this.foregroundImage) {
            this.pickTransparentColor(levelPos.x, levelPos.y);
            return;
        }
        
        if (!this.selectedTool) return;
        
        switch (this.selectedTool) {
            case 'spawn':
                this.spawnPoint = { x: levelPos.x, y: levelPos.y };
                this.selectedTool = null;
                this.updateToolSelection();
                break;
                
            case 'exit':
                this.exitPoint = { 
                    x: levelPos.x - 30, 
                    y: levelPos.y - 25, 
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
                this.hazards.push(new EditorHazard(levelPos.x, levelPos.y, size.width, size.height, this.selectedTool));
                break;
        }
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const levelPos = this.screenToLevel(screenX, screenY);
        
        // Check if clicking on an existing hazard
        for (let i = this.hazards.length - 1; i >= 0; i--) {
            const hazard = this.hazards[i];
            if (hazard.containsPoint(levelPos.x, levelPos.y)) {
                if (this.selectedTool === 'eraser') {
                    this.hazards.splice(i, 1);
                } else {
                    this.draggedItem = hazard;
                    this.dragOffset = {
                        x: levelPos.x - hazard.x,
                        y: levelPos.y - hazard.y
                    };
                }
                return;
            }
        }
        
        // Check spawn point
        if (Math.abs(levelPos.x - this.spawnPoint.x) < 20 && Math.abs(levelPos.y - this.spawnPoint.y) < 20) {
            this.draggedItem = this.spawnPoint;
            this.dragOffset = { x: 0, y: 0 };
            return;
        }
        
        // Check exit
        if (levelPos.x >= this.exitPoint.x && levelPos.x <= this.exitPoint.x + this.exitPoint.width &&
            levelPos.y >= this.exitPoint.y && levelPos.y <= this.exitPoint.y + this.exitPoint.height) {
            this.draggedItem = this.exitPoint;
            this.dragOffset = {
                x: levelPos.x - this.exitPoint.x,
                y: levelPos.y - this.exitPoint.y
            };
            return;
        }
        
        // If nothing was hit and no tool selected, start panning
        if (!this.selectedTool && !this.draggedItem) {
            this.isPanning = true;
            this.panStart = { x: screenX, y: screenY };
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const levelPos = this.screenToLevel(screenX, screenY);
        
        this.lastMousePos = { x: screenX, y: screenY };
        this.mouseX = levelPos.x;
        this.mouseY = levelPos.y;
        
        if (this.isPanning) {
            const dx = (screenX - this.panStart.x) / this.zoom;
            const dy = (screenY - this.panStart.y) / this.zoom;
            
            this.camera.x -= dx;
            this.camera.y -= dy;
            
            this.panStart = { x: screenX, y: screenY };
            this.clampCamera();
        }
        
        if (this.draggedItem) {
            this.draggedItem.x = levelPos.x - this.dragOffset.x;
            this.draggedItem.y = levelPos.y - this.dragOffset.y;
        }
        
        // Update cursor
        if (this.selectedTool === 'eraser') {
            this.canvas.style.cursor = 'crosshair';
        } else if (this.draggedItem) {
            this.canvas.style.cursor = 'move';
        } else if (this.isPanning) {
            this.canvas.style.cursor = 'grabbing';
        } else if (!this.selectedTool) {
            this.canvas.style.cursor = 'grab';
        } else {
            this.canvas.style.cursor = 'default';
        }
        
        this.draw();
    }
    
    handleMouseUp(e) {
        this.draggedItem = null;
        this.isPanning = false;
    }
    
    loadForegroundImage(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                console.log('Foreground image loaded:', img.width, 'x', img.height);
                this.foregroundImage = img;
                
                // Update level dimensions based on image
                this.levelWidth = img.width;
                this.levelHeight = img.height;
                
                // Recreate terrain at new size
                this.terrain = new Terrain(this.levelWidth, this.levelHeight);
                
                // Resize the terrain's internal canvas
                this.terrain.canvas.width = this.levelWidth;
                this.terrain.canvas.height = this.levelHeight;
                this.terrain.ctx = this.terrain.canvas.getContext('2d');
                
                // Auto-adjust zoom for visibility
                const zoomX = this.displayWidth / this.levelWidth;
                const zoomY = this.displayHeight / this.levelHeight;
                this.zoom = Math.min(zoomX, zoomY) * 0.9; // 90% to leave some margin
                this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom));
                
                this.updateZoomDisplay();
                this.centerCamera();
                
                // Draw the image to terrain canvas immediately so it's visible
                this.terrain.ctx.drawImage(this.foregroundImage, 0, 0);
                this.terrain.updateImageData();
                
                this.draw();
                
                // Prompt for transparent color
                setTimeout(() => {
                    if (confirm('Would you like to set a transparent color? Click OK to select a color that will become non-terrain, or Cancel to use the image as-is.')) {
                        alert('Click on a color in the image to set it as transparent (non-terrain)');
                        this.pickingTransparentColor = true;
                    }
                }, 100);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    processForegroundImage() {
        if (!this.foregroundImage) return;
        
        console.log('Processing foreground image with transparent color:', this.transparentColor);
        
        // Clear existing terrain
        this.terrain.ctx.clearRect(0, 0, this.terrain.width, this.terrain.height);
        
        // Draw foreground image to terrain canvas at actual size
        this.terrain.ctx.drawImage(this.foregroundImage, 0, 0);
        
        // Get image data and make transparent color actually transparent
        const imageData = this.terrain.ctx.getImageData(0, 0, this.terrain.width, this.terrain.height);
        const data = imageData.data;
        
        let transparentPixels = 0;
        for (let i = 0; i < data.length; i += 4) {
            // Check with some tolerance for color matching
            const rDiff = Math.abs(data[i] - this.transparentColor.r);
            const gDiff = Math.abs(data[i + 1] - this.transparentColor.g);
            const bDiff = Math.abs(data[i + 2] - this.transparentColor.b);
            
            if (rDiff <= 5 && gDiff <= 5 && bDiff <= 5) {
                data[i + 3] = 0; // Make transparent
                transparentPixels++;
            }
        }
        
        console.log('Made', transparentPixels, 'pixels transparent');
        
        this.terrain.ctx.putImageData(imageData, 0, 0);
        this.terrain.updateImageData();
        this.draw();
    }
    
    draw() {
        // Clear display canvas
        this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);
        
        // Save context state
        this.ctx.save();
        
        // Enable image smoothing for better quality when zoomed
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Apply zoom and camera transform
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw level bounds (dark background)
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.levelWidth, this.levelHeight);
        
        // Draw background image if loaded
        if (this.backgroundImage) {
            // Draw the background image scaled to fit the level dimensions
            this.ctx.drawImage(
                this.backgroundImage, 
                0, 0, 
                this.backgroundImage.width, 
                this.backgroundImage.height,
                0, 0, 
                this.levelWidth, 
                this.levelHeight
            );
        } else {
            // Default sky blue background
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.fillRect(0, 0, this.levelWidth, this.levelHeight);
        }
        
        // Draw terrain (foreground)
        if (this.terrain && this.terrain.canvas) {
            this.ctx.drawImage(this.terrain.canvas, 0, 0);
        }
        
        // Draw hazards
        this.hazards.forEach(hazard => hazard.draw(this.ctx));
        
        // Draw spawn point
        this.drawSpawnPoint();
        
        // Draw exit
        this.drawExit();
        
        // Draw grid overlay (in level space)
        if (this.gridVisible) {
            this.drawGrid();
        }
        
        // Restore context state
        this.ctx.restore();
        
        // Draw UI elements that shouldn't be zoomed
        this.drawUI();
        
        // Draw death height indicator
        if (this.deathHeightVisible && this.mouseY !== undefined) {
            this.drawDeathHeight();
        }
        
        // Draw current tool preview
        if (this.selectedTool && this.mouseX !== undefined && this.mouseY !== undefined) {
            this.drawToolPreview();
        }
    }
    
    drawUI() {
        // Draw zoom indicator
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(this.displayWidth - 120, 10, 110, 30);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Zoom: ${(this.zoom * 100).toFixed(0)}%`, this.displayWidth - 110, 30);
        
        // Draw level dimensions
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, this.displayHeight - 40, 150, 30);
        
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(`Level: ${this.levelWidth}x${this.levelHeight}`, 20, this.displayHeight - 20);
        
        // Draw controls hint
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Mouse wheel: Zoom | Arrow keys: Pan | Home: Center', 10, 20);
    }
    
    updateZoomDisplay() {
        // Update any UI elements that show zoom level
        const zoomLabel = document.getElementById('zoomLabel');
        if (zoomLabel) {
            zoomLabel.textContent = `${(this.zoom * 100).toFixed(0)}%`;
        }
    }
    
    // Rest of the methods remain similar but use screenToLevel/levelToScreen conversions...
    
    drawSpawnPoint() {
        // Draw spawner
        this.ctx.fillStyle = '#2196F3';
        this.ctx.fillRect(this.spawnPoint.x - 20, this.spawnPoint.y - 3, 4, 3);
        
        this.ctx.strokeStyle = '#1565C0';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.spawnPoint.x - 20, this.spawnPoint.y - 3, 4, 3);
        
        // Label
        this.ctx.fillStyle = 'white';
        this.ctx.font = '10px Arial';
        this.ctx.fillText('SPAWN', this.spawnPoint.x - 2, this.spawnPoint.y - 1);
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
        this.ctx.lineWidth = 1 / this.zoom; // Keep grid lines thin
        
        const gridSize = 20;
        
        // Draw vertical lines
        for (let x = 0; x <= this.levelWidth; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.levelHeight);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.levelHeight; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.levelWidth, y);
            this.ctx.stroke();
        }
    }
    
    drawDeathHeight() {
        const screenPos = this.levelToScreen(this.mouseX, this.mouseY);
        const deathDistance = MAX_FALL_HEIGHT / 10; // Scale for visibility
        
        this.ctx.save();
        
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(screenPos.x, screenPos.y);
        this.ctx.lineTo(screenPos.x, screenPos.y + deathDistance * this.zoom);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        
        // Draw skull icon at bottom
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = 'red';
        this.ctx.fillText('💀', screenPos.x - 10, screenPos.y + deathDistance * this.zoom + 5);
        
        this.ctx.restore();
    }
    
    drawToolPreview() {
        this.ctx.save();
        
        const screenPos = this.levelToScreen(this.mouseX, this.mouseY);
        this.ctx.globalAlpha = 0.5;
        
        const size = this.getHazardSize();
        const screenWidth = size.width * this.zoom;
        const screenHeight = size.height * this.zoom;
        
        switch (this.selectedTool) {
            case 'lava':
                this.ctx.fillStyle = '#ff3300';
                this.ctx.fillRect(screenPos.x - screenWidth/2, screenPos.y - screenHeight/2, screenWidth, screenHeight);
                break;
            case 'bearTrap':
                this.ctx.fillStyle = '#666666';
                this.ctx.fillRect(screenPos.x - screenWidth/2, screenPos.y - screenHeight/2, screenWidth, screenHeight);
                break;
            case 'spikes':
                this.ctx.fillStyle = '#999999';
                this.ctx.fillRect(screenPos.x - screenWidth/2, screenPos.y - screenHeight/2, screenWidth, screenHeight);
                break;
        }
        
        this.ctx.globalAlpha = 1.0;
        this.ctx.restore();
    }
    
    // Add these methods from the original that weren't included above
    pickTransparentColor(x, y) {
        // Create a temporary canvas to get pixel data from the image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.foregroundImage.width;
        tempCanvas.height = this.foregroundImage.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.foregroundImage, 0, 0);
        
        // Get pixel color (ensure coordinates are within bounds)
        x = Math.max(0, Math.min(this.foregroundImage.width - 1, Math.floor(x)));
        y = Math.max(0, Math.min(this.foregroundImage.height - 1, Math.floor(y)));
        
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
                // Redraw immediately
                this.draw();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    getHazardSize() {
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
    
    saveLevel() {
        // Update level settings from UI
        this.levelName = document.getElementById('levelName').value;
        this.levelData.totalLemmings = parseInt(document.getElementById('totalLemmings').value);
        this.levelData.requiredLemmings = parseInt(document.getElementById('requiredLemmings').value);
        this.levelData.spawnRate = parseInt(document.getElementById('spawnRate').value);
        
        const levelData = {
            name: this.levelName,
            width: this.levelWidth,
            height: this.levelHeight,
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
        this.levelWidth = data.width || 800;
        this.levelHeight = data.height || 160;
        this.spawnPoint = data.spawn;
        this.exitPoint = data.exit;
        this.levelData = data.levelSettings;
        
        // Recreate terrain at correct size
        this.terrain = new Terrain(this.levelWidth, this.levelHeight);
        
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
            
            // Auto-adjust zoom
            const zoomX = this.displayWidth / this.levelWidth;
            const zoomY = this.displayHeight / this.levelHeight;
            this.zoom = Math.min(zoomX, zoomY) * 0.9;
            this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom));
            
            this.updateZoomDisplay();
            this.centerCamera();
            this.draw();
        };
        terrainImg.src = data.terrain;
        
        // Update UI inputs
        document.getElementById('levelName').value = this.levelName;
        document.getElementById('totalLemmings').value = this.levelData.totalLemmings;
        document.getElementById('requiredLemmings').value = this.levelData.requiredLemmings;
        document.getElementById('spawnRate').value = this.levelData.spawnRate;
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
            levelSettings: this.levelData,
            // Include actual level dimensions
            width: this.levelWidth,
            height: this.levelHeight
        };
        
        // Store in sessionStorage for game to load
        sessionStorage.setItem('testLevel', JSON.stringify(levelData));
        
        // Switch to game mode
        window.game.testLevelFromEditor();
    }
}