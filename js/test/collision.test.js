// js/test/collision.test.js
describe('Collision Detection', function() {
    describe('PolygonUtils', function() {
        describe('Point in Polygon', function() {
            let square, triangle;
            
            beforeEach(function() {
                square = [
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                    { x: 100, y: 100 },
                    { x: 0, y: 100 }
                ];
                
                triangle = [
                    { x: 50, y: 0 },
                    { x: 100, y: 100 },
                    { x: 0, y: 100 }
                ];
            });

            it('should detect point inside square', function() {
                expect(PolygonUtils.pointInPolygon(50, 50, square)).to.be.true;
                expect(PolygonUtils.pointInPolygon(25, 75, square)).to.be.true;
            });

            it('should detect point outside square', function() {
                expect(PolygonUtils.pointInPolygon(150, 50, square)).to.be.false;
                expect(PolygonUtils.pointInPolygon(50, 150, square)).to.be.false;
                expect(PolygonUtils.pointInPolygon(-10, 50, square)).to.be.false;
            });

            it('should detect point inside triangle', function() {
                expect(PolygonUtils.pointInPolygon(50, 75, triangle)).to.be.true;
            });

            it('should detect point outside triangle', function() {
                expect(PolygonUtils.pointInPolygon(10, 10, triangle)).to.be.false;
                expect(PolygonUtils.pointInPolygon(90, 10, triangle)).to.be.false;
            });

            it('should handle edge cases', function() {
                // Point on edge - behavior can vary, but should not crash
                expect(() => PolygonUtils.pointInPolygon(0, 50, square)).to.not.throw();
                expect(() => PolygonUtils.pointInPolygon(50, 0, square)).to.not.throw();
            });

            it('should handle invalid polygons gracefully', function() {
                expect(PolygonUtils.pointInPolygon(50, 50, [])).to.be.false;
                expect(PolygonUtils.pointInPolygon(50, 50, null)).to.be.false;
                expect(PolygonUtils.pointInPolygon(50, 50, [{ x: 0, y: 0 }])).to.be.false;
            });
        });

        describe('Bounding Box Calculation', function() {
            it('should calculate correct bounding box for square', function() {
                const vertices = [
                    { x: 50, y: 25 },
                    { x: 150, y: 25 },
                    { x: 150, y: 125 },
                    { x: 50, y: 125 }
                ];
                
                const bbox = PolygonUtils.getBoundingBox(vertices);
                
                expect(bbox.minX).to.equal(50);
                expect(bbox.minY).to.equal(25);
                expect(bbox.maxX).to.equal(150);
                expect(bbox.maxY).to.equal(125);
            });

            it('should handle single point', function() {
                const vertices = [{ x: 100, y: 200 }];
                
                const bbox = PolygonUtils.getBoundingBox(vertices);
                
                expect(bbox.minX).to.equal(100);
                expect(bbox.minY).to.equal(200);
                expect(bbox.maxX).to.equal(100);
                expect(bbox.maxY).to.equal(200);
            });

            it('should handle empty array', function() {
                const bbox = PolygonUtils.getBoundingBox([]);
                
                expect(bbox.minX).to.equal(0);
                expect(bbox.minY).to.equal(0);
                expect(bbox.maxX).to.equal(0);
                expect(bbox.maxY).to.equal(0);
            });
        });

        describe('Area Calculation', function() {
            it('should calculate correct area for square', function() {
                const square = [
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                    { x: 100, y: 100 },
                    { x: 0, y: 100 }
                ];
                
                const area = PolygonUtils.calculateArea(square);
                
                expect(area).to.equal(10000);
            });

            it('should calculate correct area for triangle', function() {
                const triangle = [
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                    { x: 50, y: 100 }
                ];
                
                const area = PolygonUtils.calculateArea(triangle);
                
                expect(area).to.equal(5000);
            });

            it('should return positive area regardless of vertex order', function() {
                const clockwise = [
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                    { x: 100, y: 100 },
                    { x: 0, y: 100 }
                ];
                
                const counterclockwise = [
                    { x: 0, y: 0 },
                    { x: 0, y: 100 },
                    { x: 100, y: 100 },
                    { x: 100, y: 0 }
                ];
                
                const area1 = PolygonUtils.calculateArea(clockwise);
                const area2 = PolygonUtils.calculateArea(counterclockwise);
                
                expect(area1).to.equal(area2);
                expect(area1).to.be.greaterThan(0);
            });
        });

        describe('Rectangle Intersection', function() {
            let polygon;
            
            beforeEach(function() {
                polygon = [
                    { x: 100, y: 100 },
                    { x: 200, y: 100 },
                    { x: 200, y: 200 },
                    { x: 100, y: 200 }
                ];
            });

            it('should detect bounding box intersection', function() {
                const rect = { x: 150, y: 150, width: 50, height: 50 };
                
                const intersects = PolygonUtils.rectangleIntersectsBounds(rect, polygon);
                
                expect(intersects).to.be.true;
            });

            it('should detect no bounding box intersection', function() {
                const rect = { x: 50, y: 50, width: 25, height: 25 };
                
                const intersects = PolygonUtils.rectangleIntersectsBounds(rect, polygon);
                
                expect(intersects).to.be.false;
            });

            it('should detect rectangle-polygon intersection', function() {
                const rect = { x: 150, y: 150, width: 20, height: 20 };
                
                const intersects = PolygonUtils.rectangleIntersectsPolygon(rect, polygon);
                
                expect(intersects).to.be.true;
            });

            it('should detect no rectangle-polygon intersection', function() {
                const rect = { x: 50, y: 50, width: 20, height: 20 };
                
                const intersects = PolygonUtils.rectangleIntersectsPolygon(rect, polygon);
                
                expect(intersects).to.be.false;
            });

            it('should handle edge touching', function() {
                const rect = { x: 95, y: 150, width: 10, height: 20 };
                
                const intersects = PolygonUtils.rectangleIntersectsPolygon(rect, polygon);
                
                expect(intersects).to.be.true;
            });
        });

        describe('Polygon Utilities', function() {
            describe('Auto-closing', function() {
                it('should close open polygon', function() {
                    const open = [
                        { x: 0, y: 0 },
                        { x: 100, y: 0 },
                        { x: 100, y: 100 },
                        { x: 0, y: 100 }
                    ];
                    
                    const closed = PolygonUtils.autoClosePolygon(open);
                    
                    expect(closed).to.have.length(5);
                    expect(closed[4].x).to.equal(0);
                    expect(closed[4].y).to.equal(0);
                });

                it('should not modify already closed polygon', function() {
                    const closed = [
                        { x: 0, y: 0 },
                        { x: 100, y: 0 },
                        { x: 100, y: 100 },
                        { x: 0, y: 100 },
                        { x: 0, y: 0 }
                    ];
                    
                    const result = PolygonUtils.autoClosePolygon(closed);
                    
                    expect(result).to.have.length(5);
                });

                it('should handle nearly closed polygons', function() {
                    const nearlyClose = [
                        { x: 0, y: 0 },
                        { x: 100, y: 0 },
                        { x: 100, y: 100 },
                        { x: 0, y: 100 },
                        { x: 1, y: 1 } // Close but not exact
                    ];
                    
                    const result = PolygonUtils.autoClosePolygon(nearlyClose);
                    
                    expect(result).to.have.length(6); // Should add closing point
                });
            });

            describe('Polygon Simplification', function() {
                it('should simplify complex polygon', function() {
                    const complex = [
                        { x: 0, y: 0 },
                        { x: 10, y: 1 },
                        { x: 20, y: 0 },
                        { x: 30, y: 1 },
                        { x: 40, y: 0 },
                        { x: 100, y: 0 },
                        { x: 100, y: 100 },
                        { x: 0, y: 100 }
                    ];
                    
                    const simplified = PolygonUtils.simplifyPolygon(complex, 5);
                    
                    expect(simplified.length).to.be.lessThan(complex.length);
                });

                it('should preserve essential shape points', function() {
                    const simple = [
                        { x: 0, y: 0 },
                        { x: 100, y: 0 },
                        { x: 100, y: 100 }
                    ];
                    
                    const result = PolygonUtils.simplifyPolygon(simple, 5);
                    
                    expect(result).to.have.length(3); // Should not oversimplify
                });
            });

            describe('Distance Calculations', function() {
                it('should calculate perpendicular distance correctly', function() {
                    const point = { x: 50, y: 50 };
                    const lineStart = { x: 0, y: 0 };
                    const lineEnd = { x: 100, y: 0 };
                    
                    const distance = PolygonUtils.perpendicularDistance(point, lineStart, lineEnd);
                    
                    expect(distance).to.equal(50);
                });

                it('should handle point on line', function() {
                    const point = { x: 50, y: 0 };
                    const lineStart = { x: 0, y: 0 };
                    const lineEnd = { x: 100, y: 0 };
                    
                    const distance = PolygonUtils.perpendicularDistance(point, lineStart, lineEnd);
                    
                    expect(distance).to.be.closeTo(0, 0.001);
                });

                it('should handle zero-length line', function() {
                    const point = { x: 50, y: 50 };
                    const lineStart = { x: 0, y: 0 };
                    const lineEnd = { x: 0, y: 0 };
                    
                    const distance = PolygonUtils.perpendicularDistance(point, lineStart, lineEnd);
                    
                    expect(distance).to.be.closeTo(Math.sqrt(5000), 0.1);
                });
            });
        });
    });

    describe('Game Collision Integration', function() {
        let terrain, lemming;
        
        beforeEach(function() {
            terrain = new Terrain(800, 600);
            // Add ground
            terrain.ctx.fillStyle = '#8B4513';
            terrain.ctx.fillRect(0, 500, 800, 100);
            terrain.updateImageData();
            
            lemming = new Lemming(100, 480, 1.0);
        });

        it('should detect lemming-terrain collision', function() {
            lemming.y = 490; // On ground
            
            const hasGround = terrain.hasGround(lemming.x, lemming.y + lemming.getHeight());
            
            expect(hasGround).to.be.true;
        });

        it('should detect lemming walking off edge', function() {
            lemming.x = 400; // Over empty space
            lemming.y = 400; // Above ground level
            
            const hasGround = terrain.hasGround(lemming.x, lemming.y + lemming.getHeight());
            
            expect(hasGround).to.be.false;
        });

        it('should calculate obstacle height for lemming climbing', function() {
            // Create a step
            terrain.ctx.fillRect(200, 450, 50, 50);
            terrain.updateImageData();
            
            const obstacleHeight = terrain.getObstacleHeight(225, 450);
            
            expect(obstacleHeight).to.be.greaterThan(0);
            expect(obstacleHeight).to.be.at.most(CLIMB_HEIGHT + 1);
        });
    });
});