export class AudioManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.masterVolume = 0.5;

        // Track creeping sound oscillators for looping
        this.creepingOscillators = [];
        this.audioContext = null;

        this.initSounds();
        this.initAudioContext();
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
            const ctx = this.audioContext || new (window.AudioContext || window.webkitAudioContext)();
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

    /**
     * Play or manage creeping sound when ghosts are approaching
     * @param {number} creepingGhostCount - Number of ghosts currently creeping
     */
    updateCreepingAudio(creepingGhostCount) {
        if (!this.enabled || !this.audioContext) return;

        // Stop all creeping sounds if no ghosts creeping
        if (creepingGhostCount === 0) {
            this.stopCreepingSound();
            return;
        }

        // Start or adjust creeping sound
        if (this.creepingOscillators.length === 0 && creepingGhostCount > 0) {
            this.playCreepingSound();
        } else if (this.creepingOscillators.length > 0) {
            // Adjust volume based on number of creeping ghosts
            const volumeMultiplier = Math.min(creepingGhostCount * 0.3, 0.8); // Max 80% volume
            this.creepingOscillators.forEach(item => {
                item.gainNode.gain.setValueAtTime(this.masterVolume * volumeMultiplier, this.audioContext.currentTime);
            });
        }
    }

    playCreepingSound() {
        if (!this.enabled || !this.audioContext || !this.sounds['creep']) return;

        try {
            const ctx = this.audioContext;
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
        } catch (e) {
            console.debug('Creeping audio playback not available:', e.message);
        }
    }

    stopCreepingSound() {
        if (!this.audioContext) return;

        this.creepingOscillators.forEach(item => {
            try {
                // Fade out before stopping
                item.gainNode.gain.setValueAtTime(item.gainNode.gain.value, this.audioContext.currentTime);
                item.gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                item.oscillator.stop(this.audioContext.currentTime + 0.2);
            } catch (e) {
                console.debug('Error stopping creeping audio:', e.message);
            }
        });

        this.creepingOscillators = [];
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
