class Terrain {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        this.imageData = null;
    }
    
    // loadLevel(levelData) {
    //     // Draw initial terrain
    //     this.ctx.fillStyle = '#8B4513';
        
    //     // Ground with gaps for hazards
    //     // First section
    //     this.ctx.fillRect(0, 400, 270, 200);
        
    //     // Gap for lava pit (300-360)
        
    //     // Second section
    //     this.ctx.fillRect(360, 400, 70, 200);
        
    //     // Gap for bear trap (430-470)
        
    //     // Third section  
    //     this.ctx.fillRect(470, 400, 55, 200);
        
    //     // Gap for spike pit (525-575)
        
    //     // Final section
    //     this.ctx.fillRect(575, 400, 225, 200);
        
    //     // Some obstacles
    //     this.ctx.fillRect(200, 350, 100, 50);
    //     this.ctx.fillRect(400, 300, 150, 100);
    //     this.ctx.fillRect(900, 320, 80, 80);
        
    //     this.updateImageData();
    // }


    loadLevel(levelData) {
        // Draw initial terrain
        this.ctx.fillStyle = '#8B4513';

        // Ground
        this.ctx.fillRect(0, 400, this.width, 200);


        // Some obstacles
        this.ctx.fillRect(200, 350, 100, 50);
        this.ctx.fillRect(400, 300, 150, 100);
        this.ctx.fillRect(600, 320, 80, 80);

        this.updateImageData();
    }
    
    updateImageData() {
        this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    }
    
    hasGround(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return true; // Treat boundaries as solid
        }
        
        x = Math.floor(x);
        y = Math.floor(y);
        
        const index = (y * this.width + x) * 4;
        return this.imageData.data[index + 3] > 0; // Check alpha channel
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
        // Get color of terrain before removing it
        const imageData = this.ctx.getImageData(x, y, 1, 1);
        const color = `rgb(${imageData.data[0]}, ${imageData.data[1]}, ${imageData.data[2]})`;
        
        this.ctx.clearRect(x, y, width, height);
        this.updateImageData();
        
        // Return the color for particle effects
        return color;
    }
    
    addTerrain(x, y, width, height) {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x, y, width, height);
        this.updateImageData();
    }
    
    draw(ctx) {
        ctx.drawImage(this.canvas, 0, 0);
    }
}