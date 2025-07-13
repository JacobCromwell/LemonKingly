# 🧪 Lemmings Clone Test Suite

A comprehensive testing framework for the Lemmings Clone game using **Mocha + Chai** for browser-based testing.

## 🎯 Why Mocha + Chai?

**Perfect fit for your project because:**
- ✅ **No build system required** - Works directly in browser
- ✅ **Excellent game testing** - Great for testing physics, AI, collision detection
- ✅ **Flexible** - Supports both unit and integration testing
- ✅ **Clear reporting** - Beautiful test results and failure messages
- ✅ **CDN-based** - Consistent with your current no-npm approach

## 🏗️ Framework Setup

### Core Components
- **Mocha** - Test framework with BDD interface (`describe`, `it`, `beforeEach`)
- **Chai** - Assertion library with expressive syntax (`expect().to.equal()`)
- **Browser-friendly** - All tests run in the browser environment

### File Structure
```
js/test/
├── index.html              # Main test runner page
├── constants.test.js        # Game constants and configuration tests
├── terrain.test.js          # Terrain system and collision tests
├── lemming.test.js          # Lemming AI and behavior tests
├── collision.test.js        # Advanced collision detection tests
├── level.test.js            # Level management and hazard tests
├── indestructibleTerrain.test.js  # Indestructible terrain tests
└── README.md               # This file
```

## 🚀 Running Tests

### Option 1: Open Test Runner
1. Open `js/test/index.html` in your browser
2. Click "Run All Tests" to execute the full suite
3. Click "Run Specific Suite" to test individual modules

### Option 2: Command Line (Optional)
If you want to add npm later for automation:
```bash
npm install mocha chai puppeteer --save-dev
# Then create npm scripts for headless testing
```

## 📊 Test Coverage

### ✅ Currently Tested
- **Constants** - Game physics, dimensions, action types
- **Terrain** - Collision detection, terrain modification, performance
- **Lemming** - Movement, abilities, state management, zoom handling
- **Collision** - Polygon utilities, rectangle intersection, point-in-polygon
- **Level** - Hazard management, exit detection, drawing functions
- **Indestructible Terrain** - Shape management, serialization, performance

### 🔄 Planned Test Areas
- **Audio Manager** - Sound effects, volume control, music loading
- **Game Loop** - Frame rate, update cycles, state transitions
- **Level Editor** - Tool functionality, save/load, UI interactions
- **Particle System** - Particle creation, physics, cleanup
- **Integration** - Full gameplay scenarios, level completion

## 🎮 Game-Specific Testing Features

### Mock Game Environment
```javascript
// Automatically creates mock canvas, audio manager, DOM elements
window.mockGameEnvironment();
```

### Lemming Behavior Testing
```javascript
it('should turn around when hitting obstacle', function() {
    // Create wall, move lemming, verify direction change
    terrain.ctx.fillRect(150, 400, 50, 100);
    lemming.x = 120;
    
    // Test collision and direction change
    for (let i = 0; i < 50; i++) {
        lemming.update(terrain, []);
        if (lemming.direction !== initialDirection) break;
    }
    
    expect(lemming.direction).to.equal(-initialDirection);
});
```

### Physics and Collision Testing
```javascript
it('should detect indestructible terrain collision', function() {
    const vertices = [
        { x: 100, y: 100 }, { x: 200, y: 100 },
        { x: 200, y: 200 }, { x: 100, y: 200 }
    ];
    terrainManager.addShape(vertices);
    
    const lemmingBounds = { x: 150, y: 150, width: 20, height: 20 };
    expect(terrainManager.checkCollision(lemmingBounds)).to.be.true;
});
```

### Performance Testing
```javascript
it('should handle collision detection efficiently', function() {
    const startTime = performance.now();
    for (let i = 0; i < 1000; i++) {
        terrain.hasGround(Math.random() * 800, Math.random() * 600);
    }
    const endTime = performance.now();
    
    expect(endTime - startTime).to.be.below(50); // Under 50ms
});
```

## 📝 Writing New Tests

### Basic Test Structure
```javascript
describe('Feature Name', function() {
    let objectUnderTest;
    
    beforeEach(function() {
        // Setup before each test
        objectUnderTest = new FeatureClass();
    });
    
    describe('Sub-feature', function() {
        it('should do something specific', function() {
            // Arrange
            const input = 'test input';
            
            // Act
            const result = objectUnderTest.method(input);
            
            // Assert
            expect(result).to.equal('expected output');
        });
    });
});
```

### Common Assertions
```javascript
// Equality
expect(actual).to.equal(expected);
expect(actual).to.not.equal(unexpected);

// Truthiness
expect(value).to.be.true;
expect(value).to.be.false;
expect(value).to.exist;

// Numbers
expect(number).to.be.greaterThan(5);
expect(number).to.be.lessThan(10);
expect(number).to.be.closeTo(3.14, 0.01);

// Arrays and Objects
expect(array).to.have.length(5);
expect(array).to.include('item');
expect(object).to.have.property('key');

// Functions
expect(fn).to.not.throw();
expect(fn).to.throw(Error);
```

### Game-Specific Patterns
```javascript
// Test lemming state changes
expect(lemming.state).to.equal(LemmingState.WALKING);

// Test collision detection
expect(terrain.hasGround(x, y)).to.be.true;

// Test action application
const result = lemming.applyAction(ActionType.CLIMBER);
expect(result).to.be.true;
expect(lemming.isClimber).to.be.true;

// Test zoom calculations
expect(lemming.getWidth()).to.be.closeTo(expectedWidth, 0.1);
```

## 🔧 Testing Utilities

### Mock Canvas Creation
```javascript
function createMockCanvas(width = 800, height = 600) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}
```

### Performance Timing
```javascript
const startTime = performance.now();
// ... test expensive operation
const endTime = performance.now();
expect(endTime - startTime).to.be.below(threshold);
```

### Async Testing (for future features)
```javascript
it('should load level asynchronously', async function() {
    const levelData = await loadLevel('test-level.json');
    expect(levelData).to.exist;
});
```

## 🐛 Debugging Tests

### Browser DevTools
- Open browser console to see detailed error messages
- Use `console.log()` in tests for debugging
- Set breakpoints in test code

### Test Isolation
- Each test runs independently (thanks to `beforeEach`)
- Failed tests don't affect subsequent tests
- Clear state between test runs

### Common Issues
```javascript
// Problem: Test depends on previous test state
// Solution: Use beforeEach for setup

// Problem: Async operations not completing
// Solution: Use async/await or return promises

// Problem: Mock objects not behaving correctly
// Solution: Verify mock setup and expectations
```

## 🚀 Future Enhancements

### Continuous Integration
```yaml
# GitHub Actions example (future)
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm test
```

### Coverage Reporting
```javascript
// Add Istanbul.js for coverage (future)
// Shows which code lines are tested
```

### Visual Regression Testing
```javascript
// Add screenshot comparison (future)
// Test that graphics render correctly
```

### Performance Benchmarking
```javascript
// Add benchmark.js (future)
// Track performance regressions over time
```

## 📚 Resources

- [Mocha Documentation](https://mochajs.org/)
- [Chai Assertion Library](https://www.chaijs.com/)
- [Game Testing Best Practices](https://gamedevelopment.tutsplus.com/articles/how-to-test-a-game--gamedev-6578)
- [JavaScript Testing Guide](https://javascript.info/testing-mocha)

## 🤝 Contributing Tests

1. **Follow naming conventions** - Descriptive test names
2. **Test one thing** - Each test should verify one behavior
3. **Use arrange-act-assert** - Clear test structure
4. **Include edge cases** - Test boundary conditions
5. **Document complex tests** - Add comments for tricky logic

---

**Happy Testing! 🎮✨**

The test suite is designed to grow with your game. Add tests as you implement new features to maintain confidence in your code quality.