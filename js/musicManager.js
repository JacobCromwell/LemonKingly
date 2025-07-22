// js/musicManager.js - New file for managing music selection and playback

class MusicManager {
    constructor() {
        this.availableMusic = [];
        this.currentTrack = null;
        this.isFading = false;
    }

    /**
     * Get list of available music files from assets/music/
     * Since we can't list S3 directories, we'll try common filenames
     * or use a simple naming convention
     */
    async loadAvailableMusic() {
        // Try to load a simple music list file first
        try {
            const response = await fetch('./assets/music/musiclist.txt');
            if (response.ok) {
                const text = await response.text();
                this.availableMusic = text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line && this.isSupportedFormat(line))
                    .map(filename => ({
                        name: filename,
                        path: `assets/music/${filename}`
                    }));
                console.log('Loaded music list:', this.availableMusic.length, 'tracks');
                return this.availableMusic;
            }
        } catch (e) {
            console.log('No musiclist.txt found, using default list');
        }

        // Fallback: try common track names
        const defaultTracks = [
            'track1.mp3', 'track2.mp3', 'track3.mp3', 'track4.mp3', 'track5.mp3',
            'level1.mp3', 'level2.mp3', 'level3.mp3', 'level4.mp3', 'level5.mp3',
            'theme1.mp3', 'theme2.mp3', 'theme3.mp3', 'theme4.mp3', 'theme5.mp3',
            'music1.mp3', 'music2.mp3', 'music3.mp3', 'music4.mp3', 'music5.mp3'
        ];

        // Test which tracks actually exist
        this.availableMusic = [];
        for (const filename of defaultTracks) {
            const path = `assets/music/${filename}`;
            try {
                const response = await fetch(path, { method: 'HEAD' });
                if (response.ok) {
                    this.availableMusic.push({ name: filename, path });
                }
            } catch (e) {
                // File doesn't exist, skip it
            }
        }

        console.log('Found', this.availableMusic.length, 'music tracks');
        return this.availableMusic;
    }

    /**
     * Check if a filename has a supported audio format
     */
    isSupportedFormat(filename) {
        const supportedFormats = ['.mp3', '.ogg', '.wav', '.m4a', '.webm'];
        return supportedFormats.some(format => filename.toLowerCase().endsWith(format));
    }

    /**
     * Get all available music tracks
     */
    getAvailableMusic() {
        return this.availableMusic;
    }

    /**
     * Play a specific music track with fade in
     */
    async playTrack(musicPath, fadeInDuration = 2000) {
        if (!musicPath) {
            console.log('No music path provided');
            return;
        }

        try {
            // Stop current track if playing
            if (window.audioManager.music) {
                window.audioManager.pauseMusic();
            }

            // Load the new track
            console.log('Loading music from:', musicPath);
            await window.audioManager.loadMusic('./' + musicPath);

            // Set initial volume to 0 for fade in
            const targetVolume = window.audioManager.musicVolume / 100;
            window.audioManager.music.volume = 0;

            // Start playing
            window.audioManager.playMusic();

            // Fade in
            this.fadeMusic(0, targetVolume, fadeInDuration);

            this.currentTrack = musicPath;

        } catch (error) {
            console.error('Failed to load music track:', musicPath, error);
            // Continue gameplay without music
        }
    }

    /**
     * Fade out current music
     */
    fadeOutMusic(duration = 2000) {
        if (!window.audioManager.music || this.isFading) return;

        const currentVolume = window.audioManager.music.volume;
        this.fadeMusic(currentVolume, 0, duration, () => {
            window.audioManager.pauseMusic();
        });
    }

    /**
     * Generic fade function
     */
    fadeMusic(fromVolume, toVolume, duration, callback) {
        if (!window.audioManager.music) return;

        this.isFading = true;
        const startTime = Date.now();
        const volumeDiff = toVolume - fromVolume;

        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            if (window.audioManager.music) {
                window.audioManager.music.volume = fromVolume + (volumeDiff * progress);
            }

            if (progress < 1) {
                requestAnimationFrame(fade);
            } else {
                this.isFading = false;
                if (callback) callback();
            }
        };

        fade();
    }

    /**
     * Stop current music immediately
     */
    stopMusic() {
        if (window.audioManager.music) {
            window.audioManager.pauseMusic();
            this.currentTrack = null;
        }
    }

    /**
     * Load available music with local development support
     */
    async loadAvailableMusic() {
        // Check if we're in local development
        const isLocal = window.environmentManager && window.environmentManager.isDevelopment();

        if (isLocal) {
            // In local development, provide a file input option
            this.availableMusic = [
                {
                    name: '📁 Browse local files...',
                    path: 'LOCAL_FILE_SELECT',
                    isLocalOption: true
                }
            ];

            // Also try to load any predefined local tracks
            const localTracks = [
                'test1.mp3', 'test2.mp3', 'test3.mp3',
                'track1.mp3', 'track2.mp3', 'track3.mp3'
            ];

            for (const filename of localTracks) {
                const path = `assets/music/${filename}`;
                try {
                    const response = await fetch(path, { method: 'HEAD' });
                    if (response.ok) {
                        this.availableMusic.push({ name: filename, path });
                    }
                } catch (e) {
                    // File doesn't exist locally, skip
                }
            }

            console.log('Local development mode - found', this.availableMusic.length - 1, 'local tracks');
            return this.availableMusic;
        }

        // Original S3 production code continues here...
        // Try to load a simple music list file first
        try {
            const response = await fetch('./assets/music/musiclist.txt');
            if (response.ok) {
                const text = await response.text();
                this.availableMusic = text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line && this.isSupportedFormat(line))
                    .map(filename => ({
                        name: filename,
                        path: `assets/music/${filename}`
                    }));
                console.log('Loaded music list:', this.availableMusic.length, 'tracks');
                return this.availableMusic;
            }
        } catch (e) {
            console.log('No musiclist.txt found, using default list');
        }

        // Fallback: try common track names
        const defaultTracks = [
            'track1.mp3', 'track2.mp3', 'track3.mp3', 'track4.mp3', 'track5.mp3',
            'level1.mp3', 'level2.mp3', 'level3.mp3', 'level4.mp3', 'level5.mp3',
            'theme1.mp3', 'theme2.mp3', 'theme3.mp3', 'theme4.mp3', 'theme5.mp3',
            'music1.mp3', 'music2.mp3', 'music3.mp3', 'music4.mp3', 'music5.mp3'
        ];

        // Test which tracks actually exist
        this.availableMusic = [];
        for (const filename of defaultTracks) {
            const path = `assets/music/${filename}`;
            try {
                const response = await fetch(path, { method: 'HEAD' });
                if (response.ok) {
                    this.availableMusic.push({ name: filename, path });
                }
            } catch (e) {
                // File doesn't exist, skip it
            }
        }

        console.log('Found', this.availableMusic.length, 'music tracks');
        return this.availableMusic;
    }

    /**
     * Play a specific music track with fade in (updated to handle local files)
     */
    async playTrack(musicPath, fadeInDuration = 2000) {
        if (!musicPath) {
            console.log('No music path provided');
            return;
        }

        try {
            // Stop current track if playing
            if (window.audioManager.music) {
                window.audioManager.pauseMusic();
            }

            let musicUrl;

            // Check if this is a local file reference
            if (musicPath.startsWith('LOCAL:')) {
                const filename = musicPath.substring(6); // Remove 'LOCAL:' prefix

                // For local development, try to load from assets/music folder
                if (window.environmentManager && window.environmentManager.isDevelopment()) {
                    // First check if we have a blob URL in memory
                    if (this.localFileUrls && this.localFileUrls[filename]) {
                        musicUrl = this.localFileUrls[filename];
                    } else {
                        // Try to load from assets/music folder
                        musicUrl = `./assets/music/${filename}`;
                        console.log('Attempting to load local file from assets/music:', filename);
                    }
                } else {
                    // In production, LOCAL: files won't work
                    throw new Error('Local file references are not supported in production. Please use files from assets/music/');
                }
            } else {
                musicUrl = './' + musicPath;
            }

            // Load the new track
            console.log('Loading music from:', musicUrl);
            await window.audioManager.loadMusic(musicUrl);

            // Set initial volume to 0 for fade in
            const targetVolume = window.audioManager.musicVolume / 100;
            window.audioManager.music.volume = 0;

            // Start playing
            window.audioManager.playMusic();

            // Fade in
            this.fadeMusic(0, targetVolume, fadeInDuration);

            this.currentTrack = musicPath;

        } catch (error) {
            console.error('Failed to load music track:', musicPath, error);
            // Continue gameplay without music
        }
    }

/**
 * Handle local file selection
 */
    async handleLocalFileSelect(file) {
        if (!file || !this.isSupportedFormat(file.name)) {
            alert('Please select a valid audio file (.mp3, .ogg, .wav, .m4a, .webm)');
            return null;
        }

        // Create a blob URL for the local file
        const blobUrl = URL.createObjectURL(file);

        // Store the blob URL temporarily
        this.localFileUrls = this.localFileUrls || {};
        this.localFileUrls[file.name] = blobUrl;

        // Alert user about local testing
        alert(`Selected: ${file.name}\n\nNote: For testing saved levels, place this file in assets/music/ folder.`);

        return {
            name: file.name,
            path: `LOCAL:${file.name}`,
            blobUrl: blobUrl
        };
    }
}

// Create global music manager instance
window.musicManager = new MusicManager();