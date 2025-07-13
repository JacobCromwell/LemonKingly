// js/test/terrain.test.js
describe('Terrain', function() {
    let terrain;

    beforeEach(function() {
        terrain = new Terrain(800, 600);
    });

    describe('Initialization', function() {
        it('should create terrain with correct dimensions', function() {
            expect(terrain.width).to.equal(800);
            expect(terrain.height).to.equal(600);
        });

        it('should have a valid canvas context', function() {
            expect(terrain.canvas).to.exist;
            expect(terrain.ctx).to.exist;
            expect(terrain.canvas.width).to.equal(800);
            expect(terrain.canvas.height).to.equal(600);
        });

        it('should initialize image data', function() {
            expect(terrain.imageData).to.exist;
            expect(terrain.imageData.width).to.equal(800);
            expect(terrain.imageData.height).to.equal(600);
        });
    });

    describe('Collision Detection', function() {
        beforeEach(function() {
            // Add some test terrain
            terrain.ctx.fillStyle = '#8B4513';
            terrain.ctx.fillRect(100, 400, 200, 100);
            terrain.updateImageData();
        });

        it('should detect ground correctly', function() {
            // Test point on terrain
            expect(terrain.hasGround(150, 450)).to.be.true;
            
            // Test point not on terrain
            expect(terrain.hasGround(50, 450)).to.be.false;
            
            // Test point in air
            expect(terrain.hasGround(150, 350)).to.be.false;
        });

        it('should treat boundaries as solid', function() {
            expect(terrain.hasGround(-1, 300)).to.be.true;
            expect(terrain.hasGround(801, 300)).to.be.true;
            expect(terrain.hasGround(400, -1)).to.be.true;
            expect(terrain.hasGround(400, 601)).to.be.true;
        });

        it('should calculate obstacle height correctly', function() {
            // Create a small step
            terrain.ctx.fillRect(300, 390, 50, 10);
            terrain.updateImageData();
            
            const height = terrain.getObstacleHeight(325, 350);
            expect(height).to.be.at.most(CLIMB_HEIGHT + 1);
        });
    });

    describe('Terrain Modification', function() {
        beforeEach(function() {
            // Add initial terrain
            terrain.ctx.fillStyle = '#8B4513';
            terrain.ctx.fillRect(100, 400, 200, 100);
            terrain.updateImageData();
        });

        it('should remove terrain correctly', function() {
            // Verify terrain exists
            expect(terrain.hasGround(150, 450)).to.be.true;
            
            // Remove terrain
            terrain.removeTerrain(140, 440, 20, 20);
            
            // Verify terrain was removed
            expect(terrain.hasGround(150, 450)).to.be.false;
        });

        it('should add terrain correctly', function() {
            // Verify no terrain exists at location
            expect(terrain.hasGround(400, 300)).to.be.false;
            
            // Add terrain
            terrain.addTerrain(390, 290, 20, 20);
            
            // Verify terrain was added
            expect(terrain.hasGround(400, 300)).to.be.true;
        });

        it('should return terrain color when removing', function() {
            const color = terrain.removeTerrain(150, 450, 10, 10);
            expect(color).to.be.a('string');
            expect(color).to.include('rgb');
        });
    });

    describe('Performance', function() {
        it('should handle collision grid efficiently', function() {
            // Add complex terrain
            for (let i = 0; i < 50; i++) {
                terrain.ctx.fillRect(i * 15, 400 + i * 2, 10, 20);
            }
            terrain.updateImageData();
            
            // Test many collision checks
            const startTime = performance.now();
            for (let i = 0; i < 1000; i++) {
                terrain.hasGround(Math.random() * 800, Math.random() * 600);
            }
            const endTime = performance.now();
            
            // Should complete quickly (under 50ms for 1000 checks)
            expect(endTime - startTime).to.be.below(50);
        });
    });

    describe('Edge Cases', function() {
        it('should handle pixel removal at boundaries gracefully', function() {
            // Should not throw errors
            expect(() => terrain.removeTerrainPixel(-1, -1)).to.not.throw();
            expect(() => terrain.removeTerrainPixel(800, 600)).to.not.throw();
        });

        it('should handle empty terrain', function() {
            const emptyTerrain = new Terrain(100, 100);
            expect(emptyTerrain.hasGround(50, 50)).to.be.false;
            expect(emptyTerrain.getObstacleHeight(50, 50)).to.equal(0);
        });
    });
});