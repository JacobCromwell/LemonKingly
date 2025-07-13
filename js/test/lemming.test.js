// js/test/lemming.test.js
describe('Lemming', function() {
    let lemming;
    let terrain;
    
    beforeEach(function() {
        terrain = new Terrain(800, 600);
        // Add ground
        terrain.ctx.fillStyle = '#8B4513';
        terrain.ctx.fillRect(0, 500, 800, 100);
        terrain.updateImageData();
        
        lemming = new Lemming(100, 480, 1.0);
    });

    describe('Initialization', function() {
        it('should create lemming with correct initial properties', function() {
            expect(lemming.x).to.equal(100);
            expect(lemming.y).to.equal(480);
            expect(lemming.direction).to.equal(1);
            expect(lemming.state).to.equal(LemmingState.FALLING);
            expect(lemming.zoom).to.equal(1.0);
        });

        it('should calculate correct dimensions based on zoom', function() {
            const lemming2x = new Lemming(100, 480, 2.0);
            
            expect(lemming2x.getWidth()).to.be.greaterThan(lemming.getWidth());
            expect(lemming2x.getHeight()).to.be.greaterThan(lemming.getHeight());
        });
    });

    describe('Movement', function() {
        beforeEach(function() {
            // Place lemming on ground
            lemming.state = LemmingState.WALKING;
            lemming.y = 490; // On the ground
        });

        it('should walk in the correct direction', function() {
            const initialX = lemming.x;
            lemming.update(terrain, []);
            
            expect(lemming.x).to.be.greaterThan(initialX);
            expect(lemming.state).to.equal(LemmingState.WALKING);
        });

        it('should turn around when hitting an obstacle', function() {
            // Create a wall
            terrain.ctx.fillRect(150, 400, 50, 100);
            terrain.updateImageData();
            
            lemming.x = 120; // Close to wall
            const initialDirection = lemming.direction;
            
            // Update multiple times to hit the wall
            for (let i = 0; i < 50; i++) {
                lemming.update(terrain, []);
                if (lemming.direction !== initialDirection) break;
            }
            
            expect(lemming.direction).to.equal(-initialDirection);
        });

        it('should fall when there is no ground', function() {
            lemming.x = 400; // Over empty space
            lemming.y = 300;
            lemming.state = LemmingState.WALKING;
            
            lemming.update(terrain, []);
            
            expect(lemming.state).to.equal(LemmingState.FALLING);
        });
    });

    describe('Falling', function() {
        beforeEach(function() {
            lemming.state = LemmingState.FALLING;
            lemming.y = 300;
        });

        it('should fall due to gravity', function() {
            const initialY = lemming.y;
            lemming.update(terrain, []);
            
            expect(lemming.y).to.be.greaterThan(initialY);
            expect(lemming.fallDistance).to.be.greaterThan(0);
        });

        it('should land when hitting ground', function() {
            // Position just above ground
            lemming.y = 485;
            lemming.fallDistance = 10;
            
            lemming.update(terrain, []);
            
            expect(lemming.state).to.equal(LemmingState.WALKING);
            expect(lemming.fallDistance).to.equal(0);
        });

        it('should die from excessive fall damage', function() {
            lemming.fallDistance = MAX_FALL_HEIGHT + 10;
            lemming.y = 485; // About to land
            
            lemming.update(terrain, []);
            
            expect(lemming.state).to.equal(LemmingState.DEAD);
        });

        it('should not die from fall damage if floater', function() {
            lemming.isFloater = true;
            lemming.fallDistance = MAX_FALL_HEIGHT + 10;
            lemming.y = 485;
            
            lemming.update(terrain, []);
            
            expect(lemming.state).to.equal(LemmingState.WALKING);
        });
    });

    describe('Actions', function() {
        beforeEach(function() {
            lemming.state = LemmingState.WALKING;
        });

        it('should apply blocker action correctly', function() {
            const result = lemming.applyAction(ActionType.BLOCKER);
            
            expect(result).to.be.true;
            expect(lemming.state).to.equal(LemmingState.BLOCKING);
        });

        it('should apply climber ability correctly', function() {
            expect(lemming.isClimber).to.be.false;
            
            const result = lemming.applyAction(ActionType.CLIMBER);
            
            expect(result).to.be.true;
            expect(lemming.isClimber).to.be.true;
        });

        it('should apply floater ability correctly', function() {
            expect(lemming.isFloater).to.be.false;
            
            const result = lemming.applyAction(ActionType.FLOATER);
            
            expect(result).to.be.true;
            expect(lemming.isFloater).to.be.true;
        });

        it('should not apply duplicate abilities', function() {
            lemming.isClimber = true;
            
            expect(lemming.hasAbility(ActionType.CLIMBER)).to.be.true;
        });

        it('should handle explosion timer correctly', function() {
            lemming.applyAction(ActionType.EXPLODER);
            
            expect(lemming.explosionTimer).to.be.greaterThan(0);
            expect(lemming.state).to.equal(LemmingState.EXPLODING);
        });
    });

    describe('Special Abilities', function() {
        describe('Climbing', function() {
            beforeEach(function() {
                lemming.isClimber = true;
                lemming.state = LemmingState.WALKING;
                
                // Create a wall to climb
                terrain.ctx.fillRect(200, 400, 20, 100);
                terrain.updateImageData();
            });

            it('should start climbing when hitting a tall obstacle', function() {
                lemming.x = 180;
                
                // Move towards wall
                for (let i = 0; i < 30; i++) {
                    lemming.update(terrain, []);
                    if (lemming.state === LemmingState.CLIMBING) break;
                }
                
                expect(lemming.state).to.equal(LemmingState.CLIMBING);
            });
        });

        describe('Building', function() {
            beforeEach(function() {
                lemming.state = LemmingState.BUILDING;
                lemming.buildTilesPlaced = 0;
            });

            it('should place build tiles correctly', function() {
                const initialTiles = lemming.buildTilesPlaced;
                
                // Simulate building updates
                for (let i = 0; i < 5; i++) {
                    lemming.update(terrain, []);
                }
                
                expect(lemming.buildTilesPlaced).to.be.greaterThan(initialTiles);
            });

            it('should stop building after max tiles', function() {
                lemming.buildTilesPlaced = MAX_BUILD_TILES - 1;
                
                lemming.update(terrain, []);
                
                expect(lemming.state).to.equal(LemmingState.WALKING);
            });
        });
    });

    describe('Zoom Handling', function() {
        it('should update zoom correctly', function() {
            expect(lemming.zoom).to.equal(1.0);
            
            lemming.updateZoom(2.0);
            
            expect(lemming.zoom).to.equal(2.0);
            expect(lemming.getWidth()).to.be.greaterThan(lemming.getHeight() * 0.5);
        });
    });

    describe('Death and Saving', function() {
        it('should not update when dead', function() {
            lemming.state = LemmingState.DEAD;
            const initialX = lemming.x;
            
            lemming.update(terrain, []);
            
            expect(lemming.x).to.equal(initialX);
        });

        it('should not update when saved', function() {
            lemming.state = LemmingState.SAVED;
            const initialX = lemming.x;
            
            lemming.update(terrain, []);
            
            expect(lemming.x).to.equal(initialX);
        });

        it('should die when falling out of bounds', function() {
            lemming.y = terrain.height + 100;
            
            lemming.update(terrain, []);
            
            expect(lemming.state).to.equal(LemmingState.DEAD);
        });
    });
});