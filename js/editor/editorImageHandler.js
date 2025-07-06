// Handles image loading and processing for the editor
class EditorImageHandler {
    constructor(editor) {
        this.editor = editor;
        this.setupImageInputs();
    }
    
    setupImageInputs() {
        const bgInput = document.getElementById('backgroundInput');
        const fgInput = document.getElementById('foregroundInput');
        
        if (bgInput) {
            bgInput.addEventListener('change', this.loadBackgroundImage.bind(this));
        }
        if (fgInput) {
            fgInput.addEventListener('change', this.loadForegroundImage.bind(this));
        }
    }
    
    loadBackgroundImage(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                this.editor.backgroundImage = img;
                this.editor.draw();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    loadForegroundImage(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                console.log('Foreground image loaded:', img.width, 'x', img.height);
                this.editor.foregroundImage = img;
                
                // Update level dimensions based on image
                this.editor.levelWidth = img.width;
                this.editor.levelHeight = img.height;
                
                // Recreate terrain at new size
                this.editor.terrain = new Terrain(this.editor.levelWidth, this.editor.levelHeight);
                this.editor.terrain.canvas.width = this.editor.levelWidth;
                this.editor.terrain.canvas.height = this.editor.levelHeight;
                this.editor.terrain.ctx = this.editor.terrain.canvas.getContext('2d');
                
                // Auto-adjust zoom for visibility
                const zoomX = this.editor.displayWidth / this.editor.levelWidth;
                const zoomY = this.editor.displayHeight / this.editor.levelHeight;
                this.editor.zoom = Math.min(zoomX, zoomY) * 0.9;
                this.editor.zoom = Math.max(this.editor.minZoom, Math.min(this.editor.maxZoom, this.editor.zoom));
                
                this.editor.updateZoomDisplay();
                this.editor.centerCamera();
                
                // Draw the image to terrain canvas
                this.editor.terrain.ctx.drawImage(this.editor.foregroundImage, 0, 0);
                this.editor.terrain.updateImageData();
                
                this.editor.draw();
                
                // CHANGED: Automatically set transparent color to black (0,0,0) instead of prompting
                this.editor.transparentColor = {
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 255
                };
                
                this.processForegroundImage();
                
                console.log('Transparent color automatically set to black RGB(0, 0, 0)');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // NEW: Method to trigger background color selection manually
    selectBackgroundColor() {
        if (!this.editor.foregroundImage) {
            alert('Please load a terrain image first before selecting a background color.');
            return;
        }
        
        alert('Click on a color in the terrain image to set it as transparent (non-terrain)');
        this.editor.pickingTransparentColor = true;
    }
    
    pickTransparentColor(x, y) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.editor.foregroundImage.width;
        tempCanvas.height = this.editor.foregroundImage.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.editor.foregroundImage, 0, 0);
        
        // Get pixel color
        x = Math.max(0, Math.min(this.editor.foregroundImage.width - 1, Math.floor(x)));
        y = Math.max(0, Math.min(this.editor.foregroundImage.height - 1, Math.floor(y)));
        
        const imageData = tempCtx.getImageData(x, y, 1, 1);
        const data = imageData.data;
        
        this.editor.transparentColor = {
            r: data[0],
            g: data[1],
            b: data[2],
            a: data[3]
        };
        
        this.editor.pickingTransparentColor = false;
        this.processForegroundImage();
        
        alert(`Transparent color set to RGB(${data[0]}, ${data[1]}, ${data[2]})`);
    }
    
    processForegroundImage() {
        if (!this.editor.foregroundImage) return;
        
        console.log('Processing foreground image with transparent color:', this.editor.transparentColor);
        
        // Clear existing terrain
        this.editor.terrain.ctx.clearRect(0, 0, this.editor.terrain.width, this.editor.terrain.height);
        
        // Draw foreground image to terrain canvas
        this.editor.terrain.ctx.drawImage(this.editor.foregroundImage, 0, 0);
        
        // Get image data and make transparent color actually transparent
        const imageData = this.editor.terrain.ctx.getImageData(0, 0, this.editor.terrain.width, this.editor.terrain.height);
        const data = imageData.data;
        
        let transparentPixels = 0;
        for (let i = 0; i < data.length; i += 4) {
            // Check with some tolerance for color matching
            const rDiff = Math.abs(data[i] - this.editor.transparentColor.r);
            const gDiff = Math.abs(data[i + 1] - this.editor.transparentColor.g);
            const bDiff = Math.abs(data[i + 2] - this.editor.transparentColor.b);
            
            if (rDiff <= 5 && gDiff <= 5 && bDiff <= 5) {
                data[i + 3] = 0; // Make transparent
                transparentPixels++;
            }
        }
        
        console.log('Made', transparentPixels, 'pixels transparent');
        
        this.editor.terrain.ctx.putImageData(imageData, 0, 0);
        this.editor.terrain.updateImageData();
        this.editor.draw();
    }
}