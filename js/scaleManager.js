/**
 * Scale Manager - Handles responsive scaling for the game
 * Uses 1920x1080 as the baseline resolution
 */
class ScaleManager {
    constructor() {
        // Baseline resolution (your preferred size)
        this.baseWidth = 1920;
        this.baseHeight = 1080;
        
        // Current scale factor
        this.scale = 1;
        
        // Elements to scale
        this.gameWrapper = null;
        this.gameContainer = null;
        this.gameCanvas = null;
        this.menu = null;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        // Get elements
        this.gameWrapper = document.getElementById('gameWrapper');
        this.gameContainer = document.getElementById('gameContainer');
        this.gameCanvas = document.getElementById('gameCanvas');
        this.menu = document.getElementById('menu');
        
        // Setup scaling
        this.setupScaling();
        
        // Listen for resize events
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('orientationchange', () => this.handleResize());
        
        // Initial scale
        this.updateScale();
    }
    
    setupScaling() {
        // Add necessary styles to wrapper
        if (this.gameWrapper) {
            this.gameWrapper.style.position = 'fixed';
            this.gameWrapper.style.top = '0';
            this.gameWrapper.style.left = '0';
            this.gameWrapper.style.width = '100%';
            this.gameWrapper.style.height = '100%';
            this.gameWrapper.style.overflow = 'hidden';
            this.gameWrapper.style.display = 'flex';
            this.gameWrapper.style.justifyContent = 'center';
            this.gameWrapper.style.alignItems = 'center';
            this.gameWrapper.style.backgroundColor = '#000';
        }
        
        // Set base dimensions for game container
        if (this.gameContainer) {
            this.gameContainer.style.width = this.baseWidth + 'px';
            this.gameContainer.style.height = this.baseHeight + 'px';
            this.gameContainer.style.transformOrigin = 'center center';
            this.gameContainer.style.position = 'relative';
        }
    }
    
    updateScale() {
        if (!this.gameWrapper || !this.gameContainer) return;
        
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Calculate scale factors for both dimensions
        const scaleX = windowWidth / this.baseWidth;
        const scaleY = windowHeight / this.baseHeight;
        
        // For responsive scaling, we'll use different strategies based on aspect ratio
        const windowAspect = windowWidth / windowHeight;
        const baseAspect = this.baseWidth / this.baseHeight;
        
        if (windowAspect > baseAspect) {
            // Window is wider - scale based on height
            this.scale = scaleY;
        } else {
            // Window is taller - scale based on width
            this.scale = scaleX;
        }
        
        // Apply minimum scale for very small screens
        const minScale = this.isMobile() ? 0.4 : 0.5;
        this.scale = Math.max(this.scale, minScale);
        
        // Apply the scale transformation
        this.gameContainer.style.transform = `scale(${this.scale})`;
        
        // Update canvas internal resolution if needed
        this.updateCanvasResolution();
        
        // Notify game of scale change
        this.notifyScaleChange();
    }
    
    updateCanvasResolution() {
        if (!this.gameCanvas) return;
        
        // The canvas internal resolution stays at 1200x600
        // But we might want to adjust for very high DPI screens in the future
        const dpr = window.devicePixelRatio || 1;
        
        // Store current scale for game to use if needed
        if (window.game) {
            window.game.displayScale = this.scale;
            window.game.devicePixelRatio = dpr;
        }
    }
    
    handleResize() {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.updateScale();
        }, 100);
    }
    
    notifyScaleChange() {
        // Dispatch custom event that game components can listen to
        window.dispatchEvent(new CustomEvent('scalechange', {
            detail: {
                scale: this.scale,
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
                isMobile: this.isMobile()
            }
        }));
    }
    
    isMobile() {
        // Simple mobile detection
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth < 768;
    }
    
    /**
     * Get current scale factor
     */
    getScale() {
        return this.scale;
    }
    
    /**
     * Convert screen coordinates to game coordinates
     * Useful for mouse/touch events
     */
    screenToGame(screenX, screenY) {
        if (!this.gameContainer) return { x: screenX, y: screenY };
        
        const rect = this.gameContainer.getBoundingClientRect();
        const x = (screenX - rect.left) / this.scale;
        const y = (screenY - rect.top) / this.scale;
        
        return { x, y };
    }
    
    /**
     * Check if we should show mobile UI
     */
    shouldShowMobileUI() {
        return this.isMobile() || window.innerWidth < 1024;
    }
}

// Create global scale manager instance
window.scaleManager = new ScaleManager();