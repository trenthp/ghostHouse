export class LocationManager {
    constructor() {
        this.targetLat = parseFloat(import.meta.env.VITE_TARGET_LAT || '28.4191143');
        this.targetLng = parseFloat(import.meta.env.VITE_TARGET_LNG || '-81.4958061');
        this.targetAddress = import.meta.env.VITE_TARGET_ADDRESS || 'Halloween House';

        this.currentLat = null;
        this.currentLng = null;
        this.distance = null;
        this.isTracking = false;
        this.callback = null;
        this.watchId = null;
    }

    startTracking(callback) {
        this.callback = callback;
        this.isTracking = true;

        if (!navigator.geolocation) {
            console.warn('Geolocation not supported');
            this.simulateTracking();
            return;
        }

        // Initial position
        navigator.geolocation.getCurrentPosition(
            (position) => this.onPositionUpdate(position),
            (error) => {
                console.warn('Geolocation error:', error);
                this.simulateTracking();
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );

        // Watch position
        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.onPositionUpdate(position),
            (error) => console.warn('Watch position error:', error),
            { enableHighAccuracy: true, maximumAge: 1000 }
        );
    }

    onPositionUpdate(position) {
        this.currentLat = position.coords.latitude;
        this.currentLng = position.coords.longitude;
        this.distance = this.calculateDistance(
            this.currentLat,
            this.currentLng,
            this.targetLat,
            this.targetLng
        );

        if (this.callback) {
            this.callback({
                currentLat: this.currentLat,
                currentLng: this.currentLng,
                targetLat: this.targetLat,
                targetLng: this.targetLng,
                distance: this.distance,
                address: this.targetAddress
            });
        }
    }

    // Haversine formula for distance calculation
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; // Convert to meters
    }

    toRad(degrees) {
        return degrees * Math.PI / 180;
    }

    simulateTracking() {
        // Simulate being near the target
        setTimeout(() => {
            this.currentLat = this.targetLat + (Math.random() - 0.5) * 0.005;
            this.currentLng = this.targetLng + (Math.random() - 0.5) * 0.005;
            this.distance = this.calculateDistance(
                this.currentLat,
                this.currentLng,
                this.targetLat,
                this.targetLng
            );

            if (this.callback) {
                this.callback({
                    currentLat: this.currentLat,
                    currentLng: this.currentLng,
                    targetLat: this.targetLat,
                    targetLng: this.targetLng,
                    distance: this.distance,
                    address: this.targetAddress
                });
            }
        }, 500);
    }

    stopTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
        }
        this.isTracking = false;
    }

    getDistance() {
        return this.distance;
    }
}
