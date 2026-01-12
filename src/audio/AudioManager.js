export class AudioManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.masterVolume = 0.5;
        this.audioContext = null;

        this.initAudioContext();
        this.initSounds();
    }

    initAudioContext() {
        try {
            this.audioContext = new window.AudioContext();
        } catch (e) {
            // AudioContext not available - audio will be disabled
        }
    }

    initSounds() {
        // Simple beep sounds using Web Audio API
        this.createSound('spawn', 1000, 0.2, 'sine');    // Ghost spawn
        this.createSound('scare', 600, 0.3, 'square');   // Ghost scare
        this.createSound('success', 1200, 0.2, 'sine');  // Victory sound
    }

    createSound(name, frequency, duration, waveType = 'sine') {
        this.sounds[name] = { frequency, duration, waveType };
    }

    playSound(soundName) {
        if (!this.enabled || !this.sounds[soundName]) return;

        const sound = this.sounds[soundName];

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
            // Audio playback not available
        }
    }

    _getAudioContext() {
        if (this.audioContext) {
            return this.audioContext;
        }

        try {
            const ctx = new window.AudioContext();
            this.audioContext = ctx;
            return ctx;
        } catch (e) {
            return null;
        }
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    toggleAudio(enabled) {
        this.enabled = enabled;
    }
}
