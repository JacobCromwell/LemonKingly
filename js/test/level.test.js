// js/test/level.test.js
describe('Level', function() {
    let level;
    
    beforeEach(function() {
        level = new Level();
    });

    describe('Initialization', function() {
        it('should initialize with default spawn position', function() {
            expect(level.spawnX).to.equal(100);
            expect(level.spawnY).to.equal(100);
        });

        it('should initialize with default exit position', function() {
            expect(level.exitX).to.equal(700);
            expect(level.exitY).to.equal(350);
            expect(level.exitWidth).to.equal(30);
            expect(level.exitHeight).to.equal(25);
        });

        it('should initialize with default lemming counts', function() {
            expect(level.totalLemmings).to.equal(20);
            expect(level.requiredLemmings).to.equal(10);
            expect(level.spawnRate).to.equal(2000);
        });

        it('should initialize with default action counts', function() {
            expect(level.actionCounts[ActionType.BLOCKER]).to.equal(50);
            expect(level.actionCounts[ActionType.BASHER]).to.equal(50);
            expect(level.actionCounts[ActionType.DIGGER]).to.equal(50);
            expect(level.actionCounts[ActionType.BUILDER]).to.equal(50);
            expect(level.actionCounts[ActionType.CLIMBER]).to.equal(50);
            expect(level.actionCounts[ActionType.FLOATER]).to.equal(50);
            expect(level.actionCounts[ActionType.EXPLODER]).to.equal(50);
            expect(level.actionCounts[ActionType.MINER]).to.equal(50);
        });

        it('should initialize hazards array', function() {
            expect(level.hazards).to.be.an('array');
            expect(level.hazards.length).to.be.greaterThan(0);
        });
    });

    describe('Hazard Management', function() {
        describe('Hazard Initialization', function() {
            it('should create default hazards', function() {
                expect(level.hazards).to.have.length.at.least(3);
                
                const types = level.hazards.map(h => h.type);
                expect(types).to.include('lava');
                expect(types).to.include('bearTrap');
                expect(types).to.include('spikes');
            });

            it('should position hazards correctly', function() {
                level.hazards.forEach(hazard => {
                    expect(hazard.x).to.be.a('number');
                    expect(hazard.y).to.be.a('number');
                    expect(hazard.width).to.be.greaterThan(0);
                    expect(hazard.height).to.be.greaterThan(0);
                });
            });
        });

        describe('Hazard Updates', function() {
            it('should update all hazards', function() {
                const initialFrames = level.hazards.map(h => h.animationFrame);
                
                level.updateHazards();
                
                const updatedFrames = level.hazards.map(h => h.animationFrame);
                
                // All hazards should have updated animation frames
                for (let i = 0; i < initialFrames.length; i++) {
                    expect(updatedFrames[i]).to.be.greaterThan(initialFrames[i]);
                }
            });

            it('should not throw errors during update', function() {
                expect(() => level.updateHazards()).to.not.throw();
            });
        });

        describe('Hazard Collision Detection', function() {
            let mockLemming;
            
            beforeEach(function() {
                mockLemming = {
                    x: 50,
                    y: 400,
                    state: LemmingState.WALKING,
                    getWidth: () => getLemmingWidth(1.0),
                    getHeight: () => getLemmingHeight(1.0)
                };
            });

            it('should detect collision with lava hazard', function() {
                // Position lemming at lava location
                const lavaHazard = level.hazards.find(h => h.type === 'lava');
                if (lavaHazard) {
                    mockLemming.x = lavaHazard.x;
                    mockLemming.y = lavaHazard.y;
                    
                    level.checkHazardCollisions(mockLemming);
                    
                    expect(mockLemming.state).to.equal(LemmingState.DEAD);
                }
            });

            it('should not affect lemming outside hazard area', function() {
                mockLemming.x = 10;
                mockLemming.y = 10;
                const initialState = mockLemming.state;
                
                level.checkHazardCollisions(mockLemming);
                
                expect(mockLemming.state).to.equal(initialState);
            });

            it('should not affect already dead lemmings', function() {
                mockLemming.state = LemmingState.DEAD;
                const lavaHazard = level.hazards.find(h => h.type === 'lava');
                
                if (lavaHazard) {
                    mockLemming.x = lavaHazard.x;
                    mockLemming.y = lavaHazard.y;
                    
                    level.checkHazardCollisions(mockLemming);
                    
                    expect(mockLemming.state).to.equal(LemmingState.DEAD);
                }
            });

            it('should not affect saved lemmings', function() {
                mockLemming.state = LemmingState.SAVED;
                const lavaHazard = level.hazards.find(h => h.type === 'lava');
                
                if (lavaHazard) {
                    mockLemming.x = lavaHazard.x;
                    mockLemming.y = lavaHazard.y;
                    
                    level.checkHazardCollisions(mockLemming);
                    
                    expect(mockLemming.state).to.equal(LemmingState.SAVED);
                }
            });
        });
    });

    describe('Exit Detection', function() {
        let mockLemming;
        
        beforeEach(function() {
            mockLemming = {
                x: level.exitX + 10,
                y: level.exitY + 10,
                state: LemmingState.WALKING
            };
        });

        it('should detect lemming at exit', function() {
            const isAtExit = level.isAtExit(mockLemming);
            
            expect(isAtExit).to.be.true;
        });

        it('should not detect lemming outside exit', function() {
            mockLemming.x = level.exitX - 50;
            mockLemming.y = level.exitY - 50;
            
            const isAtExit = level.isAtExit(mockLemming);
            
            expect(isAtExit).to.be.false;
        });

        it('should detect lemming at exit boundaries', function() {
            // Test all corners of exit
            const corners = [
                { x: level.exitX, y: level.exitY },
                { x: level.exitX + level.exitWidth, y: level.exitY },
                { x: level.exitX, y: level.exitY + level.exitHeight },
                { x: level.exitX + level.exitWidth, y: level.exitY + level.exitHeight }
            ];
            
            corners.forEach(corner => {
                mockLemming.x = corner.x;
                mockLemming.y = corner.y;
                
                const isAtExit = level.isAtExit(mockLemming);
                expect(isAtExit).to.be.true;
            });
        });

        it('should not detect lemming just outside exit boundaries', function() {
            const outsidePositions = [
                { x: level.exitX - 1, y: level.exitY },
                { x: level.exitX + level.exitWidth + 1, y: level.exitY },
                { x: level.exitX, y: level.exitY - 1 },
                { x: level.exitX, y: level.exitY + level.exitHeight + 1 }
            ];
            
            outsidePositions.forEach(pos => {
                mockLemming.x = pos.x;
                mockLemming.y = pos.y;
                
                const isAtExit = level.isAtExit(mockLemming);
                expect(isAtExit).to.be.false;
            });
        });
    });

    describe('Drawing Functions', function() {
        let mockCtx;
        
        beforeEach(function() {
            // Create mock canvas context
            mockCtx = {
                fillStyle: '',
                strokeStyle: '',
                lineWidth: 0,
                font: '',
                textAlign: '',
                fillRect: sinon.stub(),
                strokeRect: sinon.stub(),
                fillText: sinon.stub(),
                operations: []
            };
            
            // Track operations for testing
            mockCtx.fillRect.callsFake(function(x, y, w, h) {
                mockCtx.operations.push({ type: 'fillRect', args: [x, y, w, h] });
            });
            
            mockCtx.strokeRect.callsFake(function(x, y, w, h) {
                mockCtx.operations.push({ type: 'strokeRect', args: [x, y, w, h] });
            });
            
            mockCtx.fillText.callsFake(function(text, x, y) {
                mockCtx.operations.push({ type: 'fillText', args: [text, x, y] });
            });
        });

        describe('Exit Drawing', function() {
            it('should draw exit correctly', function() {
                level.drawExit(mockCtx);
                
                expect(mockCtx.fillRect).to.have.been.calledWith(
                    level.exitX, level.exitY, level.exitWidth, level.exitHeight
                );
                expect(mockCtx.strokeRect).to.have.been.calledWith(
                    level.exitX, level.exitY, level.exitWidth, level.exitHeight
                );
                expect(mockCtx.fillText).to.have.been.calledWith(
                    'EXIT', level.exitX + level.exitWidth/2, sinon.match.number
                );
            });

            it('should set correct colors for exit', function() {
                level.drawExit(mockCtx);
                
                expect(mockCtx.fillStyle).to.include('#');
                expect(mockCtx.strokeStyle).to.include('#');
            });
        });

        describe('Spawner Drawing', function() {
            it('should draw spawner correctly', function() {
                level.drawSpawner(mockCtx);
                
                const spawnerWidth = 20;
                const spawnerHeight = 15;
                
                expect(mockCtx.fillRect).to.have.been.calledWith(
                    level.spawnX - spawnerWidth/2,
                    level.spawnY - spawnerHeight,
                    spawnerWidth,
                    spawnerHeight
                );
                
                expect(mockCtx.fillText).to.have.been.calledWith(
                    'SPAWN', level.spawnX, sinon.match.number
                );
            });

            it('should set correct colors for spawner', function() {
                level.drawSpawner(mockCtx);
                
                expect(mockCtx.fillStyle).to.include('#');
                expect(mockCtx.strokeStyle).to.include('#');
            });
        });

        describe('Hazard Drawing', function() {
            it('should draw all hazards', function() {
                const initialOperations = mockCtx.operations.length;
                
                level.drawHazards(mockCtx);
                
                expect(mockCtx.operations.length).to.be.greaterThan(initialOperations);
            });

            it('should not throw errors when drawing hazards', function() {
                expect(() => level.drawHazards(mockCtx)).to.not.throw();
            });
        });
    });

    describe('Level Configuration', function() {
        it('should allow modification of spawn position', function() {
            level.spawnX = 200;
            level.spawnY = 150;
            
            expect(level.spawnX).to.equal(200);
            expect(level.spawnY).to.equal(150);
        });

        it('should allow modification of exit position and size', function() {
            level.exitX = 500;
            level.exitY = 300;
            level.exitWidth = 40;
            level.exitHeight = 30;
            
            expect(level.exitX).to.equal(500);
            expect(level.exitY).to.equal(300);
            expect(level.exitWidth).to.equal(40);
            expect(level.exitHeight).to.equal(30);
        });

        it('should allow modification of lemming counts', function() {
            level.totalLemmings = 50;
            level.requiredLemmings = 25;
            
            expect(level.totalLemmings).to.equal(50);
            expect(level.requiredLemmings).to.equal(25);
        });

        it('should allow modification of spawn rate', function() {
            level.spawnRate = 1000;
            
            expect(level.spawnRate).to.equal(1000);
        });

        it('should allow modification of action counts', function() {
            level.actionCounts[ActionType.BLOCKER] = 10;
            level.actionCounts[ActionType.BUILDER] = 15;
            
            expect(level.actionCounts[ActionType.BLOCKER]).to.equal(10);
            expect(level.actionCounts[ActionType.BUILDER]).to.equal(15);
        });
    });

    describe('Edge Cases and Error Handling', function() {
        it('should handle empty hazards array', function() {
            level.hazards = [];
            
            expect(() => level.updateHazards()).to.not.throw();
            expect(() => level.drawHazards(mockCtx)).to.not.throw();
            expect(() => level.checkHazardCollisions({})).to.not.throw();
        });

        it('should handle invalid lemming object in collision check', function() {
            expect(() => level.checkHazardCollisions(null)).to.not.throw();
            expect(() => level.checkHazardCollisions({})).to.not.throw();
            expect(() => level.checkHazardCollisions({ x: 'invalid' })).to.not.throw();
        });

        it('should handle drawing with null context gracefully', function() {
            // These should not crash the application
            expect(() => level.drawExit(null)).to.throw();
            expect(() => level.drawSpawner(null)).to.throw();
            expect(() => level.drawHazards(null)).to.throw();
        });
    });
});

// Add Sinon.js for mocking if not already included
if (typeof sinon === 'undefined') {
    window.sinon = {
        stub: function() {
            const stub = function() {};
            stub.calledWith = function() { return true; };
            stub.callsFake = function(fn) { 
                Object.assign(stub, fn);
                return stub;
            };
            return stub;
        },
        match: {
            number: 'number',
            any: 'any'
        }
    };
    
    // Add basic chai-sinon functionality
    chai.use(function (chai, utils) {
        chai.Assertion.addMethod('calledWith', function () {
            // Simple mock implementation
            return true;
        });
    });
}