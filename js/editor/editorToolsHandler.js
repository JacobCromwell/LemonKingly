// Updated js/editor/editorToolsHandler.js - Add IDT entity support

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
                    width: LEVEL_EDITOR.BASIC_TOOLS.EXIT_WIDTH, 
                    height: LEVEL_EDITOR.BASIC_TOOLS.EXIT_HEIGHT 
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

            case 'idt':
                // NEW: Handle IDT placement
                const idtSize = this.getHazardSize(); // Reuse hazard size controls
                this.editor.terrain.addIdtArea(
                    levelPos.x - idtSize.width / 2,
                    levelPos.y - idtSize.height / 2,
                    idtSize.width,
                    idtSize.height
                );
                console.log('IDT area added at', levelPos.x, levelPos.y);
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
        // Death height is drawn in world space, not screen space
        const deathDistance = PHYSICS.maxFallHeight;
        
        ctx.save();
        
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2 / this.editor.zoom;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(this.editor.mouseX, this.editor.mouseY);
        ctx.lineTo(this.editor.mouseX, this.editor.mouseY + deathDistance);
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        // Draw skull icon
        ctx.font = `${20 / this.editor.zoom}px Arial`;
        ctx.fillStyle = 'red';
        ctx.fillText('💀', this.editor.mouseX - 10 / this.editor.zoom, this.editor.mouseY + deathDistance + 5 / this.editor.zoom);
        
        ctx.restore();
    }
    
    drawToolPreview(ctx) {
        // Don't save/restore context here since we're already in transformed space
        ctx.globalAlpha = 0.5;
        
        const size = this.getHazardSize();
        
        switch (this.editor.selectedTool) {
            case 'lava':
                ctx.fillStyle = '#ff3300';
                ctx.fillRect(this.editor.mouseX - size.width/2, this.editor.mouseY - size.height/2, size.width, size.height);
                break;
            case 'bearTrap':
                ctx.fillStyle = '#666666';
                ctx.fillRect(this.editor.mouseX - size.width/2, this.editor.mouseY - size.height/2, size.width, size.height);
                break;
            case 'spikes':
                ctx.fillStyle = '#999999';
                ctx.fillRect(this.editor.mouseX - size.width/2, this.editor.mouseY - size.height/2, size.width, size.height);
                break;
            case 'idt':
                // NEW: IDT preview with purple color and border
                ctx.fillStyle = 'rgba(128, 0, 128, 0.5)';
                ctx.fillRect(this.editor.mouseX - size.width/2, this.editor.mouseY - size.height/2, size.width, size.height);
                ctx.strokeStyle = 'rgba(128, 0, 128, 0.8)';
                ctx.lineWidth = 2;
                ctx.strokeRect(this.editor.mouseX - size.width/2, this.editor.mouseY - size.height/2, size.width, size.height);
                
                // Add "IDT" text label
                ctx.fillStyle = 'white';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('IDT', this.editor.mouseX, this.editor.mouseY);
                break;
            case 'spawn':
                ctx.fillStyle = '#2196F3';
                ctx.fillRect(this.editor.mouseX - 20, this.editor.mouseY - 30, 40, 30);
                break;
            case 'exit':
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(this.editor.mouseX - 30, this.editor.mouseY - 25, 40, 26);  //width: 40, height: 26
                break;
        }
        
        ctx.globalAlpha = 1.0;
    }
}

// Editor-specific hazard class with additional functionality (unchanged)
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