// Main Level Editor class that ties all modules together
class LevelEditor extends EditorBase {
    constructor() {
        super();
        
        // Initialize handlers
        this.inputHandler = new EditorInputHandler(this);
        this.toolsHandler = new EditorToolsHandler(this);
        this.imageHandler = new EditorImageHandler(this);
        this.fileHandler = new EditorFileHandler(this);
        
        // Test lemmings for preview
        this.testLemmings = [];
        this.showLemmingPreview = false;
        
        // Initial setup
        this.centerCamera();
        this.draw();
    }
    
    // Add method to toggle lemming preview
    toggleLemmingPreview() {
        this.showLemmingPreview = !this.showLemmingPreview;
        
        if (this.showLemmingPreview) {
            // Create a test lemming at spawn point with current zoom
            this.testLemmings = [new Lemming(this.spawnPoint.x, this.spawnPoint.y, this.zoom)];
        } else {
            this.testLemmings = [];
        }
        
        this.draw();
    }
    
    // Update zoom method to also update test lemmings
    updateZoom() {
        super.updateZoomDisplay();
        
        // Update test lemmings with new zoom
        this.testLemmings.forEach(lemming => {
            lemming.updateZoom(this.zoom);
        });
        
        this.draw();
    }
    
    // Override draw method to include tool overlays and lemming preview
    draw() {
        super.draw();
        
        // Save context state for tool overlays and lemming preview
        this.ctx.save();
        
        // Apply zoom and camera transform for tool overlays
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw test lemmings if preview is enabled
        if (this.showLemmingPreview) {
            this.testLemmings.forEach(lemming => {
                lemming.draw(this.ctx);
            });
        }
        
        // Draw tool-specific overlays
        this.toolsHandler.drawToolOverlays(this.ctx);
        
        // Restore context
        this.ctx.restore();
    }
    
    /**
     * Handle window resize
     */
    onResize() {
        if (super.onResize) {
            super.onResize();
        }
        
        // Redraw after resize
        this.draw();
    }
    
    /**
     * Cleanup method for proper disposal
     */
    destroy() {
        // Call parent destroy if it exists
        if (super.destroy) {
            super.destroy();
        }
        
        console.log('Level editor destroyed');
    }
}