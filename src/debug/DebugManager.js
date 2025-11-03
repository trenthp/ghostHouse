export class DebugManager {
    constructor() {
        this.logs = [];
        this.maxLogs = 20;
        this.panel = document.getElementById('debugPanel');
        this.toggle = document.getElementById('debugToggle');
        this.isVisible = false;

        if (this.toggle) {
            this.toggle.addEventListener('click', () => this.togglePanel());
        }

        this.log('🐛 Debug Panel Initialized', 'info');
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = { timestamp, message, type };
        this.logs.push(logEntry);

        // Keep only recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        this.updatePanel();
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    logWebXR(message) {
        this.log(`🎮 ${message}`, 'webxr');
    }

    logAR(message, isSuccess = true) {
        const prefix = isSuccess ? '✅ AR' : '❌ AR';
        this.log(`${prefix}: ${message}`, isSuccess ? 'success' : 'error');
    }

    logGhost(message) {
        this.log(`👻 ${message}`, 'ghost');
    }

    logLocation(message) {
        this.log(`📍 ${message}`, 'location');
    }

    updatePanel() {
        if (!this.panel) return;

        let html = '<div style="font-weight: bold; margin-bottom: 8px;">AR Debug Log:</div>';

        this.logs.forEach(log => {
            let className = 'debug-ok';
            if (log.type === 'error') className = 'debug-error';
            else if (log.type === 'warn') className = 'debug-warn';

            html += `<div class="debug-line"><span class="${className}">${log.timestamp}</span> ${log.message}</div>`;
        });

        this.panel.innerHTML = html;
    }

    togglePanel() {
        this.isVisible = !this.isVisible;
        if (this.panel) {
            this.panel.classList.toggle('active');
        }
    }

    setStatus(key, value) {
        this.log(`Status: ${key} = ${value}`, 'info');
    }

    reportARSupport(isSupported) {
        this.logAR(`WebXR supported: ${isSupported}`, isSupported);
    }

    reportSessionStart() {
        this.logAR('Session started successfully!', true);
    }

    reportSessionError(error) {
        this.logAR(`Session failed: ${error}`, false);
    }

    reportGhostSpawn(count) {
        this.logGhost(`Spawned (total: ${count})`);
    }

    reportGhostScare() {
        this.logGhost('Scared!');
    }

    reportLocationUpdate(distance, isAtLocation) {
        const status = isAtLocation ? 'AT LOCATION' : `${Math.round(distance)}m away`;
        this.logLocation(status);
    }
}
