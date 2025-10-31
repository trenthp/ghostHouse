export class AudioManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.masterVolume = 0.5;

        this.initSounds();
    }

    initSounds() {
        // Create simple beep sounds using Web Audio API
        this.createSound('spawn', 1000, 0.2, 'sine'); // Ghost spawn
        this.createSound('scare', 600, 0.3, 'square'); // Ghost scare
        this.createSound('combo', 800, 0.25, 'sine'); // Combo notification
        this.createSound('success', 1200, 0.2, 'sine'); // Success sound
    }

    createSound(name, frequency, duration, waveType = 'sine') {
        this.sounds[name] = { frequency, duration, waveType };
    }

    playSound(soundName) {
        if (!this.enabled || !this.sounds[soundName]) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const sound = this.sounds[soundName];

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = sound.waveType;
            oscillator.frequency.value = sound.frequency;

            // Fade out
            gainNode.gain.setValueAtTime(this.masterVolume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + sound.duration);
        } catch (e) {
            console.debug('Audio playback not available:', e.message);
        }
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    toggleAudio(enabled) {
        this.enabled = enabled;
    }
}
