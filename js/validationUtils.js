// Centralized validation utilities
class ValidationUtils {
    /**
     * Validate level data structure
     * @param {Object} levelData - Level data to validate
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    static validateLevelData(levelData) {
        const errors = [];
        
        // Check for required top-level fields
        const requiredFields = ['name', 'width', 'height', 'spawn', 'exit'];
        for (const field of requiredFields) {
            if (!levelData.hasOwnProperty(field)) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        
        // Validate spawn point
        if (!levelData.spawn || 
            typeof levelData.spawn.x !== 'number' || 
            typeof levelData.spawn.y !== 'number') {
            errors.push('Invalid spawn point - must have numeric x and y');
        }
        
        // Validate exit point
        if (!levelData.exit || 
            typeof levelData.exit.x !== 'number' || 
            typeof levelData.exit.y !== 'number' ||
            typeof levelData.exit.width !== 'number' || 
            typeof levelData.exit.height !== 'number') {
            errors.push('Invalid exit point - must have numeric x, y, width, and height');
        }
        
        // Validate dimensions
        if (typeof levelData.width !== 'number' || levelData.width < 400 || levelData.width > 6000) {
            errors.push('Level width must be between 400 and 6000');
        }
        
        if (typeof levelData.height !== 'number' || levelData.height < 160 || levelData.height > 1200) {
            errors.push('Level height must be between 160 and 1200');
        }
        
        // Validate level settings if present
        if (levelData.levelSettings) {
            const settings = levelData.levelSettings;
            
            if (settings.totalLemmings !== undefined) {
                if (typeof settings.totalLemmings !== 'number' || 
                    settings.totalLemmings < 1 || 
                    settings.totalLemmings > 100) {
                    errors.push('Total lemmings must be between 1 and 100');
                }
            }
            
            if (settings.requiredLemmings !== undefined) {
                if (typeof settings.requiredLemmings !== 'number' || 
                    settings.requiredLemmings < 1 || 
                    settings.requiredLemmings > settings.totalLemmings) {
                    errors.push('Required lemmings must be between 1 and total lemmings');
                }
            }
            
            if (settings.spawnRate !== undefined) {
                if (typeof settings.spawnRate !== 'number' || 
                    settings.spawnRate < 250 || 
                    settings.spawnRate > 5000) {
                    errors.push('Spawn rate must be between 250 and 5000 milliseconds');
                }
            }
        }
        
        // Validate hazards if present
        if (levelData.hazards && Array.isArray(levelData.hazards)) {
            levelData.hazards.forEach((hazard, index) => {
                if (!hazard.x || !hazard.y || !hazard.width || !hazard.height || !hazard.type) {
                    errors.push(`Hazard ${index} is missing required properties`);
                }
                
                const validTypes = ['lava', 'bearTrap', 'spikes'];
                if (!validTypes.includes(hazard.type)) {
                    errors.push(`Hazard ${index} has invalid type: ${hazard.type}`);
                }
            });
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Validate and sanitize lemming count
     * @param {number} count - Lemming count to validate
     * @param {number} min - Minimum allowed (default 1)
     * @param {number} max - Maximum allowed (default 100)
     * @returns {number} Sanitized count
     */
    static validateLemmingCount(count, min = 1, max = 100) {
        const num = parseInt(count);
        if (isNaN(num)) return min;
        return Math.max(min, Math.min(max, num));
    }
    
    /**
     * Validate action type
     * @param {string} action - Action type to validate
     * @returns {boolean} True if valid action type
     */
    static isValidAction(action) {
        return Object.values(ActionType).includes(action);
    }
    
    /**
     * Validate file type
     * @param {File} file - File to validate
     * @param {string[]} allowedTypes - Array of allowed MIME types
     * @returns {boolean} True if file type is allowed
     */
    static validateFileType(file, allowedTypes) {
        if (!file || !file.type) return false;
        return allowedTypes.includes(file.type);
    }
    
    /**
     * Validate audio file
     * @param {File} file - File to validate
     * @returns {boolean} True if valid audio file
     */
    static isValidAudioFile(file) {
        const audioTypes = [
            'audio/mp3',
            'audio/mpeg',
            'audio/ogg',
            'audio/wav',
            'audio/webm',
            'audio/m4a'
        ];
        
        // Check MIME type
        if (this.validateFileType(file, audioTypes)) {
            return true;
        }
        
        // Fallback to extension check
        const validExtensions = ['.mp3', '.ogg', '.wav', '.m4a', '.webm'];
        const fileName = file.name.toLowerCase();
        return validExtensions.some(ext => fileName.endsWith(ext));
    }
    
    /**
     * Validate image file
     * @param {File} file - File to validate
     * @returns {boolean} True if valid image file
     */
    static isValidImageFile(file) {
        const imageTypes = [
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/gif',
            'image/webp'
        ];
        
        return this.validateFileType(file, imageTypes);
    }
    
    /**
     * Validate JSON file
     * @param {File} file - File to validate
     * @returns {boolean} True if valid JSON file
     */
    static isValidJSONFile(file) {
        return this.validateFileType(file, ['application/json']) || 
               file.name.toLowerCase().endsWith('.json');
    }
    
    /**
     * Sanitize level name
     * @param {string} name - Level name to sanitize
     * @returns {string} Sanitized name
     */
    static sanitizeLevelName(name) {
        if (!name || typeof name !== 'string') return 'untitled';
        
        // Remove special characters, keep alphanumeric, spaces, dashes, underscores
        return name.replace(/[^a-zA-Z0-9\s\-_]/g, '')
                   .trim()
                   .substring(0, 50) // Limit length
                   || 'untitled';
    }
    
    /**
     * Validate coordinate within bounds
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Boundary width
     * @param {number} height - Boundary height
     * @returns {boolean} True if within bounds
     */
    static isWithinBounds(x, y, width, height) {
        return x >= 0 && x < width && y >= 0 && y < height;
    }
}

// Export globally
window.ValidationUtils = ValidationUtils;