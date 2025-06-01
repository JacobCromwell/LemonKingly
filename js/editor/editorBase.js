// Base editor class with core functionality
class EditorBase {
    constructor() {
        // Display canvas
        this.canvas = document.getElementById('editorCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set display size
        this.displayWidth = 1200;
        this.displayHeight = 600;
        this.canvas.width = this.displayWidth;
        this.canvas.height = this.displayHeight;
        
        // Level dimensions
        this.levelWidth = 1200;
        this.levelHeight = 160;
        
        // Viewport and zoom
        this.zoom = 2.0;
        this.minZoom = 1.0;
        this.maxZoom = 8.0;
        this.zoomStep = 0.5;
        
        // Camera position
        this.camera = { x: 0, y: 0 };
        
        // Mouse state
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Images
        this.backgroundImage = null;
        this.foregroundImage = null;
        this.transparentColor = { r: 255, g: 255, b: 255, a: 255 };
        this.pickingTransparentColor = false;
        
        // Create terrain
        this.terrain = new Terrain(this.levelWidth, this.levelHeight);
        
        // Level elements
        this.hazards = [];
        this.spawnPoint = { x: 100, y: 80 };
        this.exitPoint = { x: 700, y: 80, width: 60, height: 50 };
        
        // Editor state
        this.selectedTool = null;
        this.draggedItem = null;
        this.dragOffset = { x: 0, y: 0 };
        
        // Level data
        this.levelName = 'untitled';
        this.levelData = {
            totalLemmings: 20,
            requiredLemmings: 10,
            spawnRate: 2000,
            musicFile: null,
            actionCounts: {
                blocker: 5,
                basher: 5,
                digger: 5,
                builder: 5,
                climber: 5
            }
        };
    }
    
    // Coordinate conversion methods
    screenToLevel(screenX, screenY) {
        return {
            x: (screenX / this.zoom) + this.camera.x,
            y: (screenY / this.zoom) + this.camera.y
        };
    }
    
    levelToScreen(levelX, levelY) {
        return {
            x: (levelX - this.camera.x) * this.zoom,
            y: (levelY - this.camera.y) * this.zoom
        };
    }
    
    // Camera control methods
    centerCamera() {
        const viewportWidth = this.displayWidth / this.zoom;
        const viewportHeight = this.displayHeight / this.zoom;
        
        this.camera.x = (this.levelWidth - viewportWidth) / 2;
        this.camera.y = (this.levelHeight - viewportHeight) / 2;
        
        this.clampCamera();
    }
    
    clampCamera() {
        const viewportWidth = this.displayWidth / this.zoom;
        const viewportHeight = this.displayHeight / this.zoom;
        const padding = 50;
        
        this.camera.x = Math.max(-padding, Math.min(this.levelWidth - viewportWidth + padding, this.camera.x));
        this.camera.y = Math.max(-padding, Math.min(this.levelHeight - viewportHeight + padding, this.camera.y));
    }
    
    // Drawing methods
    draw() {
        // Clear display canvas
        this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);
        
        // Save context state
        this.ctx.save();
        
        // Enable image smoothing
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Apply zoom and camera transform
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw level content
        this.drawLevel();
        
        // Restore context state
        this.ctx.restore();
        
        // Draw UI overlay
        this.drawUI();
    }
    
    drawLevel() {
        // Draw level bounds
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.levelWidth, this.levelHeight);
        
        // Draw background
        if (this.backgroundImage) {
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
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.fillRect(0, 0, this.levelWidth, this.levelHeight);
        }
        
        // Draw terrain
        if (this.terrain && this.terrain.canvas) {
            this.ctx.drawImage(this.terrain.canvas, 0, 0);
        }
        
        // Draw hazards
        this.hazards.forEach(hazard => hazard.draw(this.ctx));
        
        // Draw spawn and exit
        this.drawSpawnPoint();
        this.drawExit();
    }
    
    drawSpawnPoint() {
        this.ctx.fillStyle = '#2196F3';
        this.ctx.fillRect(this.spawnPoint.x - 20, this.spawnPoint.y - 30, 40, 30);
        
        this.ctx.strokeStyle = '#1565C0';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.spawnPoint.x - 20, this.spawnPoint.y - 30, 40, 30);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '10px Arial';
        this.ctx.fillText('SPAWN', this.spawnPoint.x - 18, this.spawnPoint.y - 10);
    }
    
    drawExit() {
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(this.exitPoint.x, this.exitPoint.y, this.exitPoint.width, this.exitPoint.height);
        
        this.ctx.strokeStyle = '#2E7D32';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.exitPoint.x, this.exitPoint.y, this.exitPoint.width, this.exitPoint.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('EXIT', this.exitPoint.x + 18, this.exitPoint.y + 28);
    }
    
    drawUI() {
        // Zoom indicator
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(this.displayWidth - 120, 10, 110, 30);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Zoom: ${(this.zoom * 100).toFixed(0)}%`, this.displayWidth - 110, 30);
        
        // Level dimensions
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, this.displayHeight - 40, 150, 30);
        
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(`Level: ${this.levelWidth}x${this.levelHeight}`, 20, this.displayHeight - 20);
        
        // Controls hint
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Mouse wheel: Zoom | Arrow keys: Pan | Home: Center', 10, 20);
    }
    
    updateZoomDisplay() {
        const zoomLabel = document.getElementById('zoomLabel');
        if (zoomLabel) {
            zoomLabel.textContent = `${(this.zoom * 100).toFixed(0)}%`;
        }
    }
}