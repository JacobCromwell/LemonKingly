class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.soundVolume = 50;
        this.musicVolume = 50;
        this.audioContext = null;
        this.initialized = false;
        
        // Load saved volume settings
        this.loadSettings();
    }
    
    init() {
        if (this.initialized) return;
        
        // Create audio context on first user interaction
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.initialized = true;
        
        // Generate sound effects
        this.generateSoundEffects();
    }
    
    generateSoundEffects() {
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
    }
    
    createSound(generatorFunction) {
        return () => {
            if (!this.initialized || this.soundVolume === 0) return;
            
            try {
                generatorFunction();
            } catch (e) {
                console.warn('Sound playback error:', e);
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
        if (!this.initialized) {
            this.init();
        }
        
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
    
    loadMusic(url) {
        if (!this.initialized) {
            this.init();
        }
        
        if (this.music) {
            this.music.pause();
        }
        
        this.music = new Audio(url);
        this.music.loop = true;
        this.music.volume = this.musicVolume / 100;
    }
    
    playMusic() {
        if (this.music && this.musicVolume > 0) {
            this.music.play();
        }
    }
    
    pauseMusic() {
        if (this.music) {
            this.music.pause();
        }
    }
    
    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(100, volume));
        this.saveSettings();
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(100, volume));
        if (this.music) {
            this.music.volume = this.musicVolume / 100;
        }
        this.saveSettings();
    }
    
    saveSettings() {
        localStorage.setItem('lemmings_soundVolume', this.soundVolume);
        localStorage.setItem('lemmings_musicVolume', this.musicVolume);
    }
    
    loadSettings() {
        const savedSoundVolume = localStorage.getItem('lemmings_soundVolume');
        const savedMusicVolume = localStorage.getItem('lemmings_musicVolume');
        
        if (savedSoundVolume !== null) {
            this.soundVolume = parseInt(savedSoundVolume);
        }
        if (savedMusicVolume !== null) {
            this.musicVolume = parseInt(savedMusicVolume);
        }
    }
}

// Create global audio manager instance
window.audioManager = new AudioManager();