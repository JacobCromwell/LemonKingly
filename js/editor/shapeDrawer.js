/**
 * Shape Drawing Tool for Level Editor
 * Handles interactive drawing of indestructible terrain polygons
 */
class ShapeDrawer {
    constructor(canvas, terrainManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.terrainManager = terrainManager || new IndestructibleTerrain();
        
        // Drawing state
        this.isDrawing = false;
        this.isActive = false;
        this.currentPath = [];
        this.previewPath = [];
        
        // Visual settings
        this.style = {
            strokeColor: '#8B4CBF',      // Purple color
            strokeWidth: 2,
            dashPattern: [8, 4],         // Dotted line pattern
            fillColor: 'rgba(139, 76, 191, 0.1)', // Semi-transparent purple
            vertexColor: '#8B4CBF',
            vertexSize: 4,
            previewColor: '#8B4CBF80',   // Transparent purple for preview
            completedColor: '#8B4CBF'    // Solid purple for completed shapes
        };
        
        // Drawing settings
        this.settings = {
            minPointDistance: 8,         // Minimum distance between points
            snapDistance: 12,            // Distance to snap to start point for closing
            smoothing: true,             // Enable line smoothing
            showVertices: true,          // Show vertex dots while drawing
            realTimePreview: true        // Show closing line while drawing
        };
        
        // Mouse state
        this.mousePos = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        
        // Bind event handlers
        this.boundHandlers = {
            mouseDown: this.handleMouseDown.bind(this),
            mouseMove: this.handleMouseMove.bind(this),
            mouseUp: this.handleMouseUp.bind(this),
            keyDown: this.handleKeyDown.bind(this),
            contextMenu: this.handleContextMenu.bind(this)
        };
        
        // Performance tracking
        this.lastDrawTime = 0;
    }
    
    /**
     * Activate the shape drawing tool
     */
    activate() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.addEventListeners();
        this.canvas.style.cursor = 'crosshair';
        
        console.log('Indestructible Terrain drawing tool activated');
    }
    
    /**
     * Deactivate the shape drawing tool
     */
    deactivate() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.cancelCurrentDrawing();
        this.removeEventListeners();
        this.canvas.style.cursor = 'default';
        
        console.log('Indestructible Terrain drawing tool deactivated');
    }
    
    /**
     * Add event listeners to canvas
     */
    addEventListeners() {
        this.canvas.addEventListener('mousedown', this.boundHandlers.mouseDown);
        this.canvas.addEventListener('mousemove', this.boundHandlers.mouseMove);
        this.canvas.addEventListener('mouseup', this.boundHandlers.mouseUp);
        this.canvas.addEventListener('contextmenu', this.boundHandlers.contextMenu);
        document.addEventListener('keydown', this.boundHandlers.keyDown);
    }
    
    /**
     * Remove event listeners from canvas
     */
    removeEventListeners() {
        this.canvas.removeEventListener('mousedown', this.boundHandlers.mouseDown);
        this.canvas.removeEventListener('mousemove', this.boundHandlers.mouseMove);
        this.canvas.removeEventListener('mouseup', this.boundHandlers.mouseUp);
        this.canvas.removeEventListener('contextmenu', this.boundHandlers.contextMenu);
        document.removeEventListener('keydown', this.boundHandlers.keyDown);
    }
    
    /**
     * Handle mouse down event - start drawing
     */
    handleMouseDown(event) {
        if (!this.isActive || event.button !== 0) return; // Only left mouse button
        
        event.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        this.mousePos = { x, y };
        this.lastMousePos = { x, y };
        
        if (!this.isDrawing) {
            // Start new shape
            this.startDrawing(x, y);
        }
    }
    
    /**
     * Handle mouse move event - continue drawing or show preview
     */
    handleMouseMove(event) {
        if (!this.isActive) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        this.mousePos = { x, y };
        
        if (this.isDrawing) {
            this.continueDrawing(x, y);
        }
        
        // Always update preview if we have points
        if (this.currentPath.length > 0) {
            this.updatePreview();
        }
    }
    
    /**
     * Handle mouse up event - add point or finish shape
     */
    handleMouseUp(event) {
        if (!this.isActive || !this.isDrawing || event.button !== 0) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Check if we should close the shape
        if (this.shouldCloseShape(x, y)) {
            this.finishShape();
        } else {
            this.addPoint(x, y);
        }
    }
    
    /**
     * Handle right-click - cancel current drawing
     */
    handleContextMenu(event) {
        if (!this.isActive) return;
        
        event.preventDefault();
        this.cancelCurrentDrawing();
    }
    
    /**
     * Handle keyboard events
     */
    handleKeyDown(event) {
        if (!this.isActive) return;
        
        switch (event.key) {
            case 'Escape':
                this.cancelCurrentDrawing();
                break;
            case 'Enter':
                if (this.isDrawing && this.currentPath.length >= 3) {
                    this.finishShape();
                }
                break;
            case 'Backspace':
            case 'Delete':
                if (this.isDrawing && this.currentPath.length > 0) {
                    this.removeLastPoint();
                }
                break;
        }
    }
    
    /**
     * Start drawing a new shape
     */
    startDrawing(x, y) {
        this.isDrawing = true;
        this.currentPath = [{ x, y }];
        this.previewPath = [];
        
        console.log('Started drawing indestructible terrain shape');
    }
    
    /**
     * Continue drawing - update preview line
     */
    continueDrawing(x, y) {
        // Update preview but don't add point until mouse up
        this.updatePreview();
    }
    
    /**
     * Add a point to the current path
     */
    addPoint(x, y) {
        if (!this.isDrawing) return;
        
        const lastPoint = this.currentPath[this.currentPath.length - 1];
        const distance = Math.sqrt(
            Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2)
        );
        
        // Only add point if it's far enough from the last point
        if (distance >= this.settings.minPointDistance) {
            this.currentPath.push({ x, y });
            console.log(`Added point ${this.currentPath.length}: (${x}, ${y})`);
        }
    }
    
    /**
     * Remove the last point from current path
     */
    removeLastPoint() {
        if (this.currentPath.length > 1) {
            this.currentPath.pop();
            console.log(`Removed point, ${this.currentPath.length} points remaining`);
        } else if (this.currentPath.length === 1) {
            this.cancelCurrentDrawing();
        }
    }
    
    /**
     * Check if shape should be closed (mouse near start point)
     */
    shouldCloseShape(x, y) {
        if (this.currentPath.length < 3) return false;
        
        const startPoint = this.currentPath[0];
        const distance = Math.sqrt(
            Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
        );
        
        return distance <= this.settings.snapDistance;
    }
    
    /**
     * Finish the current shape and add it to terrain manager
     */
    finishShape() {
        if (!this.isDrawing || this.currentPath.length < 3) {
            this.cancelCurrentDrawing();
            return;
        }
        
        // Create a copy of the path for the terrain manager
        const vertices = [...this.currentPath];
        
        // Add the shape to terrain manager
        const shape = this.terrainManager.addShape(vertices);
        
        if (shape) {
            console.log(`Created indestructible terrain shape with ${vertices.length} vertices`);
            console.log(`Shape ID: ${shape.id}, Area: ${shape.area.toFixed(2)} pixels²`);
            
            // Trigger callback if provided
            this.onShapeCreated?.(shape);
        } else {
            console.warn('Failed to create indestructible terrain shape');
            this.onShapeCreationFailed?.();
        }
        
        // Reset drawing state
        this.isDrawing = false;
        this.currentPath = [];
        this.previewPath = [];
    }
    
    /**
     * Cancel current drawing
     */
    cancelCurrentDrawing() {
        if (this.isDrawing) {
            console.log('Cancelled indestructible terrain drawing');
        }
        
        this.isDrawing = false;
        this.currentPath = [];
        this.previewPath = [];
    }
    
    /**
     * Update preview path for real-time feedback
     */
    updatePreview() {
        if (!this.isDrawing || this.currentPath.length === 0) {
            this.previewPath = [];
            return;
        }
        
        // Create preview path including current mouse position
        this.previewPath = [...this.currentPath, this.mousePos];
        
        // If we have enough points, show closing line
        if (this.currentPath.length >= 3 && this.settings.realTimePreview) {
            const startPoint = this.currentPath[0];
            const currentDistance = Math.sqrt(
                Math.pow(this.mousePos.x - startPoint.x, 2) + 
                Math.pow(this.mousePos.y - startPoint.y, 2)
            );
            
            // Show closing line if mouse is reasonably close to start
            if (currentDistance <= this.settings.snapDistance * 3) {
                this.previewPath.push(startPoint);
            }
        }
    }
    
    /**
     * Render all shapes and current drawing state
     * Should be called from the main level editor render loop
     */
    render() {
        if (!this.isActive) return;
        
        const startTime = performance.now();
        
        this.ctx.save();
        
        // Render completed shapes
        this.renderCompletedShapes();
        
        // Render current drawing
        if (this.isDrawing) {
            this.renderCurrentDrawing();
        }
        
        this.ctx.restore();
        
        this.lastDrawTime = performance.now() - startTime;
    }
    
    /**
     * Render all completed indestructible terrain shapes
     */
    renderCompletedShapes() {
        const shapes = this.terrainManager.getAllShapes();
        
        for (const shape of shapes) {
            this.renderShape(shape.vertices, {
                strokeColor: this.style.completedColor,
                fillColor: this.style.fillColor,
                showVertices: false,
                lineWidth: this.style.strokeWidth
            });
        }
    }
    
    /**
     * Render the current drawing in progress
     */
    renderCurrentDrawing() {
        // Render the current path
        if (this.currentPath.length > 0) {
            this.renderShape(this.currentPath, {
                strokeColor: this.style.strokeColor,
                fillColor: 'transparent',
                showVertices: this.settings.showVertices,
                lineWidth: this.style.strokeWidth,
                dashPattern: this.style.dashPattern
            });
        }
        
        // Render preview path
        if (this.previewPath.length > this.currentPath.length) {
            this.renderShape(this.previewPath, {
                strokeColor: this.style.previewColor,
                fillColor: 'transparent',
                showVertices: false,
                lineWidth: 1,
                dashPattern: [4, 4]
            });
        }
        
        // Highlight start point if we can close the shape
        if (this.currentPath.length >= 3) {
            const startPoint = this.currentPath[0];
            const distance = Math.sqrt(
                Math.pow(this.mousePos.x - startPoint.x, 2) + 
                Math.pow(this.mousePos.y - startPoint.y, 2)
            );
            
            if (distance <= this.settings.snapDistance) {
                this.renderSnapIndicator(startPoint);
            }
        }
    }
    
    /**
     * Render a shape with given style
     */
    renderShape(vertices, style) {
        if (!vertices || vertices.length === 0) return;
        
        this.ctx.strokeStyle = style.strokeColor;
        this.ctx.fillStyle = style.fillColor;
        this.ctx.lineWidth = style.lineWidth || 2;
        
        if (style.dashPattern) {
            this.ctx.setLineDash(style.dashPattern);
        } else {
            this.ctx.setLineDash([]);
        }
        
        // Draw the path
        this.ctx.beginPath();
        this.ctx.moveTo(vertices[0].x, vertices[0].y);
        
        for (let i = 1; i < vertices.length; i++) {
            this.ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        
        // Close the path if we have enough vertices
        if (vertices.length >= 3) {
            this.ctx.closePath();
        }
        
        // Fill if not transparent
        if (style.fillColor !== 'transparent') {
            this.ctx.fill();
        }
        
        this.ctx.stroke();
        
        // Draw vertices if requested
        if (style.showVertices) {
            this.renderVertices(vertices);
        }
    }
    
    /**
     * Render vertex points
     */
    renderVertices(vertices) {
        this.ctx.fillStyle = this.style.vertexColor;
        this.ctx.setLineDash([]);
        
        for (const vertex of vertices) {
            this.ctx.beginPath();
            this.ctx.arc(vertex.x, vertex.y, this.style.vertexSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    /**
     * Render snap indicator when mouse is near start point
     */
    renderSnapIndicator(point) {
        this.ctx.strokeStyle = '#00FF00';
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([]);
        
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, this.settings.snapDistance, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    /**
     * Get drawing statistics for UI display
     */
    getDrawingStats() {
        return {
            isActive: this.isActive,
            isDrawing: this.isDrawing,
            currentPoints: this.currentPath.length,
            canClose: this.currentPath.length >= 3,
            lastRenderTime: this.lastDrawTime,
            totalShapes: this.terrainManager.getAllShapes().length
        };
    }
    
    /**
     * Update visual style settings
     */
    updateStyle(newStyle) {
        this.style = { ...this.style, ...newStyle };
    }
    
    /**
     * Update drawing settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }
    
    /**
     * Set callback for when a shape is created
     */
    setOnShapeCreated(callback) {
        this.onShapeCreated = callback;
    }
    
    /**
     * Set callback for when shape creation fails
     */
    setOnShapeCreationFailed(callback) {
        this.onShapeCreationFailed = callback;
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.deactivate();
        this.terrainManager = null;
        this.canvas = null;
        this.ctx = null;
    }
}

// Make ShapeDrawer globally available (no module export needed)