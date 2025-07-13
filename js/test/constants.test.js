// js/test/constants.test.js
describe('Constants', function() {
    describe('Basic Game Constants', function() {
        it('should have correct lemming dimensions at base zoom', function() {
            expect(LEMMING_BASE_HEIGHT).to.equal(10);
            expect(LEMMING_BASE_WIDTH).to.equal(6);
            expect(LEMMING_BASE_ZOOM).to.equal(2.8);
        });

        it('should have correct physics constants', function() {
            expect(MAX_FALL_HEIGHT).to.equal(60);
            expect(CLIMB_HEIGHT).to.equal(10);
            expect(GRAVITY).to.equal(2);
            expect(WALK_SPEED).to.equal(1);
        });

        it('should have correct building constants', function() {
            expect(BUILD_TILE_WIDTH).to.equal(4);
            expect(BUILD_TILE_HEIGHT).to.equal(2);
            expect(MAX_BUILD_TILES).to.equal(12);
        });

        it('should have correct miner constants', function() {
            expect(MINER_SWING_DURATION).to.equal(60);
            expect(MINER_ANGLE).to.equal(35);
            expect(MINER_PROGRESS_PER_SWING).to.equal(2);
        });
    });

    describe('Dynamic Lemming Size Functions', function() {
        it('should calculate correct lemming width at various zoom levels', function() {
            expect(getLemmingWidth(1.0)).to.be.closeTo(2.14, 0.1);
            expect(getLemmingWidth(2.8)).to.be.closeTo(6, 0.01); // Base zoom
            expect(getLemmingWidth(5.6)).to.be.closeTo(12, 0.01); // Double base zoom
        });

        it('should calculate correct lemming height at various zoom levels', function() {
            expect(getLemmingHeight(1.0)).to.be.closeTo(3.57, 0.1);
            expect(getLemmingHeight(2.8)).to.be.closeTo(10, 0.01); // Base zoom
            expect(getLemmingHeight(5.6)).to.be.closeTo(20, 0.01); // Double base zoom
        });

        it('should maintain aspect ratio across zoom levels', function() {
            const zoom1 = 1.5;
            const zoom2 = 3.0;
            
            const ratio1 = getLemmingWidth(zoom1) / getLemmingHeight(zoom1);
            const ratio2 = getLemmingWidth(zoom2) / getLemmingHeight(zoom2);
            
            expect(ratio1).to.be.closeTo(ratio2, 0.01);
        });
    });

    describe('Action Types', function() {
        it('should define all required action types', function() {
            expect(ActionType.NONE).to.equal('none');
            expect(ActionType.BLOCKER).to.equal('blocker');
            expect(ActionType.BASHER).to.equal('basher');
            expect(ActionType.DIGGER).to.equal('digger');
            expect(ActionType.BUILDER).to.equal('builder');
            expect(ActionType.CLIMBER).to.equal('climber');
            expect(ActionType.FLOATER).to.equal('floater');
            expect(ActionType.EXPLODER).to.equal('exploder');
            expect(ActionType.MINER).to.equal('miner');
            expect(ActionType.NUKE).to.equal('nuke');
        });
    });

    describe('Lemming States', function() {
        it('should define all required lemming states', function() {
            expect(LemmingState.WALKING).to.equal('walking');
            expect(LemmingState.FALLING).to.equal('falling');
            expect(LemmingState.BLOCKING).to.equal('blocking');
            expect(LemmingState.BASHING).to.equal('bashing');
            expect(LemmingState.DIGGING).to.equal('digging');
            expect(LemmingState.BUILDING).to.equal('building');
            expect(LemmingState.CLIMBING).to.equal('climbing');
            expect(LemmingState.EXPLODING).to.equal('exploding');
            expect(LemmingState.MINING).to.equal('mining');
            expect(LemmingState.DEAD).to.equal('dead');
            expect(LemmingState.SAVED).to.equal('saved');
        });
    });
});