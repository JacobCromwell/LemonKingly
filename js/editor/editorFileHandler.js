// Handles saving and loading level files
class EditorFileHandler {
    constructor(editor) {
        this.editor = editor;
    }

    saveLevel() {
        // Update level settings from UI with validation
        const totalLemmingsInput = document.getElementById('totalLemmingsInput');
        const totalLemmingsValue = parseInt(totalLemmingsInput.value);

        // Validate total lemmings range (1-100)
        if (totalLemmingsValue < 1 || totalLemmingsValue > 100 || isNaN(totalLemmingsValue)) {
            totalLemmingsInput.style.color = 'red';
            alert('Total Lemmings must be between 1 and 101');
            return; // Don't save if invalid
        } else {
            totalLemmingsInput.style.color = ''; // Reset color if valid
        }

        this.editor.levelName = document.getElementById('levelName').value;
        this.editor.levelWidth = parseInt(document.getElementById('levelWidth').value);
        this.editor.levelHeight = parseInt(document.getElementById('levelHeight').value);
        this.editor.levelData.totalLemmings = totalLemmingsValue; // Use validated value
        this.editor.levelData.requiredLemmings = parseInt(document.getElementById('requiredLemmings').value);
        this.editor.levelData.spawnRate = parseInt(document.getElementById('spawnRate').value);

        const levelData = {
            name: this.editor.levelName,
            width: this.editor.levelWidth,
            height: this.editor.levelHeight,
            spawn: this.editor.spawnPoint,
            exit: this.editor.exitPoint,
            levelSettings: this.editor.levelData, // This contains totalLemmings
            hazards: this.editor.hazards.map(h => ({
                x: h.x,
                y: h.y,
                width: h.width,
                height: h.height,
                type: h.type
            })),
            terrain: this.editor.terrain.canvas.toDataURL(),
            background: this.editor.backgroundImage ? this.editor.backgroundImage.src : null,
            zoom: this.editor.zoom,
            camera: {
                x: this.editor.camera.x,
                y: this.editor.camera.y
            }
        };

        const dataStr = JSON.stringify(levelData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.editor.levelName}.json`;
        link.click();

        URL.revokeObjectURL(url);
    }

    loadLevel(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const levelData = JSON.parse(e.target.result);
                this.loadLevelData(levelData);
            } catch (err) {
                alert('Error loading level: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    loadLevelData(data) {
        this.editor.levelName = data.name || 'untitled';
        this.editor.levelWidth = data.width || 1200;
        this.editor.levelHeight = data.height || 160;
        this.editor.spawnPoint = data.spawn;
        this.editor.exitPoint = data.exit;
        this.editor.levelData = data.levelSettings;

        // NEW: Load zoom and camera position if available
        if (data.zoom !== undefined) {
            this.editor.zoom = Math.max(this.editor.minZoom, Math.min(this.editor.maxZoom, data.zoom));
            this.editor.updateZoomDisplay();
        }

        if (data.camera) {
            this.editor.camera.x = data.camera.x;
            this.editor.camera.y = data.camera.y;
            this.editor.clampCamera();
        }

        // Recreate terrain at correct size
        this.editor.terrain = new Terrain(this.editor.levelWidth, this.editor.levelHeight);

        // Load hazards
        this.editor.hazards = data.hazards.map(h =>
            new EditorHazard(h.x, h.y, h.width, h.height, h.type)
        );

        // Load background
        if (data.background) {
            const img = new Image();
            img.onload = () => {
                this.editor.backgroundImage = img;
                this.editor.draw();
            };
            img.src = data.background;
        }

        // Load terrain
        const terrainImg = new Image();
        terrainImg.onload = () => {
            this.editor.terrain.ctx.clearRect(0, 0, this.editor.terrain.width, this.editor.terrain.height);
            this.editor.terrain.ctx.drawImage(terrainImg, 0, 0);
            this.editor.terrain.updateImageData();

            // If no zoom was saved, auto-adjust zoom (backward compatibility)
            if (data.zoom === undefined) {
                const zoomX = this.editor.displayWidth / this.editor.levelWidth;
                const zoomY = this.editor.displayHeight / this.editor.levelHeight;
                this.editor.zoom = Math.min(zoomX, zoomY) * 0.9;
                this.editor.zoom = Math.max(this.editor.minZoom, Math.min(this.editor.maxZoom, this.editor.zoom));
                this.editor.updateZoomDisplay();
                this.editor.centerCamera();
            }

            this.editor.draw();
        };
        terrainImg.src = data.terrain;

        // Update UI inputs
        document.getElementById('levelName').value = this.editor.levelName;
        document.getElementById('totalLemmingsInput').value = this.editor.levelData.totalLemmings;
        document.getElementById('requiredLemmings').value = this.editor.levelData.requiredLemmings;
        document.getElementById('spawnRate').value = this.editor.levelData.spawnRate;
    }

    testLevel() {

        // Check if editor UI is actually visible
        const levelEditor = document.getElementById('levelEditor');

        // Let's try to find the input by different methods
        const totalLemmingsInput = document.getElementById('totalLemmingsInput');

        if (totalLemmingsInput) {
            console.log('Input value:', totalLemmingsInput.value);
            console.log('Input type:', totalLemmingsInput.type);
            console.log('Input name:', totalLemmingsInput.name);
        } else {
            // If not found, let's see what inputs DO exist
            const allInputs = document.querySelectorAll('input[type="number"]');
            allInputs.forEach((input, index) => {
                console.log(`Input ${index}:`, {
                    id: input.id,
                    value: input.value,
                    name: input.name
                });
            });
        }

        // Continue with rest of method using fallback...
        const totalLemmingsValue = totalLemmingsInput ? parseInt(totalLemmingsInput.value) || 20 : 20;

    }
}