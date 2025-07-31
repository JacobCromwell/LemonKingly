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
});