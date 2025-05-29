// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    window.game = game;  // Make game accessible globally for particles
});