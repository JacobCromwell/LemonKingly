/**
 * Polygon utility functions for indestructible terrain
 * Provides geometry calculations and collision detection
 */

class PolygonUtils {
    /**
     * Check if a point is inside a polygon using ray casting algorithm
     * @param {number} x - Point x coordinate
     * @param {number} y - Point y coordinate
     * @param {Array} vertices - Array of {x, y} vertex objects
     * @returns {boolean} True if point is inside polygon
     */
    static pointInPolygon(x, y, vertices) {
        if (!vertices || vertices.length < 3) return false;
        
        let inside = false;
        const len = vertices.length;
        
        for (let i = 0, j = len - 1; i < len; j = i++) {
            const xi = vertices[i].x;
            const yi = vertices[i].y;
            const xj = vertices[j].x;
            const yj = vertices[j].y;
            
            if (((yi > y) !== (yj > y)) && 
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }
    
    /**
     * Calculate bounding box for a polygon
     * @param {Array} vertices - Array of {x, y} vertex objects
     * @returns {Object} Bounding box {minX, minY, maxX, maxY}
     */
    static getBoundingBox(vertices) {
        if (!vertices || vertices.length === 0) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        }
        
        let minX = vertices[0].x;
        let minY = vertices[0].y;
        let maxX = vertices[0].x;
        let maxY = vertices[0].y;
        
        for (let i = 1; i < vertices.length; i++) {
            const v = vertices[i];
            minX = Math.min(minX, v.x);
            minY = Math.min(minY, v.y);
            maxX = Math.max(maxX, v.x);
            maxY = Math.max(maxY, v.y);
        }
        
        return { minX, minY, maxX, maxY };
    }
    
    /**
     * Calculate the area of a polygon using the shoelace formula
     * @param {Array} vertices - Array of {x, y} vertex objects
     * @returns {number} Area of polygon (positive for clockwise, negative for counter-clockwise)
     */
    static calculateArea(vertices) {
        if (!vertices || vertices.length < 3) return 0;
        
        let area = 0;
        const len = vertices.length;
        
        for (let i = 0; i < len; i++) {
            const j = (i + 1) % len;
            area += vertices[i].x * vertices[j].y;
            area -= vertices[j].x * vertices[i].y;
        }
        
        return Math.abs(area) / 2;
    }
    
    /**
     * Check if a polygon is closed (first and last points are the same)
     * @param {Array} vertices - Array of {x, y} vertex objects
     * @returns {boolean} True if polygon is closed
     */
    static isPolygonClosed(vertices) {
        if (!vertices || vertices.length < 3) return false;
        
        const first = vertices[0];
        const last = vertices[vertices.length - 1];
        const tolerance = 2; // pixels
        
        return Math.abs(first.x - last.x) <= tolerance && 
               Math.abs(first.y - last.y) <= tolerance;
    }
    
    /**
     * Auto-close a polygon by connecting the last point to the first
     * @param {Array} vertices - Array of {x, y} vertex objects
     * @returns {Array} Closed polygon vertices
     */
    static autoClosePolygon(vertices) {
        if (!vertices || vertices.length < 3) return vertices;
        
        const closed = [...vertices];
        
        if (!this.isPolygonClosed(vertices)) {
            // Add the first point as the last point to close the polygon
            closed.push({ x: vertices[0].x, y: vertices[0].y });
        }
        
        return closed;
    }
    
    /**
     * Simplify a polygon using Douglas-Peucker algorithm
     * Reduces the number of vertices while maintaining shape
     * @param {Array} vertices - Array of {x, y} vertex objects
     * @param {number} tolerance - Simplification tolerance (higher = more simplified)
     * @returns {Array} Simplified polygon vertices
     */
    static simplifyPolygon(vertices, tolerance = 2) {
        if (!vertices || vertices.length <= 3) return vertices;
        
        return this.douglasPeucker(vertices, tolerance);
    }
    
    /**
     * Douglas-Peucker line simplification algorithm
     * @param {Array} points - Array of {x, y} point objects
     * @param {number} tolerance - Simplification tolerance
     * @returns {Array} Simplified points
     */
    static douglasPeucker(points, tolerance) {
        if (points.length <= 2) return points;
        
        // Find the point with maximum distance from line between first and last points
        let maxDistance = 0;
        let maxIndex = 0;
        const end = points.length - 1;
        
        for (let i = 1; i < end; i++) {
            const distance = this.perpendicularDistance(
                points[i], 
                points[0], 
                points[end]
            );
            
            if (distance > maxDistance) {
                maxDistance = distance;
                maxIndex = i;
            }
        }
        
        // If max distance is greater than tolerance, recursively simplify
        if (maxDistance > tolerance) {
            const left = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
            const right = this.douglasPeucker(points.slice(maxIndex), tolerance);
            
            // Combine results, removing duplicate point at junction
            return left.slice(0, -1).concat(right);
        } else {
            // Return just the endpoints
            return [points[0], points[end]];
        }
    }
    
    /**
     * Calculate perpendicular distance from point to line
     * @param {Object} point - Point {x, y}
     * @param {Object} lineStart - Line start point {x, y}
     * @param {Object} lineEnd - Line end point {x, y}
     * @returns {number} Perpendicular distance
     */
    static perpendicularDistance(point, lineStart, lineEnd) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        
        if (dx === 0 && dy === 0) {
            // Line start and end are the same point
            return Math.sqrt(
                Math.pow(point.x - lineStart.x, 2) + 
                Math.pow(point.y - lineStart.y, 2)
            );
        }
        
        const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / 
                  (dx * dx + dy * dy);
        
        const projection = {
            x: lineStart.x + t * dx,
            y: lineStart.y + t * dy
        };
        
        return Math.sqrt(
            Math.pow(point.x - projection.x, 2) + 
            Math.pow(point.y - projection.y, 2)
        );
    }
    
    /**
     * Check if a rectangle intersects with a polygon's bounding box
     * Fast preliminary check before expensive point-in-polygon tests
     * @param {Object} rect - Rectangle {x, y, width, height}
     * @param {Array} vertices - Polygon vertices
     * @returns {boolean} True if bounding boxes intersect
     */
    static rectangleIntersectsBounds(rect, vertices) {
        const bounds = this.getBoundingBox(vertices);
        
        return !(rect.x > bounds.maxX || 
                 rect.x + rect.width < bounds.minX ||
                 rect.y > bounds.maxY || 
                 rect.y + rect.height < bounds.minY);
    }
    
    /**
     * Check if any part of a rectangle intersects with a polygon
     * @param {Object} rect - Rectangle {x, y, width, height}
     * @param {Array} vertices - Polygon vertices
     * @returns {boolean} True if rectangle intersects polygon
     */
    static rectangleIntersectsPolygon(rect, vertices) {
        // Quick bounding box check first
        if (!this.rectangleIntersectsBounds(rect, vertices)) {
            return false;
        }
        
        // Check if any corner of rectangle is inside polygon
        const corners = [
            { x: rect.x, y: rect.y },
            { x: rect.x + rect.width, y: rect.y },
            { x: rect.x + rect.width, y: rect.y + rect.height },
            { x: rect.x, y: rect.y + rect.height }
        ];
        
        for (const corner of corners) {
            if (this.pointInPolygon(corner.x, corner.y, vertices)) {
                return true;
            }
        }
        
        // TODO: Add edge intersection tests for complete accuracy
        // For now, corner tests should be sufficient for lemming collision
        
        return false;
    }
}

// Make PolygonUtils globally available (no module export needed)