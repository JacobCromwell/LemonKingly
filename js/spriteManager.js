// js/spriteManager.js - Manages sprite sheet loading and caching

class SpriteManager {
    constructor() {
        this.sprites = new Map();
        this.loadPromises = new Map();
        this.loadedCount = 0;
        this.totalCount = 0;
        
        // Sprite sheet definitions
        this.spriteSheets = {
            // Movement animations
            walk: { url: 'assets/sprites/lemming-walk-sheet.png', frames: 4, width: 6, height: 10 },
            fall: { url: 'assets/sprites/lemming-fall-sheet.png', frames: 4, width: 16, height: 20 },
            climb: { url: 'assets/sprites/lemming-climb-sheet.png', frames: 4, width: 16, height: 20 },
            float: { url: 'assets/sprites/lemming-float-sheet.png', frames: 4, width: 16, height: 20 },
            
            // Action animations
            bash: { url: 'assets/sprites/lemming-bash-sheet.png', frames: 4, width: 16, height: 20 },
            dig: { url: 'assets/sprites/lemming-dig-sheet.png', frames: 4, width: 16, height: 20 },
            mine: { url: 'assets/sprites/lemming-mine-sheet.png', frames: 4, width: 16, height: 20 },
            build: { url: 'assets/sprites/lemming-build-sheet.png', frames: 4, width: 16, height: 20 },
            block: { url: 'assets/sprites/lemming-block-sheet.png', frames: 4, width: 16, height: 20 },
            
            // Death animations (grouped as requested)
            deathFall: { url: 'assets/sprites/lemming-death-fall-sheet.png', frames: 4, width: 16, height: 20 },
            deathDrown: { url: 'assets/sprites/lemming-death-drown-sheet.png', frames: 4, width: 16, height: 20 },
            deathChop: { url: 'assets/sprites/lemming-death-chop-sheet.png', frames: 4, width: 16, height: 20 },
            deathExplode: { url: 'assets/sprites/lemming-death-explode-sheet.png', frames: 4, width: 16, height: 20 },
            
            // Special states
            explodeCountdown: { url: 'assets/sprites/lemming-explode-countdown-sheet.png', frames: 4, width: 16, height: 20 }
        };
        
        this.totalCount = Object.keys(this.spriteSheets).length;
    }
    
    /**
     * Preload all sprite sheets
     * @returns {Promise} Resolves when all sprites are loaded
     */
    async preloadAll() {
        const loadPromises = Object.entries(this.spriteSheets).map(([key, config]) => 
            this.loadSpriteSheet(key, config)
        );
        
        try {
            await Promise.all(loadPromises);
            console.log(`All ${this.loadedCount} sprite sheets loaded successfully`);
            return true;
        } catch (error) {
            console.error('Error loading sprite sheets:', error);
            return false;
        }
    }
    
    /**
     * Load a single sprite sheet
     * @param {string} key - Sprite sheet identifier
     * @param {Object} config - Sprite sheet configuration
     * @returns {Promise} Resolves when sprite is loaded
     */
    loadSpriteSheet(key, config) {
        // Return existing promise if already loading
        if (this.loadPromises.has(key)) {
            return this.loadPromises.get(key);
        }
        
        const loadPromise = new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                // Store the sprite sheet data
                this.sprites.set(key, {
                    image: img,
                    frames: config.frames,
                    frameWidth: config.width,
                    frameHeight: config.height,
                    totalWidth: config.width * config.frames
                });
                
                this.loadedCount++;
                this.loadPromises.delete(key);
                
                if (window.environmentManager) {
                    window.environmentManager.devLog(`Loaded sprite sheet: ${key}`);
                }
                
                resolve(img);
            };
            
            img.onerror = () => {
                console.error(`Failed to load sprite sheet: ${config.url}`);
                this.loadPromises.delete(key);
                
                // Create fallback colored rectangle data
                this.createFallbackSprite(key, config);
                resolve(null);
            };
            
            img.src = config.url;
        });
        
        this.loadPromises.set(key, loadPromise);
        return loadPromise;
    }
    
    /**
     * Create a fallback sprite for missing images
     * @param {string} key - Sprite sheet identifier
     * @param {Object} config - Sprite sheet configuration
     */
    createFallbackSprite(key, config) {
        // Create a canvas to draw fallback frames
        const canvas = document.createElement('canvas');
        canvas.width = config.width * config.frames;
        canvas.height = config.height;
        const ctx = canvas.getContext('2d');
        
        // Use different colors for different animation types
        const colors = {
            walk: '#00ff00',
            fall: '#00ffff',
            climb: '#ffaa00',
            float: '#FFD700',
            bash: '#ffff00',
            dig: '#00ffff',
            mine: '#8B4513',
            build: '#ff00ff',
            block: '#ff6600',
            deathFall: '#ff0000',
            deathDrown: '#0066ff',
            deathChop: '#cc0000',
            deathExplode: '#ff8800',
            explodeCountdown: '#ffff00'
        };
        
        const color = colors[key] || '#00ff00';
        
        // Draw frames with slight variations
        for (let i = 0; i < config.frames; i++) {
            const x = i * config.width;
            const brightness = 0.7 + (0.3 * (i / (config.frames - 1)));
            
            ctx.fillStyle = color;
            ctx.globalAlpha = brightness;
            ctx.fillRect(x + 2, 2, config.width - 4, config.height - 4);
            
            // Add frame number for debugging
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'white';
            ctx.font = '8px Arial';
            ctx.fillText((i + 1).toString(), x + 6, 12);
        }
        
        // Create image from canvas
        const img = new Image();
        img.src = canvas.toDataURL();
        
        this.sprites.set(key, {
            image: img,
            frames: config.frames,
            frameWidth: config.width,
            frameHeight: config.height,
            totalWidth: config.width * config.frames,
            isFallback: true
        });
        
        console.warn(`Using fallback sprite for: ${key}`);
    }
    
    /**
     * Get sprite data for a specific animation
     * @param {string} key - Sprite sheet identifier
     * @returns {Object|null} Sprite data or null if not loaded
     */
    getSprite(key) {
        return this.sprites.get(key) || null;
    }
    
    /**
     * Draw a specific frame from a sprite sheet
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} spriteKey - Sprite sheet identifier
     * @param {number} frameIndex - Which frame to draw (0-based)
     * @param {number} x - X position to draw at
     * @param {number} y - Y position to draw at
     * @param {number} scale - Scale factor for drawing
     * @param {boolean} flipX - Whether to flip horizontally
     */
    drawFrame(ctx, spriteKey, frameIndex, x, y, scale = 1, flipX = false) {
        const sprite = this.getSprite(spriteKey);
        if (!sprite) return;
        
        // Calculate source rectangle
        const srcX = frameIndex * sprite.frameWidth;
        const srcY = 0;
        
        // Calculate destination size
        const destWidth = sprite.frameWidth * scale;
        const destHeight = sprite.frameHeight * scale;
        
        ctx.save();
        
        if (flipX) {
            // Flip horizontally around the sprite center
            ctx.translate(x + destWidth / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(x + destWidth / 2), 0);
        }
        
        // Draw the sprite frame
        ctx.drawImage(
            sprite.image,
            srcX, srcY, sprite.frameWidth, sprite.frameHeight,
            x - destWidth / 2, y, destWidth, destHeight
        );
        
        ctx.restore();
    }
    
    /**
     * Get loading progress
     * @returns {number} Progress from 0 to 1
     */
    getLoadingProgress() {
        return this.totalCount > 0 ? this.loadedCount / this.totalCount : 0;
    }
    
    /**
     * Check if all sprites are loaded
     * @returns {boolean} True if all sprites are loaded
     */
    isFullyLoaded() {
        return this.loadedCount === this.totalCount;
    }
}

// Create global sprite manager instance
window.spriteManager = new SpriteManager();