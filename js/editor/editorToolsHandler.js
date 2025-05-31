// Handles tool functionality and tool-specific drawing
class EditorToolsHandler {
    constructor(editor) {
        this.editor = editor;
        this.gridVisible = false;
        this.deathHeightVisible = false;
    }
    
    selectTool(tool) {
        this.editor.selectedTool = tool;
        this.updateToolSelection();
    }
    
    updateToolSelection() {
        document.querySelectorAll('.toolButton').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.tool === this.editor.selectedTool) {
                btn.classList.add('selected');
            }
        });
    }
    
    handleToolClick(levelPos, tool) {
        switch (tool) {
            case 'spawn':
                this.editor.spawnPoint = { x: levelPos.x, y: levelPos.y };
                this.editor.selectedTool = null;
                this.updateToolSelection();
                break;
                
            case 'exit':
                this.editor.exitPoint = { 
                    x: levelPos.x - 30, 
                    y: levelPos.y - 25, 
                    width: 60, 
                    height: 50 
                };
                this.editor.selectedTool = null;
                this.updateToolSelection();
                break;
                
            case 'lava':
            case 'bearTrap':
            case 'spikes':
                const size = this.getHazardSize();
                this.editor.hazards.push(new EditorHazard(levelPos.x, levelPos.y, size.width, size.height, tool));
                break;
        }
        
        this.editor.draw();
    }
    
    getHazardSize() {
        const widthInput = document.getElementById('hazardWidth');
        const heightInput = document.getElementById('hazardHeight');
        
        return {
            width: widthInput ? parseInt(widthInput.value) : 50,
            height: heightInput ? parseInt(heightInput.value) : 30
        };
    }
    
    toggleGrid() {
        this.gridVisible = !this.gridVisible;
        document.querySelector('[data-tool="grid"]')?.classList.toggle('selected');
        this.editor.draw();
    }
    
    toggleDeathHeight() {
        this.deathHeightVisible = !this.deathHeightVisible;
        document.querySelector('[data-tool="deathHeight"]')?.classList.toggle('selected');
        this.editor.draw();
    }
    
    drawToolOverlays(ctx) {
        // Draw grid
        if (this.gridVisible) {
            this.drawGrid(ctx);
        }
        
        // Draw death height indicator
        if (this.deathHeightVisible && this.editor.mouseY !== undefined) {
            this.drawDeathHeight(ctx);
        }
        
        // Draw current tool preview
        if (this.editor.selectedTool && this.editor.mouseX !== undefined && this.editor.mouseY !== undefined) {
            this.drawToolPreview(ctx);
        }
    }
    
    drawGrid(ctx) {
        ctx.save();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1 / this.editor.zoom;
        
        const gridSize = 20;
        
        // Draw vertical lines
        for (let x = 0; x <= this.editor.levelWidth; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.editor.levelHeight);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.editor.levelHeight; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.editor.levelWidth, y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    drawDeathHeight(ctx) {
        const screenPos = this.editor.levelToScreen(this.editor.mouseX, this.editor.mouseY);
        const deathDistance = MAX_FALL_HEIGHT / 10;
        
        ctx.save();
        
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(screenPos.x, screenPos.y);
        ctx.lineTo(screenPos.x, screenPos.y + deathDistance * this.editor.zoom);
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        // Draw skull icon
        ctx.font = '20px Arial';
        ctx.fillStyle = 'red';
        ctx.fillText('💀', screenPos.x - 10, screenPos.y + deathDistance * this.editor.zoom + 5);
        
        ctx.restore();
    }
    
    drawToolPreview(ctx) {
        ctx.save();
        
        const screenPos = this.editor.levelToScreen(this.editor.mouseX, this.editor.mouseY);
        ctx.globalAlpha = 0.5;
        
        const size = this.getHazardSize();
        const screenWidth = size.width * this.editor.zoom;
        const screenHeight = size.height * this.editor.zoom;
        
        switch (this.editor.selectedTool) {
            case 'lava':
                ctx.fillStyle = '#ff3300';
                ctx.fillRect(screenPos.x - screenWidth/2, screenPos.y - screenHeight/2, screenWidth, screenHeight);
                break;
            case 'bearTrap':
                ctx.fillStyle = '#666666';
                ctx.fillRect(screenPos.x - screenWidth/2, screenPos.y - screenHeight/2, screenWidth, screenHeight);
                break;
            case 'spikes':
                ctx.fillStyle = '#999999';
                ctx.fillRect(screenPos.x - screenWidth/2, screenPos.y - screenHeight/2, screenWidth, screenHeight);
                break;
            case 'spawn':
                ctx.fillStyle = '#2196F3';
                ctx.fillRect(screenPos.x - 20 * this.editor.zoom, screenPos.y - 30 * this.editor.zoom, 
                           40 * this.editor.zoom, 30 * this.editor.zoom);
                break;
            case 'exit':
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(screenPos.x - 30 * this.editor.zoom, screenPos.y - 25 * this.editor.zoom, 
                           60 * this.editor.zoom, 50 * this.editor.zoom);
                break;
        }
        
        ctx.globalAlpha = 1.0;
        ctx.restore();
    }
}

// Editor-specific hazard class with additional functionality
class EditorHazard extends Hazard {
    constructor(x, y, width, height, type) {
        super(x, y, width, height, type);
    }
    
    containsPoint(px, py) {
        return px >= this.x - this.width/2 && 
               px <= this.x + this.width/2 &&
               py >= this.y - this.height/2 && 
               py <= this.y + this.height/2;
    }
}