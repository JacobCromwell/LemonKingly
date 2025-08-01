class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.soundVolume = 50;
        this.musicVolume = 50;
        this.audioContext = null;
        this.initialized = false;

        // Environment awareness
        this.envManager = null;
        this.isProduction = false;

        // Load saved volume settings
        this.loadSettings();
        
        // Initialize environment awareness when available
        this.initEnvironmentAwareness();
    }

    initEnvironmentAwareness() {
        // Check if environment manager is available
        if (window.environmentManager) {
            this.envManager = window.environmentManager;
            this.isProduction = this.envManager.isProduction();
            this.envManager.devLog('Audio manager initialized with environment awareness');
        } else {
            // Fallback - check again after a short delay
            setTimeout(() => this.initEnvironmentAwareness(), 100);
        }
    }

    init() {
        if (this.initialized) return;

        try {
            // Create audio context on first user interaction
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;

            // Generate sound effects
            this.generateSoundEffects();
            
            if (this.envManager) {
                this.envManager.devLog('Audio system initialized successfully');
            }
        } catch (error) {
            this.handleAudioError(error, 'Audio initialization failed');
        }
    }

    handleAudioError(error, context) {
        if (this.envManager) {
            this.envManager.handleError(error, `audio - ${context}`);
        } else {
            console.error('Audio Error:', context, error);
            
            // Fallback user notification for production
            if (this.isProductionEnvironment()) {
                console.warn('Audio features may not work correctly.');
            }
        }
    }

    // Fallback environment detection if environment manager isn't available
    isProductionEnvironment() {
        const hostname = window.location.hostname;
        return hostname.includes('.s3.') || 
               hostname.includes('.amazonaws.com') || 
               hostname.includes('.cloudfront.net');
    }

    generateSoundEffects() {
        try {
            // Generate blocker sound (thud)
            this.sounds.blocker = this.createSound(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const masterGain = this.audioContext.createGain();

                osc.type = 'square';
                osc.frequency.setValueAtTime(80, this.audioContext.currentTime);
                osc.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.1);

                gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

                masterGain.gain.value = this.soundVolume / 100;

                osc.connect(gain);
                gain.connect(masterGain);
                masterGain.connect(this.audioContext.destination);

                osc.start();
                osc.stop(this.audioContext.currentTime + 0.1);
            });

            // Generate basher sound (hitting/chipping)
            this.sounds.basher = this.createSound(() => {
                const noise = this.createNoise();
                const filter = this.audioContext.createBiquadFilter();
                const gain = this.audioContext.createGain();
                const masterGain = this.audioContext.createGain();

                filter.type = 'highpass';
                filter.frequency.value = 1000;

                gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

                masterGain.gain.value = this.soundVolume / 100;

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(masterGain);
                masterGain.connect(this.audioContext.destination);

                noise.start();
                noise.stop(this.audioContext.currentTime + 0.05);
            });

            // Generate digger sound (digging/scraping)
            this.sounds.digger = this.createSound(() => {
                const osc = this.audioContext.createOscillator();
                const noise = this.createNoise();
                const gain = this.audioContext.createGain();
                const noiseGain = this.audioContext.createGain();
                const masterGain = this.audioContext.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, this.audioContext.currentTime);
                osc.frequency.linearRampToValueAtTime(50, this.audioContext.currentTime + 0.15);

                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

                noiseGain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

                masterGain.gain.value = this.soundVolume / 100;

                osc.connect(gain);
                noise.connect(noiseGain);
                gain.connect(masterGain);
                noiseGain.connect(masterGain);
                masterGain.connect(this.audioContext.destination);

                osc.start();
                noise.start();
                osc.stop(this.audioContext.currentTime + 0.15);
                noise.stop(this.audioContext.currentTime + 0.15);
            });

            // Generate builder sound (placing blocks)
            this.sounds.builder = this.createSound(() => {
                const osc = this.audioContext.createOscillator();
                const osc2 = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const masterGain = this.audioContext.createGain();

                osc.type = 'square';
                osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
                osc.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.1);

                osc2.type = 'square';
                osc2.frequency.setValueAtTime(554, this.audioContext.currentTime);
                osc2.frequency.exponentialRampToValueAtTime(277, this.audioContext.currentTime + 0.1);

                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

                masterGain.gain.value = this.soundVolume / 100;

                osc.connect(gain);
                osc2.connect(gain);
                gain.connect(masterGain);
                masterGain.connect(this.audioContext.destination);

                osc.start();
                osc2.start();
                osc.stop(this.audioContext.currentTime + 0.1);
                osc2.stop(this.audioContext.currentTime + 0.1);
            });

            // Generate death sound
            this.sounds.death = this.createSound(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const masterGain = this.audioContext.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
                osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);

                gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

                masterGain.gain.value = this.soundVolume / 100;

                osc.connect(gain);
                gain.connect(masterGain);
                masterGain.connect(this.audioContext.destination);

                osc.start();
                osc.stop(this.audioContext.currentTime + 0.3);
            });

            // Generate save sound (success)
            this.sounds.save = this.createSound(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const masterGain = this.audioContext.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
                osc.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1); // E5
                osc.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2); // G5

                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime + 0.25);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

                masterGain.gain.value = this.soundVolume / 100;

                osc.connect(gain);
                gain.connect(masterGain);
                masterGain.connect(this.audioContext.destination);

                osc.start();
                osc.stop(this.audioContext.currentTime + 0.3);
            });

            // Generate climber sound (rope/climbing)
            this.sounds.climber = this.createSound(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const masterGain = this.audioContext.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
                osc.frequency.linearRampToValueAtTime(400, this.audioContext.currentTime + 0.05);
                osc.frequency.linearRampToValueAtTime(350, this.audioContext.currentTime + 0.1);

                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

                masterGain.gain.value = this.soundVolume / 100;

                osc.connect(gain);
                gain.connect(masterGain);
                masterGain.connect(this.audioContext.destination);

                osc.start();
                osc.stop(this.audioContext.currentTime + 0.15);
            });

            this.sounds.floater = this.createSound(() => {
                const osc = this.audioContext.createOscillator();
                const noise = this.createNoise();
                const filter = this.audioContext.createBiquadFilter();
                const gain = this.audioContext.createGain();
                const noiseGain = this.audioContext.createGain();
                const masterGain = this.audioContext.createGain();

                // Wind-like sound with oscillator
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
                osc.frequency.linearRampToValueAtTime(150, this.audioContext.currentTime + 0.2);

                // Filtered noise for parachute rustling
                filter.type = 'bandpass';
                filter.frequency.value = 800;
                filter.Q.value = 2;

                gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

                noiseGain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

                masterGain.gain.value = this.soundVolume / 100;

                osc.connect(gain);
                noise.connect(filter);
                filter.connect(noiseGain);
                gain.connect(masterGain);
                noiseGain.connect(masterGain);
                masterGain.connect(this.audioContext.destination);

                osc.start();
                noise.start();
                osc.stop(this.audioContext.currentTime + 0.2);
                noise.stop(this.audioContext.currentTime + 0.2);
            });

            this.sounds.exploder = this.createSound(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const masterGain = this.audioContext.createGain();

                osc.type = 'square';
                osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
                osc.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.05);

                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

                masterGain.gain.value = this.soundVolume / 100;

                osc.connect(gain);
                gain.connect(masterGain);
                masterGain.connect(this.audioContext.destination);

                osc.start();
                osc.stop(this.audioContext.currentTime + 0.1);
            });

            // Generate explosion sound (pop)
            this.sounds.explosion = this.createSound(() => {
                // Create noise burst for explosion
                const noise = this.createNoise();
                const filter = this.audioContext.createBiquadFilter();
                const gain = this.audioContext.createGain();
                const masterGain = this.audioContext.createGain();

                // Low-pass filter for "pop" effect
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
                filter.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.2);

                // Quick attack, slower decay
                gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

                masterGain.gain.value = this.soundVolume / 100;

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(masterGain);
                masterGain.connect(this.audioContext.destination);

                noise.start();
                noise.stop(this.audioContext.currentTime + 0.3);

                // Add a bass thump
                const bass = this.audioContext.createOscillator();
                const bassGain = this.audioContext.createGain();

                bass.type = 'sine';
                bass.frequency.setValueAtTime(100, this.audioContext.currentTime);
                bass.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.2);

                bassGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                bassGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

                bass.connect(bassGain);
                bassGain.connect(masterGain);

                bass.start();
                bass.stop(this.audioContext.currentTime + 0.2);
            });

            this.sounds.miner = this.createSound(() => {
                // Create metallic pick sound
                const osc = this.audioContext.createOscillator();
                const osc2 = this.audioContext.createOscillator();
                const noise = this.createNoise();
                const gain = this.audioContext.createGain();
                const noiseGain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                const masterGain = this.audioContext.createGain();

                // High frequency metallic ring
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(2500, this.audioContext.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);

                // Lower frequency thud
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(150, this.audioContext.currentTime);
                osc2.frequency.exponentialRampToValueAtTime(60, this.audioContext.currentTime + 0.15);

                // Filter noise for rock crumbling
                filter.type = 'bandpass';
                filter.frequency.value = 1500;
                filter.Q.value = 2;

                // Quick attack, fast decay for impact
                gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

                noiseGain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

                masterGain.gain.value = this.soundVolume / 100;

                // Connect audio graph
                osc.connect(gain);
                osc2.connect(gain);
                noise.connect(filter);
                filter.connect(noiseGain);
                gain.connect(masterGain);
                noiseGain.connect(masterGain);
                masterGain.connect(this.audioContext.destination);

                osc.start();
                osc2.start();
                noise.start();
                osc.stop(this.audioContext.currentTime + 0.15);
                osc2.stop(this.audioContext.currentTime + 0.15);
                noise.stop(this.audioContext.currentTime + 0.1);
            });

            // Generate nuke sound ("Oh no!" exclamation)
            this.sounds.nuke = this.createSound(() => {
                // Create a dramatic, urgent sound that suggests "Oh no!"
                const osc1 = this.audioContext.createOscillator();
                const osc2 = this.audioContext.createOscillator();
                const osc3 = this.audioContext.createOscillator();
                const gain1 = this.audioContext.createGain();
                const gain2 = this.audioContext.createGain();
                const gain3 = this.audioContext.createGain();
                const masterGain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();

                // First part: "Oh" - lower pitch, worried tone
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(220, this.audioContext.currentTime); // A3
                osc1.frequency.linearRampToValueAtTime(196, this.audioContext.currentTime + 0.2); // G3

                gain1.gain.setValueAtTime(0.4, this.audioContext.currentTime);
                gain1.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

                // Second part: "no" - higher pitch, more alarmed
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(330, this.audioContext.currentTime + 0.15); // E4
                osc2.frequency.linearRampToValueAtTime(294, this.audioContext.currentTime + 0.4); // D4

                gain2.gain.setValueAtTime(0, this.audioContext.currentTime);
                gain2.gain.setValueAtTime(0.5, this.audioContext.currentTime + 0.15);
                gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

                // Add harmonic for richness
                osc3.type = 'triangle';
                osc3.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
                osc3.frequency.linearRampToValueAtTime(392, this.audioContext.currentTime + 0.4); // G4

                gain3.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gain3.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

                // Add filter for voice-like quality
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
                filter.Q.value = 2;

                masterGain.gain.value = this.soundVolume / 100;

                // Connect audio graph
                osc1.connect(gain1);
                osc2.connect(gain2);
                osc3.connect(gain3);
                gain1.connect(filter);
                gain2.connect(filter);
                gain3.connect(filter);
                filter.connect(masterGain);
                masterGain.connect(this.audioContext.destination);

                // Start and stop oscillators
                osc1.start();
                osc2.start(this.audioContext.currentTime + 0.15);
                osc3.start();
                
                osc1.stop(this.audioContext.currentTime + 0.2);
                osc2.stop(this.audioContext.currentTime + 0.4);
                osc3.stop(this.audioContext.currentTime + 0.4);
            });

            // Generate 'lastBricks' sound (clunk/clatter warning)
            this.sounds.lastBricks = this.createSound(() => {
                const osc = this.audioContext.createOscillator();
                const noise = this.createNoise();
                const gain = this.audioContext.createGain();
                const noiseGain = this.audioContext.createGain();
                const masterGain = this.audioContext.createGain();

                // Low frequency thud/clunk
                osc.type = 'square';
                osc.frequency.setValueAtTime(120, this.audioContext.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.08);

                // Short, sharp noise burst for clatter
                gain.gain.setValueAtTime(1, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

                noiseGain.gain.setValueAtTime(0.8, this.audioContext.currentTime);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

                masterGain.gain.value = this.soundVolume / 100;

                osc.connect(gain);
                noise.connect(noiseGain);
                gain.connect(masterGain);
                noiseGain.connect(masterGain);
                masterGain.connect(this.audioContext.destination);

                osc.start();
                noise.start();
                osc.stop(this.audioContext.currentTime + 0.1);
                noise.stop(this.audioContext.currentTime + 0.05);
            });

            if (this.envManager) {
                this.envManager.devLog('All sound effects generated successfully');
            }

        } catch (error) {
            this.handleAudioError(error, 'Sound effect generation');
        }
    }

    createSound(generatorFunction) {
        return () => {
            if (!this.initialized || this.soundVolume === 0) return;

            try {
                generatorFunction();
            } catch (e) {
                this.handleAudioError(e, 'Sound playback');
            }
        };
    }

    createNoise() {
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        return noise;
    }

    playSound(soundName) {
        try {
            if (!this.initialized) {
                this.init();
            }

            if (this.sounds[soundName]) {
                this.sounds[soundName]();
                
                if (this.envManager) {
                    this.envManager.devLog(`Played sound: ${soundName}`);
                }
            } else {
                if (this.envManager) {
                    this.envManager.devLog(`Sound not found: ${soundName}`);
                }
            }
        } catch (error) {
            this.handleAudioError(error, `Playing sound ${soundName}`);
        }
    }

    async loadMusic(url) {
        try {
            if (!this.initialized) {
                this.init();
            }

            if (this.music) {
                this.music.pause();
            }

            // Environment-aware music loading
            if (this.envManager && this.envManager.isProduction()) {
                // In production, be more careful about music loading
                this.music = await this.loadMusicSafely(url);
            } else {
                // In development, use simple loading
                this.music = new Audio(url);
            }

            this.music.loop = true;
            this.music.volume = this.musicVolume / 100;

            if (this.envManager) {
                this.envManager.devLog('Music loaded successfully');
            }

        } catch (error) {
            this.handleAudioError(error, 'Music loading');
        }
    }

    async loadMusicSafely(url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            audio.addEventListener('canplaythrough', () => {
                resolve(audio);
            });
            
            audio.addEventListener('error', (e) => {
                reject(new Error(`Failed to load music: ${e.message}`));
            });
            
            // Set a timeout for loading
            setTimeout(() => {
                reject(new Error('Music loading timeout'));
            }, 10000); // 10 second timeout
            
            audio.src = url;
        });
    }

    playMusic() {
        try {
            if (this.music && this.musicVolume > 0) {
                // Handle autoplay restrictions in browsers
                const playPromise = this.music.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        if (this.envManager) {
                            this.envManager.devLog('Music autoplay blocked, waiting for user interaction');
                        }
                        
                        // Set up one-time click listener to start music
                        const startMusicOnClick = () => {
                            this.music.play().catch(e => {
                                this.handleAudioError(e, 'Music playback after user interaction');
                            });
                            document.removeEventListener('click', startMusicOnClick);
                        };
                        
                        document.addEventListener('click', startMusicOnClick);
                    });
                }
            }
        } catch (error) {
            this.handleAudioError(error, 'Music playback');
        }
    }

    pauseMusic() {
        try {
            if (this.music) {
                this.music.pause();
            }
        } catch (error) {
            this.handleAudioError(error, 'Music pause');
        }
    }

    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(100, volume));
        this.saveSettings();
        
        if (this.envManager) {
            this.envManager.devLog(`Sound volume set to: ${this.soundVolume}%`);
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(100, volume));
        if (this.music) {
            this.music.volume = this.musicVolume / 100;
        }
        this.saveSettings();
        
        if (this.envManager) {
            this.envManager.devLog(`Music volume set to: ${this.musicVolume}%`);
        }
    }

    saveSettings() {
        try {
            const storageKey = this.envManager && this.envManager.isProduction() ? 
                'lemmings_prod_' : 'lemmings_';
            
            localStorage.setItem(storageKey + 'soundVolume', this.soundVolume);
            localStorage.setItem(storageKey + 'musicVolume', this.musicVolume);
        } catch (error) {
            this.handleAudioError(error, 'Settings save');
        }
    }

    loadSettings() {
        try {
            const storageKey = this.envManager && this.envManager.isProduction() ? 
                'lemmings_prod_' : 'lemmings_';
                
            const savedSoundVolume = localStorage.getItem(storageKey + 'soundVolume');
            const savedMusicVolume = localStorage.getItem(storageKey + 'musicVolume');

            if (savedSoundVolume !== null) {
                this.soundVolume = parseInt(savedSoundVolume);
            }
            if (savedMusicVolume !== null) {
                this.musicVolume = parseInt(savedMusicVolume);
            }
        } catch (error) {
            // If localStorage fails, use defaults
            if (this.envManager) {
                this.envManager.devLog('Could not load audio settings, using defaults');
            }
        }
    }

    /**
     * Get audio system status for debugging
     */
    getStatus() {
        return {
            initialized: this.initialized,
            environment: this.envManager?.environment || 'unknown',
            soundVolume: this.soundVolume,
            musicVolume: this.musicVolume,
            musicLoaded: !!this.music,
            contextState: this.audioContext?.state || 'unknown',
            soundsGenerated: Object.keys(this.sounds).length
        };
    }
}

// Create global audio manager instance
window.audioManager = new AudioManager();