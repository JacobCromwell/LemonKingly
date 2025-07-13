// js/test/indestructibleTerrain.test.js
describe('Indestructible Terrain', function() {
    let terrainManager;
    
    beforeEach(function() {
        terrainManager = new IndestructibleTerrain();
    });

    describe('Initialization', function() {
        it('should initialize with empty shapes array', function() {
            expect(terrainManager.shapes).to.be.an('array');
            expect(terrainManager.shapes).to.have.length(0);
        });

        it('should have correct performance limits', function() {
            expect(terrainManager.limits.MAX_VERTICES_PER_SHAPE).to.equal(500);
            expect(terrainManager.limits.MAX_TOTAL_VERTICES).to.equal(2000);
            expect(terrainManager.limits.MAX_SHAPES_PER_LEVEL).to.equal(20);
        });
    });

    describe('Shape Management', function() {
        describe('Adding Shapes', function() {
            it('should add valid triangular shape', function() {
                const vertices = [
                    { x: 100, y: 100 },
                    { x: 200, y: 100 },
                    { x: 150, y: 200 }
                ];
                
                const shape = terrainManager.addShape(vertices);
                
                expect(shape).to.exist;
                expect(shape.id).to.be.a('string');
                expect(shape.vertices).to.have.length.at.least(3);
                expect(terrainManager.shapes).to.have.length(1);
            });

            it('should add valid rectangular shape', function() {
                const vertices = [
                    { x: 50, y: 50 },
                    { x: 150, y: 50 },
                    { x: 150, y: 150 },
                    { x: 50, y: 150 }
                ];
                
                const shape = terrainManager.addShape(vertices);
                
                expect(shape).to.exist;
                expect(shape.area).to.equal(10000); // 100x100 square
            });

            it('should reject invalid shapes', function() {
                // Too few vertices
                const invalidShape1 = [{ x: 0, y: 0 }, { x: 10, y: 0 }];
                expect(terrainManager.addShape(invalidShape1)).to.be.null;
                
                // Invalid vertex data
                const invalidShape2 = [{ x: 0 }, { y: 0 }, { x: 10, y: 10 }];
                expect(terrainManager.addShape(invalidShape2)).to.be.null;
                
                // Empty array
                expect(terrainManager.addShape([])).to.be.null;
                
                // Null input
                expect(terrainManager.addShape(null)).to.be.null;
            });

            it('should auto-close polygons', function() {
                const vertices = [
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                    { x: 100, y: 100 },
                    { x: 0, y: 100 }
                    // Note: missing closing vertex
                ];
                
                const shape = terrainManager.addShape(vertices);
                
                expect(shape).to.exist;
                expect(shape.vertices).to.have.length(5); // Auto-closed
            });
        });

        describe('Removing Shapes', function() {
            let shapeId;
            
            beforeEach(function() {
                const vertices = [
                    { x: 0, y: 0 },
                    { x: 50, y: 0 },
                    { x: 25, y: 50 }
                ];
                const shape = terrainManager.addShape(vertices);
                shapeId = shape.id;
            });

            it('should remove existing shape', function() {
                expect(terrainManager.shapes).to.have.length(1);
                
                const result = terrainManager.removeShape(shapeId);
                
                expect(result).to.be.true;
                expect(terrainManager.shapes).to.have.length(0);
            });

            it('should return false for non-existent shape', function() {
                const result = terrainManager.removeShape('non-existent-id');
                
                expect(result).to.be.false;
                expect(terrainManager.shapes).to.have.length(1);
            });
        });

        describe('Clearing Shapes', function() {
            beforeEach(function() {
                // Add multiple shapes
                for (let i = 0; i < 3; i++) {
                    const vertices = [
                        { x: i * 100, y: 0 },
                        { x: i * 100 + 50, y: 0 },
                        { x: i * 100 + 25, y: 50 }
                    ];
                    terrainManager.addShape(vertices);
                }
            });

            it('should clear all shapes', function() {
                expect(terrainManager.shapes).to.have.length(3);
                
                terrainManager.clearAllShapes();
                
                expect(terrainManager.shapes).to.have.length(0);
            });
        });
    });

    describe('Collision Detection', function() {
        beforeEach(function() {
            // Add a square shape for testing
            const vertices = [
                { x: 100, y: 100 },
                { x: 200, y: 100 },
                { x: 200, y: 200 },
                { x: 100, y: 200 }
            ];
            terrainManager.addShape(vertices);
        });

        describe('Rectangle Collision', function() {
            it('should detect collision with overlapping rectangle', function() {
                const lemmingBounds = {
                    x: 150, y: 150,
                    width: 20, height: 20
                };
                
                const hasCollision = terrainManager.checkCollision(lemmingBounds);
                
                expect(hasCollision).to.be.true;
            });

            it('should not detect collision with non-overlapping rectangle', function() {
                const lemmingBounds = {
                    x: 50, y: 50,
                    width: 20, height: 20
                };
                
                const hasCollision = terrainManager.checkCollision(lemmingBounds);
                
                expect(hasCollision).to.be.false;
            });

            it('should detect collision at shape edge', function() {
                const lemmingBounds = {
                    x: 95, y: 95,
                    width: 10, height: 10
                };
                
                const hasCollision = terrainManager.checkCollision(lemmingBounds);
                
                expect(hasCollision).to.be.true;
            });

            it('should not detect collision just outside shape', function() {
                const lemmingBounds = {
                    x: 80, y: 80,
                    width: 10, height: 10
                };
                
                const hasCollision = terrainManager.checkCollision(lemmingBounds);
                
                expect(hasCollision).to.be.false;
            });
        });

        describe('Performance Monitoring', function() {
            it('should record collision detection times', function() {
                const lemmingBounds = {
                    x: 150, y: 150,
                    width: 20, height: 20
                };
                
                // Perform collision check
                terrainManager.checkCollision(lemmingBounds);
                
                const stats = terrainManager.getPerformanceStats();
                expect(stats.lastFrameTime).to.be.a('number');
                expect(stats.frameCount).to.be.greaterThan(0);
            });

            it('should calculate performance statistics correctly', function() {
                // Perform multiple collision checks
                const lemmingBounds = {
                    x: 150, y: 150,
                    width: 20, height: 20
                };
                
                for (let i = 0; i < 10; i++) {
                    terrainManager.checkCollision(lemmingBounds);
                }
                
                const stats = terrainManager.getPerformanceStats();
                expect(stats.averageFrameTime).to.be.a('number');
                expect(stats.budgetUtilization).to.be.a('number');
                expect(stats.withinBudget).to.be.a('boolean');
            });
        });
    });

    describe('Intersecting Shapes', function() {
        beforeEach(function() {
            // Add two overlapping shapes
            const shape1 = [
                { x: 0, y: 0 },
                { x: 100, y: 0 },
                { x: 100, y: 100 },
                { x: 0, y: 100 }
            ];
            
            const shape2 = [
                { x: 50, y: 50 },
                { x: 150, y: 50 },
                { x: 150, y: 150 },
                { x: 50, y: 150 }
            ];
            
            terrainManager.addShape(shape1);
            terrainManager.addShape(shape2);
        });

        it('should find intersecting shapes', function() {
            const actionBounds = {
                x: 75, y: 75,
                width: 20, height: 20
            };
            
            const intersecting = terrainManager.getIntersectingShapes(actionBounds);
            
            expect(intersecting).to.have.length(2);
        });

        it('should find no intersecting shapes outside area', function() {
            const actionBounds = {
                x: 200, y: 200,
                width: 20, height: 20
            };
            
            const intersecting = terrainManager.getIntersectingShapes(actionBounds);
            
            expect(intersecting).to.have.length(0);
        });
    });

    describe('Serialization', function() {
        beforeEach(function() {
            // Add test shapes
            const vertices1 = [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
                { x: 25, y: 50 }
            ];
            
            const vertices2 = [
                { x: 100, y: 100 },
                { x: 200, y: 100 },
                { x: 200, y: 200 },
                { x: 100, y: 200 }
            ];
            
            terrainManager.addShape(vertices1, 'triangle');
            terrainManager.addShape(vertices2, 'square');
        });

        describe('Serialize', function() {
            it('should serialize shapes correctly', function() {
                const serialized = terrainManager.serialize();
                
                expect(serialized).to.have.property('shapes');
                expect(serialized).to.have.property('version');
                expect(serialized.shapes).to.have.length(2);
                expect(serialized.version).to.equal('1.0');
            });

            it('should include all shape data', function() {
                const serialized = terrainManager.serialize();
                const shape = serialized.shapes[0];
                
                expect(shape).to.have.property('id');
                expect(shape).to.have.property('vertices');
                expect(shape).to.have.property('created');
                expect(shape.vertices).to.be.an('array');
            });
        });

        describe('Deserialize', function() {
            it('should deserialize valid data correctly', function() {
                const serialized = terrainManager.serialize();
                const newManager = new IndestructibleTerrain();
                
                const result = newManager.deserialize(serialized);
                
                expect(result).to.be.true;
                expect(newManager.shapes).to.have.length(2);
            });

            it('should reject invalid serialized data', function() {
                const result1 = terrainManager.deserialize(null);
                const result2 = terrainManager.deserialize({});
                const result3 = terrainManager.deserialize({ shapes: 'invalid' });
                
                expect(result1).to.be.false;
                expect(result2).to.be.false;
                expect(result3).to.be.false;
            });

            it('should preserve shape properties after deserialization', function() {
                const originalStats = terrainManager.getPerformanceStats();
                const serialized = terrainManager.serialize();
                
                const newManager = new IndestructibleTerrain();
                newManager.deserialize(serialized);
                
                const newStats = newManager.getPerformanceStats();
                expect(newStats.totalShapes).to.equal(originalStats.totalShapes);
                expect(newStats.totalVertices).to.equal(originalStats.totalVertices);
            });
        });
    });

    describe('Validation', function() {
        describe('Shape Validation', function() {
            it('should validate correct triangular shape', function() {
                const vertices = [
                    { x: 0, y: 0 },
                    { x: 50, y: 0 },
                    { x: 25, y: 50 }
                ];
                
                const isValid = terrainManager.validateShape(vertices);
                
                expect(isValid).to.be.true;
            });

            it('should reject shapes with too few vertices', function() {
                const vertices = [
                    { x: 0, y: 0 },
                    { x: 50, y: 0 }
                ];
                
                const isValid = terrainManager.validateShape(vertices);
                
                expect(isValid).to.be.false;
            });

            it('should reject shapes with invalid vertex data', function() {
                const vertices = [
                    { x: 0, y: 0 },
                    { invalid: 'data' },
                    { x: 50, y: 50 }
                ];
                
                const isValid = terrainManager.validateShape(vertices);
                
                expect(isValid).to.be.false;
            });

            it('should reject degenerate shapes (too small area)', function() {
                const vertices = [
                    { x: 0, y: 0 },
                    { x: 1, y: 0 },
                    { x: 0.5, y: 1 }
                ];
                
                const isValid = terrainManager.validateShape(vertices);
                
                expect(isValid).to.be.false;
            });
        });
    });

    describe('Utility Methods', function() {
        beforeEach(function() {
            // Add shapes with known vertex counts
            const triangle = [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
                { x: 25, y: 50 }
            ];
            
            const square = [
                { x: 100, y: 100 },
                { x: 200, y: 100 },
                { x: 200, y: 200 },
                { x: 100, y: 200 }
            ];
            
            terrainManager.addShape(triangle);
            terrainManager.addShape(square);
        });

        it('should count total vertices correctly', function() {
            const totalVertices = terrainManager.getTotalVertices();
            
            // Triangle: 4 vertices (auto-closed), Square: 5 vertices (auto-closed)
            expect(totalVertices).to.equal(9);
        });

        it('should generate unique IDs', function() {
            const id1 = terrainManager.generateId();
            const id2 = terrainManager.generateId();
            
            expect(id1).to.be.a('string');
            expect(id2).to.be.a('string');
            expect(id1).to.not.equal(id2);
        });

        it('should get shape by ID', function() {
            const shapes = terrainManager.getAllShapes();
            const firstShapeId = shapes[0].id;
            
            const foundShape = terrainManager.getShapeById(firstShapeId);
            
            expect(foundShape).to.exist;
            expect(foundShape.id).to.equal(firstShapeId);
        });

        it('should return null for non-existent shape ID', function() {
            const foundShape = terrainManager.getShapeById('non-existent');
            
            expect(foundShape).to.be.null;
        });
    });
});