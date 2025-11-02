export class AudioManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.masterVolume = 0.5;

        // Track creeping sound oscillators for looping
        this.creepingOscillators = [];
        this.audioContext = null;
        this.isCreepingSoundActive = false; // Prevent duplicate creeping sounds

        this.initAudioContext();
        this.initSounds();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.debug('AudioContext not available:', e.message);
        }
    }

    initSounds() {
        // Create simple beep sounds using Web Audio API
        this.createSound('spawn', 1000, 0.2, 'sine'); // Ghost spawn
        this.createSound('scare', 600, 0.3, 'square'); // Ghost scare
        this.createSound('combo', 800, 0.25, 'sine'); // Combo notification
        this.createSound('success', 1200, 0.2, 'sine'); // Success sound
        this.createSound('creep', 300, 0.5, 'sine', true); // Creeping sound (low, looping)
    }

    createSound(name, frequency, duration, waveType = 'sine', isLooping = false) {
        this.sounds[name] = { frequency, duration, waveType, isLooping };
    }

    playSound(soundName) {
        if (!this.enabled || !this.sounds[soundName]) return;

        const sound = this.sounds[soundName];

        // Looping sounds are handled separately
        if (sound.isLooping) {
            return; // Use playLoopingSound instead
        }

        try {
            const ctx = this._getAudioContext();
            if (!ctx) return;

            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = sound.waveType;
            oscillator.frequency.value = sound.frequency;

            // Fade out
            gainNode.gain.setValueAtTime(this.masterVolume, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + sound.duration);
        } catch (e) {
            console.debug('Audio playback not available:', e.message);
        }
    }

    _getAudioContext() {
        if (this.audioContext) {
            return this.audioContext;
        }

        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.audioContext = ctx;
            return ctx;
        } catch (e) {
            console.debug('AudioContext creation failed:', e.message);
            return null;
        }
    }

    /**
     * Play or manage creeping sound when ghosts are approaching
     * @param {number} creepingGhostCount - Number of ghosts currently creeping
     */
    updateCreepingAudio(creepingGhostCount) {
        const ctx = this._getAudioContext();
        if (!this.enabled || !ctx) return;

        // Stop all creeping sounds if no ghosts creeping
        if (creepingGhostCount === 0) {
            this.stopCreepingSound();
            return;
        }

        // Start creeping sound only if not already active (prevents duplicates)
        if (!this.isCreepingSoundActive && creepingGhostCount > 0) {
            this.playCreepingSound();
        } else if (this.isCreepingSoundActive && this.creepingOscillators.length > 0) {
            // Adjust volume based on number of creeping ghosts
            const volumeMultiplier = Math.min(creepingGhostCount * 0.3, 0.8); // Max 80% volume
            this.creepingOscillators.forEach(item => {
                item.gainNode.gain.setValueAtTime(this.masterVolume * volumeMultiplier, ctx.currentTime);
            });
        }
    }

    playCreepingSound() {
        const ctx = this._getAudioContext();
        if (!this.enabled || !ctx || !this.sounds['creep'] || this.isCreepingSoundActive) return;

        try {
            const sound = this.sounds['creep'];

            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = sound.waveType;
            oscillator.frequency.value = sound.frequency;

            // Looping creep sound - subtle and eerie
            gainNode.gain.setValueAtTime(this.masterVolume * 0.3, ctx.currentTime);

            oscillator.start(ctx.currentTime);

            // Store for later stopping
            this.creepingOscillators.push({ oscillator, gainNode });
            this.isCreepingSoundActive = true;
        } catch (e) {
            console.debug('Creeping audio playback not available:', e.message);
        }
    }

    stopCreepingSound() {
        const ctx = this._getAudioContext();
        if (!ctx) return;

        this.creepingOscillators.forEach(item => {
            try {
                // Fade out before stopping
                item.gainNode.gain.setValueAtTime(item.gainNode.gain.value, ctx.currentTime);
                item.gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                item.oscillator.stop(ctx.currentTime + 0.2);
            } catch (e) {
                console.debug('Error stopping creeping audio:', e.message);
            }
        });

        this.creepingOscillators = [];
        this.isCreepingSoundActive = false;
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    toggleAudio(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopCreepingSound();
        }
    }
}
