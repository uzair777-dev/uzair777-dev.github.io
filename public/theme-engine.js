/* ═══════════════════════════════════════════════════════════
   theme-engine.js — Multi-Palette Pastel Engine + Client-Device
   Factor Auto-Theme + Unified Burger Drawer Controller
   Works in browser (window.PortfolioThemeEngine) and Node tests.
   ═══════════════════════════════════════════════════════════ */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.PortfolioThemeEngine = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    const PALETTES = [
        {
            id: 'jade',
            name: 'Jade Circuit',
            note: 'Mint-jade & warm apricot',
            swatches: {
                light: ['#148573', '#d47a3c', '#f1f5f4'],
                dark: ['#7ce0c3', '#f5bd87', '#11161c'],
            },
        },
        {
            id: 'glacier',
            name: 'Glacier Terminal',
            note: 'Ice-blue & soft chamomile',
            swatches: {
                light: ['#1f6fa8', '#b88424', '#f0f4f8'],
                dark: ['#89c4f4', '#ebd08c', '#10161f'],
            },
        },
        {
            id: 'matcha',
            name: 'Matcha Dusk',
            note: 'Sage-lime & soft terracotta',
            swatches: {
                light: ['#2c7d48', '#b85a3f', '#f2f5f0'],
                dark: ['#a4dba6', '#eba28b', '#121814'],
            },
        },
        {
            id: 'wisteria',
            name: 'Wisteria Fog',
            note: 'Periwinkle & calm seafoam',
            swatches: {
                light: ['#5c4db3', '#1b8577', '#f3f2f8'],
                dark: ['#b8aef2', '#84d9c9', '#14141e'],
            },
        },
    ];

    const VALID_PALETTES = new Set(PALETTES.map((p) => p.id));

    const DRIVERS = [
        {
            id: 'manual',
            label: 'Manual',
            hint: 'Lock your selected pastel palette',
        },
        {
            id: 'clock',
            label: 'Solar Clock',
            hint: 'Shifts with your local hour of day',
        },
        {
            id: 'battery',
            label: 'Battery',
            hint: 'Reacts to live charge level & plug state',
        },
        {
            id: 'cores',
            label: 'CPU Cores',
            hint: 'Maps hardware thread count to a palette',
        },
        {
            id: 'viewport',
            label: 'Viewport',
            hint: 'Adapts dynamically to screen width',
        },
    ];

    const VALID_DRIVERS = new Set(DRIVERS.map((d) => d.id));

    function getPaletteMeta(id) {
        return PALETTES.find((p) => p.id === id) || PALETTES[0];
    }

    // ── Pure Client-Device Factor Resolvers ──
    function resolvePaletteFromClock(hour) {
        const h = Number.isFinite(hour) ? ((Math.floor(hour) % 24) + 24) % 24 : 18;
        if (h >= 5 && h <= 10) {
            return { palette: 'matcha', reason: `${String(h).padStart(2, '0')}:00 morning` };
        }
        if (h >= 11 && h <= 16) {
            return { palette: 'glacier', reason: `${String(h).padStart(2, '0')}:00 midday` };
        }
        if (h >= 17 && h <= 21) {
            return { palette: 'jade', reason: `${String(h).padStart(2, '0')}:00 dusk` };
        }
        return { palette: 'wisteria', reason: `${String(h).padStart(2, '0')}:00 late night` };
    }

    function resolvePaletteFromBattery(level, charging) {
        const clamped = Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : 0.8;
        const pct = Math.round(clamped * 100);
        if (charging) {
            return { palette: 'jade', reason: `${pct}% charging` };
        }
        if (clamped >= 0.7) {
            return { palette: 'glacier', reason: `${pct}% high battery` };
        }
        if (clamped >= 0.3) {
            return { palette: 'matcha', reason: `${pct}% mid battery` };
        }
        return { palette: 'wisteria', reason: `${pct}% power-saver` };
    }

    function resolvePaletteFromCores(cores) {
        const count = Number.isFinite(cores) && cores > 0 ? Math.floor(cores) : 4;
        if (count <= 4) {
            return { palette: 'matcha', reason: `${count} CPU threads` };
        }
        if (count <= 8) {
            return { palette: 'jade', reason: `${count} CPU threads` };
        }
        if (count <= 12) {
            return { palette: 'glacier', reason: `${count} CPU threads` };
        }
        return { palette: 'wisteria', reason: `${count} CPU threads` };
    }

    function resolvePaletteFromViewport(width) {
        const w = Number.isFinite(width) && width > 0 ? Math.round(width) : 1280;
        if (w >= 1400) {
            return { palette: 'jade', reason: `${w}px ultrawide` };
        }
        if (w >= 1024) {
            return { palette: 'glacier', reason: `${w}px desktop` };
        }
        if (w >= 768) {
            return { palette: 'matcha', reason: `${w}px tablet` };
        }
        return { palette: 'wisteria', reason: `${w}px compact` };
    }

    // ── Browser Runtime Controller ──
    let currentTheme = 'light';
    let manualPalette = 'jade';
    let currentDriver = 'manual';
    let activePalette = 'jade';
    let activeStatusText = 'Manual · Jade Circuit';

    let clockIntervalId = null;
    let resizeBound = false;
    let batteryRef = null;
    let batteryHandler = null;
    let drawerMounted = false;
    let storageBound = false;

    function safeGet(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (_) {
            return null;
        }
    }

    function safeSet(key, val) {
        try {
            window.localStorage.setItem(key, val);
        } catch (_) {}
    }

    function detectPreferredTheme() {
        const stored = safeGet('theme');
        if (stored === 'light' || stored === 'dark') return stored;
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    }

    function loadStoredPreferences() {
        currentTheme = detectPreferredTheme();
        const storedPalette = safeGet('themePalette');
        manualPalette = storedPalette && VALID_PALETTES.has(storedPalette) ? storedPalette : 'jade';
        const storedDriver = safeGet('themeDriver');
        currentDriver = storedDriver && VALID_DRIVERS.has(storedDriver) ? storedDriver : 'manual';
    }

    function applyDOMAttributes() {
        if (typeof document === 'undefined') return;
        document.documentElement.setAttribute('data-theme', currentTheme);
        document.documentElement.setAttribute('data-palette', activePalette);
        document.documentElement.setAttribute('data-theme-driver', currentDriver);
    }

    function syncUI() {
        if (typeof document === 'undefined') return;

        document.querySelectorAll('.theme-option').forEach((btn) => {
            const isActive = btn.dataset.theme === currentTheme;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', String(isActive));
        });

        document.querySelectorAll('.palette-option').forEach((btn) => {
            const isActive = btn.dataset.palette === activePalette;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', String(isActive));

            const meta = getPaletteMeta(btn.dataset.palette);
            const colors = meta.swatches[currentTheme] || meta.swatches.light;
            const dots = btn.querySelectorAll('.palette-swatch-dot');
            if (dots[0]) dots[0].style.background = colors[0];
            if (dots[1]) dots[1].style.background = colors[1];
            if (dots[2]) dots[2].style.background = colors[2];
        });

        document.querySelectorAll('.driver-option').forEach((btn) => {
            const isActive = btn.dataset.driver === currentDriver;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', String(isActive));
        });

        document.querySelectorAll('.drawer-sensor-status').forEach((el) => {
            el.textContent = activeStatusText;
        });
    }

    function cleanupSensorListeners() {
        if (clockIntervalId !== null) {
            clearInterval(clockIntervalId);
            clockIntervalId = null;
        }
        if (batteryRef && batteryHandler) {
            batteryRef.removeEventListener('levelchange', batteryHandler);
            batteryRef.removeEventListener('chargingchange', batteryHandler);
            batteryRef = null;
            batteryHandler = null;
        }
    }

    function applyResolvedPalette(paletteId, statusLabel) {
        activePalette = VALID_PALETTES.has(paletteId) ? paletteId : 'jade';
        const meta = getPaletteMeta(activePalette);
        activeStatusText = `${statusLabel} → ${meta.name}`;
        safeSet('themeActivePalette', activePalette);
        applyDOMAttributes();
        syncUI();
    }

    function evaluateDriver() {
        cleanupSensorListeners();

        if (currentDriver === 'manual') {
            activePalette = manualPalette;
            const meta = getPaletteMeta(activePalette);
            activeStatusText = `Manual · ${meta.name}`;
            safeSet('themeActivePalette', activePalette);
            applyDOMAttributes();
            syncUI();
            return;
        }

        if (currentDriver === 'clock') {
            const applyClock = () => {
                const now = new Date();
                const res = resolvePaletteFromClock(now.getHours());
                const hh = String(now.getHours()).padStart(2, '0');
                const mm = String(now.getMinutes()).padStart(2, '0');
                applyResolvedPalette(res.palette, `${hh}:${mm} local`);
            };
            applyClock();
            clockIntervalId = setInterval(applyClock, 60000);
            return;
        }

        if (currentDriver === 'cores') {
            const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
            const res = resolvePaletteFromCores(cores);
            applyResolvedPalette(res.palette, res.reason);
            return;
        }

        if (currentDriver === 'viewport') {
            const applyViewport = () => {
                const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
                const res = resolvePaletteFromViewport(w);
                applyResolvedPalette(res.palette, res.reason);
            };
            applyViewport();
            if (!resizeBound && typeof window !== 'undefined') {
                resizeBound = true;
                let rafPending = false;
                window.addEventListener('resize', () => {
                    if (currentDriver !== 'viewport' || rafPending) return;
                    rafPending = true;
                    window.requestAnimationFrame(() => {
                        rafPending = false;
                        if (currentDriver === 'viewport') applyViewport();
                    });
                });
            }
            return;
        }

        if (currentDriver === 'battery') {
            if (typeof navigator !== 'undefined' && typeof navigator.getBattery === 'function') {
                navigator.getBattery().then((battery) => {
                    if (currentDriver !== 'battery') return;
                    batteryRef = battery;
                    const updateFromBattery = () => {
                        if (currentDriver !== 'battery') return;
                        const res = resolvePaletteFromBattery(battery.level, battery.charging);
                        applyResolvedPalette(res.palette, res.reason);
                    };
                    batteryHandler = updateFromBattery;
                    battery.addEventListener('levelchange', updateFromBattery);
                    battery.addEventListener('chargingchange', updateFromBattery);
                    updateFromBattery();
                }).catch(() => {
                    if (currentDriver !== 'battery') return;
                    const res = resolvePaletteFromClock(new Date().getHours());
                    applyResolvedPalette(res.palette, 'Battery API unavailable (Solar fallback)');
                });
            } else {
                const res = resolvePaletteFromClock(new Date().getHours());
                applyResolvedPalette(res.palette, 'Battery API unavailable (Solar fallback)');
            }
        }
    }

    function setTheme(theme) {
        currentTheme = theme === 'dark' ? 'dark' : 'light';
        safeSet('theme', currentTheme);
        applyDOMAttributes();
        syncUI();
    }

    function setManualPalette(paletteId) {
        if (!VALID_PALETTES.has(paletteId)) return;
        manualPalette = paletteId;
        currentDriver = 'manual';
        safeSet('themePalette', manualPalette);
        safeSet('themeDriver', currentDriver);
        evaluateDriver();
    }

    function setDriver(driverId) {
        if (!VALID_DRIVERS.has(driverId)) return;
        currentDriver = driverId;
        safeSet('themeDriver', currentDriver);
        evaluateDriver();
    }

    function buildThemeStudioMarkup() {
        const paletteButtons = PALETTES.map((p) => {
            const colors = p.swatches[currentTheme] || p.swatches.light;
            return `
                <button type="button" class="palette-option" data-palette="${p.id}" aria-pressed="false">
                    <span class="palette-swatches" aria-hidden="true">
                        <span class="palette-swatch-dot" style="background:${colors[0]}"></span>
                        <span class="palette-swatch-dot" style="background:${colors[1]}"></span>
                        <span class="palette-swatch-dot" style="background:${colors[2]}"></span>
                    </span>
                    <span class="palette-meta">
                        <span class="palette-name">${p.name}</span>
                        <span class="palette-note">${p.note}</span>
                    </span>
                </button>
            `;
        }).join('');

        const driverButtons = DRIVERS.map((d) => `
            <button type="button" class="driver-option" data-driver="${d.id}" title="${d.hint}" aria-pressed="false">
                ${d.label}
            </button>
        `).join('');

        return `
            <div class="drawer-section">
                <div class="drawer-section-header">
                    <span class="drawer-section-title">Appearance</span>
                </div>
                <div class="theme-toggle theme-toggle--drawer" id="theme-toggle" role="group" aria-label="Color mode">
                    <button type="button" class="theme-option" data-theme="light" aria-label="Switch to light mode" aria-pressed="false">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                        <span>Light</span>
                    </button>
                    <button type="button" class="theme-option" data-theme="dark" aria-label="Switch to dark mode" aria-pressed="false">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                        <span>Dark</span>
                    </button>
                </div>
            </div>

            <div class="drawer-section">
                <div class="drawer-section-header">
                    <span class="drawer-section-title">Pastel Palette</span>
                </div>
                <div class="palette-grid" role="group" aria-label="Pastel color palette">
                    ${paletteButtons}
                </div>
            </div>

            <div class="drawer-section">
                <div class="drawer-section-header">
                    <span class="drawer-section-title">Auto-Theme Sensor</span>
                </div>
                <p class="drawer-sensor-help">Automatically shift palette from a live signal on your device.</p>
                <div class="driver-grid" role="group" aria-label="Device factor auto-theme sensor">
                    ${driverButtons}
                </div>
                <div class="drawer-sensor-readout" aria-live="polite">
                    <span class="drawer-sensor-dot" aria-hidden="true"></span>
                    <span class="drawer-sensor-status"></span>
                </div>
            </div>
        `;
    }

    function initDrawer(options) {
        const opts = options || {};
        loadStoredPreferences();

        const hamburger = document.getElementById(opts.hamburgerId || 'hamburger');
        const drawer = document.getElementById(opts.drawerId || 'burger-drawer');
        const backdrop = document.getElementById(opts.backdropId || 'burger-backdrop');
        const themeHost = document.getElementById(opts.themeHostId || 'burger-drawer-theme');

        if (themeHost && !drawerMounted) {
            drawerMounted = true;
            themeHost.innerHTML = buildThemeStudioMarkup();

            themeHost.querySelectorAll('.theme-option').forEach((btn) => {
                btn.addEventListener('click', () => setTheme(btn.dataset.theme));
            });

            themeHost.querySelectorAll('.palette-option').forEach((btn) => {
                btn.addEventListener('click', () => setManualPalette(btn.dataset.palette));
            });

            themeHost.querySelectorAll('.driver-option').forEach((btn) => {
                btn.addEventListener('click', () => setDriver(btn.dataset.driver));
            });
        }

        function setDrawerOpen(open) {
            if (!drawer || !hamburger) return;
            drawer.classList.toggle('open', open);
            drawer.setAttribute('aria-hidden', String(!open));
            if (backdrop) backdrop.classList.toggle('open', open);
            hamburger.classList.toggle('active', open);
            hamburger.setAttribute('aria-expanded', String(open));
            hamburger.setAttribute('aria-label', open ? 'Close menu and theme controls' : 'Open menu and theme controls');
        }

        if (hamburger && drawer && !hamburger.dataset.drawerBound) {
            hamburger.dataset.drawerBound = 'true';

            hamburger.addEventListener('click', (e) => {
                e.stopPropagation();
                setDrawerOpen(!drawer.classList.contains('open'));
            });

            const closeBtn = drawer.querySelector('.drawer-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    setDrawerOpen(false);
                    hamburger.focus();
                });
            }

            if (backdrop) {
                backdrop.addEventListener('click', () => setDrawerOpen(false));
            }

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && drawer.classList.contains('open')) {
                    setDrawerOpen(false);
                    hamburger.focus();
                }
            });

            document.addEventListener('click', (e) => {
                if (!drawer.classList.contains('open')) return;
                if (!drawer.contains(e.target) && !hamburger.contains(e.target)) {
                    setDrawerOpen(false);
                }
            });
        }

        if (!storageBound && typeof window !== 'undefined') {
            storageBound = true;
            window.addEventListener('storage', (e) => {
                if (e.key === 'theme' || e.key === 'themePalette' || e.key === 'themeDriver') {
                    loadStoredPreferences();
                    evaluateDriver();
                }
            });
        }

        evaluateDriver();

        return {
            close: () => setDrawerOpen(false),
            open: () => setDrawerOpen(true),
            setTheme,
            setManualPalette,
            setDriver,
        };
    }

    function initPassive() {
        loadStoredPreferences();
        evaluateDriver();
    }

    return {
        PALETTES,
        DRIVERS,
        resolvePaletteFromClock,
        resolvePaletteFromBattery,
        resolvePaletteFromCores,
        resolvePaletteFromViewport,
        initDrawer,
        initPassive,
        setTheme,
        setManualPalette,
        setDriver,
    };
});
