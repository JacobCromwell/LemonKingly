// Handles all input events for the editor
class EditorInputHandler {
    constructor(editor) {
        this.editor = editor;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const canvas = this.editor.canvas;
        
        canvas.addEventListener('click', this.handleClick.bind(this));
        canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        canvas.addEventListener('wheel', this.handleWheel.bind(this));
        
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    handleClick(e) {
        const rect = this.editor.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const levelPos = this.editor.screenToLevel(screenX, screenY);
        
        if (this.editor.pickingTransparentColor && this.editor.foregroundImage) {
            this.editor.imageHandler.pickTransparentColor(levelPos.x, levelPos.y);
            return;
        }
        
        if (!this.editor.selectedTool) return;
        
        // Let the tools handler process the click
        if (this.editor.toolsHandler) {
            this.editor.toolsHandler.handleToolClick(levelPos, this.editor.selectedTool);
        }
    }
    
    handleMouseDown(e) {
        const rect = this.editor.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const levelPos = this.editor.screenToLevel(screenX, screenY);
        
        // Check if clicking on an existing item
        let itemClicked = false;
        
        // Check hazards
        for (let i = this.editor.hazards.length - 1; i >= 0; i--) {
            const hazard = this.editor.hazards[i];
            if (hazard.containsPoint(levelPos.x, levelPos.y)) {
                if (this.editor.selectedTool === 'eraser') {
                    this.editor.hazards.splice(i, 1);
                } else {
                    this.editor.draggedItem = hazard;
                    this.editor.dragOffset = {
                        x: levelPos.x - hazard.x,
                        y: levelPos.y - hazard.y
                    };
                }
                itemClicked = true;
                break;
            }
        }
        
        // Check spawn point
        if (!itemClicked && Math.abs(levelPos.x - this.editor.spawnPoint.x) < 20 && 
            Math.abs(levelPos.y - this.editor.spawnPoint.y) < 20) {
            this.editor.draggedItem = this.editor.spawnPoint;
            this.editor.dragOffset = { x: 0, y: 0 };
            itemClicked = true;
        }
        
        // Check exit
        if (!itemClicked && levelPos.x >= this.editor.exitPoint.x && 
            levelPos.x <= this.editor.exitPoint.x + this.editor.exitPoint.width &&
            levelPos.y >= this.editor.exitPoint.y && 
            levelPos.y <= this.editor.exitPoint.y + this.editor.exitPoint.height) {
            this.editor.draggedItem = this.editor.exitPoint;
            this.editor.dragOffset = {
                x: levelPos.x - this.editor.exitPoint.x,
                y: levelPos.y - this.editor.exitPoint.y
            };
            itemClicked = true;
        }
        
        // Start panning if nothing was clicked and no tool selected
        if (!itemClicked && !this.editor.selectedTool && !this.editor.draggedItem) {
            this.editor.isPanning = true;
            this.editor.panStart = { x: screenX, y: screenY };
        }
    }
    
    handleMouseMove(e) {
        const rect = this.editor.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const levelPos = this.editor.screenToLevel(screenX, screenY);
        
        this.editor.lastMousePos = { x: screenX, y: screenY };
        this.editor.mouseX = levelPos.x;
        this.editor.mouseY = levelPos.y;
        
        if (this.editor.isPanning) {
            const dx = (screenX - this.editor.panStart.x) / this.editor.zoom;
            const dy = (screenY - this.editor.panStart.y) / this.editor.zoom;
            
            this.editor.camera.x -= dx;
            this.editor.camera.y -= dy;
            
            this.editor.panStart = { x: screenX, y: screenY };
            this.editor.clampCamera();
        }
        
        if (this.editor.draggedItem) {
            this.editor.draggedItem.x = levelPos.x - this.editor.dragOffset.x;
            this.editor.draggedItem.y = levelPos.y - this.editor.dragOffset.y;
        }
        
        this.updateCursor();
        this.editor.draw();
    }
    
    handleMouseUp(e) {
        this.editor.draggedItem = null;
        this.editor.isPanning = false;
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.editor.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const levelPosBefore = this.editor.screenToLevel(mouseX, mouseY);
        
        // Adjust zoom
        const delta = e.deltaY > 0 ? -this.editor.zoomStep : this.editor.zoomStep;
        this.editor.zoom = Math.max(this.editor.minZoom, Math.min(this.editor.maxZoom, this.editor.zoom + delta));
        
        this.editor.updateZoomDisplay();
        
        const levelPosAfter = this.editor.screenToLevel(mouseX, mouseY);
        
        // Adjust camera to keep mouse position fixed
        this.editor.camera.x += levelPosBefore.x - levelPosAfter.x;
        this.editor.camera.y += levelPosBefore.y - levelPosAfter.y;
        
        this.editor.clampCamera();
        this.editor.draw();
    }
    
    handleKeyDown(e) {
        const panSpeed = 20 / this.editor.zoom;
        
        switch(e.key) {
            case 'ArrowLeft':
                this.editor.camera.x -= panSpeed;
                break;
            case 'ArrowRight':
                this.editor.camera.x += panSpeed;
                break;
            case 'ArrowUp':
                this.editor.camera.y -= panSpeed;
                break;
            case 'ArrowDown':
                this.editor.camera.y += panSpeed;
                break;
            case '+':
            case '=':
                this.editor.zoom = Math.min(this.editor.maxZoom, this.editor.zoom + this.editor.zoomStep);
                this.editor.updateZoomDisplay();
                break;
            case '-':
            case '_':
                this.editor.zoom = Math.max(this.editor.minZoom, this.editor.zoom - this.editor.zoomStep);
                this.editor.updateZoomDisplay();
                break;
            case 'Home':
                this.editor.centerCamera();
                break;
            case 'Delete':
                if (this.editor.selectedHazard) {
                    const index = this.editor.hazards.indexOf(this.editor.selectedHazard);
                    if (index > -1) {
                        this.editor.hazards.splice(index, 1);
                        this.editor.selectedHazard = null;
                    }
                }
                break;
            default:
                return;
        }
        
        this.editor.clampCamera();
        this.editor.draw();
    }
    
    updateCursor() {
        const canvas = this.editor.canvas;
        
        if (this.editor.selectedTool === 'eraser') {
            canvas.style.cursor = 'crosshair';
        } else if (this.editor.draggedItem) {
            canvas.style.cursor = 'move';
        } else if (this.editor.isPanning) {
            canvas.style.cursor = 'grabbing';
        } else if (!this.editor.selectedTool) {
            canvas.style.cursor = 'grab';
        } else {
            canvas.style.cursor = 'default';
        }
    }
}