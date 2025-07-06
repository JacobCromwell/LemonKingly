/**
 * Indestructible Terrain Manager
 * Handles creation, storage, and collision detection for indestructible terrain polygons
 */
class IndestructibleTerrain {
    constructor() {
        this.shapes = [];
        this.performanceStats = {
            totalShapes: 0,
            totalVertices: 0,
            lastFrameTime: 0,
            averageFrameTime: 0,
            frameCount: 0
        };
        
        // Performance limits
        this.limits = {
            MAX_VERTICES_PER_SHAPE: 500,
            MAX_TOTAL_VERTICES: 2000,
            MAX_SHAPES_PER_LEVEL: 20,
            COLLISION_TIME_BUDGET: 2.0  // milliseconds per frame
        };
        
        // Audio setup - will be initialized when audio system is available
        this.audioContext = null;
        this.clunkSound = null;
    }
    
    /**
     * Initialize audio system for collision sounds
     * @param {AudioContext} audioContext - Web Audio API context
     */
    initAudio(audioContext) {
        this.audioContext = audioContext;
        this.createClunkSound();
    }
    
    /**
     * Create the metal clunk sound effect
     * Uses Web Audio API to generate a metallic impact sound
     */
    createClunkSound() {
        if (!this.audioContext) return;
        
        const createClunk = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            // Create metallic clunk sound
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);
            
            // Add filter for metallic quality
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(100, this.audioContext.currentTime);
            
            // Volume envelope
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            // Connect nodes
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Play and cleanup
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
        
        this.clunkSound = createClunk;
    }
    
    /**
     * Add a new indestructible terrain shape
     * @param {Array} vertices - Array of {x, y} vertex objects
     * @param {string} id - Optional unique identifier for the shape
     * @returns {Object|null} Created shape object or null if invalid
     */
    addShape(vertices, id = null) {
        if (!this.validateShape(vertices)) {
            console.warn('Invalid shape provided to addShape');
            return null;
        }
        
        // Auto-close the polygon if needed
        const closedVertices = PolygonUtils.autoClosePolygon(vertices);
        
        // Simplify if too complex
        const simplifiedVertices = closedVertices.length > this.limits.MAX_VERTICES_PER_SHAPE
            ? PolygonUtils.simplifyPolygon(closedVertices, 2)
            : closedVertices;
        
        const shape = {
            id: id || this.generateId(),
            vertices: simplifiedVertices,
            boundingBox: PolygonUtils.getBoundingBox(simplifiedVertices),
            area: PolygonUtils.calculateArea(simplifiedVertices),
            created: Date.now()
        };
        
        // Check limits
        if (this.shapes.length >= this.limits.MAX_SHAPES_PER_LEVEL) {
            console.warn('Maximum number of shapes reached');
            return null;
        }
        
        const totalVertices = this.getTotalVertices() + simplifiedVertices.length;
        if (totalVertices > this.limits.MAX_TOTAL_VERTICES) {
            console.warn('Total vertex limit would be exceeded');
            return null;
        }
        
        this.shapes.push(shape);
        this.updatePerformanceStats();
        
        return shape;
    }
    
    /**
     * Remove a shape by ID
     * @param {string} id - Shape ID to remove
     * @returns {boolean} True if shape was found and removed
     */
    removeShape(id) {
        const index = this.shapes.findIndex(shape => shape.id === id);
        if (index !== -1) {
            this.shapes.splice(index, 1);
            this.updatePerformanceStats();
            return true;
        }
        return false;
    }
    
    /**
     * Clear all shapes
     */
    clearAllShapes() {
        this.shapes = [];
        this.updatePerformanceStats();
    }
    
    /**
     * Check if a lemming (rectangle) collides with any indestructible terrain
     * @param {Object} lemmingBounds - Lemming bounds {x, y, width, height}
     * @returns {boolean} True if collision detected
     */
    checkCollision(lemmingBounds) {
        const startTime = performance.now();
        
        for (const shape of this.shapes) {
            // Quick bounding box check first
            if (!PolygonUtils.rectangleIntersectsBounds(lemmingBounds, shape.vertices)) {
                continue;
            }
            
            // Detailed polygon collision check
            if (PolygonUtils.rectangleIntersectsPolygon(lemmingBounds, shape.vertices)) {
                this.recordFrameTime(performance.now() - startTime);
                return true;
            }
        }
        
        this.recordFrameTime(performance.now() - startTime);
        return false;
    }
    
    /**
     * Check collision and play sound if collision detected
     * @param {Object} lemmingBounds - Lemming bounds {x, y, width, height}
     * @returns {boolean} True if collision detected
     */
    checkCollisionWithSound(lemmingBounds) {
        const hasCollision = this.checkCollision(lemmingBounds);
        
        if (hasCollision && this.clunkSound) {
            this.clunkSound();
        }
        
        return hasCollision;
    }
    
    /**
     * Get all shapes that intersect with a given rectangle
     * Useful for action collision detection (digger, basher, etc.)
     * @param {Object} actionBounds - Action bounds {x, y, width, height}
     * @returns {Array} Array of intersecting shapes
     */
    getIntersectingShapes(actionBounds) {
        const intersecting = [];
        
        for (const shape of this.shapes) {
            if (PolygonUtils.rectangleIntersectsBounds(actionBounds, shape.vertices)) {
                if (PolygonUtils.rectangleIntersectsPolygon(actionBounds, shape.vertices)) {
                    intersecting.push(shape);
                }
            }
        }
        
        return intersecting;
    }
    
    /**
     * Validate a shape before adding it
     * @param {Array} vertices - Array of vertex objects
     * @returns {boolean} True if shape is valid
     */
    validateShape(vertices) {
        if (!vertices || !Array.isArray(vertices)) return false;
        if (vertices.length < 3) return false;
        
        // Check that all vertices have x and y properties
        for (const vertex of vertices) {
            if (typeof vertex.x !== 'number' || typeof vertex.y !== 'number') {
                return false;
            }
        }
        
        // Check minimum area to prevent degenerate shapes
        const area = PolygonUtils.calculateArea(vertices);
        if (area < 10) return false; // Minimum 10 square pixels
        
        return true;
    }
    
    /**
     * Generate a unique ID for a shape
     * @returns {string} Unique identifier
     */
    generateId() {
        return `idt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get total number of vertices across all shapes
     * @returns {number} Total vertex count
     */
    getTotalVertices() {
        return this.shapes.reduce((total, shape) => total + shape.vertices.length, 0);
    }
    
    /**
     * Update performance statistics
     */
    updatePerformanceStats() {
        this.performanceStats.totalShapes = this.shapes.length;
        this.performanceStats.totalVertices = this.getTotalVertices();
    }
    
    /**
     * Record collision detection frame time for performance monitoring
     * @param {number} frameTime - Time in milliseconds
     */
    recordFrameTime(frameTime) {
        this.performanceStats.lastFrameTime = frameTime;
        this.performanceStats.frameCount++;
        
        // Calculate running average
        const weight = Math.min(this.performanceStats.frameCount, 100);
        this.performanceStats.averageFrameTime = 
            (this.performanceStats.averageFrameTime * (weight - 1) + frameTime) / weight;
    }
    
    /**
     * Get performance statistics
     * @returns {Object} Performance stats object
     */
    getPerformanceStats() {
        return {
            ...this.performanceStats,
            withinBudget: this.performanceStats.averageFrameTime < this.limits.COLLISION_TIME_BUDGET,
            budgetUtilization: (this.performanceStats.averageFrameTime / this.limits.COLLISION_TIME_BUDGET) * 100
        };
    }
    
    /**
     * Check if performance is within acceptable limits
     * @returns {boolean} True if performance is acceptable
     */
    isPerformanceAcceptable() {
        return this.performanceStats.averageFrameTime < this.limits.COLLISION_TIME_BUDGET;
    }
    
    /**
     * Optimize shapes if performance is poor
     * Simplifies complex shapes to improve performance
     */
    optimizeShapes() {
        if (this.isPerformanceAcceptable()) return;
        
        console.log('Optimizing shapes for better performance...');
        
        for (const shape of this.shapes) {
            if (shape.vertices.length > 50) {
                const simplified = PolygonUtils.simplifyPolygon(shape.vertices, 3);
                shape.vertices = simplified;
                shape.boundingBox = PolygonUtils.getBoundingBox(simplified);
                shape.area = PolygonUtils.calculateArea(simplified);
            }
        }
        
        this.updatePerformanceStats();
    }
    
    /**
     * Serialize shapes for saving
     * @returns {Object} Serialized data
     */
    serialize() {
        return {
            shapes: this.shapes.map(shape => ({
                id: shape.id,
                vertices: shape.vertices,
                created: shape.created
            })),
            version: '1.0'
        };
    }
    
    /**
     * Deserialize shapes from saved data
     * @param {Object} data - Serialized data
     * @returns {boolean} True if successfully loaded
     */
    deserialize(data) {
        if (!data || !data.shapes || !Array.isArray(data.shapes)) {
            return false;
        }
        
        this.clearAllShapes();
        
        for (const shapeData of data.shapes) {
            if (this.validateShape(shapeData.vertices)) {
                const shape = {
                    id: shapeData.id,
                    vertices: shapeData.vertices,
                    boundingBox: PolygonUtils.getBoundingBox(shapeData.vertices),
                    area: PolygonUtils.calculateArea(shapeData.vertices),
                    created: shapeData.created || Date.now()
                };
                this.shapes.push(shape);
            }
        }
        
        this.updatePerformanceStats();
        return true;
    }
    
    /**
     * Get all shapes (for level editor visualization)
     * @returns {Array} Array of shape objects
     */
    getAllShapes() {
        return [...this.shapes];
    }
    
    /**
     * Get shape by ID
     * @param {string} id - Shape ID
     * @returns {Object|null} Shape object or null if not found
     */
    getShapeById(id) {
        return this.shapes.find(shape => shape.id === id) || null;
    }
}

// Make IndestructibleTerrain globally available (no module export needed)