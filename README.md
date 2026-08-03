# Cyber OS - Kareo Studio (Auto Build)
## Package: com.kareostudio

---

## Aapko Kya Karna Hai (Sirf 3 Steps)

### Step 1: Folder Setup
```
cyber-os/
├── www/                          ← Aapka HTML project
│   ├── index.html
│   ├── css/
│   ├── js/
│   ├── assets/
│   └── native-bridge.js         ← ZIP se copy
│
├── android-custom/               ← ZIP se copy
│   ├── AndroidManifest.xml
│   ├── java/com/kareostudio/     ← 10 Java files
│   └── res/values/strings.xml
│
├── .github/workflows/            ← ZIP se copy
│   └── build-apk.yml
│
├── capacitor.config.json         ← ZIP se copy
└── package.json                  ← ZIP se copy
```

### Step 2: HTML Mein Bridge Add Karein
`www/index.html` ke `<head>` mein:
```html
<script src="native-bridge.js"></script>
```

### Step 3: GitHub Push
```bash
git init
git add .
git commit -m "Cyber OS"
git branch -M main
git remote add origin https://github.com/YOURNAME/cyber-os.git
git push -u origin main
```

**Bas!** GitHub Actions khud APK build karega.

---

## Apps Ko Real Kaise Banayein

### WiFi
```javascript
const populate = async () => {
    let ssids = await NativeBridge.scanWifi();
    // render...
};
```

### Bluetooth
```javascript
const scan = async () => {
    let devices = await NativeBridge.scanBluetooth();
    // render...
};
```

### GPS
```javascript
const loc = await NativeBridge.getGPS();
// loc.lat, loc.lng, loc.accuracy
```

### Battery
```javascript
const b = await NativeBridge.getBattery();
// b.level, b.charging, b.temp
```

### Storage
```javascript
const s = await NativeBridge.getStorage();
// s.totalGB, s.usedGB, s.freeGB
```

### Device
```javascript
const d = await NativeBridge.getDevice();
// d.brand, d.model, d.androidVersion
```

### Vibrate
```javascript
NativeBridge.vibrate(100);
```

### Torch
```javascript
NativeBridge.torch(true);   // ON
NativeBridge.torch(false);  // OFF
```
