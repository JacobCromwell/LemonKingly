/**
 * Environment Manager
 * Detects runtime environment and provides appropriate APIs
 */
class EnvironmentManager {
    constructor() {
        this.environment = this.detectEnvironment();
        this.fileAPI = this.createFileAPI();
        
        console.log(`Environment detected: ${this.environment}`);
    }
    
    /**
     * Detect the current runtime environment
     * @returns {string} 'local', 's3', or 'development'
     */
    detectEnvironment() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const pathname = window.location.pathname;
        
        // Check for S3 hosting patterns
        if (hostname.includes('.s3.') || 
            hostname.includes('.s3-') || 
            hostname.endsWith('.amazonaws.com') ||
            hostname.includes('s3-website')) {
            return 's3';
        }
        
        // Check for CloudFront (common with S3)
        if (hostname.includes('.cloudfront.net')) {
            return 's3';
        }
        
        // Check for local development
        if (hostname === 'localhost' || 
            hostname === '127.0.0.1' || 
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.')) {
            return 'local';
        }
        
        // Check for file protocol (opening HTML directly)
        if (protocol === 'file:') {
            return 'local';
        }
        
        // Check for common development ports
        const port = window.location.port;
        const devPorts = ['3000', '8000', '8080', '5000', '4200', '3001'];
        if (devPorts.includes(port)) {
            return 'development';
        }
        
        // Default to S3 for production domains
        return 's3';
    }
    
    /**
     * Create appropriate file API based on environment
     * @returns {Object} File API object
     */
    createFileAPI() {
        switch (this.environment) {
            case 'local':
            case 'development':
                return this.createLocalFileAPI();
            case 's3':
                return this.createS3FileAPI();
            default:
                return this.createS3FileAPI();
        }
    }
    
    /**
     * Create file API for local/development environment
     * @returns {Object} Local file API
     */
    createLocalFileAPI() {
        return {
            // Read file using File API (works in both environments)
            readFile: async (file, options = {}) => {
                if (file instanceof File) {
                    return this.readFileFromInput(file, options);
                }
                
                // If it's a path string, we can't read arbitrary files in browser
                // This is a limitation we need to work around
                throw new Error('Cannot read arbitrary file paths in browser environment');
            },
            
            // Save file (download)
            saveFile: (data, filename, mimeType = 'application/json') => {
                this.downloadFile(data, filename, mimeType);
            },
            
            // Check if file operations are supported
            isFileSystemSupported: () => false, // Browser filesystem is sandboxed
            
            // Environment info
            environment: 'local'
        };
    }
    
    /**
     * Create file API for S3 environment
     * @returns {Object} S3 file API
     */
    createS3FileAPI() {
        return {
            // Read file using File API (same as local)
            readFile: async (file, options = {}) => {
                if (file instanceof File) {
                    return this.readFileFromInput(file, options);
                }
                
                throw new Error('Cannot read arbitrary file paths in S3 environment');
            },
            
            // Save file (download only)
            saveFile: (data, filename, mimeType = 'application/json') => {
                this.downloadFile(data, filename, mimeType);
            },
            
            // Check if file operations are supported
            isFileSystemSupported: () => false,
            
            // Environment info
            environment: 's3'
        };
    }
    
    /**
     * Read file from file input using FileReader API
     * @param {File} file - File object from input
     * @param {Object} options - Options (encoding, etc.)
     * @returns {Promise} File content
     */
    readFileFromInput(file, options = {}) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            // Determine read method based on options
            if (options.encoding === 'utf8' || options.encoding === 'utf-8') {
                reader.readAsText(file);
            } else if (options.encoding === 'base64') {
                reader.readAsDataURL(file);
            } else if (options.encoding === 'binary') {
                reader.readAsArrayBuffer(file);
            } else {
                // Default to text for JSON files, binary for others
                if (file.type === 'application/json' || file.name.endsWith('.json')) {
                    reader.readAsText(file);
                } else {
                    reader.readAsArrayBuffer(file);
                }
            }
        });
    }
    
    /**
     * Download file to user's device
     * @param {string|Blob} data - File data
     * @param {string} filename - Name for downloaded file
     * @param {string} mimeType - MIME type
     */
    downloadFile(data, filename, mimeType = 'application/json') {
        let blob;
        
        if (data instanceof Blob) {
            blob = data;
        } else if (typeof data === 'string') {
            blob = new Blob([data], { type: mimeType });
        } else {
            // Assume it's an object that needs JSON serialization
            const jsonString = JSON.stringify(data, null, 2);
            blob = new Blob([jsonString], { type: 'application/json' });
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
    }
    
    /**
     * Get environment-specific configuration
     * @returns {Object} Configuration object
     */
    getConfig() {
        const baseConfig = {
            environment: this.environment,
            fileAPI: this.fileAPI,
            features: {
                levelEditor: true,
                customLevels: true,
                audioSupport: true,
                particleEffects: true
            }
        };
        
        switch (this.environment) {
            case 'local':
            case 'development':
                return {
                    ...baseConfig,
                    debug: true,
                    logging: true,
                    devMode: true
                };
                
            case 's3':
                return {
                    ...baseConfig,
                    debug: false,
                    logging: false,
                    devMode: false,
                    cdn: true
                };
                
            default:
                return baseConfig;
        }
    }
    
    /**
     * Check if we're in development mode
     * @returns {boolean}
     */
    isDevelopment() {
        return this.environment === 'local' || this.environment === 'development';
    }
    
    /**
     * Check if we're in production (S3)
     * @returns {boolean}
     */
    isProduction() {
        return this.environment === 's3';
    }
    
    /**
     * Log message only in development
     * @param {...any} args - Arguments to log
     */
    devLog(...args) {
        if (this.isDevelopment()) {
            console.log('[DEV]', ...args);
        }
    }
    
    /**
     * Log error in all environments
     * @param {...any} args - Arguments to log
     */
    errorLog(...args) {
        console.error('[ERROR]', ...args);
    }
    
    /**
     * Get appropriate base URL for assets
     * @returns {string} Base URL
     */
    getAssetBaseURL() {
        switch (this.environment) {
            case 'local':
            case 'development':
                return './'; // Relative paths for local
                
            case 's3':
                return './'; // S3 also uses relative paths
                
            default:
                return './';
        }
    }
    
    /**
     * Get environment-specific error handling
     * @param {Error} error - Error to handle
     * @param {string} context - Context where error occurred
     */
    handleError(error, context = 'Unknown') {
        this.errorLog(`Error in ${context}:`, error);
        
        if (this.isDevelopment()) {
            // Show detailed errors in development
            alert(`Development Error in ${context}:\n${error.message}\n\nCheck console for details.`);
        } else {
            // Show user-friendly errors in production
            const userMessage = this.getUserFriendlyErrorMessage(error, context);
            alert(userMessage);
        }
    }
    
    /**
     * Convert technical errors to user-friendly messages
     * @param {Error} error - The error
     * @param {string} context - Context where error occurred
     * @returns {string} User-friendly message
     */
    getUserFriendlyErrorMessage(error, context) {
        const errorMap = {
            'level loading': 'Failed to load level. Please check that the file is a valid level file.',
            'file saving': 'Failed to save file. Please try again.',
            'audio': 'Audio error occurred. Some sounds may not play correctly.',
            'rendering': 'Graphics error occurred. Please refresh the page.',
            'editor': 'Level editor error. Your changes may not be saved.'
        };
        
        const contextLower = context.toLowerCase();
        const userMessage = Object.keys(errorMap).find(key => 
            contextLower.includes(key)
        );
        
        return userMessage ? errorMap[userMessage] : 'An unexpected error occurred. Please try again.';
    }
}

// Create global environment manager instance
window.environmentManager = new EnvironmentManager();

// Make file API globally available for backward compatibility
window.fs = {
    readFile: window.environmentManager.fileAPI.readFile,
    saveFile: window.environmentManager.fileAPI.saveFile
};