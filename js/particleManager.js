// Centralized Particle Management System
class ParticleManager {
    constructor() {
        this.particles = [];
        this.particlePool = [];
        this.maxPoolSize = 200;
    }
    
    /**
     * Get or create a particle from the pool
     */
    getParticle(x, y, color, vx, vy) {
        let particle;
        
        if (this.particlePool.length > 0) {
            particle = this.particlePool.pop();
            particle.reset(x, y, color, vx, vy);
        } else {
            particle = new Particle(x, y, color, vx, vy);
        }
        
        this.particles.push(particle);
        return particle;
    }
    
    /**
     * Update all particles and recycle dead ones
     */
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();
            
            if (particle.isDead()) {
                this.particles.splice(i, 1);
                if (this.particlePool.length < this.maxPoolSize) {
                    this.particlePool.push(particle);
                }
            }
        }
    }
    
    /**
     * Draw all particles
     */
    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }
    
    /**
     * Create death particles for a lemming
     */
    createDeathParticles(x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * 3 + 1;
            this.getParticle(
                x, y,
                '#ff0000',
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 2
            );
        }
    }
    
    /**
     * Create explosion particles
     */
    createExplosionParticles(x, y) {
        const colors = ['#00ff00', '#ff0000', '#ffffff', '#0000ff'];
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
            const speed = Math.random() * 3 + 2;
            const color = colors[i % colors.length];
            
            this.getParticle(x, y, color,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 2
            );
        }
    }
    
    /**
     * Create terrain destruction particles
     */
    createTerrainParticles(x, y, width, height, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.getParticle(
                x + Math.random() * width - width / 2,
                y + Math.random() * height,
                color,
                Math.random() * 2 - 1,
                Math.random() * 2 - 3
            );
        }
    }
    
    /**
     * Create lava death particles
     */
    createLavaParticles(x, y) {
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            const color = i < 15 ? '#ff6600' : '#333333'; // Orange fire and grey ash
            
            this.getParticle(x, y, color,
                Math.cos(angle) * speed * 0.5,
                -Math.abs(Math.sin(angle) * speed) - 2
            );
        }
    }
    
    /**
     * Create trap death particles
     */
    createTrapParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI - Math.PI/2; // Upward arc
            const speed = Math.random() * 3 + 2;
            this.getParticle(x, y, '#cc0000',
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
        }
    }
    
    /**
     * Create spike death particles
     */
    createSpikeParticles(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            this.getParticle(x, y, '#990000',
                Math.cos(angle) * speed * 0.3,
                Math.abs(Math.sin(angle) * speed)
            );
        }
    }
    
    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
    }
    
    /**
     * Get particle count for debugging
     */
    getStats() {
        return {
            active: this.particles.length,
            pooled: this.particlePool.length,
            total: this.particles.length + this.particlePool.length
        };
    }
}

// Create global particle manager instance
window.particleManager = new ParticleManager();