// Main Level Editor class that ties all modules together
class LevelEditor extends EditorBase {
    constructor() {
        super();
        
        // Initialize handlers
        this.inputHandler = new EditorInputHandler(this);
        this.toolsHandler = new EditorToolsHandler(this);
        this.imageHandler = new EditorImageHandler(this);
        this.fileHandler = new EditorFileHandler(this);
        
        // Initial setup
        this.centerCamera();
        this.draw();
    }
    
    // Override draw method to include tool overlays
    draw() {
        super.draw();
        
        // Save context state for tool overlays
        this.ctx.save();
        
        // Apply zoom and camera transform for tool overlays
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw tool-specific overlays
        this.toolsHandler.drawToolOverlays(this.ctx);
        
        // Restore context
        this.ctx.restore();
    }
}