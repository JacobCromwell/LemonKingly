// In js/terrain.js - Add collision cache system

class Terrain {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        this.imageData = null;

        // Add collision cache
        this.collisionGrid = null;
        this.gridCellSize = 10; // Check every 10 pixels for performance

        this.updateImageData();
    }

    updateImageData() {
        try {
            this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
            this.updateCollisionCache();
        } catch (error) {
            console.error('Error updating image data:', error);
            // Create empty image data as fallback
            this.imageData = this.ctx.createImageData(this.width, this.height);
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

    // JRC is this needed
    // updateImageData() {
    //     this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    //     this.updateCollisionCache();
    // }

    // OPTIMIZE hasGround() with fast path:
    hasGround(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return true; // Treat boundaries as solid
        }

        x = Math.floor(x);
        y = Math.floor(y);

        // Quick check using collision grid first
        if (this.collisionGrid) {
            const gx = Math.floor(x / this.gridCellSize);
            const gy = Math.floor(y / this.gridCellSize);

            // If grid cell has no collision, skip expensive pixel check
            if (!this.collisionGrid[gy][gx]) {
                return false;
            }
        }

        // Only do pixel-perfect check if grid cell has collision
        const index = (y * this.width + x) * 4;
        return this.imageData.data[index + 3] > 0;
    }

    getObstacleHeight(x, y) {
        let height = 0;
        let checkY = y + LEMMING_HEIGHT;

        while (height < CLIMB_HEIGHT + 1 && this.hasGround(x, checkY - height)) {
            height++;
        }

        return height <= CLIMB_HEIGHT ? height : CLIMB_HEIGHT + 1;
    }

    removeTerrain(x, y, width, height) {
        // Get color before clearing
        const imageData = this.ctx.getImageData(x, y, 1, 1);
        let color = `rgb(${imageData.data[0]}, ${imageData.data[1]}, ${imageData.data[2]})`;

        // If color is transparent or black, use a default terrain color
        if (imageData.data[3] === 0 || (imageData.data[0] === 0 && imageData.data[1] === 0 && imageData.data[2] === 0)) {
            color = '#8B4513'; // Brown color for terrain
        }

        this.ctx.clearRect(x, y, width, height);
        this.updateImageData();

        return color;
    }

    addTerrain(x, y, width, height) {
        console.log(`x: ${x}, y: ${y}`);
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x, y, width, height);
        this.updateImageData();
    }

    draw(ctx) {
        ctx.drawImage(this.canvas, 0, 0);
    }

    removeTerrainPixel(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            // Clear a single pixel
            this.ctx.clearRect(x, y, 1, 1);
        }
    }
}