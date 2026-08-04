/* Cyber OS Native Bridge v3.0 - Kareo Studio
   Debug version with proper error handling
*/

const NativeBridge = {
    isNative: false,
    plugins: {},
    debug: true,

    log(msg) {
        if (this.debug) console.log('[CyberOS Bridge] ' + msg);
    },

    init() {
        this.log('Initializing...');

        // Check if Capacitor is available
        if (typeof Capacitor === 'undefined') {
            this.log('Capacitor not found - Browser mode');
            this.isNative = false;
            return;
        }

        this.isNative = Capacitor.isNativePlatform();
        this.log('isNative: ' + this.isNative);

        if (this.isNative) {
            try {
                this.plugins = {
                    wifi: Capacitor.Plugins.CyberWifi,
                    bluetooth: Capacitor.Plugins.CyberBluetooth,
                    gps: Capacitor.Plugins.CyberGPS,
                    battery: Capacitor.Plugins.CyberBattery,
                    storage: Capacitor.Plugins.CyberStorage,
                    network: Capacitor.Plugins.CyberNetwork,
                    vibrate: Capacitor.Plugins.CyberVibrate,
                    torch: Capacitor.Plugins.CyberTorch,
                    device: Capacitor.Plugins.CyberDevice,
                    microphone: Capacitor.Plugins.CyberMicrophone
                };

                // Verify all plugins loaded
                for (let key in this.plugins) {
                    if (!this.plugins[key]) {
                        this.log('WARNING: Plugin "' + key + '" not found');
                    } else {
                        this.log('Plugin "' + key + '" loaded');
                    }
                }

                this.log('All native plugins loaded successfully');
            } catch (e) {
                this.log('ERROR loading plugins: ' + e.message);
                this.isNative = false;
            }
        } else {
            this.log('Running in browser - simulated data mode');
        }
    },

    // ====== 1. WIFI ======
    async scanWifi() {
        this.log('scanWifi() called');
        if (!this.isNative) return this._fakeWifi();
        try {
            const res = await this.plugins.wifi.scan();
            this.log('WiFi scan returned ' + (res.networks ? res.networks.length : 0) + ' networks');
            return res.networks.map(n => ({
                name: n.ssid || 'Hidden Network',
                dbm: n.level,
                sec: n.capabilities.includes('WPA3') ? 'WPA3' : 
                     n.capabilities.includes('WPA2') ? 'WPA2' : 
                     n.capabilities.includes('WPA') ? 'WPA' : 'OPEN',
                ch: Math.floor((n.frequency - 2407) / 5)
            }));
        } catch (e) {
            this.log('WiFi scan error: ' + e.message);
            throw e;
        }
    },
    _fakeWifi() {
        return [
            { name: 'CYBER_HUB_5G', dbm: -42, sec: 'WPA3', ch: 36 },
            { name: 'NEO_TOKYO_PUBLIC', dbm: -58, sec: 'WPA2', ch: 6 },
            { name: 'DARK_NET_NODE', dbm: -67, sec: 'WPA3', ch: 149 },
            { name: 'GHOST_IN_SHELL', dbm: -75, sec: 'OPEN', ch: 11 }
        ];
    },

    // ====== 2. BLUETOOTH ======
    async scanBluetooth() {
        this.log('scanBluetooth() called');
        if (!this.isNative) return this._fakeBluetooth();
        try {
            const res = await this.plugins.bluetooth.scan();
            this.log('Bluetooth scan returned ' + (res.devices ? res.devices.length : 0) + ' devices');
            return res.devices.map(d => ({
                name: d.name || 'Unknown Device',
                address: d.address,
                rssi: d.rssi
            }));
        } catch (e) {
            this.log('Bluetooth scan error: ' + e.message);
            throw e;
        }
    },
    _fakeBluetooth() {
        return [
            { name: 'CYBER_HUD_GLASSES', address: 'AA:BB:CC:11:22:33', rssi: -52 },
            { name: 'NEURAL_BAND_V2', address: 'DD:EE:FF:44:55:66', rssi: -68 }
        ];
    },

    // ====== 3. GPS ======
    async getGPS() {
        this.log('getGPS() called');
        if (!this.isNative) return this._fakeGPS();
        try {
            const res = await this.plugins.gps.getLocation();
            this.log('GPS: ' + res.latitude + ', ' + res.longitude);
            return {
                lat: res.latitude, lng: res.longitude,
                accuracy: res.accuracy, altitude: res.altitude,
                speed: res.speed, provider: res.provider
            };
        } catch (e) {
            this.log('GPS error: ' + e.message);
            throw e;
        }
    },
    _fakeGPS() {
        return { lat: 35.6762, lng: 139.6503, accuracy: 5, altitude: 0, speed: 0, provider: 'simulated' };
    },

    // ====== 4. BATTERY ======
    async getBattery() {
        this.log('getBattery() called');
        if (!this.isNative) return this._fakeBattery();
        try {
            const res = await this.plugins.battery.getStatus();
            return {
                level: res.level, charging: res.charging,
                ac: res.ac, usb: res.usb, wireless: res.wireless,
                temp: res.temperature, voltage: res.voltage
            };
        } catch (e) {
            this.log('Battery error: ' + e.message);
            throw e;
        }
    },
    _fakeBattery() {
        return { level: 98, charging: true, ac: true, usb: false, wireless: false, temp: 32.5, voltage: 4200 };
    },

    // ====== 5. STORAGE ======
    async getStorage() {
        this.log('getStorage() called');
        if (!this.isNative) return this._fakeStorage();
        try {
            const res = await this.plugins.storage.getInfo();
            return { totalGB: res.totalGB, usedGB: res.usedGB, freeGB: res.freeGB, usedPercent: res.usedPercent };
        } catch (e) {
            this.log('Storage error: ' + e.message);
            throw e;
        }
    },
    _fakeStorage() {
        return { totalGB: "128.00", usedGB: "65.20", freeGB: "62.80", usedPercent: 51 };
    },

    // ====== 6. NETWORK ======
    async getNetwork() {
        this.log('getNetwork() called');
        if (!this.isNative) return this._fakeNetwork();
        try {
            const res = await this.plugins.network.getInfo();
            return { connected: res.connected, type: res.type, ssid: res.ssid || 'Unknown', speedMbps: res.speedMbps || 0, rssi: res.rssi || 0 };
        } catch (e) {
            this.log('Network error: ' + e.message);
            throw e;
        }
    },
    _fakeNetwork() {
        return { connected: true, type: 'WIFI', ssid: '"CYBER_HUB_5G"', speedMbps: 866, rssi: -42 };
    },

    // ====== 7. VIBRATE ======
    async vibrate(ms = 200) {
        this.log('vibrate(' + ms + ') called');
        if (!this.isNative) { this.log('Simulated vibrate'); return; }
        try {
            await this.plugins.vibrate.vibrate({ duration: ms });
        } catch (e) {
            this.log('Vibrate error: ' + e.message);
        }
    },

    // ====== 8. TORCH ======
    async torch(on = true) {
        this.log('torch(' + on + ') called');
        if (!this.isNative) { this.log('Simulated torch'); return; }
        try {
            await this.plugins.torch.toggle({ on: on });
            this.log('Torch toggled successfully');
        } catch (e) {
            this.log('Torch error: ' + e.message);
            throw e;
        }
    },

    // ====== 9. DEVICE INFO ======
    async getDevice() {
        this.log('getDevice() called');
        if (!this.isNative) return this._fakeDevice();
        try {
            const res = await this.plugins.device.getInfo();
            return {
                brand: res.brand, model: res.model, device: res.device,
                manufacturer: res.manufacturer, androidVersion: res.androidVersion,
                sdkInt: res.sdkInt, hardware: res.hardware, board: res.board,
                serial: res.serial, fingerprint: res.fingerprint
            };
        } catch (e) {
            this.log('Device error: ' + e.message);
            throw e;
        }
    },
    _fakeDevice() {
        return {
            brand: 'Browser', model: navigator.platform, device: 'Web',
            manufacturer: 'Mozilla', androidVersion: 'N/A', sdkInt: 0,
            hardware: 'CPU', board: 'WebKit', serial: 'WEB', fingerprint: navigator.userAgent
        };
    },

    // ====== 10. MICROPHONE (NEW) ======
    async startMicrophone() {
        this.log('startMicrophone() called');
        if (!this.isNative) { this.log('Simulated microphone'); return true; }
        try {
            await this.plugins.microphone.start();
            this.log('Microphone started');
            return true;
        } catch (e) {
            this.log('Microphone error: ' + e.message);
            throw e;
        }
    },

    async stopMicrophone() {
        this.log('stopMicrophone() called');
        if (!this.isNative) return;
        try {
            await this.plugins.microphone.stop();
        } catch (e) {}
    },

    async getMicrophoneLevel() {
        if (!this.isNative) return Math.random() * 100;
        try {
            const res = await this.plugins.microphone.getLevel();
            return res.level;
        } catch (e) {
            return 0;
        }
    }
};

// Auto init with retry
function initBridge() {
    if (typeof Capacitor !== 'undefined') {
        NativeBridge.init();
    } else {
        console.log('[CyberOS] Capacitor not loaded yet, waiting...');
        setTimeout(initBridge, 500);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBridge);
} else {
    initBridge();
}
