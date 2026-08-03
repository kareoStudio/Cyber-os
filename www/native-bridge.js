/* Cyber OS Native Bridge v2.0 - Kareo Studio */

const NativeBridge = {
    isNative: false,
    plugins: {},

    init() {
        this.isNative = (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform());
        if (this.isNative) {
            this.plugins = {
                wifi: Capacitor.Plugins.CyberWifi,
                bluetooth: Capacitor.Plugins.CyberBluetooth,
                gps: Capacitor.Plugins.CyberGPS,
                battery: Capacitor.Plugins.CyberBattery,
                storage: Capacitor.Plugins.CyberStorage,
                network: Capacitor.Plugins.CyberNetwork,
                vibrate: Capacitor.Plugins.CyberVibrate,
                torch: Capacitor.Plugins.CyberTorch,
                device: Capacitor.Plugins.CyberDevice
            };
            console.log('[CyberOS] Native platform detected. All plugins loaded.');
        } else {
            console.log('[CyberOS] Browser mode. Using simulated data.');
        }
    },

    async scanWifi() {
        if (!this.isNative) return this._fakeWifi();
        const res = await this.plugins.wifi.scan();
        return res.networks.map(n => ({
            name: n.ssid || 'Hidden Network',
            dbm: n.level,
            sec: n.capabilities.includes('WPA3') ? 'WPA3' : 
                 n.capabilities.includes('WPA2') ? 'WPA2' : 
                 n.capabilities.includes('WPA') ? 'WPA' : 'OPEN',
            ch: Math.floor((n.frequency - 2407) / 5)
        }));
    },
    _fakeWifi() {
        return [
            { name: 'CYBER_HUB_5G', dbm: -42, sec: 'WPA3', ch: 36 },
            { name: 'NEO_TOKYO_PUBLIC', dbm: -58, sec: 'WPA2', ch: 6 },
            { name: 'DARK_NET_NODE', dbm: -67, sec: 'WPA3', ch: 149 },
            { name: 'GHOST_IN_SHELL', dbm: -75, sec: 'OPEN', ch: 11 }
        ];
    },

    async scanBluetooth() {
        if (!this.isNative) return this._fakeBluetooth();
        const res = await this.plugins.bluetooth.scan();
        return res.devices.map(d => ({
            name: d.name || 'Unknown Device',
            address: d.address,
            rssi: d.rssi
        }));
    },
    _fakeBluetooth() {
        return [
            { name: 'CYBER_HUD_GLASSES', address: 'AA:BB:CC:11:22:33', rssi: -52 },
            { name: 'NEURAL_BAND_V2', address: 'DD:EE:FF:44:55:66', rssi: -68 }
        ];
    },

    async getGPS() {
        if (!this.isNative) return this._fakeGPS();
        const res = await this.plugins.gps.getLocation();
        return {
            lat: res.latitude, lng: res.longitude,
            accuracy: res.accuracy, altitude: res.altitude,
            speed: res.speed, provider: res.provider
        };
    },
    _fakeGPS() {
        return { lat: 35.6762, lng: 139.6503, accuracy: 5, altitude: 0, speed: 0, provider: 'simulated' };
    },

    async getBattery() {
        if (!this.isNative) return this._fakeBattery();
        const res = await this.plugins.battery.getStatus();
        return {
            level: res.level, charging: res.charging,
            ac: res.ac, usb: res.usb, wireless: res.wireless,
            temp: res.temperature, voltage: res.voltage
        };
    },
    _fakeBattery() {
        return { level: 98, charging: true, ac: true, usb: false, wireless: false, temp: 32.5, voltage: 4200 };
    },

    async getStorage() {
        if (!this.isNative) return this._fakeStorage();
        const res = await this.plugins.storage.getInfo();
        return { totalGB: res.totalGB, usedGB: res.usedGB, freeGB: res.freeGB, usedPercent: res.usedPercent };
    },
    _fakeStorage() {
        return { totalGB: "128.00", usedGB: "65.20", freeGB: "62.80", usedPercent: 51 };
    },

    async getNetwork() {
        if (!this.isNative) return this._fakeNetwork();
        const res = await this.plugins.network.getInfo();
        return { connected: res.connected, type: res.type, ssid: res.ssid || 'Unknown', speedMbps: res.speedMbps || 0, rssi: res.rssi || 0 };
    },
    _fakeNetwork() {
        return { connected: true, type: 'WIFI', ssid: '"CYBER_HUB_5G"', speedMbps: 866, rssi: -42 };
    },

    async vibrate(ms = 200) {
        if (!this.isNative) { console.log('[Vibrate] Simulated: ' + ms + 'ms'); return; }
        await this.plugins.vibrate.vibrate({ duration: ms });
    },

    async torch(on = true) {
        if (!this.isNative) { console.log('[Torch] Simulated: ' + (on ? 'ON' : 'OFF')); return; }
        await this.plugins.torch.toggle({ on: on });
    },

    async getDevice() {
        if (!this.isNative) return this._fakeDevice();
        const res = await this.plugins.device.getInfo();
        return {
            brand: res.brand, model: res.model, device: res.device,
            manufacturer: res.manufacturer, androidVersion: res.androidVersion,
            sdkInt: res.sdkInt, hardware: res.hardware, board: res.board,
            serial: res.serial, fingerprint: res.fingerprint
        };
    },
    _fakeDevice() {
        return {
            brand: 'Browser', model: navigator.platform, device: 'Web',
            manufacturer: 'Mozilla', androidVersion: 'N/A', sdkInt: 0,
            hardware: 'CPU', board: 'WebKit', serial: 'WEB', fingerprint: navigator.userAgent
        };
    }
};

if (typeof Capacitor !== 'undefined') {
    NativeBridge.init();
} else {
    window.addEventListener('load', () => NativeBridge.init());
  }
