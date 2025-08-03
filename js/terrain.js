// Enhanced terrain.js with improved collision detection
class Terrain {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        this.imageData = null;

        // Add IDT tracking
        this.idtData = null; // Stores which pixels are indestructible
        this.idtAreas = []; // Stores IDT area definitions for editor/saving

        // IMPROVED: Smaller collision grid for better precision
        this.collisionGrid = null;
        this.gridCellSize = 4; // Reduced from 10 to 4 for better precision

        this.updateImageData();
    }

    updateImageData() {
        try {
            this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
            
            if (!this.idtData) {
                this.idtData = new Uint8Array(this.width * this.height);
            }
            
            this.updateCollisionCache();
        } catch (error) {
            console.error('Error updating image data:', error);
            this.imageData = this.ctx.createImageData(this.width, this.height);
            this.idtData = new Uint8Array(this.width * this.height);
        }
    }

    updateCollisionCache() {
        const gridWidth = Math.ceil(this.width / this.gridCellSize);
        const gridHeight = Math.ceil(this.height / this.gridCellSize);
        this.collisionGrid = new Array(gridHeight);

        for (let gy = 0; gy < gridHeight; gy++) {
            this.collisionGrid[gy] = new Array(gridWidth);
            for (let gx = 0; gx < gridWidth; gx++) {
                // Check if this grid cell contains any solid pixels
                let hasSolid = false;
                const startX = gx * this.gridCellSize;
                const startY = gy * this.gridCellSize;
                const endX = Math.min(startX + this.gridCellSize, this.width);
                const endY = Math.min(startY + this.gridCellSize, this.height);

                checkLoop: for (let y = startY; y < endY; y++) {
                    for (let x = startX; x < endX; x++) {
                        const index = (y * this.width + x) * 4;
                        if (this.imageData.data[index + 3] > 0) {
                            hasSolid = true;
                            break checkLoop;
                        }
                    }
                }

                this.collisionGrid[gy][gx] = hasSolid;
            }
        }
    }

    // ENHANCED: Improved hasGround with better precision and debugging
    hasGround(x, y) {
        // Handle boundary conditions
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return true; // Treat boundaries as solid
        }

        // IMPROVED: Use more precise rounding
        const pixelX = Math.round(x);
        const pixelY = Math.round(y);

        // Ensure we're still within bounds after rounding
        if (pixelX < 0 || pixelX >= this.width || pixelY < 0 || pixelY >= this.height) {
            return true;
        }

        // ENHANCED: Multi-point sampling for better accuracy at high zoom
        const hasGroundAtPoint = (px, py) => {
            if (px < 0 || px >= this.width || py < 0 || py >= this.height) {
                return true;
            }
            const index = (py * this.width + px) * 4;
            return this.imageData.data[index + 3] > 0;
        };

        // Check the exact pixel first
        const hasMain = hasGroundAtPoint(pixelX, pixelY);

        // For critical collision detection, also check neighboring pixels
        // This helps catch edge cases where rounding might miss thin terrain
        const hasLeft = hasGroundAtPoint(pixelX - 1, pixelY);
        const hasRight = hasGroundAtPoint(pixelX + 1, pixelY);
        const hasUp = hasGroundAtPoint(pixelX, pixelY - 1);
        const hasDown = hasGroundAtPoint(pixelX, pixelY + 1);

        // If any of the nearby pixels have ground, consider it solid
        // This provides more robust collision detection
        const result = hasMain || hasLeft || hasRight || hasUp || hasDown;

        return result;
    }

    // ENHANCED: More robust ground checking for lemmings
    hasGroundForLemming(x, y, width, height) {
        // Check multiple points across the lemming's bottom edge
        const checkPoints = Math.max(3, Math.ceil(width / 2));
        const stepSize = width / (checkPoints - 1);

        for (let i = 0; i < checkPoints; i++) {
            const checkX = x - width/2 + (i * stepSize);
            const checkY = y + height;
            
            if (this.hasGround(checkX, checkY)) {
                return true;
            }
        }
        return false;
    }

    // Rest of the existing methods remain the same...
    isIndestructible(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }

        x = Math.floor(x);
        y = Math.floor(y);
        
        const index = y * this.width + x;
        return this.idtData[index] === 1;
    }

    hasIndestructibleTerrain(x, y, width, height) {
        const startX = Math.max(0, Math.floor(x));
        const endX = Math.min(this.width - 1, Math.floor(x + width));
        const startY = Math.max(0, Math.floor(y));
        const endY = Math.min(this.height - 1, Math.floor(y + height));

        for (let checkY = startY; checkY <= endY; checkY++) {
            for (let checkX = startX; checkX <= endX; checkX++) {
                if (this.hasGround(checkX, checkY) && this.isIndestructible(checkX, checkY)) {
                    return true;
                }
            }
        }
        return false;
    }

        // NEW: Add IDT area and mark existing terrain pixels as indestructible
    addIdtArea(x, y, width, height) {
        // Store the area definition for saving/loading
        this.idtAreas.push({ x, y, width, height });

        // Mark existing terrain pixels in this area as indestructible
        const startX = Math.max(0, Math.floor(x));
        const endX = Math.min(this.width - 1, Math.floor(x + width));
        const startY = Math.max(0, Math.floor(y));
        const endY = Math.min(this.height - 1, Math.floor(y + height));

        for (let checkY = startY; checkY <= endY; checkY++) {
            for (let checkX = startX; checkX <= endX; checkX++) {
                // Only mark pixels that actually have terrain
                if (this.hasGround(checkX, checkY)) {
                    const index = checkY * this.width + checkX;
                    this.idtData[index] = 1;
                }
            }
        }

        console.log(`Added IDT area at (${x}, ${y}) with size ${width}x${height}`);
    }

    // NEW: Remove IDT area
    removeIdtArea(areaIndex) {
        if (areaIndex >= 0 && areaIndex < this.idtAreas.length) {
            const area = this.idtAreas[areaIndex];
            
            // Clear IDT markings for this area
            const startX = Math.max(0, Math.floor(area.x));
            const endX = Math.min(this.width - 1, Math.floor(area.x + area.width));
            const startY = Math.max(0, Math.floor(area.y));
            const endY = Math.min(this.height - 1, Math.floor(area.y + area.height));

            for (let checkY = startY; checkY <= endY; checkY++) {
                for (let checkX = startX; checkX <= endX; checkX++) {
                    const index = checkY * this.width + checkX;
                    this.idtData[index] = 0;
                }
            }

            // Re-apply other IDT areas to avoid removing overlapping areas
            this.idtAreas.splice(areaIndex, 1);
            this.reapplyAllIdtAreas();
        }
    }

    // NEW: Reapply all IDT areas (used when removing areas)
    reapplyAllIdtAreas() {
        // Clear all IDT data
        this.idtData.fill(0);

        // Reapply all remaining areas
        const tempAreas = [...this.idtAreas];
        this.idtAreas = [];
        
        tempAreas.forEach(area => {
            this.addIdtArea(area.x, area.y, area.width, area.height);
        });
    }

    // NEW: Load IDT areas from save data
    loadIdtAreas(areas) {
        this.idtAreas = [];
        this.idtData.fill(0);

        if (Array.isArray(areas)) {
            areas.forEach(area => {
                this.addIdtArea(area.x, area.y, area.width, area.height);
            });
        }
    }

    getObstacleHeight(x, y) {
        let height = 0;
        let checkY = y + LEMMING_CONFIG.getHeight(1);

        while (height < PHYSICS.climbHeight + 1 && this.hasGround(x, checkY - height)) {
            height++;
        }

        return height <= PHYSICS.climbHeight ? height : PHYSICS.climbHeight + 1;
    }

    // UPDATED: Check for IDT before removing terrain
    removeTerrain(x, y, width, height) {
        // Check if any terrain in the removal area is indestructible
        if (this.hasIndestructibleTerrain(x, y, width, height)) {
            return null; // Cannot remove - area contains indestructible terrain
        }

        // Get color before clearing
        const imageData = this.ctx.getImageData(x, y, 1, 1);
        let color = `rgb(${imageData.data[0]}, ${imageData.data[1]}, ${imageData.data[2]})`;

        // If color is transparent or black, use a default terrain color
        if (imageData.data[3] === 0 || (imageData.data[0] === 0 && imageData.data[1] === 0 && imageData.data[2] === 0)) {
            color = '#8B4513'; // Brown color for terrain
        }

        this.ctx.clearRect(x, y, width, height);
        
        // Also clear IDT data for removed terrain
        const startX = Math.max(0, Math.floor(x));
        const endX = Math.min(this.width - 1, Math.floor(x + width));
        const startY = Math.max(0, Math.floor(y));
        const endY = Math.min(this.height - 1, Math.floor(y + height));

        for (let checkY = startY; checkY <= endY; checkY++) {
            for (let checkX = startX; checkX <= endX; checkX++) {
                const index = checkY * this.width + checkX;
                this.idtData[index] = 0;
            }
        }

        this.updateImageData();
        return color;
    }

    // UPDATED: Check for IDT before removing single pixel
    removeTerrainPixel(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            // Check if this pixel is indestructible
            if (this.isIndestructible(x, y)) {
                return false; // Cannot remove - pixel is indestructible
            }

            // Clear the pixel
            this.ctx.clearRect(x, y, 1, 1);
            
            // Clear IDT data for this pixel
            const index = y * this.width + x;
            this.idtData[index] = 0;
            
            return true;
        }
        return false;
    }

    addTerrain(x, y, width, height) {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x, y, width, height);
        this.updateImageData();
    }

    // UPDATED: Draw terrain with IDT overlay
    draw(ctx) {
        // Draw normal terrain
        ctx.drawImage(this.canvas, 0, 0);

        // Draw IDT overlay
        this.drawIdtOverlay(ctx);
    }

    // NEW: Draw purple overlay for IDT areas
    drawIdtOverlay(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(128, 0, 128, 0.3)'; // Transparent purple
        
        this.idtAreas.forEach(area => {
            ctx.fillRect(area.x, area.y, area.width, area.height);
        });

        ctx.restore();
    }

    // NEW: Get IDT areas for saving
    getIdtAreas() {
        return this.idtAreas;
    }
}