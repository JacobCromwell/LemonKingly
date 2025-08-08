// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading screen
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
    }
    
    // Create game instance
    const game = new Game();
    window.game = game;
    
    // Load game assets (sprites)
    await game.loadGameAssets();
    
    // Draw sprites on action buttons after sprites are loaded
    drawActionButtonSprites();
});

// Function to draw sprite icons on action buttons
function drawActionButtonSprites() {
    // Wait a bit to ensure sprites are fully loaded
    setTimeout(() => {
        const actionIcons = document.querySelectorAll('.actionIcon');
        
        actionIcons.forEach(canvas => {
            const spriteKey = canvas.dataset.sprite;
            if (!spriteKey) return;
            
            const ctx = canvas.getContext('2d');
            const sprite = window.spriteManager?.getSprite(spriteKey);
            
            if (sprite && sprite.image) {
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Use frame 2 (index 1) as requested
                const frameIndex = 0;
                const spacing = sprite.spacing || 0;
                const srcX = frameIndex * (sprite.frameWidth + spacing);
                const srcY = 0;
                
                // Calculate scale to fit 18x30 canvas
                const scaleX = canvas.width / sprite.frameWidth;
                const scaleY = canvas.height / sprite.frameHeight;
                
                // Enable pixelated rendering for crisp pixels
                ctx.imageSmoothingEnabled = false;
                
                // Draw the sprite frame scaled to fit the canvas
                ctx.drawImage(
                    sprite.image,
                    srcX, srcY, sprite.frameWidth, sprite.frameHeight,
                    0, 0, canvas.width, canvas.height
                );
            } else {
                // Fallback: draw a colored rectangle if sprite not loaded
                ctx.fillStyle = getActionColor(spriteKey);
                ctx.fillRect(2, 2, canvas.width - 4, canvas.height - 4);
            }
        });
    }, 500);
}

// Helper function to get fallback colors for actions
function getActionColor(action) {
    const colors = {
        block: '#ff6600',
        bash: '#ffff00',
        dig: '#00ffff',
        build: '#ff00ff',
        climb: '#ffaa00',
        float: '#FFD700',
        mine: '#8B4513',
        walk: '#00ff00'
    };
    return colors[action] || '#00ff00';
}