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
            walk: { url: 'assets/sprites/lemming-walk-sheet.png', frames: 4, width: 6, height: 10, spacing: 2 },
            fall: { url: 'assets/sprites/lemming-fall-sheet.png', frames: 4, width: 6, height: 10, spacing: 2 },
            climb: { url: 'assets/sprites/lemming-climb-sheet.png', frames: 4, width: 6, height: 10, spacing: 3 },
            float: { url: 'assets/sprites/lemming-float-sheet.png', frames: 4, width: 8, height: 12, spacing: 3 },

            // Action animations
            bash: { url: 'assets/sprites/lemming-bash-sheet.png', frames: 4, width: 6, height: 10, spacing: 2 },
            dig: { url: 'assets/sprites/lemming-dig-sheet.png', frames: 4, width: 6, height: 10, spacing: 2 },
            mine: { url: 'assets/sprites/lemming-mine-sheet.png', frames: 4, width: 8, height: 11, spacing: 3 },
            build: { url: 'assets/sprites/lemming-build-sheet.png', frames: 4, width: 6, height: 10, spacing: 2 },
            block: { url: 'assets/sprites/lemming-block-sheet.png', frames: 4, width: 6, height: 10, spacing: 2 },

            // Death animations
            deathFall: { url: 'assets/sprites/lemming-death-fall-sheet.png', frames: 4, width: 6, height: 10, spacing: 2 },
            deathDrown: { url: 'assets/sprites/lemming-death-drown-sheet.png', frames: 4, width: 6, height: 10, spacing: 2 },
            deathChop: { url: 'assets/sprites/lemming-death-chop-sheet.png', frames: 4, width: 6, height: 10, spacing: 2 },
            deathExplode: { url: 'assets/sprites/lemming-death-explode-sheet.png', frames: 4, width: 6, height: 10, spacing: 2 },

            // NEW: Level element animations
            spawn: { url: 'assets/sprites/spawn-animation-sheet.png', frames: 4, width: 40, height: 30, spacing: 3 },
            exit: { url: 'assets/sprites/exit-animation-sheet.png', frames: 4, width: LEVEL_EDITOR.BASIC_TOOLS.EXIT_WIDTH, height: LEVEL_EDITOR.BASIC_TOOLS.EXIT_HEIGHT, spacing: 3 }
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
                // Store the sprite sheet data with spacing
                this.sprites.set(key, {
                    image: img,
                    frames: config.frames,
                    frameWidth: config.width,
                    frameHeight: config.height,
                    spacing: config.spacing || 0, // Default to 0 if not specified
                    totalWidth: img.width // Use actual image width
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

    draw(ctx) {
        if (!this.shouldRender()) {
            return;
        }

        const lemmingWidth = this.getWidth();
        const lemmingHeight = this.getHeight();

        // Apply opacity for death fade effect
        const opacity = this.getOpacity();
        if (opacity <= 0) {
            return;
        }

        ctx.save();
        ctx.globalAlpha = opacity;

        // Get current animation and frame
        const animationKey = this.animationController.getCurrentAnimation();
        const frameIndex = this.animationController.getCurrentFrame();

        // Calculate scale based on zoom
        const scale = this.zoom / LEMMING_CONFIG.baseZoom;

        // Check if we should flip the sprite (when facing left)
        const flipX = this.direction === -1;

        // Draw sprite if available
        if (window.spriteManager && window.spriteManager.getSprite(animationKey)) {
            // ALIGNMENT FIX: Calculate offset to center larger sprite on lemming position
            const sprite = window.spriteManager.getSprite(animationKey);
            const spriteWidth = sprite.frameWidth * scale;
            const spriteHeight = sprite.frameHeight * scale;

            // Calculate offset to center sprite on lemming collision box
            const offsetX = 0; // X is already centered in drawFrame
            const offsetY = 0; // Align sprite bottom with lemming bottom

            window.spriteManager.drawFrame(
                ctx,
                animationKey,
                frameIndex,
                this.x + offsetX,
                this.y + offsetY,
                scale,
                flipX
            );
        } else {
            // Fallback to colored rectangle rendering
            this.drawFallback(ctx, lemmingWidth, lemmingHeight);
        }

        // Draw countdown for explosion timer (keep aligned with lemming position)
        if (this.explosionTimer > 0) {
            const seconds = Math.ceil(this.explosionTimer);

            ctx.font = `bold ${Math.max(10, this.getHeight())}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;

            const textX = this.x;
            const textY = this.y - 2;

            ctx.strokeText(seconds.toString(), textX, textY);
            ctx.fillText(seconds.toString(), textX, textY);
        }

        ctx.restore();
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

        // Calculate source rectangle accounting for spacing
        const spacing = sprite.spacing || 0;
        const srcX = frameIndex * (sprite.frameWidth + spacing);
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