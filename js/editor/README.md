# Level Editor Module Structure

The level editor has been refactored into a modular architecture to support future expansion and maintain code organization.

## File Structure

```
js/editor/
├── EditorUIBuilder.js      # Builds and manages the editor UI
├── EditorBase.js          # Core editor functionality and drawing
├── EditorInputHandler.js   # Handles all user input events
├── EditorToolsHandler.js   # Tool selection and tool-specific logic
├── EditorImageHandler.js   # Image loading and processing
├── EditorFileHandler.js    # Save/load functionality
└── LevelEditor.js         # Main class that ties everything together
```

## Module Descriptions

### EditorUIBuilder.js
- Creates the editor UI dynamically
- Manages menu/submenu system
- Handles UI state and transitions
- Global instance: `window.editorUI`

### EditorBase.js
- Core editor properties (canvas, zoom, camera, etc.)
- Basic drawing functionality
- Coordinate conversion methods
- Level element storage (hazards, spawn, exit)

### EditorInputHandler.js
- Mouse events (click, drag, pan, zoom)
- Keyboard shortcuts
- Cursor management
- Delegates tool-specific actions to ToolsHandler

### EditorToolsHandler.js
- Tool selection and state management
- Tool-specific click handling
- Overlay drawing (grid, death height, tool preview)
- Contains `EditorHazard` class for editor-specific hazard functionality

### EditorImageHandler.js
- Background image loading
- Foreground/terrain image loading
- Transparent color picking
- Image processing for terrain

### EditorFileHandler.js
- Level saving (JSON format)
- Level loading
- Test level functionality
- Integration with game mode

### LevelEditor.js
- Main editor class extending EditorBase
- Initializes all handler modules
- Coordinates between modules
- Global instance: `window.editor`

## Adding New Features

### Adding a New Entity Type
1. Add the entity button to the appropriate submenu in `EditorUIBuilder.js`
2. Add click handling logic in `EditorToolsHandler.handleToolClick()`
3. Add preview drawing in `EditorToolsHandler.drawToolPreview()`
4. Update save/load logic in `EditorFileHandler.js` if needed

### Adding a New Submenu
1. Add menu button in `EditorUIBuilder.createEditorUI()`
2. Create submenu div with unique ID
3. Add content to the submenu
4. The toggle functionality is already handled by `toggleSubmenu()`

### Adding New Level Settings
1. Add UI inputs in the settings submenu in `EditorUIBuilder.js`
2. Add properties to `this.levelData` in `EditorBase.js`
3. Update save/load logic in `EditorFileHandler.js`
4. Update test level logic if the settings affect gameplay

## Future Enhancements

### Planned Entity Types
- **Doors & Keys**: Collectible keys that open specific doors
- **Treasure Chests**: Bonus points or power-ups
- **Work Rooms**: Areas where lemmings perform tasks
- **Moving Platforms**: Dynamic level elements
- **Switches**: Activate/deactivate hazards or platforms

### Planned Tools
- **Brush Tool**: Paint terrain directly
- **Selection Tool**: Select and move multiple entities
- **Copy/Paste**: Duplicate level sections
- **Undo/Redo**: Action history

### Planned Settings
- **Music Selection**: Choose background music for levels
- **Time Limits**: Optional countdown timer
- **Action Restrictions**: Customize available actions per level
- **Environmental Effects**: Weather, lighting changes

## Usage

The editor is loaded dynamically when needed:

```javascript
// In game.js
openLevelEditor() {
    // Loads all editor modules in correct order
    // Creates UI and initializes editor
}
```

## Best Practices

1. **Module Independence**: Each module should be as independent as possible
2. **Clear Interfaces**: Use clear method names and parameters
3. **Event Delegation**: Input events flow through InputHandler to appropriate modules
4. **State Management**: Editor state is centralized in EditorBase
5. **UI Separation**: UI structure is separate from logic