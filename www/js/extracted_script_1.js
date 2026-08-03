// WEB AUDIO API SYNTHESIZER ENGINE (Pure Web Audio - No external audio files required)
        class CyberAudio {
            constructor() {
                this.ctx = null;
                this.enabled = true;
                this.volume = 0.1;
            }

            init() {
                if (!this.ctx) {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    if (AudioContext) {
                        this.ctx = new AudioContext();
                    }
                }
            }

            playTone(freq = 800, type = 'sine', duration = 0.05, vol = null) {
                if (!this.enabled) return;
                try {
                    this.init();
                    if (!this.ctx) return;
                    const v = vol !== null ? vol : this.volume;
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = type;
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(v, this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start();
                    osc.stop(this.ctx.currentTime + duration);
                } catch(e) {}
            }

            click() { this.playTone(1200, 'sine', 0.03, 0.05); }
            hover() { this.playTone(1600, 'sine', 0.015, 0.02); }
            scan() { this.playTone(600, 'sawtooth', 0.08, 0.06); }
            alert() { this.playTone(320, 'square', 0.2, 0.12); }
            typing() { this.playTone(1300 + Math.random()*400, 'triangle', 0.02, 0.03); }
            success() { 
                this.playTone(800, 'sine', 0.05, 0.05);
                setTimeout(() => this.playTone(1200, 'sine', 0.08, 0.05), 60);
            }
            startupChime() {
                if (!this.enabled) return;
                const notes = [440, 554.37, 659.25, 880];
                notes.forEach((freq, idx) => {
                    setTimeout(() => this.playTone(freq, 'sine', 0.3, 0.08), idx * 120);
                });
            }
        }

        const sound = new CyberAudio();

        const SettingsManager = {
            defaults: {
                theme: 'matrix',
                wallpaper: 'matrix',
                soundEnabled: true,
                fps: 60,
                batterySaver: false,
                scanlines: true,
                brightness: 100,
                volume: 0.1,
                highContrast: false
            },
            data: {},

            load() {
                const saved = localStorage.getItem('cyber_os_v6_settings');
                if (saved) {
                    try {
                        this.data = { ...this.defaults, ...JSON.parse(saved) };
                    } catch(e) {
                        this.data = { ...this.defaults };
                    }
                } else {
                    this.data = { ...this.defaults };
                }
                this.apply();
            },

            save() {
                localStorage.setItem('cyber_os_v6_settings', JSON.stringify(this.data));
            },

            apply() {
                // Apply theme
                document.body.className = document.body.className.replace(/theme-\w+/g, '');
                if (this.data.theme !== 'matrix') {
                    document.body.classList.add(`theme-${this.data.theme}`);
                }
                if (this.data.highContrast) {
                    document.body.classList.add('high-contrast');
                }

                // Apply Audio
                sound.enabled = this.data.soundEnabled;
                sound.volume = this.data.volume;

                // Apply Scanlines
                const scanlines = document.getElementById('scanline-overlay');
                if (scanlines) scanlines.style.display = this.data.scanlines ? 'block' : 'none';

                // Apply Brightness
                const brightOverlay = document.getElementById('brightness-overlay');
                if (brightOverlay) brightOverlay.style.opacity = (1 - (this.data.brightness / 100)).toFixed(2);

                QuickSettings.syncUI();
            }
        };

        const NotificationSystem = {
            logs: [],

            notify(title, message, type = 'info') {
                const item = {
                    id: Date.now(),
                    title,
                    message,
                    type,
                    time: new Date().toLocaleTimeString()
                };
                this.logs.unshift(item);
                if (this.logs.length > 50) this.logs.pop();

                this.showToast(item);
                this.updateBadge();
                this.renderPanelList();
            },

            showToast(item) {
                const container = document.getElementById('toast-container');
                if (!container) return;

                const toast = document.createElement('div');
                toast.className = `toast-msg cyber-panel p-3 rounded-lg flex items-center gap-3 border shadow-lg max-w-xs sm:max-w-sm ${
                    item.type === 'alert' ? 'border-red-500 text-red-400' : 'border-[var(--border-color)] text-gray-200'
                }`;

                const icon = item.type === 'alert' ? 'fa-triangle-exclamation text-red-500' : 'fa-bell text-[var(--primary)]';

                toast.innerHTML = `
                    <i class="fa-solid ${icon} text-lg"></i>
                    <div class="flex-1 overflow-hidden">
                        <div class="font-bold text-xs ${item.type === 'alert' ? 'text-red-400' : 'text-[var(--primary)]'}">${item.title}</div>
                        <div class="text-[10px] text-gray-300 truncate">${item.message}</div>
                    </div>
                `;

                container.appendChild(toast);
                sound.scan();

                setTimeout(() => {
                    toast.style.opacity = '0';
                    toast.style.transition = 'opacity 0.3s';
                    setTimeout(() => toast.remove(), 300);
                }, 3500);
            },

            updateBadge() {
                const badge = document.getElementById('taskbar-noti-badge');
                if (badge) badge.classList.remove('hidden');
            },

            togglePanel() {
                sound.click();
                const panel = document.getElementById('notification-panel');
                const badge = document.getElementById('taskbar-noti-badge');
                if (badge) badge.classList.add('hidden');
                if (panel) panel.classList.toggle('hidden');
                this.renderPanelList();
            },

            renderPanelList() {
                const list = document.getElementById('noti-panel-list');
                if (!list) return;
                if (this.logs.length === 0) {
                    list.innerHTML = `<div class="text-center py-8 text-gray-500 text-xs">No notifications logged.</div>`;
                    return;
                }
                list.innerHTML = this.logs.map(log => `
                    <div class="p-2 bg-black/60 rounded border-l-2 ${log.type === 'alert' ? 'border-l-red-500' : 'border-l-[var(--primary)]'} text-xs">
                        <div class="flex justify-between items-center">
                            <span class="font-bold text-white">${log.title}</span>
                            <span class="text-[9px] text-gray-400">${log.time}</span>
                        </div>
                        <div class="text-[10px] text-gray-300 mt-1">${log.message}</div>
                    </div>
                `).join('');
            },

            clearAll() {
                sound.click();
                this.logs = [];
                this.renderPanelList();
            }
        };

        const WallpaperEngine = {
            canvas: null,
            ctx: null,
            mode: 'matrix',
            particles: [],

            init() {
                this.canvas = document.getElementById('bg-canvas');
                if (!this.canvas) return;
                this.ctx = this.canvas.getContext('2d');
                this.resize();
                window.addEventListener('resize', () => this.resize());
                this.startLoop();
            },

            resize() {
                if (!this.canvas) return;
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            },

            setMode(mode) {
                this.mode = mode;
                SettingsManager.data.wallpaper = mode;
                SettingsManager.save();
                NotificationSystem.notify("WALLPAPER", `Canvas background mode: ${mode.toUpperCase()}`, "info");
            },

            startLoop() {
                const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ$#@%';
                const fontSize = 14;
                let cols = Math.floor(window.innerWidth / fontSize);
                let drops = Array(cols).fill(1);

                this.particles = Array(60).fill(0).map(() => ({
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: (Math.random() - 0.5) * 1.5
                }));

                let lastFrame = 0;
                let radarAngle = 0;

                const render = (time) => {
                    const delta = time - lastFrame;
                    const targetInterval = 1000 / (SettingsManager.data.fps || 60);

                    if (delta >= targetInterval) {
                        lastFrame = time;
                        const w = this.canvas.width;
                        const h = this.canvas.height;
                        const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary') || '#00ff66';

                        // 1. Matrix Rain Mode
                        if (this.mode === 'matrix') {
                            this.ctx.fillStyle = 'rgba(5, 8, 10, 0.18)';
                            this.ctx.fillRect(0, 0, w, h);
                            this.ctx.fillStyle = primaryColor;
                            this.ctx.font = fontSize + 'px monospace';

                            for (let i = 0; i < drops.length; i++) {
                                const text = chars.charAt(Math.floor(Math.random() * chars.length));
                                this.ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                                if (drops[i] * fontSize > h && Math.random() > 0.975) drops[i] = 0;
                                drops[i]++;
                            }
                        } 
                        // 2. Cyber Grid Mode
                        else if (this.mode === 'grid') {
                            this.ctx.fillStyle = '#05080a';
                            this.ctx.fillRect(0, 0, w, h);
                            this.ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border-color') || 'rgba(0,255,102,0.2)';
                            this.ctx.lineWidth = 1;

                            const step = 40;
                            for (let x = 0; x < w; x += step) {
                                this.ctx.beginPath();
                                this.ctx.moveTo(x, 0);
                                this.ctx.lineTo(x, h);
                                this.ctx.stroke();
                            }
                            for (let y = 0; y < h; y += step) {
                                this.ctx.beginPath();
                                this.ctx.moveTo(0, y);
                                this.ctx.lineTo(w, y);
                                this.ctx.stroke();
                            }
                        } 
                        // 3. Cyber Particles Mode
                        else if (this.mode === 'particles') {
                            this.ctx.fillStyle = '#05080a';
                            this.ctx.fillRect(0, 0, w, h);
                            this.ctx.fillStyle = primaryColor;
                            this.ctx.strokeStyle = primaryColor;

                            this.particles.forEach((p, i) => {
                                p.x += p.vx; p.y += p.vy;
                                if (p.x < 0 || p.x > w) p.vx *= -1;
                                if (p.y < 0 || p.y > h) p.vy *= -1;

                                this.ctx.beginPath();
                                this.ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
                                this.ctx.fill();

                                for (let j = i + 1; j < this.particles.length; j++) {
                                    const p2 = this.particles[j];
                                    const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                                    if (dist < 100) {
                                        this.ctx.globalAlpha = 1 - dist / 100;
                                        this.ctx.beginPath();
                                        this.ctx.moveTo(p.x, p.y);
                                        this.ctx.lineTo(p2.x, p2.y);
                                        this.ctx.stroke();
                                        this.ctx.globalAlpha = 1.0;
                                    }
                                }
                            });
                        }
                        // 4. Radar Sweep Mode
                        else if (this.mode === 'radar') {
                            this.ctx.fillStyle = 'rgba(5, 8, 10, 0.15)';
                            this.ctx.fillRect(0, 0, w, h);
                            const cx = w / 2, cy = h / 2, r = Math.min(cx, cy) - 40;

                            this.ctx.strokeStyle = primaryColor;
                            this.ctx.beginPath();
                            this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
                            this.ctx.stroke();

                            radarAngle += 0.03;
                            this.ctx.beginPath();
                            this.ctx.moveTo(cx, cy);
                            this.ctx.lineTo(cx + Math.cos(radarAngle) * r, cy + Math.sin(radarAngle) * r);
                            this.ctx.stroke();
                        }

                        DevHUD.updateFPS(Math.round(1000 / Math.max(delta, 1)));
                    }
                    requestAnimationFrame(render);
                };
                requestAnimationFrame(render);
            }
        };

        const WindowManager = {
            windows: {},
            activeZIndex: 100,

            openApp(appId) {
                sound.click();
                if (this.windows[appId]) {
                    this.restoreWindow(appId);
                    this.focusWindow(appId);
                    return;
                }

                const appDef = AppRegistry[appId];
                if (!appDef) return;

                const winEl = document.createElement('div');
                winEl.id = `win-${appId}`;
                winEl.className = 'os-window cyber-panel';
                winEl.style.width = window.innerWidth < 640 ? '94vw' : '650px';
                winEl.style.height = window.innerWidth < 640 ? '75vh' : '450px';
                winEl.style.top = `${60 + (Object.keys(this.windows).length * 20) % 100}px`;
                winEl.style.left = `${Math.max(10, (window.innerWidth / 2 - 325) + (Object.keys(this.windows).length * 20) % 100)}px`;
                winEl.style.zIndex = ++this.activeZIndex;

                winEl.innerHTML = `
                    <div class="window-header p-2.5 flex items-center justify-between">
                        <div class="flex items-center gap-2 pointer-events-none">
                            <i class="${appDef.icon} text-[var(--primary)]"></i>
                            <span class="font-orbitron font-bold text-xs text-[var(--primary)]">${appDef.title}</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button onclick="event.stopPropagation(); WindowManager.minimizeWindow('${appId}')" class="w-5 h-5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center text-[10px]"><i class="fa-solid fa-minus"></i></button>
                            <button onclick="event.stopPropagation(); WindowManager.maximizeWindow('${appId}')" class="w-5 h-5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center text-[10px]"><i class="fa-solid fa-square"></i></button>
                            <button onclick="event.stopPropagation(); WindowManager.closeWindow('${appId}')" class="w-5 h-5 rounded bg-red-900/60 hover:bg-red-600 text-red-300 hover:text-white flex items-center justify-center text-[10px]"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                    <div id="win-body-${appId}" class="flex-1 bg-black/70 p-3 overflow-y-auto text-xs relative">
                        <!-- Injected App Content -->
                    </div>
                    <div class="resize-handle" onmousedown="WindowManager.startResize(event, '${appId}')"></div>
                `;

                document.getElementById('windows-container').appendChild(winEl);
                this.windows[appId] = { el: winEl, maximized: false, handles: [] };

                this.makeDraggable(winEl, winEl.querySelector('.window-header'));
                winEl.onmousedown = () => this.focusWindow(appId);

                this.renderAppSafely(appId);
                this.updateTaskbarTabs();
                DevHUD.updateWindows();
            },

            renderAppSafely(appId) {
                const body = document.getElementById(`win-body-${appId}`);
                if (!body) return;
                try {
                    AppRegistry[appId].render(body, this.windows[appId]);
                } catch(err) {
                    body.innerHTML = `
                        <div class="p-4 text-center space-y-3">
                            <i class="fa-solid fa-triangle-exclamation text-3xl text-red-500 animate-bounce"></i>
                            <div class="font-bold text-red-400">MODULE EXCEPTION HANDLED</div>
                            <p class="text-[10px] text-gray-400 font-mono">${err.message}</p>
                            <button onclick="WindowManager.renderAppSafely('${appId}')" class="px-3 py-1 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)]">
                                Restart Module
                            </button>
                        </div>
                    `;
                }
            },

            focusWindow(appId) {
                if (this.windows[appId]) {
                    this.windows[appId].el.style.zIndex = ++this.activeZIndex;
                    this.updateTaskbarTabs();
                }
            },

            minimizeWindow(appId) {
                sound.click();
                if (this.windows[appId]) {
                    this.windows[appId].el.classList.add('minimized');
                    this.updateTaskbarTabs();
                }
            },

            restoreWindow(appId) {
                if (this.windows[appId]) {
                    if (this.windows[appId].el.classList.contains('minimized')) {
                        this.windows[appId].el.classList.remove('minimized');
                        this.focusWindow(appId);
                    } else {
                        this.focusWindow(appId);
                    }
                }
            },

            maximizeWindow(appId) {
                sound.click();
                if (this.windows[appId]) {
                    const win = this.windows[appId];
                    win.maximized = !win.maximized;
                    win.el.classList.toggle('maximized', win.maximized);
                }
            },

            closeWindow(appId) {
                sound.click();
                if (this.windows[appId]) {
                    if (this.windows[appId].handles) {
                        this.windows[appId].handles.forEach(h => clearInterval(h));
                    }
                    this.windows[appId].el.remove();
                    delete this.windows[appId];
                    this.updateTaskbarTabs();
                    DevHUD.updateWindows();
                }
            },

            makeDraggable(win, header) {
                let posX = 0, posY = 0, mouseX = 0, mouseY = 0;
                header.onmousedown = (e) => {
                    if (win.classList.contains('maximized')) return;
                    e.preventDefault();
                    mouseX = e.clientX;
                    mouseY = e.clientY;
                    document.onmouseup = () => {
                        document.onmouseup = null;
                        document.onmousemove = null;
                    };
                    document.onmousemove = (e2) => {
                        e2.preventDefault();
                        posX = mouseX - e2.clientX;
                        posY = mouseY - e2.clientY;
                        mouseX = e2.clientX;
                        mouseY = e2.clientY;
                        win.style.top = Math.max(0, win.offsetTop - posY) + "px";
                        win.style.left = Math.max(0, win.offsetLeft - posX) + "px";
                    };
                };
            },

            startResize(e, appId) {
                e.preventDefault();
                e.stopPropagation();
                const win = this.windows[appId]?.el;
                if (!win || win.classList.contains('maximized')) return;

                const startW = win.clientWidth;
                const startH = win.clientHeight;
                const startX = e.clientX;
                const startY = e.clientY;

                const doResize = (e2) => {
                    win.style.width = Math.max(280, startW + e2.clientX - startX) + 'px';
                    win.style.height = Math.max(200, startH + e2.clientY - startY) + 'px';
                };
                const stopResize = () => {
                    window.removeEventListener('mousemove', doResize);
                    window.removeEventListener('mouseup', stopResize);
                };
                window.addEventListener('mousemove', doResize);
                window.addEventListener('mouseup', stopResize);
            },

            updateTaskbarTabs() {
                const container = document.getElementById('taskbar-tabs');
                if (!container) return;
                container.innerHTML = Object.keys(this.windows).map(appId => {
                    const app = AppRegistry[appId];
                    const isMin = this.windows[appId].el.classList.contains('minimized');
                    return `
                        <button onclick="WindowManager.toggleTaskbarWindow('${appId}')" class="px-2.5 py-1 rounded ${isMin ? 'bg-black/60 text-gray-400' : 'bg-[var(--primary-dim)] text-[var(--primary)]'} border border-[var(--border-color)] text-[10px] flex items-center gap-1.5 truncate max-w-[130px] hover:border-[var(--primary)]">
                            <i class="${app.icon}"></i> ${app.title}
                        </button>
                    `;
                }).join('');
            },

            toggleTaskbarWindow(appId) {
                if (this.windows[appId]) {
                    if (this.windows[appId].el.classList.contains('minimized')) {
                        this.restoreWindow(appId);
                    } else {
                        this.minimizeWindow(appId);
                    }
                }
            }
        };

        const StartMenu = {
            toggle() {
                sound.click();
                const menu = document.getElementById('start-menu');
                menu.classList.toggle('hidden');
                if (!menu.classList.contains('hidden')) {
                    this.renderApps('all');
                    const inp = document.getElementById('start-search-input');
                    if (inp) {
                        inp.value = '';
                        inp.oninput = () => this.searchApps(inp.value);
                    }
                }
            },

            filterCategory(cat) {
                sound.click();
                this.renderApps(cat);
            },

            searchApps(q) {
                const list = document.getElementById('start-app-list');
                if (!list) return;
                const query = q.trim().toLowerCase();
                const matches = Object.keys(AppRegistry).filter(id => {
                    return AppRegistry[id].title.toLowerCase().includes(query) || id.includes(query);
                });
                this.renderList(matches);
            },

            renderApps(category = 'all') {
                const apps = Object.keys(AppRegistry).filter(id => {
                    if (category === 'all') return true;
                    return AppRegistry[id].cat === category;
                });
                this.renderList(apps);
            },

            renderList(apps) {
                const list = document.getElementById('start-app-list');
                if (!list) return;

                if (apps.length === 0) {
                    list.innerHTML = `<div class="text-center py-4 text-gray-500">No apps found</div>`;
                    return;
                }

                list.innerHTML = apps.map(id => {
                    const app = AppRegistry[id];
                    return `
                        <div onclick="WindowManager.openApp('${id}'); StartMenu.toggle();" class="p-2 rounded hover:bg-[var(--primary-dim)] cursor-pointer flex items-center justify-between text-gray-200 hover:text-[var(--primary)] transition">
                            <div class="flex items-center gap-2.5">
                                <i class="${app.icon} text-[var(--primary)] text-sm"></i>
                                <span class="font-medium text-xs">${app.title}</span>
                            </div>
                            <i class="fa-solid fa-chevron-right text-[9px] text-gray-500"></i>
                        </div>
                    `;
                }).join('');
            }
        };

        const SpotlightSearch = {
            open() {
                sound.click();
                const modal = document.getElementById('spotlight-search');
                modal.classList.remove('hidden');
                const input = document.getElementById('spotlight-input');
                if (input) {
                    input.value = '';
                    input.focus();
                }
            },

            close() {
                const modal = document.getElementById('spotlight-search');
                modal.classList.add('hidden');
            }
        };

        const QuickSettings = {
            wifiOnline: true,
            btOnline: true,
            torchOn: false,

            syncUI() {
                const fpsLabel = document.getElementById('qs-fps-val');
                const fpsSlider = document.getElementById('qs-fps-slider');
                const brightLabel = document.getElementById('qs-bright-val');
                const brightSlider = document.getElementById('qs-bright-slider');
                const audioState = document.getElementById('qs-audio-state');
                const saverState = document.getElementById('qs-saver-state');
                const wifiState = document.getElementById('qs-wifi-state');
                const btState = document.getElementById('qs-bt-state');
                const torchState = document.getElementById('qs-torch-state');
                const torchBtn = document.getElementById('qs-torch-btn');

                if (fpsLabel) fpsLabel.innerText = `${SettingsManager.data.fps || 60} FPS`;
                if (fpsSlider) fpsSlider.value = SettingsManager.data.fps || 60;
                if (brightLabel) brightLabel.innerText = `${SettingsManager.data.brightness || 100}%`;
                if (brightSlider) brightSlider.value = SettingsManager.data.brightness || 100;
                if (audioState) audioState.innerText = SettingsManager.data.soundEnabled ? 'ENABLED' : 'MUTED';
                if (saverState) saverState.innerText = SettingsManager.data.batterySaver ? 'ON' : 'OFF';
                if (wifiState) wifiState.innerText = this.wifiOnline ? 'ONLINE' : 'OFFLINE';
                if (btState) btState.innerText = this.btOnline ? 'READY' : 'DISABLED';
                if (torchState) torchState.innerText = this.torchOn ? 'ON' : 'OFF';

                if (torchBtn) {
                    if (this.torchOn) {
                        torchBtn.className = "p-2 rounded border border-[var(--border-color)] bg-[var(--primary-dim)] text-[var(--primary)] text-left flex items-center gap-2";
                    } else {
                        torchBtn.className = "p-2 rounded border border-gray-700 bg-black/40 text-gray-400 text-left flex items-center gap-2";
                    }
                }
            },

            toggleTorch() {
                sound.click();
                this.torchOn = !this.torchOn;
                if (typeof NativeBridge !== 'undefined' && typeof NativeBridge.torch === 'function') {
                    try {
                        NativeBridge.torch(this.torchOn);
                    } catch(e) {
                        NotificationSystem.notify("TORCH", e.message || "Torch error", "alert");
                    }
                }
                NotificationSystem.notify("TORCH", `Hardware Flashlight ${this.torchOn ? 'ON' : 'OFF'}`, "info");
                this.syncUI();
            },

            togglePanel() {
                sound.click();
                const panel = document.getElementById('quick-settings-panel');
                panel.classList.toggle('hidden');
                if (!panel.classList.contains('hidden')) {
                    this.syncUI();
                }
            },

            toggleWifi() {
                sound.click();
                this.wifiOnline = !this.wifiOnline;
                NotificationSystem.notify("WI-FI", `Interface state: ${this.wifiOnline ? 'ONLINE' : 'OFFLINE'}`, "info");
                this.syncUI();
            },

            toggleBluetooth() {
                sound.click();
                this.btOnline = !this.btOnline;
                NotificationSystem.notify("BLUETOOTH", `BLE transceiver: ${this.btOnline ? 'READY' : 'DISABLED'}`, "info");
                this.syncUI();
            },

            toggleAudio() {
                sound.click();
                SettingsManager.data.soundEnabled = !SettingsManager.data.soundEnabled;
                SettingsManager.save();
                SettingsManager.apply();
            },

            toggleBatterySaver() {
                sound.click();
                SettingsManager.data.batterySaver = !SettingsManager.data.batterySaver;
                SettingsManager.data.fps = SettingsManager.data.batterySaver ? 30 : 60;
                SettingsManager.save();
                SettingsManager.apply();
            },

            setBrightness(val) {
                SettingsManager.data.brightness = parseInt(val, 10);
                SettingsManager.save();
                SettingsManager.apply();
            },

            setFPS(val) {
                const num = parseInt(val, 10);
                SettingsManager.data.fps = num;
                SettingsManager.save();
                SettingsManager.apply();
            }
        };

        const DevHUD = {
            toggle() {
                sound.click();
                const hud = document.getElementById('dev-hud');
                hud.classList.toggle('hidden');
            },
            updateFPS(fps) {
                const el = document.getElementById('hud-fps');
                if (el) el.innerText = fps;
            },
            updateWindows() {
                const el = document.getElementById('hud-wins');
                if (el) el.innerText = Object.keys(WindowManager.windows).length;
            }
        };

        const AppRegistry = {
            'wifi': {
                title: "Wi-Fi Spectrum Scanner",
                icon: "fa-solid fa-wifi",
                cat: "net",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="space-y-3">
                            <div class="flex justify-between items-center bg-black/60 p-2.5 rounded border border-[var(--border-color)]">
                                <div>
                                    <div class="font-bold text-[var(--primary)]">Wi-Fi Receiver</div>
                                    <div class="text-[9px] text-gray-400">Spectrum 2.4 / 5.0 GHz</div>
                                </div>
                                <button id="rescan-wifi" class="px-2.5 py-1 text-xs rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black transition"><i class="fa-solid fa-rotate"></i> Rescan</button>
                            </div>
                            <div id="wifi-list" class="space-y-1.5"></div>
                        </div>
                    `;
                    const populate = async () => {
                        sound.scan();
                        let ssids = [];
                        let isNative = false;

                        if (typeof NativeBridge !== 'undefined' && typeof NativeBridge.scanWifi === 'function') {
                            try {
                                ssids = await NativeBridge.scanWifi();  // Real scan!
                                isNative = true;
                            } catch (e) {
                                NotificationSystem.notify("WI-FI", e.message || "Native scan failed", "alert");
                            }
                        }

                        if (!isNative || !ssids || ssids.length === 0) {
                            ssids = [
                                { name: 'CYBER_HUB_5G', dbm: -42, sec: 'WPA3', ch: 36 },
                                { name: 'NEO_TOKYO_PUBLIC', dbm: -58, sec: 'WPA2', ch: 6 },
                                { name: 'DARK_NET_NODE', dbm: -67, sec: 'WPA3', ch: 149 },
                                { name: 'GHOST_IN_SHELL', dbm: -75, sec: 'OPEN', ch: 11 }
                            ];
                        }

                        const list = container.querySelector('#wifi-list');
                        if (list) {
                            list.innerHTML = ssids.map(s => {
                                const ssidName = s.name || s.ssid || 'UNKNOWN_NET';
                                const dbmVal = s.dbm || s.rssi || -60;
                                const secType = s.sec || s.security || 'WPA2';
                                const channel = s.ch || s.channel || 1;
                                return `
                                    <div class="p-2 bg-black/60 rounded flex justify-between items-center border border-gray-800">
                                        <div>
                                            <div class="font-bold text-white">${ssidName} <span class="text-[9px] text-gray-400">(${secType})</span></div>
                                            <div class="text-[9px] text-gray-400">CH ${channel} | Signal: ${dbmVal} dBm</div>
                                        </div>
                                        <button onclick="NotificationSystem.notify('WI-FI', 'Handshake OK: Connected to ${ssidName}', 'info')" class="px-2 py-0.5 text-[10px] rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black">Connect</button>
                                    </div>
                                `;
                            }).join('');
                        }
                    };
                    container.querySelector('#rescan-wifi').onclick = populate;
                    populate();
                }
            },

            'bluetooth': {
                title: "BLE Bluetooth Transceiver",
                icon: "fa-brands fa-bluetooth-b",
                cat: "net",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="space-y-3">
                            <button id="ble-btn" class="w-full py-2 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] font-bold hover:bg-[var(--primary)] hover:text-black transition">
                                <i class="fa-brands fa-bluetooth-b"></i> Scan BLE Devices
                            </button>
                            <div id="ble-list" class="space-y-1.5"></div>
                        </div>
                    `;
                    const scan = async () => {
                        sound.scan();
                        let devices = [];
                        let isNative = false;

                        if (typeof NativeBridge !== 'undefined' && typeof NativeBridge.scanBluetooth === 'function') {
                            try {
                                devices = await NativeBridge.scanBluetooth();  // Real BLE scan!
                                isNative = true;
                            } catch (e) {
                                NotificationSystem.notify("BLE", e.message || "Native BLE scan error", "alert");
                            }
                        }

                        const list = container.querySelector('#ble-list');
                        if (isNative && devices && devices.length > 0) {
                            if (list) {
                                list.innerHTML = devices.map(d => `
                                    <div class="p-2 bg-black/60 rounded flex justify-between items-center border border-gray-800">
                                        <div><div class="font-bold text-white">${d.name || d.id || 'BLE Device'}</div><div class="text-[9px] text-gray-400">RSSI: ${d.rssi || -60} dBm</div></div>
                                        <button onclick="NotificationSystem.notify('BLE', 'Paired with ${d.name || 'Device'}', 'info')" class="px-2 py-0.5 text-[10px] rounded bg-[var(--primary-dim)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-black">Pair</button>
                                    </div>
                                `).join('');
                            }
                            return;
                        }

                        if (navigator.bluetooth) {
                            try {
                                const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
                                NotificationSystem.notify("BLE", `Paired with ${device.name || 'BLE Device'}`, "info");
                                return;
                            } catch(e) {}
                        }

                        if (list) {
                            list.innerHTML = `
                                <div class="p-2 bg-black/60 rounded flex justify-between items-center border border-gray-800">
                                    <div><div class="font-bold text-white">CYBER_HUD_GLASSES</div><div class="text-[9px] text-gray-400">RSSI: -52 dBm</div></div>
                                    <button onclick="NotificationSystem.notify('BLE', 'Paired HUD Smart Glasses', 'info')" class="px-2 py-0.5 text-[10px] rounded bg-[var(--primary-dim)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-black">Pair</button>
                                </div>
                                <div class="p-2 bg-black/60 rounded flex justify-between items-center border border-gray-800">
                                    <div><div class="font-bold text-white">NEURAL_BAND_V2</div><div class="text-[9px] text-gray-400">RSSI: -68 dBm</div></div>
                                    <button onclick="NotificationSystem.notify('BLE', 'Paired Neural Band', 'info')" class="px-2 py-0.5 text-[10px] rounded bg-[var(--primary-dim)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-black">Pair</button>
                                </div>
                            `;
                        }
                    };
                    container.querySelector('#ble-btn').onclick = scan;
                }
            },

            'network': {
                title: "Network Latency & Speed",
                icon: "fa-solid fa-chart-line",
                cat: "net",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="space-y-3">
                            <div class="grid grid-cols-3 gap-2 text-center">
                                <div class="p-2 bg-black/60 rounded border border-[var(--border-color)]"><div class="text-[9px] text-gray-400">PING</div><div id="p-val" class="font-bold text-[var(--primary)] text-sm">12 ms</div></div>
                                <div class="p-2 bg-black/60 rounded border border-[var(--border-color)]"><div class="text-[9px] text-gray-400">DOWNLOAD</div><div id="dl-val" class="font-bold text-[var(--primary)] text-sm">842 Mbps</div></div>
                                <div class="p-2 bg-black/60 rounded border border-[var(--border-color)]"><div class="text-[9px] text-gray-400">UPLOAD</div><div id="ul-val" class="font-bold text-[var(--primary)] text-sm">418 Mbps</div></div>
                            </div>
                            <button id="run-speedtest" class="w-full py-1.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black font-bold transition">Run Speedtest Cycle</button>
                            <canvas id="net-canvas" class="w-full h-28 bg-black rounded border border-[var(--border-color)]"></canvas>
                        </div>
                    `;
                    const cvs = container.querySelector('#net-canvas');
                    if (!cvs) return;
                    const ctx = cvs.getContext('2d');
                    cvs.width = cvs.clientWidth; cvs.height = cvs.clientHeight;
                    const pts = Array(20).fill(15);

                    container.querySelector('#run-speedtest').onclick = () => {
                        sound.scan();
                        NotificationSystem.notify("NETWORK", "Speedtest cycle initiated...", "info");
                        let count = 0;
                        const stHandle = setInterval(() => {
                            count++;
                            const dl = Math.floor(600 + Math.random()*400);
                            const ul = Math.floor(300 + Math.random()*200);
                            const dlEl = container.querySelector('#dl-val');
                            const ulEl = container.querySelector('#ul-val');
                            if (dlEl) dlEl.innerText = dl + ' Mbps';
                            if (ulEl) ulEl.innerText = ul + ' Mbps';
                            if (count > 10) {
                                clearInterval(stHandle);
                                NotificationSystem.notify("SPEEDTEST", `Result: ${dl} Mbps Down / ${ul} Mbps Up`, "info");
                            }
                        }, 200);
                    };

                    const handle = setInterval(() => {
                        const ping = Math.floor(10 + Math.random()*15);
                        const pEl = container.querySelector('#p-val');
                        if (pEl) pEl.innerText = ping + ' ms';
                        pts.push(ping); pts.shift();

                        ctx.clearRect(0,0,cvs.width, cvs.height);
                        ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--primary') || '#00ff66';
                        ctx.beginPath();
                        const step = cvs.width / (pts.length - 1);
                        pts.forEach((p, i) => {
                            const y = cvs.height - (p/35)*cvs.height;
                            if (i === 0) ctx.moveTo(0, y); else ctx.lineTo(i*step, y);
                        });
                        ctx.stroke();
                    }, 800);
                    winRef.handles.push(handle);
                }
            },

            'terminal': {
                title: "Cyber CLI Shell Terminal",
                icon: "fa-solid fa-terminal",
                cat: "sys",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="flex flex-col h-full space-y-2 font-mono text-xs">
                            <div id="term-out" class="flex-1 overflow-y-auto space-y-1 pr-1">
                                <div class="text-gray-400">Cyber OS Shell v6.0. Type <span class="text-[var(--primary)]">'help'</span> for commands.</div>
                            </div>
                            <div class="flex items-center gap-2 border-t border-[var(--border-color)] pt-2">
                                <span class="text-[var(--primary)] font-bold">root@cyber:~#</span>
                                <input id="term-in" type="text" class="flex-1 bg-transparent text-[var(--primary)] focus:outline-none" autofocus>
                            </div>
                        </div>
                    `;
                    const out = container.querySelector('#term-out');
                    const inp = container.querySelector('#term-in');
                    let history = [];
                    let histIdx = -1;

                    inp.onkeydown = (e) => {
                        if (e.key === 'ArrowUp') {
                            if (history.length > 0 && histIdx < history.length - 1) {
                                histIdx++;
                                inp.value = history[history.length - 1 - histIdx];
                            }
                        } else if (e.key === 'ArrowDown') {
                            if (histIdx > 0) {
                                histIdx--;
                                inp.value = history[history.length - 1 - histIdx];
                            } else if (histIdx === 0) {
                                histIdx = -1;
                                inp.value = '';
                            }
                        } else if (e.key === 'Enter') {
                            const cmd = inp.value.trim().toLowerCase();
                            if (cmd) history.push(cmd);
                            histIdx = -1;
                            inp.value = '';
                            sound.typing();
                            out.innerHTML += `<div><span class="text-[var(--primary)]">root@cyber:~#</span> ${cmd}</div>`;
                            let res = '';
                            if (cmd === 'help') res = "Commands: help, clear, scan, wifi, bluetooth, battery, device, storage, network, status, theme, reboot, time, date, about";
                            else if (cmd === 'clear') { out.innerHTML = ''; return; }
                            else if (cmd === 'status') res = "Kernel v6.0 | Security: MAXIMUM | System: ONLINE";
                            else if (cmd === 'time') res = new Date().toTimeString();
                            else if (cmd === 'date') res = new Date().toDateString();
                            else if (cmd === 'wifi') res = "SSID: CYBER_HUB_5G (Signal -42dBm, WPA3)";
                            else if (cmd === 'bluetooth') res = "BLE Transceiver active. Devices online: 2";
                            else if (cmd === 'battery') res = "Battery status: 98% (Power Connected)";
                            else if (cmd === 'device') res = `Platform: ${navigator.platform} | Cores: ${navigator.hardwareConcurrency || 8}`;
                            else if (cmd === 'storage') res = "Storage Allocated: 650 GB / 1000 GB NVMe";
                            else if (cmd === 'network') res = "Network Bandwidth: 842 Mbps Down / 418 Mbps Up";
                            else if (cmd === 'theme') res = `Current Theme: ${SettingsManager.data.theme}`;
                            else if (cmd === 'reboot') { CyberOS.reboot(); return; }
                            else if (cmd === 'about') res = "Cyber Hacker OS Live Wallpaper v6.0 - Pure HTML5 & JS Architecture";
                            else res = `Command not recognized: '${cmd}'`;
                            out.innerHTML += `<div class="text-gray-300 ml-2 mb-2">${res}</div>`;
                            out.scrollTop = out.scrollHeight;
                        }
                    };
                }
            },

            'files': {
                title: "File System Explorer",
                icon: "fa-solid fa-folder-tree",
                cat: "sys",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="space-y-2">
                            <div class="flex gap-2">
                                <button onclick="AppRegistry.files.loadDir('System', this)" class="px-2 py-1 bg-[var(--primary-dim)] text-[var(--primary)] rounded text-xs border border-[var(--border-color)]">/System</button>
                                <button onclick="AppRegistry.files.loadDir('Downloads', this)" class="px-2 py-1 bg-black/50 text-gray-300 rounded text-xs border border-gray-700">/Downloads</button>
                                <button onclick="AppRegistry.files.loadDir('Photos', this)" class="px-2 py-1 bg-black/50 text-gray-300 rounded text-xs border border-gray-700">/Photos</button>
                                <button onclick="AppRegistry.files.loadDir('Secure', this)" class="px-2 py-1 bg-black/50 text-gray-300 rounded text-xs border border-gray-700">/Secure</button>
                            </div>
                            <input id="file-search" type="text" placeholder="Search directory files..." class="w-full bg-black/60 p-1.5 rounded border border-[var(--border-color)] text-white text-xs focus:outline-none">
                            <div id="file-list" class="space-y-1 max-h-52 overflow-y-auto"></div>
                        </div>
                    `;
                    const search = container.querySelector('#file-search');
                    search.oninput = () => this.loadDir('System', null, search.value);
                    this.loadDir('System');
                },
                loadDir(dir, btn = null, query = '') {
                    sound.click();
                    const list = document.getElementById('file-list');
                    if (!list) return;
                    const map = {
                        System: ['kernel.sys (1.2 MB)', 'cyber_config.json (4 KB)', 'boot_loader.bin (256 KB)'],
                        Downloads: ['payload.sh (12 KB)', 'coords.txt (2 KB)', 'crypto_wallet.dat (64 KB)'],
                        Photos: ['hud_camera_snap01.png (3.4 MB)', 'satellite_orbit_render.png (8.1 MB)'],
                        Secure: ['master_keys.key (256 B)', 'biometrics.hash (1 KB)', 'shadow_vault.enc (12 MB)']
                    };
                    let files = map[dir] || map['System'];
                    if (query) {
                        files = files.filter(f => f.toLowerCase().includes(query.toLowerCase()));
                    }
                    list.innerHTML = files.map(f => `
                        <div class="p-2 bg-black/60 rounded flex justify-between items-center border border-gray-800 text-xs">
                            <span><i class="fa-solid fa-file-code text-[var(--primary)] mr-2"></i> ${f}</span>
                            <button onclick="NotificationSystem.notify('FILES', 'Opened file: ${f}', 'info')" class="px-2 py-0.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black">Preview</button>
                        </div>
                    `).join('');
                }
            },

            'antivirus': {
                title: "Virus & Threat Scanner",
                icon: "fa-solid fa-bug",
                cat: "sec",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="space-y-3 text-center py-2">
                            <div class="w-16 h-16 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin mx-auto flex items-center justify-center">
                                <i class="fa-solid fa-bug text-2xl text-[var(--primary)]"></i>
                            </div>
                            <div class="font-bold text-[var(--primary)]">DEEP THREAT SCAN IN PROGRESS</div>
                            <div class="text-[10px] text-gray-400">Scanned 14,892 system sectors</div>
                            <div class="w-full bg-gray-900 h-2 rounded overflow-hidden border border-[var(--border-color)]">
                                <div id="v-bar" class="bg-[var(--primary)] h-full w-0 transition-all duration-300"></div>
                            </div>
                            <div class="flex justify-center gap-2 mt-2">
                                <button id="btn-quick-scan" class="px-3 py-1 bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] rounded hover:bg-[var(--primary)] hover:text-black">Quick Scan</button>
                                <button id="btn-deep-scan" class="px-3 py-1 bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] rounded hover:bg-[var(--primary)] hover:text-black">Deep Scan</button>
                            </div>
                        </div>
                    `;
                    const runScan = () => {
                        sound.scan();
                        let pct = 0;
                        const handle = setInterval(() => {
                            pct += 10;
                            const bar = container.querySelector('#v-bar');
                            if (bar) bar.style.width = pct + '%';
                            if (pct >= 100) {
                                clearInterval(handle);
                                NotificationSystem.notify("VIRUS SCAN", "Scan complete: 0 Threats detected. Security Score: 100%", "info");
                            }
                        }, 150);
                        winRef.handles.push(handle);
                    };
                    container.querySelector('#btn-quick-scan').onclick = runScan;
                    container.querySelector('#btn-deep-scan').onclick = runScan;
                    runScan();
                }
            },

            'firewall': {
                title: "Firewall & Port Security",
                icon: "fa-solid fa-shield-virus",
                cat: "sec",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="space-y-3">
                            <div class="p-3 bg-black/60 rounded border border-[var(--border-color)] flex justify-between items-center">
                                <div><div class="font-bold text-white">Kernel Firewall Daemon</div><div id="fw-status" class="text-[9px] text-emerald-400">● ACTIVE FILTERING</div></div>
                                <button id="fw-toggle" class="px-3 py-1 rounded bg-red-950 text-red-400 border border-red-500 text-xs hover:bg-red-600 hover:text-white">Toggle Rules</button>
                            </div>
                            <button id="scan-ports" class="w-full py-1.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black font-bold">Scan Common Ports (80, 443, 22, 8080)</button>
                            <div id="port-list" class="space-y-1"></div>
                        </div>
                    `;
                    let active = true;
                    container.querySelector('#fw-toggle').onclick = () => {
                        sound.click();
                        active = !active;
                        const st = container.querySelector('#fw-status');
                        if (st) {
                            st.innerText = active ? '● ACTIVE FILTERING' : '○ DISABLED';
                            st.className = active ? 'text-[9px] text-emerald-400' : 'text-[9px] text-red-400';
                        }
                        NotificationSystem.notify("FIREWALL", `Daemon state: ${active ? 'ACTIVE' : 'DISABLED'}`, active ? 'info' : 'alert');
                    };

                    container.querySelector('#scan-ports').onclick = () => {
                        sound.scan();
                        const ports = [
                            { port: 22, name: 'SSH', status: 'PROTECTED' },
                            { port: 80, name: 'HTTP', status: 'ALLOWED' },
                            { port: 443, name: 'HTTPS', status: 'SECURE' },
                            { port: 8080, name: 'PROXY', status: 'BLOCKED' }
                        ];
                        container.querySelector('#port-list').innerHTML = ports.map(p => `
                            <div class="p-1.5 bg-black/60 rounded flex justify-between items-center text-xs border border-gray-800">
                                <span>PORT ${p.port} (${p.name})</span>
                                <span class="${p.status === 'BLOCKED' ? 'text-red-400' : 'text-emerald-400'} font-bold">${p.status}</span>
                            </div>
                        `).join('');
                    };
                }
            },

            'ai': {
                title: "Neural AI Core Assistant",
                icon: "fa-solid fa-brain",
                cat: "sys",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="flex flex-col h-full space-y-2">
                            <div id="ai-chat" class="flex-1 overflow-y-auto space-y-2 p-2 bg-black/60 rounded border border-[var(--border-color)]">
                                <div class="p-2 bg-[var(--primary-dim)] text-[var(--primary)] rounded">CYBER_AI: Core online. State your query.</div>
                            </div>
                            <div class="flex gap-2">
                                <input id="ai-in" type="text" placeholder="Ask AI Assistant..." class="flex-1 bg-black p-2 rounded border border-[var(--border-color)] text-white text-xs focus:outline-none">
                                <button id="ai-btn" class="px-3 py-1 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black">Send</button>
                            </div>
                        </div>
                    `;
                    const chat = container.querySelector('#ai-chat');
                    const inp = container.querySelector('#ai-in');
                    const send = () => {
                        const txt = inp.value.trim();
                        if (!txt) return;
                        sound.typing();
                        inp.value = '';
                        chat.innerHTML += `<div class="p-2 bg-black/80 text-right text-gray-300 rounded">YOU: ${txt}</div>`;
                        setTimeout(() => {
                            chat.innerHTML += `<div class="p-2 bg-[var(--primary-dim)] text-[var(--primary)] rounded">CYBER_AI: Query '${txt}' processed. Registers healthy. Neural network active.</div>`;
                            chat.scrollTop = chat.scrollHeight;
                        }, 400);
                    };
                    container.querySelector('#ai-btn').onclick = send;
                    inp.onkeydown = (e) => { if (e.key === 'Enter') send(); };
                }
            },

            'satellite': {
                title: "Orbital Satellite Tracker",
                icon: "fa-solid fa-satellite",
                cat: "net",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="space-y-2">
                            <canvas id="sat-canvas" class="w-full h-44 bg-black rounded border border-[var(--border-color)]"></canvas>
                            <div class="flex justify-between gap-2 text-xs">
                                <button id="sat-zoom-in" class="flex-1 py-1 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black">Zoom In</button>
                                <button id="sat-zoom-out" class="flex-1 py-1 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black">Zoom Out</button>
                                <button id="sat-lock" class="flex-1 py-1 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black">Lock Target</button>
                            </div>
                        </div>
                    `;
                    const cvs = container.querySelector('#sat-canvas');
                    if (!cvs) return;
                    const ctx = cvs.getContext('2d');
                    cvs.width = cvs.clientWidth; cvs.height = cvs.clientHeight;
                    let angle = 0;
                    let radiusOffset = 0;

                    container.querySelector('#sat-zoom-in').onclick = () => { sound.click(); radiusOffset = Math.max(-20, radiusOffset - 10); };
                    container.querySelector('#sat-zoom-out').onclick = () => { sound.click(); radiusOffset = Math.min(30, radiusOffset + 10); };
                    container.querySelector('#sat-lock').onclick = () => { sound.click(); NotificationSystem.notify("SATELLITE", "NORAD-01 Orbit Locked", "info"); };

                    const handle = setInterval(() => {
                        angle += 0.03;
                        ctx.clearRect(0,0,cvs.width, cvs.height);
                        const cx = cvs.width/2, cy = cvs.height/2, r = Math.min(cx, cy) - 30 + radiusOffset;
                        ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border-color') || '#00ff66';
                        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
                        const sx = cx + Math.cos(angle)*r, sy = cy + Math.sin(angle)*r;
                        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--primary') || '#00ff66';
                        ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI*2); ctx.fill();
                        ctx.fillText("NORAD-01", sx+6, sy+3);
                    }, 50);
                    winRef.handles.push(handle);
                }
            },

            'gps': {
                title: "GPS Geo Triangulation",
                icon: "fa-solid fa-location-crosshairs",
                cat: "net",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="space-y-3 text-center">
                            <div class="p-4 bg-black/60 rounded border border-[var(--border-color)]">
                                <div class="text-[10px] text-gray-400">COORDINATES</div>
                                <div id="gps-val" class="text-lg font-bold text-[var(--primary)] my-1">35.6762° N, 139.6503° E</div>
                                <div id="gps-acc" class="text-[10px] text-emerald-400">● Military Satellite Lock</div>
                            </div>
                            <button id="gps-btn" class="w-full py-1.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black font-bold">Request Real Hardware GPS</button>
                        </div>
                    `;
                    const updateGPS = async () => {
                        sound.click();
                        if (typeof NativeBridge !== 'undefined' && typeof NativeBridge.getGPS === 'function') {
                            try {
                                const loc = await NativeBridge.getGPS();  // Real location!
                                const latStr = (loc.lat >= 0 ? loc.lat.toFixed(4) + '° N' : Math.abs(loc.lat).toFixed(4) + '° S');
                                const lngStr = (loc.lng >= 0 ? loc.lng.toFixed(4) + '° E' : Math.abs(loc.lng).toFixed(4) + '° W');
                                container.querySelector('#gps-val').innerText = `${latStr}, ${lngStr}`;
                                const accEl = container.querySelector('#gps-acc');
                                if (accEl) accEl.innerText = `● Native GPS Lock (${loc.accuracy ? Math.round(loc.accuracy) + 'm' : 'High Precision'})`;
                                NotificationSystem.notify("GPS", "Native GPS position locked", "info");
                                return;
                            } catch (e) {
                                NotificationSystem.notify("GPS", e.message || "Native GPS failed", "alert");
                            }
                        }

                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(pos => {
                                container.querySelector('#gps-val').innerText = `${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`;
                                container.querySelector('#gps-acc').innerText = `● Hardware GPS Lock (${Math.round(pos.coords.accuracy)}m)`;
                                NotificationSystem.notify("GPS", "Hardware location locked successfully", "info");
                            }, err => {
                                NotificationSystem.notify("GPS", "Location permission denied. Fallback simulation active.", "alert");
                            });
                        }
                    };
                    container.querySelector('#gps-btn').onclick = updateGPS;
                }
            },

            'camera': {
                title: "Optical Camera Scan",
                icon: "fa-solid fa-camera",
                cat: "sys",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="space-y-3 text-center">
                            <video id="cam-v" class="w-full h-40 bg-black rounded border border-[var(--border-color)] object-cover hidden" autoplay playsinline></video>
                            <div class="flex gap-2">
                                <button id="cam-btn" class="flex-1 py-2 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] font-bold hover:bg-[var(--primary)] hover:text-black">Start Optical Feed</button>
                                <button id="cam-torch" class="py-2 px-3 rounded bg-black/60 text-gray-300 border border-gray-700 hover:text-white"><i class="fa-solid fa-lightbulb"></i> Torch</button>
                                <button id="cam-snap" class="py-2 px-3 rounded bg-black/60 text-gray-300 border border-gray-700 hover:text-white">Snapshot</button>
                            </div>
                        </div>
                    `;
                    container.querySelector('#cam-btn').onclick = async () => {
                        sound.click();
                        try {
                            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                            const v = container.querySelector('#cam-v');
                            v.srcObject = stream;
                            v.classList.remove('hidden');
                            NotificationSystem.notify("CAMERA", "Optical camera stream initialized", "info");
                        } catch(e) {
                            NotificationSystem.notify("CAMERA", "Camera access denied. Permission required.", "alert");
                        }
                    };
                    container.querySelector('#cam-torch').onclick = () => {
                        QuickSettings.toggleTorch();
                    };
                    container.querySelector('#cam-snap').onclick = () => {
                        sound.click();
                        NotificationSystem.notify("CAMERA", "Optical snapshot saved to /Photos", "info");
                    };
                }
            },

            'mic': {
                title: "Acoustic Audio Spectrum",
                icon: "fa-solid fa-microphone",
                cat: "sys",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="space-y-2">
                            <canvas id="mic-cvs" class="w-full h-36 bg-black rounded border border-[var(--border-color)]"></canvas>
                            <button id="mic-btn" class="w-full py-1.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black font-bold">Start Acoustic Microphone Input</button>
                        </div>
                    `;
                    const cvs = container.querySelector('#mic-cvs');
                    if (!cvs) return;
                    const ctx = cvs.getContext('2d');
                    cvs.width = cvs.clientWidth; cvs.height = cvs.clientHeight;

                    const handle = setInterval(() => {
                        ctx.clearRect(0,0,cvs.width, cvs.height);
                        const bars = 20, w = cvs.width / bars;
                        for (let i=0; i<bars; i++) {
                            const h = Math.random() * cvs.height * 0.8;
                            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--primary') || '#00ff66';
                            ctx.fillRect(i*w, cvs.height - h, w-2, h);
                        }
                    }, 100);
                    winRef.handles.push(handle);

                    container.querySelector('#mic-btn').onclick = async () => {
                        sound.click();
                        try {
                            await navigator.mediaDevices.getUserMedia({ audio: true });
                            NotificationSystem.notify("MICROPHONE", "Live acoustic audio channel active", "info");
                        } catch(e) {
                            NotificationSystem.notify("MICROPHONE", "Audio permission denied.", "alert");
                        }
                    };
                }
            },

            'ram': {
                title: "RAM Allocation Matrix",
                icon: "fa-solid fa-memory",
                cat: "sys",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="space-y-3">
                            <div class="grid grid-cols-2 gap-2 text-center">
                                <div class="p-2 bg-black/60 rounded border border-[var(--border-color)]"><div class="text-[9px] text-gray-400">TOTAL RAM</div><div class="font-bold text-white">32 GB</div></div>
                                <div class="p-2 bg-black/60 rounded border border-[var(--border-color)]"><div class="text-[9px] text-gray-400">ALLOCATED</div><div id="ram-alloc" class="font-bold text-[var(--primary)]">14.2 GB</div></div>
                            </div>
                            <button id="flush-ram" class="w-full py-1.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black font-bold">Flush Memory Cache</button>
                        </div>
                    `;
                    container.querySelector('#flush-ram').onclick = () => {
                        sound.click();
                        const alloc = container.querySelector('#ram-alloc');
                        if (alloc) alloc.innerText = "8.1 GB";
                        NotificationSystem.notify("RAM", "Flushed 6.1 GB cache memory", "info");
                    };
                }
            },

            'cpu': {
                title: "CPU Telemetry & Loads",
                icon: "fa-solid fa-microchip",
                cat: "sys",
                render(container, winRef) {
                    const cores = navigator.hardwareConcurrency || 8;
                    container.innerHTML = `
                        <div class="space-y-3">
                            <div class="p-3 bg-black/60 rounded border border-[var(--border-color)] text-center">
                                <div class="text-xs text-gray-400">CORES DETECTED</div>
                                <div class="text-xl font-bold text-[var(--primary)] my-1">${cores} Cores Online</div>
                                <div class="text-[10px] text-emerald-400">● Architecture: x86_64 Neural Matrix</div>
                            </div>
                            <button id="stress-cpu" class="w-full py-1.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black font-bold">Run Core Stress Test</button>
                        </div>
                    `;
                    container.querySelector('#stress-cpu').onclick = () => {
                        sound.scan();
                        NotificationSystem.notify("CPU", `Stress testing all ${cores} cores...`, "alert");
                        setTimeout(() => {
                            NotificationSystem.notify("CPU", "Stress test completed. Thermal levels nominal (42°C).", "info");
                        }, 1500);
                    };
                }
            },

            'storage': {
                title: "Storage Space Analyzer",
                icon: "fa-solid fa-hard-drive",
                cat: "sys",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="p-3 bg-black/60 rounded border border-[var(--border-color)] space-y-3">
                            <div class="flex justify-between text-xs"><span>NVMe System Drive</span><span id="stg-val">650 GB / 1000 GB</span></div>
                            <div class="w-full h-3 bg-gray-900 rounded overflow-hidden flex border border-[var(--border-color)]">
                                <div id="stg-bar" class="bg-emerald-500 h-full w-[65%]"></div>
                            </div>
                            <button id="clean-junk" class="w-full py-1.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black font-bold">Clean Junk Files</button>
                        </div>
                    `;
                    if (navigator.storage && navigator.storage.estimate) {
                        navigator.storage.estimate().then(est => {
                            const usedGB = (est.usage / (1024*1024*1024)).toFixed(2);
                            const totalGB = (est.quota / (1024*1024*1024)).toFixed(2);
                            const val = container.querySelector('#stg-val');
                            if (val) val.innerText = `${usedGB} GB / ${totalGB} GB Browser Quota`;
                        });
                    }
                    container.querySelector('#clean-junk').onclick = () => {
                        sound.click();
                        const bar = container.querySelector('#stg-bar');
                        if (bar) bar.style.width = '40%';
                        NotificationSystem.notify("STORAGE", "Cleaned 250 GB temporary junk files", "info");
                    };
                }
            },

            'battery': {
                title: "Battery Power Diagnostics",
                icon: "fa-solid fa-battery-three-quarters",
                cat: "sys",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="p-4 bg-black/60 rounded border border-[var(--border-color)] text-center space-y-2">
                            <i class="fa-solid fa-battery-charging text-3xl text-[var(--primary)] mb-1"></i>
                            <div id="b-val" class="text-2xl font-bold text-white">98%</div>
                            <div id="b-st" class="text-[10px] text-emerald-400">Power Connected</div>
                            <button id="b-saver" class="w-full mt-2 py-1.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black">Toggle Battery Saver Mode</button>
                        </div>
                    `;
                    const updateBattery = async () => {
                        if (typeof NativeBridge !== 'undefined' && typeof NativeBridge.getBattery === 'function') {
                            try {
                                const b = await NativeBridge.getBattery();  // Real battery!
                                const valEl = container.querySelector('#b-val');
                                const stEl = container.querySelector('#b-st');
                                if (valEl) valEl.innerText = b.level + '%';
                                if (stEl) stEl.innerText = b.charging ? `Charging ${b.temp ? '(' + b.temp + '°C)' : ''}` : 'Discharging';
                                return;
                            } catch (e) {}
                        }

                        if (navigator.getBattery) {
                            navigator.getBattery().then(b => {
                                const val = container.querySelector('#b-val');
                                const st = container.querySelector('#b-st');
                                if (val) val.innerText = Math.round(b.level * 100) + '%';
                                if (st) st.innerText = b.charging ? 'Power Connected (Charging)' : 'Discharging';
                            });
                        }
                    };
                    updateBattery();
                    container.querySelector('#b-saver').onclick = () => {
                        QuickSettings.toggleBatterySaver();
                    };
                }
            },

            'device': {
                title: "Device Information Spec",
                icon: "fa-solid fa-circle-info",
                cat: "sys",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="space-y-2 font-mono text-xs">
                            <div class="p-2 bg-black/60 rounded border border-gray-800"><span class="text-gray-400">UserAgent:</span> <span class="text-[var(--primary)] truncate block">${navigator.userAgent}</span></div>
                            <div class="p-2 bg-black/60 rounded border border-gray-800"><span class="text-gray-400">Platform:</span> <span class="text-[var(--primary)]">${navigator.platform}</span></div>
                            <div class="p-2 bg-black/60 rounded border border-gray-800"><span class="text-gray-400">Screen Resolution:</span> <span class="text-[var(--primary)]">${window.innerWidth} x ${window.innerHeight}</span></div>
                            <div class="flex gap-2">
                                <button id="copy-spec" class="flex-1 py-1.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black">Copy Diagnostics</button>
                                <button id="export-spec" class="flex-1 py-1.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black">Export JSON</button>
                            </div>
                        </div>
                    `;
                    container.querySelector('#copy-spec').onclick = () => {
                        sound.click();
                        document.execCommand('copy');
                        NotificationSystem.notify("COPIED", "System specs copied to clipboard", "info");
                    };
                    container.querySelector('#export-spec').onclick = () => {
                        sound.click();
                        const data = JSON.stringify({ ua: navigator.userAgent, platform: navigator.platform, cores: navigator.hardwareConcurrency }, null, 2);
                        const blob = new Blob([data], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'cyber_os_specs.json'; a.click();
                        NotificationSystem.notify("EXPORT", "Downloaded cyber_os_specs.json", "info");
                    };
                }
            },

            'netmap': {
                title: "Interactive Mesh Network Map",
                icon: "fa-solid fa-network-wired",
                cat: "net",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="space-y-2">
                            <canvas id="nm-cvs" class="w-full h-40 bg-black rounded border border-[var(--border-color)]"></canvas>
                            <button id="add-node" class="w-full py-1.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black font-bold">Add Cyber Node</button>
                        </div>
                    `;
                    const cvs = container.querySelector('#nm-cvs');
                    if (!cvs) return;
                    const ctx = cvs.getContext('2d');
                    cvs.width = cvs.clientWidth; cvs.height = cvs.clientHeight;
                    const nodes = [{x:40,y:40},{x:160,y:90},{x:260,y:50},{x:100,y:140}];

                    container.querySelector('#add-node').onclick = () => {
                        sound.click();
                        nodes.push({ x: Math.random() * (cvs.width - 40) + 20, y: Math.random() * (cvs.height - 40) + 20 });
                        NotificationSystem.notify("NETMAP", `Added NODE-${nodes.length}`, "info");
                    };

                    const handle = setInterval(() => {
                        ctx.clearRect(0,0,cvs.width, cvs.height);
                        ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border-color') || '#00ff66';
                        ctx.beginPath();
                        nodes.forEach((n1, i) => nodes.forEach((n2, j) => { if(i<j){ ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y); } }));
                        ctx.stroke();
                        nodes.forEach((n, idx) => {
                            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--primary') || '#00ff66';
                            ctx.beginPath(); ctx.arc(n.x, n.y, 5, 0, Math.PI*2); ctx.fill();
                            ctx.fillText(`NODE-${idx+1}`, n.x+6, n.y+3);
                        });
                    }, 100);
                    winRef.handles.push(handle);
                }
            },

            'vault': {
                title: "Encrypted Password Vault",
                icon: "fa-solid fa-vault",
                cat: "sec",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="space-y-3">
                            <div class="p-2.5 bg-black/60 rounded border border-[var(--border-color)] flex justify-between items-center">
                                <span>Master SSH Key</span><span class="text-[var(--primary)] font-mono">••••••••</span>
                            </div>
                            <div class="p-2.5 bg-black/60 rounded border border-[var(--border-color)] flex justify-between items-center">
                                <span>Crypto Seed Hash</span><span id="hash-val" class="text-[var(--primary)] font-mono text-[10px]">0x7f8a...9c2e</span>
                            </div>
                            <button id="gen-hash" class="w-full py-1.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)] hover:bg-[var(--primary)] hover:text-black font-bold">Generate AES-256 Seed Hash</button>
                        </div>
                    `;
                    container.querySelector('#gen-hash').onclick = () => {
                        sound.click();
                        const h = "0x" + Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('');
                        container.querySelector('#hash-val').innerText = h;
                        NotificationSystem.notify("VAULT", "Generated fresh AES-256 seed hash", "info");
                    };
                }
            },

            'settings': {
                title: "OS System Settings",
                icon: "fa-solid fa-gear",
                cat: "sys",
                render(container, winRef) {
                    container.innerHTML = `
                        <div class="space-y-3">
                            <div class="p-2.5 bg-black/60 rounded border border-[var(--border-color)] space-y-2">
                                <div class="font-bold text-white">Cyber OS Theme Accent</div>
                                <div class="grid grid-cols-3 gap-1.5 text-xs">
                                    <button onclick="SettingsManager.data.theme='matrix'; SettingsManager.save(); SettingsManager.apply();" class="p-1.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500">Matrix</button>
                                    <button onclick="SettingsManager.data.theme='cyan'; SettingsManager.save(); SettingsManager.apply();" class="p-1.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500">Cyan</button>
                                    <button onclick="SettingsManager.data.theme='red'; SettingsManager.save(); SettingsManager.apply();" class="p-1.5 rounded bg-rose-950 text-rose-400 border border-rose-500">Red</button>
                                    <button onclick="SettingsManager.data.theme='purple'; SettingsManager.save(); SettingsManager.apply();" class="p-1.5 rounded bg-purple-950 text-purple-400 border border-purple-500">Purple</button>
                                    <button onclick="SettingsManager.data.theme='amber'; SettingsManager.save(); SettingsManager.apply();" class="p-1.5 rounded bg-amber-950 text-amber-400 border border-amber-500">Amber</button>
                                    <button onclick="SettingsManager.data.theme='minimal'; SettingsManager.save(); SettingsManager.apply();" class="p-1.5 rounded bg-gray-800 text-white border border-gray-600">Minimal</button>
                                </div>
                            </div>
                            <div class="p-2.5 bg-black/60 rounded border border-[var(--border-color)] space-y-2">
                                <div class="font-bold text-white">Animated Wallpaper Engine</div>
                                <div class="grid grid-cols-2 gap-1.5 text-xs">
                                    <button onclick="WallpaperEngine.setMode('matrix')" class="p-1.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)]">Digital Rain</button>
                                    <button onclick="WallpaperEngine.setMode('grid')" class="p-1.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)]">Cyber Grid</button>
                                    <button onclick="WallpaperEngine.setMode('particles')" class="p-1.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)]">Particles</button>
                                    <button onclick="WallpaperEngine.setMode('radar')" class="p-1.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)]">Radar Sweep</button>
                                </div>
                            </div>
                            <div class="p-2.5 bg-black/60 rounded border border-[var(--border-color)] space-y-2">
                                <div class="font-bold text-white">Visual & Accessibility Effects</div>
                                <div class="flex gap-2">
                                    <button id="toggle-scanlines" class="flex-1 p-1.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)]">Toggle Scanlines</button>
                                    <button id="toggle-contrast" class="flex-1 p-1.5 rounded bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--border-color)]">High Contrast</button>
                                </div>
                            </div>
                            <button id="reset-settings" class="w-full py-1.5 rounded bg-red-950 text-red-400 border border-red-500 hover:bg-red-600 hover:text-white font-bold">Reset Factory Defaults</button>
                        </div>
                    `;

                    container.querySelector('#toggle-scanlines').onclick = () => {
                        sound.click();
                        SettingsManager.data.scanlines = !SettingsManager.data.scanlines;
                        SettingsManager.save();
                        SettingsManager.apply();
                    };

                    container.querySelector('#toggle-contrast').onclick = () => {
                        sound.click();
                        SettingsManager.data.highContrast = !SettingsManager.data.highContrast;
                        SettingsManager.save();
                        SettingsManager.apply();
                    };

                    container.querySelector('#reset-settings').onclick = () => {
                        sound.click();
                        localStorage.removeItem('cyber_os_v6_settings');
                        SettingsManager.load();
                        NotificationSystem.notify("SETTINGS", "Factory defaults restored", "alert");
                    };
                }
            }
        };

        const CyberOS = {
            init() {
                SettingsManager.load();
                WallpaperEngine.init();
                this.startClock();
                this.renderDesktopGrid();
                this.bindGlobalShortcuts();
                this.runBootSequence();
            },

            renderDesktopGrid() {
                const grid = document.getElementById('desktop-grid');
                if (!grid) return;
                grid.innerHTML = Object.keys(AppRegistry).map(id => {
                    const app = AppRegistry[id];
                    return `
                        <div onclick="WindowManager.openApp('${id}')" class="cyber-panel p-3 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-[var(--primary)] hover:scale-105 transition-all group glitch-hover">
                            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[var(--primary-dim)] border border-[var(--border-color)] flex items-center justify-center mb-2 group-hover:bg-[var(--primary)] transition">
                                <i class="${app.icon} text-xl text-[var(--primary)] group-hover:text-black"></i>
                            </div>
                            <span class="font-orbitron font-medium text-xs text-gray-200 group-hover:text-[var(--primary)] truncate w-full">${app.title}</span>
                        </div>
                    `;
                }).join('');
            },

            startClock() {
                const update = () => {
                    const now = new Date();
                    const clock = document.getElementById('clock-display');
                    const date = document.getElementById('date-display');
                    if (clock) clock.innerText = now.toTimeString().split(' ')[0];
                    if (date) date.innerText = now.toISOString().split('T')[0];
                };
                update();
                setInterval(update, 1000);
            },

            bindGlobalShortcuts() {
                window.addEventListener('keydown', (e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
                        e.preventDefault();
                        SpotlightSearch.open();
                    } else if (e.key === 'Escape') {
                        SpotlightSearch.close();
                        const startMenu = document.getElementById('start-menu');
                        if (startMenu) startMenu.classList.add('hidden');
                        const quickSettings = document.getElementById('quick-settings-panel');
                        if (quickSettings) quickSettings.classList.add('hidden');
                    }
                });

                const spotInp = document.getElementById('spotlight-input');
                if (spotInp) {
                    spotInp.oninput = () => {
                        const q = spotInp.value.trim().toLowerCase();
                        const res = document.getElementById('spotlight-results');
                        if (!res) return;
                        if (!q) {
                            res.innerHTML = `<div class="text-center py-6 text-gray-500">Type to search system modules...</div>`;
                            return;
                        }
                        const matches = Object.keys(AppRegistry).filter(id => AppRegistry[id].title.toLowerCase().includes(q));
                        res.innerHTML = matches.map(id => `
                            <div onclick="WindowManager.openApp('${id}'); SpotlightSearch.close();" class="p-2.5 rounded bg-black/60 border border-gray-800 hover:border-[var(--primary)] cursor-pointer flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <i class="${AppRegistry[id].icon} text-[var(--primary)] text-lg"></i>
                                    <span class="font-bold text-white text-xs">${AppRegistry[id].title}</span>
                                </div>
                                <span class="text-[9px] px-2 py-0.5 rounded bg-[var(--primary-dim)] text-[var(--primary)]">LAUNCH</span>
                            </div>
                        `).join('') || `<div class="text-center py-6 text-gray-500">No matching OS modules found.</div>`;
                    };
                }
            },

            fastBoot() {
                const bootScreen = document.getElementById('boot-screen');
                bootScreen.style.display = 'none';
                document.getElementById('os-root').classList.remove('hidden');
                sound.startupChime();
                NotificationSystem.notify("SYSTEM BOOT", "Cyber OS Kernel initialized successfully.", "info");
            },

            runBootSequence() {
                let progress = 0;
                const log = document.getElementById('boot-log');
                const progressBar = document.getElementById('boot-progress');
                
                const lines = [
                    "[ 0.312001] GRAPHICS: Initializing WebGL HUD compositor...",
                    "[ 0.450212] NETWORK: Wi-Fi & Bluetooth scanning daemons ready.",
                    "[ 0.612011] SATELLITE: Connecting to NORAD telemetry feed...",
                    "[ 0.812399] SECURITY: Loading Cypher Vault encryption standard...",
                    "[ 1.000000] SYSTEM: Boot sequence completed successfully!"
                ];

                let lineIdx = 0;
                const interval = setInterval(() => {
                    progress += 20;
                    if (progressBar) progressBar.style.width = progress + '%';
                    
                    if (lineIdx < lines.length) {
                        const d = document.createElement('div');
                        d.innerText = lines[lineIdx];
                        if (log) log.appendChild(d);
                        lineIdx++;
                    }

                    sound.typing();

                    if (progress >= 100) {
                        clearInterval(interval);
                        setTimeout(() => this.fastBoot(), 400);
                    }
                }, 250);
            },

            reboot() {
                Object.keys(WindowManager.windows).forEach(id => WindowManager.closeWindow(id));
                document.getElementById('os-root').classList.add('hidden');
                document.getElementById('boot-screen').style.display = 'flex';
                document.getElementById('boot-log').innerHTML = `<div>[ 0.000000] REBOOTING SYSTEM KERNEL...</div>`;
                document.getElementById('boot-progress').style.width = '0%';
                this.runBootSequence();
            }
        };

        window.addEventListener('load', () => {
            CyberOS.init();
        });