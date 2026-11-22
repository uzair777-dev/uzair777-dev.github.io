/* ═══════════════════════════════════════════════════════════
   theme-engine.js — Time-Accurate Solar Pastel Engine,
   Portable Time-Synced Custom Solar Loaders & Accessible Drawer
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

    const PALETTES = ['dawn', 'noon', 'dusk', 'night'];

    const SOLAR_META = {
        dawn: {
            label: 'sunrise peach and morning apricot',
            greeting: 'Good morning, friend. You found the quiet lane. Right now the site is tinted in warm sunrise peach to match early daylight — and Uzair tucked a few quiet notes along the pages just for screen reader and keyboard visitors. Enjoy your stay.',
        },
        noon: {
            label: 'warm midday sunlight and clear sky',
            greeting: 'Hey there, friend. You found the quiet lane. Right now the site is dressed in warm midday sunlight and clear sky tones — and Uzair tucked a few quiet notes along the pages just for screen reader and keyboard visitors. Take your time.',
        },
        dusk: {
            label: 'golden-hour sunset rose and warm amber',
            greeting: 'Good evening, friend. You found the quiet lane. Right now the site is glowing in soft golden-hour sunset rose and amber — and Uzair tucked a few quiet notes along the pages just for screen reader and keyboard visitors. Glad you stopped by.',
        },
        night: {
            label: 'quiet moonlit indigo and starlight cyan',
            greeting: 'Hello, fellow night owl. You found the quiet lane. Right now the site is resting in quiet moonlit indigo and starlight cyan — and Uzair tucked a few small notes along the pages just for screen reader and keyboard visitors. Remember to drink some water.',
        },
    };

    const SOLAR_LOADER_META = {
        dawn: {
            id: 'dawn-horizon',
            name: 'Rising Sun Horizon',
            caption: '// rising with the sun...',
        },
        noon: {
            id: 'noon-astrolabe',
            name: 'Midday Solar Gyro',
            caption: '// syncing midday nodes...',
        },
        dusk: {
            id: 'dusk-equalizer',
            name: 'Golden Hour Horizon Bars',
            caption: '// catching golden hour...',
        },
        night: {
            id: 'night-orbit',
            name: 'Moonlit Crescent Orbit',
            caption: '// booting night shift...',
        },
    };

    // Silent time-authentic solar palette resolution from visitor's local hour
    function resolvePaletteFromClock(hour) {
        const h = Number.isFinite(hour) ? ((Math.floor(hour) % 24) + 24) % 24 : 18;
        if (h >= 5 && h <= 10) return 'dawn';   // 05:00 - 10:59 Sunrise / Morning
        if (h >= 11 && h <= 16) return 'noon';  // 11:00 - 16:59 Midday / High Sun
        if (h >= 17 && h <= 20) return 'dusk';  // 17:00 - 20:59 Golden Hour / Sunset
        return 'night';                         // 21:00 - 04:59 Late Night / Moonlit
    }

    function getSolarMeta(paletteOrHour) {
        const key = typeof paletteOrHour === 'number'
            ? resolvePaletteFromClock(paletteOrHour)
            : (SOLAR_META[paletteOrHour] ? paletteOrHour : 'dusk');
        return { palette: key, ...SOLAR_META[key] };
    }

    function getSolarLoaderMeta(paletteOrHour) {
        const key = typeof paletteOrHour === 'number'
            ? resolvePaletteFromClock(paletteOrHour)
            : (SOLAR_LOADER_META[paletteOrHour] ? paletteOrHour : 'dusk');
        return { palette: key, ...SOLAR_LOADER_META[key] };
    }

    function escapeAttr(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    let solarClipCounter = 0;

    // Four distinct, GPU-composited, theme-reactive solar loaders (zero external assets)
    function buildSolarLoaderSVG(phase) {
        const clipUid = ++solarClipCounter;

        if (phase === 'dawn') {
            const clipId = `dawn-sky-clip-${clipUid}`;
            return `
                <svg class="solar-loader-svg solar-loader-svg--dawn" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
                    <defs>
                        <clipPath id="${clipId}">
                            <rect x="6" y="6" width="68" height="44" />
                        </clipPath>
                    </defs>
                    <g clip-path="url(#${clipId})">
                        <g class="sl-dawn-rays">
                            <line x1="40" y1="14" x2="40" y2="21" stroke="var(--accent-2)" stroke-width="2.4" stroke-linecap="round" class="sl-ray sl-ray-1" />
                            <line x1="22" y1="21" x2="27" y2="26" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round" class="sl-ray sl-ray-2" />
                            <line x1="58" y1="21" x2="53" y2="26" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round" class="sl-ray sl-ray-3" />
                            <line x1="14" y1="36" x2="21" y2="36" stroke="var(--accent-2)" stroke-width="2.4" stroke-linecap="round" class="sl-ray sl-ray-4" />
                            <line x1="66" y1="36" x2="59" y2="36" stroke="var(--accent-2)" stroke-width="2.4" stroke-linecap="round" class="sl-ray sl-ray-5" />
                        </g>
                        <g class="sl-dawn-sun">
                            <circle cx="40" cy="48" r="15" fill="var(--accent-2)" stroke="var(--card-border)" stroke-width="2" />
                            <circle cx="40" cy="48" r="8" fill="var(--accent)" opacity="0.6" />
                        </g>
                    </g>
                    <line x1="10" y1="50" x2="70" y2="50" stroke="var(--card-border)" stroke-width="2.2" stroke-linecap="round" />
                    <line x1="18" y1="57" x2="54" y2="57" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round" class="sl-mist-a" />
                    <line x1="28" y1="64" x2="62" y2="64" stroke="var(--accent-2)" stroke-width="2.2" stroke-linecap="round" class="sl-mist-b" />
                </svg>
            `;
        }

        if (phase === 'noon') {
            return `
                <svg class="solar-loader-svg solar-loader-svg--noon" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
                    <g class="sl-noon-outer">
                        <circle cx="40" cy="40" r="28" fill="none" stroke="var(--card-border)" stroke-width="1.6" stroke-dasharray="6 5" />
                        <circle cx="40" cy="12" r="4.2" fill="var(--accent-2)" stroke="var(--card-border)" stroke-width="1.4" />
                        <circle cx="40" cy="68" r="3.4" fill="var(--accent)" stroke="var(--card-border)" stroke-width="1.4" />
                    </g>
                    <g class="sl-noon-inner">
                        <circle cx="40" cy="40" r="19" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-dasharray="14 8" stroke-linecap="round" />
                        <circle cx="59" cy="40" r="3.6" fill="var(--accent)" />
                    </g>
                    <g class="sl-noon-core">
                        <circle cx="40" cy="40" r="10.5" fill="var(--accent)" stroke="var(--card-border)" stroke-width="1.8" />
                        <circle cx="40" cy="40" r="4.5" fill="var(--bg-light)" />
                    </g>
                </svg>
            `;
        }

        if (phase === 'night') {
            return `
                <svg class="solar-loader-svg solar-loader-svg--night" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
                    <circle cx="40" cy="40" r="28" fill="none" stroke="var(--border-hairline)" stroke-width="1.4" stroke-dasharray="3 5" />
                    <g class="sl-night-orbit">
                        <circle cx="40" cy="12" r="4" fill="var(--accent-2)" stroke="var(--card-border)" stroke-width="1.3" />
                    </g>
                    <g class="sl-night-moon">
                        <path d="M 44 25 A 15 15 0 1 0 54 47 A 11.5 11.5 0 1 1 44 25 Z" fill="var(--accent)" stroke="var(--card-border)" stroke-width="1.8" stroke-linejoin="round" />
                    </g>
                    <path class="sl-star sl-star-1" d="M 20 20 L 21.8 24.2 L 26 26 L 21.8 27.8 L 20 32 L 18.2 27.8 L 14 26 L 18.2 24.2 Z" fill="var(--accent-2)" />
                    <path class="sl-star sl-star-2" d="M 60 52 L 61.5 55.5 L 65 57 L 61.5 58.5 L 60 62 L 58.5 58.5 L 55 57 L 58.5 55.5 Z" fill="var(--accent)" />
                    <circle class="sl-star sl-star-3" cx="22" cy="58" r="2.2" fill="var(--text-light)" />
                </svg>
            `;
        }

        // Default: Dusk — Golden-hour sliced sunset sun + dancing equalizer horizon reflections
        const clipId = `dusk-sun-clip-${clipUid}`;
        return `
            <svg class="solar-loader-svg solar-loader-svg--dusk" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
                <defs>
                    <clipPath id="${clipId}">
                        <rect x="10" y="10" width="60" height="34" />
                    </clipPath>
                </defs>
                <g clip-path="url(#${clipId})">
                    <g class="sl-dusk-sun">
                        <circle cx="40" cy="42" r="18" fill="var(--accent-2)" stroke="var(--card-border)" stroke-width="1.8" />
                        <path d="M 22 36 H 58" stroke="var(--bg-light)" stroke-width="2.2" />
                        <path d="M 24 41 H 56" stroke="var(--bg-light)" stroke-width="2.4" />
                        <circle cx="40" cy="30" r="7" fill="var(--accent)" opacity="0.55" />
                    </g>
                </g>
                <line x1="12" y1="44" x2="68" y2="44" stroke="var(--card-border)" stroke-width="2.2" stroke-linecap="round" />
                <g class="sl-dusk-bars">
                    <rect class="sl-eq-bar sl-eq-1" x="20" y="50" width="6" height="16" rx="2" fill="var(--accent)" />
                    <rect class="sl-eq-bar sl-eq-2" x="29" y="50" width="6" height="20" rx="2" fill="var(--accent-2)" />
                    <rect class="sl-eq-bar sl-eq-3" x="38" y="50" width="6" height="14" rx="2" fill="var(--accent)" />
                    <rect class="sl-eq-bar sl-eq-4" x="47" y="50" width="6" height="19" rx="2" fill="var(--accent-2)" />
                    <rect class="sl-eq-bar sl-eq-5" x="56" y="50" width="6" height="15" rx="2" fill="var(--accent)" />
                </g>
            </svg>
        `;
    }

    function buildSolarLoaderMarkup(options) {
        const opts = options || {};
        const domPal = (typeof document !== 'undefined' && document.documentElement)
            ? document.documentElement.getAttribute('data-palette')
            : null;
        const phase = SOLAR_LOADER_META[opts.phase]
            ? opts.phase
            : (SOLAR_LOADER_META[domPal] ? domPal : resolvePaletteFromClock(new Date().getHours()));
        const meta = SOLAR_LOADER_META[phase];
        const label = typeof opts.label === 'string' ? opts.label : meta.caption;
        const compactClass = opts.compact ? ' solar-loader--compact' : '';

        return `
            <div class="solar-loader solar-loader--${phase}${compactClass}" data-solar-loader="${phase}">
                <div class="solar-loader-emblem">
                    ${buildSolarLoaderSVG(phase)}
                </div>
                ${label ? `<span class="solar-loader-label">${escapeAttr(label)}</span>` : ''}
            </div>
        `;
    }

    function mountSolarLoader(target, options) {
        if (typeof document === 'undefined' || !target) return null;
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el) return null;
        el.innerHTML = buildSolarLoaderMarkup(options);
        return el;
    }

    let currentTheme = 'light';
    let activePalette = 'dusk';
    let clockIntervalId = null;
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

    function announcePolite(message) {
        if (typeof document === 'undefined' || !message) return;
        let region = document.getElementById('a11y-announcer');
        if (!region) {
            region = document.createElement('div');
            region.id = 'a11y-announcer';
            region.className = 'sr-only';
            region.setAttribute('role', 'status');
            region.setAttribute('aria-live', 'polite');
            region.setAttribute('aria-atomic', 'true');
            document.body.appendChild(region);
        }
        region.textContent = '';
        setTimeout(() => {
            region.textContent = message;
        }, 30);
    }

    function detectPreferredTheme() {
        const stored = safeGet('theme');
        if (stored === 'light' || stored === 'dark') return stored;
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    }

    function applyDOMAttributes() {
        if (typeof document === 'undefined') return;
        document.documentElement.setAttribute('data-theme', currentTheme);
        document.documentElement.setAttribute('data-palette', activePalette);
    }

    function syncThemeButtons() {
        if (typeof document === 'undefined') return;
        const isDark = currentTheme === 'dark';
        document.querySelectorAll('.sky-toggle').forEach((btn) => {
            btn.classList.toggle('is-dark', isDark);
            btn.setAttribute('aria-checked', String(isDark));
            btn.setAttribute('aria-label', isDark ? 'Dark mode active. Activate to switch to light mode' : 'Light mode active. Activate to switch to dark mode');
        });
    }

    function applySolarPalette() {
        activePalette = resolvePaletteFromClock(new Date().getHours());
        applyDOMAttributes();
    }

    function getToggleOrigin(sourceEl) {
        if (typeof window === 'undefined') return { x: 0, y: 0 };
        const orb = sourceEl && sourceEl.querySelector ? (sourceEl.querySelector('.sky-orb') || sourceEl) : null;
        if (orb && typeof orb.getBoundingClientRect === 'function') {
            const rect = orb.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            }
        }
        return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }

    function spawnIrisHaloRing(x, y, radius, toDark) {
        if (typeof document === 'undefined' || !document.body) return;
        const existing = document.getElementById('theme-iris-ring');
        if (existing) existing.remove();

        const ring = document.createElement('div');
        ring.id = 'theme-iris-ring';
        ring.className = `theme-iris-ring ${toDark ? 'theme-iris-ring--expand' : 'theme-iris-ring--collapse'}`;
        ring.setAttribute('aria-hidden', 'true');
        const diameter = Math.ceil(radius * 2);
        ring.style.setProperty('--iris-x', `${x}px`);
        ring.style.setProperty('--iris-y', `${y}px`);
        ring.style.setProperty('--iris-size', `${diameter}px`);
        document.body.appendChild(ring);

        setTimeout(() => {
            if (ring.parentNode) ring.remove();
        }, 780);
    }

    function commitThemeState(next, silent, changed) {
        currentTheme = next;
        safeSet('theme', currentTheme);
        applyDOMAttributes();
        syncThemeButtons();
        if (!silent && changed) {
            announcePolite(
                currentTheme === 'dark'
                    ? 'Switched to dark mode. Easy on the eyes.'
                    : 'Switched to light mode.'
            );
        }
    }

    let themeTransitionBusy = false;

    function setTheme(theme, silent, originEl) {
        const next = theme === 'dark' ? 'dark' : 'light';
        const changed = next !== currentTheme;

        const prefersReducedMotion = typeof window !== 'undefined'
            && window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!changed || prefersReducedMotion || typeof document === 'undefined') {
            commitThemeState(next, silent, changed);
            return;
        }

        // Photosensitive safety guard: prevent rapid >1.2Hz full-screen Light/Dark flashing
        if (themeTransitionBusy) {
            return;
        }
        themeTransitionBusy = true;
        const releaseLock = () => {
            themeTransitionBusy = false;
        };
        const safetyTimer = setTimeout(releaseLock, 1020);

        const { x, y } = getToggleOrigin(originEl);
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        ) + 2;
        const toDark = next === 'dark';

        if (typeof document.startViewTransition === 'function') {
            const root = document.documentElement;
            const irisClass = toDark ? 'theme-iris-to-dark' : 'theme-iris-to-light';

            // Freeze live CSS color/transform transitions during snapshot capture so new(root) is 100% crisp
            root.classList.remove('theme-iris-to-dark', 'theme-iris-to-light');
            root.classList.add(irisClass, 'theme-iris-freeze');
            root.setAttribute('data-iris', toDark ? 'to-dark' : 'to-light');

            const transition = document.startViewTransition(() => {
                commitThemeState(next, silent, changed);
            });

            transition.ready.then(() => {
                const clipExpand = [
                    `circle(0px at ${x}px ${y}px)`,
                    `circle(${endRadius}px at ${x}px ${y}px)`,
                ];
                const clipCollapse = [
                    `circle(${endRadius}px at ${x}px ${y}px)`,
                    `circle(0px at ${x}px ${y}px)`,
                ];
                const easing = 'cubic-bezier(0.45, 0.05, 0.25, 1)';
                const duration = 860;

                if (toDark) {
                    // Expanding pinhole iris: Dark sweeps smoothly outward from the gliding Sun/Moon orb
                    root.animate(
                        {
                            clipPath: clipExpand,
                            transform: ['scale(1.014)', 'scale(1)'],
                        },
                        {
                            duration,
                            easing,
                            fill: 'both',
                            pseudoElement: '::view-transition-new(root)',
                        }
                    );
                } else {
                    // Contracting pinhole iris: Dark collapses cleanly back into the orb to unveil Light.
                    // Top masking layer stays at scale(1) with fill:'both' — zero edge-gap or final-frame flash.
                    root.animate(
                        {
                            clipPath: clipCollapse,
                        },
                        {
                            duration,
                            easing,
                            fill: 'both',
                            pseudoElement: '::view-transition-old(root)',
                        }
                    );
                    root.animate(
                        {
                            transform: ['scale(1.014)', 'scale(1)'],
                        },
                        {
                            duration,
                            easing,
                            fill: 'both',
                            pseudoElement: '::view-transition-new(root)',
                        }
                    );
                }
            }).catch(() => {});

            transition.finished.finally(() => {
                root.classList.remove('theme-iris-to-dark', 'theme-iris-to-light', 'theme-iris-freeze');
                root.removeAttribute('data-iris');
                clearTimeout(safetyTimer);
                setTimeout(releaseLock, 80);
            });
            return;
        }

        // Graceful GPU-composited fallback for browsers without View Transitions API
        spawnIrisHaloRing(x, y, endRadius, toDark);
        commitThemeState(next, silent, changed);
    }

    function buildThemeToggleMarkup() {
        return `
            <div class="sky-toggle-wrap">
                <button type="button" role="switch" id="theme-toggle" class="sky-toggle" aria-checked="false" aria-label="Toggle dark mode">
                    <span class="sky-toggle-stage" aria-hidden="true">
                        <span class="sky-layer sky-layer--day"></span>
                        <span class="sky-layer sky-layer--night"></span>
                        <span class="sky-aurora"></span>

                        <!-- Daytime drifting cloud banks -->
                        <svg class="sky-clouds" viewBox="0 0 240 66" preserveAspectRatio="none">
                            <g class="sky-cloud-back" opacity="0.72">
                                <circle cx="152" cy="48" r="16" fill="#ffffff" />
                                <circle cx="172" cy="44" r="20" fill="#ffffff" />
                                <circle cx="195" cy="48" r="17" fill="#ffffff" />
                                <circle cx="216" cy="51" r="15" fill="#ffffff" />
                            </g>
                            <g class="sky-cloud-front" opacity="0.95">
                                <circle cx="122" cy="56" r="14" fill="#ffffff" />
                                <circle cx="144" cy="54" r="18" fill="#ffffff" />
                                <circle cx="168" cy="56" r="16" fill="#ffffff" />
                                <circle cx="194" cy="58" r="15" fill="#ffffff" />
                                <circle cx="220" cy="55" r="17" fill="#ffffff" />
                            </g>
                        </svg>

                        <!-- Nighttime twinkling stars + shooting star -->
                        <svg class="sky-stars" viewBox="0 0 240 66" preserveAspectRatio="none">
                            <path class="sky-star sky-star-1" d="M 38 14 L 40 19 L 45 21 L 40 23 L 38 28 L 36 23 L 31 21 L 36 19 Z" fill="#fef3c7" />
                            <path class="sky-star sky-star-2" d="M 88 12 L 89.6 15.8 L 93.4 17.4 L 89.6 19 L 88 22.8 L 86.4 19 L 82.6 17.4 L 86.4 15.8 Z" fill="#e0f2fe" />
                            <path class="sky-star sky-star-3" d="M 126 24 L 127.4 27.2 L 130.6 28.6 L 127.4 30 L 126 33.2 L 124.6 30 L 121.4 28.6 L 124.6 27.2 Z" fill="#fde68a" />
                            <circle class="sky-star sky-star-4" cx="62" cy="36" r="1.7" fill="#ffffff" />
                            <circle class="sky-star sky-star-5" cx="108" cy="40" r="1.5" fill="#bae6fd" />
                            <circle class="sky-star sky-star-6" cx="24" cy="42" r="1.4" fill="#fef08a" />
                            <line class="sky-shooting-star" x1="112" y1="8" x2="66" y2="28" stroke="url(#sky-shoot-grad)" stroke-width="1.8" stroke-linecap="round" />
                            <defs>
                                <linearGradient id="sky-shoot-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
                                    <stop offset="100%" stop-color="#ffffff" stop-opacity="0.95" />
                                </linearGradient>
                            </defs>
                        </svg>

                        <!-- Rolling horizon landscape silhouettes -->
                        <svg class="sky-horizon" viewBox="0 0 240 66" preserveAspectRatio="none">
                            <path class="sky-hill-far" d="M 0 58 Q 52 38 118 52 T 240 46 L 240 66 L 0 66 Z" />
                            <path class="sky-hill-near" d="M 0 62 Q 68 48 142 58 T 240 54 L 240 66 L 0 66 Z" />
                        </svg>

                        <!-- Subtle opposite-side labels -->
                        <span class="sky-state-tag sky-state-tag--day">LIGHT</span>
                        <span class="sky-state-tag sky-state-tag--night">DARK</span>

                        <!-- Kinetic Sun <-> Moon Eclipse Orb -->
                        <span class="sky-orb-track">
                            <span class="sky-orb">
                                <span class="sky-orb-halo"></span>
                                <span class="sky-sun-rays">
                                    <i></i><i></i><i></i><i></i>
                                </span>
                                <span class="sky-orb-disc">
                                    <span class="sky-moon-craters">
                                        <i class="crater-a"></i>
                                        <i class="crater-b"></i>
                                        <i class="crater-c"></i>
                                    </span>
                                    <span class="sky-eclipse-cut"></span>
                                </span>
                            </span>
                        </span>
                    </span>
                </button>
            </div>
        `;
    }

    function getVisibleFocusables(container) {
        if (!container) return [];
        const nodes = container.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
        return Array.from(nodes).filter((el) => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
        });
    }

    function initDrawer(options) {
        const opts = options || {};
        currentTheme = detectPreferredTheme();
        applySolarPalette();

        if (clockIntervalId === null) {
            clockIntervalId = setInterval(applySolarPalette, 60000);
        }

        const hamburger = document.getElementById(opts.hamburgerId || 'hamburger');
        const drawer = document.getElementById(opts.drawerId || 'burger-drawer');
        const backdrop = document.getElementById(opts.backdropId || 'burger-backdrop');
        const themeHost = document.getElementById(opts.themeHostId || 'burger-drawer-theme');

        if (themeHost && !drawerMounted) {
            drawerMounted = true;
            themeHost.innerHTML = buildThemeToggleMarkup();
            const toggleBtn = themeHost.querySelector('.sky-toggle');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    setTheme(currentTheme === 'dark' ? 'light' : 'dark', false, toggleBtn);
                });
            }
        }

        syncThemeButtons();

        function setDrawerOpen(open, restoreFocus) {
            if (!drawer || !hamburger) return;
            const wasOpen = drawer.classList.contains('open');
            drawer.classList.toggle('open', open);
            drawer.setAttribute('aria-hidden', String(!open));
            if (backdrop) backdrop.classList.toggle('open', open);
            hamburger.classList.toggle('active', open);
            hamburger.setAttribute('aria-expanded', String(open));
            hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');

            if (open && !wasOpen) {
                const focusables = getVisibleFocusables(drawer);
                if (focusables.length > 0) {
                    setTimeout(() => focusables[0].focus(), 40);
                }
            } else if (!open && wasOpen && restoreFocus) {
                hamburger.focus();
            }
        }

        if (hamburger && drawer && !hamburger.dataset.drawerBound) {
            hamburger.dataset.drawerBound = 'true';

            hamburger.addEventListener('click', (e) => {
                e.stopPropagation();
                const willOpen = !drawer.classList.contains('open');
                setDrawerOpen(willOpen, !willOpen);
            });

            const closeBtn = drawer.querySelector('.drawer-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => setDrawerOpen(false, true));
            }

            if (backdrop) {
                backdrop.addEventListener('click', () => setDrawerOpen(false, false));
            }

            document.addEventListener('keydown', (e) => {
                if (!drawer.classList.contains('open')) return;
                if (e.key === 'Escape') {
                    e.preventDefault();
                    setDrawerOpen(false, true);
                    return;
                }
                if (e.key === 'Tab') {
                    const focusables = getVisibleFocusables(drawer);
                    if (focusables.length === 0) return;
                    const first = focusables[0];
                    const last = focusables[focusables.length - 1];
                    if (e.shiftKey && document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    } else if (!e.shiftKey && document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            });

            document.addEventListener('click', (e) => {
                if (!drawer.classList.contains('open')) return;
                if (!drawer.contains(e.target) && !hamburger.contains(e.target)) {
                    setDrawerOpen(false, false);
                }
            });
        }

        if (!storageBound && typeof window !== 'undefined') {
            storageBound = true;
            window.addEventListener('storage', (e) => {
                if (e.key === 'theme') {
                    currentTheme = detectPreferredTheme();
                    applyDOMAttributes();
                    syncThemeButtons();
                }
            });
        }

        bindCrossPageCurtainLinks(() => setDrawerOpen(false, false));

        return {
            close: () => setDrawerOpen(false, false),
            open: () => setDrawerOpen(true, false),
            setTheme,
            announcePolite,
            buildSolarLoaderMarkup,
            mountSolarLoader,
            getActivePalette: () => activePalette,
        };
    }

    // ═══════════════════════════════════════════════════════════
    //  Cross-Page Pastel Multi-Ribbon Curtain Engine (Portfolio <-> devLOGS)
    // ═══════════════════════════════════════════════════════════
    const CURTAIN_HANDOFF_KEY = 'portfolio_curtain_handoff';
    const CURTAIN_HANDOFF_TTL_MS = 4500;
    const VALID_SPA_ROUTES = new Set(['home', 'about', 'experience', 'contact', 'resources']);

    let curtainNavigating = false;
    let crossPageCurtainBound = false;
    let closeDrawerHook = null;
    let incomingCurtainActive = false;
    let incomingCurtainMountedAt = 0;
    let incomingCurtainSafetyTimer = null;

    function normalizeDocPath(pathname) {
        let p = String(pathname || '/').replace(/\/index\.html$/i, '/');
        if (!p.startsWith('/')) p = '/' + p;
        if (p.length > 1 && !p.endsWith('/') && !/\.[a-z0-9]+$/i.test(p)) {
            p += '/';
        }
        return p;
    }

    function resolveCurtainLabel(href) {
        try {
            const base = (typeof window !== 'undefined' && window.location && window.location.href)
                ? window.location.href
                : 'https://uzair777-dev.github.io/';
            const url = new URL(String(href || '/'), base);
            const path = normalizeDocPath(url.pathname).toLowerCase();

            if (path.endsWith('/devlogs/editor.html')) return 'CUSTOM XML';
            if (path.startsWith('/devlogs/')) return 'DEVLOGS';

            const hash = url.hash.replace(/^#/, '').trim().toLowerCase();
            if (hash && VALID_SPA_ROUTES.has(hash)) {
                return hash.toUpperCase();
            }
            return 'HOME';
        } catch (_) {
            return 'HOME';
        }
    }

    function shouldUseCrossPageCurtain(linkInfo, currentLoc) {
        if (!linkInfo || !linkInfo.href) return false;
        const rawHref = String(linkInfo.href).trim();
        if (!rawHref || rawHref.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(rawHref)) {
            return false;
        }
        if (linkInfo.download) return false;
        const target = String(linkInfo.target || '').trim().toLowerCase();
        if (target && target !== '_self') return false;

        try {
            const loc = currentLoc || (typeof window !== 'undefined' ? window.location : null);
            const baseOrigin = (loc && loc.origin) ? loc.origin : 'https://uzair777-dev.github.io';
            const baseHref = (loc && loc.href) ? loc.href : `${baseOrigin}${loc && loc.pathname ? loc.pathname : '/'}`;
            const destUrl = new URL(rawHref, baseHref);

            if (destUrl.origin !== baseOrigin) return false;

            const currentPath = normalizeDocPath(loc ? loc.pathname : '/');
            const destPath = normalizeDocPath(destUrl.pathname);

            // Same HTML document links (e.g. SPA #routes or same-page anchors) are handled locally
            if (destPath === currentPath) return false;

            // Animate across portfolio root and devlogs pages
            return (
                destPath === '/'
                || destPath === '/devlogs/'
                || destPath === '/devlogs/editor.html'
            );
        } catch (_) {
            return false;
        }
    }

    function ensureRouteCurtain() {
        if (typeof document === 'undefined' || !document.body) return null;
        let curtain = document.getElementById('route-transition-curtain');
        if (!curtain) {
            curtain = document.createElement('div');
            curtain.id = 'route-transition-curtain';
            curtain.className = 'route-curtain';
            curtain.setAttribute('aria-hidden', 'true');
            curtain.innerHTML = `
                <div class="route-curtain-band route-curtain-band--accent"></div>
                <div class="route-curtain-band route-curtain-band--accent2"></div>
                <div class="route-curtain-band route-curtain-band--veil">
                    <div class="route-curtain-stamp">
                        <span class="route-curtain-stamp-slash">//</span>
                        <span class="route-curtain-stamp-label" id="route-curtain-label">HOME</span>
                        <span class="route-curtain-stamp-dot"></span>
                    </div>
                </div>
            `;
            document.body.appendChild(curtain);
        }
        return curtain;
    }

    function applyRouteStagger(container, selector) {
        if (!container || typeof container.querySelectorAll !== 'function') return;
        const defaultSelector = '.page-masthead, .hero-editorial, .resume-banner, .about-spread, .pillar-card, .skill-item, .experience-timeline-item, .contact-aside, .contact-form, .resource-item, .note-banner, .devlog-hero-inner, .devlog-controls, .devlog-card';
        const targets = container.querySelectorAll(selector || defaultSelector);
        targets.forEach((el, idx) => {
            el.style.setProperty('--stagger-i', String(Math.min(idx, 10)));
            el.classList.add('route-stagger-item');
            el.addEventListener('animationend', () => {
                el.classList.remove('route-stagger-item');
                el.style.removeProperty('--stagger-i');
            }, { once: true });
        });
    }

    function resetCurtainState() {
        curtainNavigating = false;
        incomingCurtainActive = false;
        if (incomingCurtainSafetyTimer) {
            clearTimeout(incomingCurtainSafetyTimer);
            incomingCurtainSafetyTimer = null;
        }
        if (typeof document === 'undefined') return;
        document.documentElement.removeAttribute('data-curtain-handoff');
        const curtain = document.getElementById('route-transition-curtain');
        if (curtain) {
            curtain.classList.remove('is-active', 'is-held', 'phase-in', 'phase-out');
        }
        document.querySelectorAll('.is-route-exiting').forEach((el) => {
            el.classList.remove('is-route-exiting');
        });
    }

    function navigateWithCurtain(href, labelOverride) {
        if (typeof window === 'undefined' || !href) return;
        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            window.location.href = href;
            return;
        }
        if (curtainNavigating) return;
        curtainNavigating = true;

        if (typeof closeDrawerHook === 'function') {
            try { closeDrawerHook(); } catch (_) {}
        }

        const label = labelOverride || resolveCurtainLabel(href);
        const curtain = ensureRouteCurtain();
        if (!curtain) {
            window.location.href = href;
            return;
        }

        const labelEl = curtain.querySelector('#route-curtain-label');
        if (labelEl) labelEl.textContent = label;

        curtain.classList.remove('phase-out', 'is-held');
        curtain.classList.add('is-active');
        void curtain.offsetWidth;
        curtain.classList.add('phase-in');

        const exitTargets = document.querySelectorAll('#main-content, .devlog-hero, .devlog-container, .editor-layout');
        exitTargets.forEach((el) => el.classList.add('is-route-exiting'));

        try {
            window.sessionStorage.setItem(
                CURTAIN_HANDOFF_KEY,
                JSON.stringify({ label, ts: Date.now() })
            );
        } catch (_) {}

        // Navigate right as the 3rd pastel ribbon settles cleanly over the viewport
        setTimeout(() => {
            window.location.href = href;
        }, 760);
    }

    function consumeHandoffPayload() {
        if (typeof window === 'undefined') return null;
        const attrLabel = typeof document !== 'undefined'
            ? document.documentElement.getAttribute('data-curtain-handoff')
            : null;
        let stored = null;
        try {
            const raw = window.sessionStorage.getItem(CURTAIN_HANDOFF_KEY);
            if (raw) {
                window.sessionStorage.removeItem(CURTAIN_HANDOFF_KEY);
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed.ts === 'number' && (Date.now() - parsed.ts) < CURTAIN_HANDOFF_TTL_MS) {
                    stored = parsed;
                }
            }
        } catch (_) {}

        if (stored && stored.label) return String(stored.label);
        if (attrLabel) return String(attrLabel);
        return null;
    }

    function mountIncomingCurtainIfPresent() {
        if (typeof document === 'undefined' || !document.body) return false;
        const prefersReducedMotion = typeof window !== 'undefined'
            && window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const label = consumeHandoffPayload();
        if (!label || prefersReducedMotion) {
            document.documentElement.removeAttribute('data-curtain-handoff');
            return false;
        }

        const curtain = ensureRouteCurtain();
        if (!curtain) {
            document.documentElement.removeAttribute('data-curtain-handoff');
            return false;
        }

        const labelEl = curtain.querySelector('#route-curtain-label');
        if (labelEl) labelEl.textContent = label;

        curtain.classList.remove('phase-in', 'phase-out');
        curtain.classList.add('is-active', 'is-held');
        incomingCurtainActive = true;
        incomingCurtainMountedAt = (typeof performance !== 'undefined') ? performance.now() : Date.now();

        // Remove the pre-paint pseudo-element veil once the real curtain DOM is composited
        requestAnimationFrame(() => {
            document.documentElement.removeAttribute('data-curtain-handoff');
        });

        // Failsafe: never allow an unexpected script error to leave the curtain stuck
        incomingCurtainSafetyTimer = setTimeout(() => {
            if (incomingCurtainActive) {
                releaseIncomingCurtain({ minHoldMs: 0 });
            }
        }, 3500);

        return true;
    }

    function hasIncomingCurtainHandoff() {
        if (incomingCurtainActive) return true;
        if (typeof document !== 'undefined' && document.documentElement.hasAttribute('data-curtain-handoff')) {
            return true;
        }
        return false;
    }

    function releaseIncomingCurtain(options) {
        const opts = options || {};
        const minHoldMs = typeof opts.minHoldMs === 'number' ? opts.minHoldMs : 240;
        const onReveal = typeof opts.onReveal === 'function' ? opts.onReveal : null;

        if (!incomingCurtainActive) {
            if (typeof document !== 'undefined') {
                document.documentElement.removeAttribute('data-curtain-handoff');
            }
            if (onReveal) onReveal();
            return;
        }

        incomingCurtainActive = false;
        if (incomingCurtainSafetyTimer) {
            clearTimeout(incomingCurtainSafetyTimer);
            incomingCurtainSafetyTimer = null;
        }

        const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
        const elapsed = now - incomingCurtainMountedAt;
        const remaining = Math.max(0, minHoldMs - elapsed);

        setTimeout(() => {
            const curtain = document.getElementById('route-transition-curtain');
            document.documentElement.removeAttribute('data-curtain-handoff');
            if (onReveal) onReveal();
            if (!curtain) return;

            // Force layout sync while still held, then release into smooth upward peel
            void curtain.offsetWidth;
            requestAnimationFrame(() => {
                curtain.classList.remove('is-held', 'phase-in');
                curtain.classList.add('phase-out');
            });

            setTimeout(() => {
                curtain.classList.remove('is-active', 'phase-out', 'is-held');
            }, 920);
        }, remaining);
    }

    function bindCrossPageCurtainLinks(closeDrawerFn) {
        if (typeof closeDrawerFn === 'function') {
            closeDrawerHook = closeDrawerFn;
        }
        if (crossPageCurtainBound || typeof document === 'undefined' || typeof window === 'undefined') return;
        crossPageCurtainBound = true;

        document.addEventListener('click', (e) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                return;
            }
            const anchor = e.target && typeof e.target.closest === 'function'
                ? e.target.closest('a[href]')
                : null;
            if (!anchor) return;

            const info = {
                href: anchor.getAttribute('href'),
                target: anchor.getAttribute('target'),
                download: anchor.hasAttribute('download'),
            };
            if (!shouldUseCrossPageCurtain(info, window.location)) return;

            e.preventDefault();
            const label = anchor.dataset.curtainLabel || resolveCurtainLabel(anchor.href);
            navigateWithCurtain(anchor.href, label);
        });

        // Clean up curtain state if browser restores the page from bfcache (Back/Forward button)
        window.addEventListener('pageshow', (e) => {
            if (e.persisted || curtainNavigating) {
                resetCurtainState();
            }
        });
    }

    // Auto-mount held incoming curtain as soon as this deferred script runs (before DOMContentLoaded)
    if (typeof document !== 'undefined') {
        if (document.body) {
            mountIncomingCurtainIfPresent();
        } else {
            document.addEventListener('DOMContentLoaded', mountIncomingCurtainIfPresent, { once: true });
        }
    }

    return {
        PALETTES,
        SOLAR_META,
        SOLAR_LOADER_META,
        CURTAIN_HANDOFF_KEY,
        resolvePaletteFromClock,
        getSolarMeta,
        getSolarLoaderMeta,
        buildSolarLoaderSVG,
        buildSolarLoaderMarkup,
        mountSolarLoader,
        announcePolite,
        initDrawer,
        setTheme,
        resolveCurtainLabel,
        shouldUseCrossPageCurtain,
        ensureRouteCurtain,
        applyRouteStagger,
        navigateWithCurtain,
        hasIncomingCurtainHandoff,
        mountIncomingCurtainIfPresent,
        releaseIncomingCurtain,
        bindCrossPageCurtainLinks,
        resetCurtainState,
    };
});
