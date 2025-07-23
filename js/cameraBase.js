// Base camera functionality shared between game and editor
class CameraBase {
    constructor(canvas, levelWidth, levelHeight) {
        this.canvas = canvas;
        this.levelWidth = levelWidth;
        this.levelHeight = levelHeight;
        
        // Camera position
        this.x = 0;
        this.y = 0;
        
        // Zoom settings
        this.zoom = 1.0;
        this.minZoom = 0.2;
        this.maxZoom = 8.0;
        this.zoomStep = 0.2;
    }
    
    /**
     * Update level dimensions
     */
    setLevelDimensions(width, height) {
        this.levelWidth = width;
        this.levelHeight = height;
        this.clamp();
    }
    
    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX / this.zoom) + this.x,
            y: (screenY / this.zoom) + this.y
        };
    }
    
    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.zoom,
            y: (worldY - this.y) * this.zoom
        };
    }
    
    /**
     * Get viewport dimensions in world coordinates
     */
    getViewport() {
        return {
            width: this.canvas.width / this.zoom,
            height: this.canvas.height / this.zoom,
            x: this.x,
            y: this.y
        };
    }
    
    /**
     * Pan the camera
     */
    pan(dx, dy) {
        this.x += dx;
        this.y += dy;
        this.clamp();
    }
    
    /**
     * Set camera position
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.clamp();
    }
    
    /**
     * Center camera on a point
     */
    centerOn(x, y) {
        const viewport = this.getViewport();
        this.x = x - viewport.width / 2;
        this.y = y - viewport.height / 2;
        this.clamp();
    }
    
    /**
     * Center camera on level
     */
    center() {
        const viewport = this.getViewport();
        this.x = (this.levelWidth - viewport.width) / 2;
        this.y = (this.levelHeight - viewport.height) / 2;
        this.clamp();
    }
    
    /**
     * Adjust zoom level
     */
    setZoom(zoom) {
        const oldZoom = this.zoom;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
        
        // Adjust camera to keep center point stable
        if (oldZoom !== this.zoom) {
            const viewport = this.getViewport();
            const zoomRatio = oldZoom / this.zoom;
            this.x += viewport.width * (1 - zoomRatio) / 2;
            this.y += viewport.height * (1 - zoomRatio) / 2;
            this.clamp();
        }
    }
    
    /**
     * Zoom in/out by steps
     */
    zoomIn() {
        this.setZoom(this.zoom + this.zoomStep);
    }
    
    zoomOut() {
        this.setZoom(this.zoom - this.zoomStep);
    }
    
    /**
     * Zoom at a specific point (e.g., mouse position)
     */
    zoomAt(screenX, screenY, newZoom) {
        // Get world position before zoom
        const worldPos = this.screenToWorld(screenX, screenY);
        
        // Apply zoom
        this.setZoom(newZoom);
        
        // Get world position after zoom
        const newWorldPos = this.screenToWorld(screenX, screenY);
        
        // Adjust camera to keep point stable
        this.x += worldPos.x - newWorldPos.x;
        this.y += worldPos.y - newWorldPos.y;
        this.clamp();
    }
    
    /**
     * Clamp camera to level bounds
     */
    clamp() {
        const viewport = this.getViewport();
        const padding = 50; // Allow some overscroll
        
        this.x = Math.max(-padding, Math.min(this.levelWidth - viewport.width + padding, this.x));
        this.y = Math.max(-padding, Math.min(this.levelHeight - viewport.height + padding, this.y));
    }
    
    /**
     * Apply camera transformation to context
     */
    apply(ctx) {
        ctx.save();
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }
    
    /**
     * Restore context after camera transformation
     */
    restore(ctx) {
        ctx.restore();
    }
    
    /**
     * Get camera state for saving
     */
    getState() {
        return {
            x: this.x,
            y: this.y,
            zoom: this.zoom
        };
    }
    
    /**
     * Restore camera state
     */
    setState(state) {
        if (state.zoom !== undefined) {
            this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, state.zoom));
        }
        if (state.x !== undefined && state.y !== undefined) {
            this.x = state.x;
            this.y = state.y;
            this.clamp();
        }
    }
}

// Export globally
window.CameraBase = CameraBase;