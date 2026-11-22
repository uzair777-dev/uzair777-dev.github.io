// Global state
let globalConfig = {};
let currentPage = 'home';
let currentSkillFilter = 'all';
const svgCache = {};
const jsonCache = {};
const jsonPromises = new Map();
const svgPromises = new Map();

const VALID_PAGES = new Set(['home', 'about', 'experience', 'contact', 'resources']);

const HIDDEN_POCKET_NOTES = [
    'Secret note 1 of 5: You have great curiosity — most visitors never wander this far down the keyboard path. Thanks for exploring my little corner of the internet.',
    'Secret note 2 of 5: Fun fact — this site quietly shifts its colors with the sun outside your window, moving from sunrise peach to warm midday gold, sunset rose, and moonlit indigo.',
    'Secret note 3 of 5: Gentle reminder from a fellow terminal dweller: unclench your jaw, drop your shoulders, and take one slow breath. You are doing better than you think.',
    'Secret note 4 of 5: sudo apt-get install good-day — completed with zero broken packages, 100 percent deserved.',
    'Secret note 5 of 5: That is all five hidden notes! You unlocked the unofficial Champion of the Quiet Lane badge. Wishing you warm drinks, clean builds, and kind people today.',
];

let pocketNoteIndex = 0;

function announceA11y(message) {
    if (window.PortfolioThemeEngine && typeof window.PortfolioThemeEngine.announcePolite === 'function') {
        window.PortfolioThemeEngine.announcePolite(message);
        return;
    }
    const region = document.getElementById('a11y-announcer');
    if (region && message) {
        region.textContent = '';
        setTimeout(() => { region.textContent = message; }, 30);
    }
}

function getCurrentSolarMood() {
    const pal = document.documentElement.getAttribute('data-palette') || 'dusk';
    if (window.PortfolioThemeEngine && typeof window.PortfolioThemeEngine.getSolarMeta === 'function') {
        return window.PortfolioThemeEngine.getSolarMeta(pal);
    }
    return {
        palette: pal,
        label: 'pastel solar tones',
        greeting: 'Welcome to the quiet lane. Uzair tucked a few small notes along these pages for screen reader and keyboard visitors.',
    };
}

// Theme-adaptive bespoke vector artwork for Home Hero (shifts dynamically with Light/Dark & Solar Phase)
function buildHeroArtworkSVG() {
    const mood = getCurrentSolarMood();
    const ariaDesc = `Geometric solar horizon and isometric network topology blueprint rendered in ${mood.label}, with glowing packet paths linking modular server nodes under a live sun and moon arc.`;
    return `
        <svg class="theme-svg hero-svg-art" viewBox="0 0 560 390" role="img" aria-label="${escapeHTML(ariaDesc)}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="hero-dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1" fill="var(--border-hairline)" />
                </pattern>
                <radialGradient id="hero-solar-halo" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="var(--solar-disc, var(--accent-2))" stop-opacity="0.46" />
                    <stop offset="55%" stop-color="var(--accent)" stop-opacity="0.16" />
                    <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
                </radialGradient>
                <linearGradient id="hero-horizon-fade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--accent-soft)" />
                    <stop offset="100%" stop-color="var(--bg-color)" stop-opacity="0.96" />
                </linearGradient>
                <linearGradient id="hero-trace-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="var(--accent)" />
                    <stop offset="100%" stop-color="var(--accent-2)" />
                </linearGradient>
            </defs>

            <!-- Sky Canvas & Technical Dot Grid -->
            <rect width="560" height="390" fill="var(--bg-color)" />
            <rect width="560" height="214" fill="url(#hero-dot-grid)" />

            <!-- Subtle Solar Horizon Band -->
            <rect x="0" y="156" width="560" height="58" fill="url(#hero-horizon-fade)" opacity="0.65" />

            <!-- Soft Celestial Halo (moves with solar phase via CSS) -->
            <g class="solar-glow" aria-hidden="true">
                <circle cx="0" cy="0" r="96" fill="url(#hero-solar-halo)" />
            </g>

            <!-- Dashed Solar Orbital Arc & Phase Ticks -->
            <path d="M 46 214 Q 280 22 514 214" fill="none" stroke="var(--border-hairline)" stroke-width="1.4" stroke-dasharray="4 6" />
            <circle cx="122" cy="134" r="3" fill="var(--bg-light)" stroke="var(--border-color)" stroke-width="1.2" />
            <circle cx="280" cy="72" r="3" fill="var(--bg-light)" stroke="var(--border-color)" stroke-width="1.2" />
            <circle cx="438" cy="134" r="3" fill="var(--bg-light)" stroke="var(--border-color)" stroke-width="1.2" />

            <!-- Sun Emblem (Dawn / Noon / Dusk) -->
            <g class="solar-sun" aria-hidden="true">
                <circle cx="0" cy="0" r="36" fill="none" stroke="var(--solar-disc, var(--accent-2))" stroke-width="1.3" stroke-dasharray="3 4" opacity="0.88" />
                <circle cx="0" cy="0" r="24" fill="var(--solar-disc, var(--accent-2))" stroke="var(--card-border)" stroke-width="1.6" />
                <circle cx="0" cy="0" r="13" fill="var(--solar-core, var(--accent))" opacity="0.82" />
                <line x1="0" y1="-44" x2="0" y2="-38" stroke="var(--solar-disc, var(--accent-2))" stroke-width="1.6" stroke-linecap="round" />
                <line x1="0" y1="38" x2="0" y2="44" stroke="var(--solar-disc, var(--accent-2))" stroke-width="1.6" stroke-linecap="round" />
                <line x1="-44" y1="0" x2="-38" y2="0" stroke="var(--solar-disc, var(--accent-2))" stroke-width="1.6" stroke-linecap="round" />
                <line x1="38" y1="0" x2="44" y2="0" stroke="var(--solar-disc, var(--accent-2))" stroke-width="1.6" stroke-linecap="round" />
            </g>

            <!-- Crescent Moon & Starfield (Night) -->
            <g class="solar-stars" aria-hidden="true">
                <path d="M 96 64 L 99 71 L 106 74 L 99 77 L 96 84 L 93 77 L 86 74 L 93 71 Z" fill="var(--accent-2)" class="svg-pulse" />
                <path d="M 456 54 L 458.5 60 L 464.5 62.5 L 458.5 65 L 456 71 L 453.5 65 L 447.5 62.5 L 453.5 60 Z" fill="var(--accent)" class="svg-pulse" />
                <circle cx="174" cy="52" r="2" fill="var(--accent)" />
                <circle cx="388" cy="88" r="2.2" fill="var(--accent-2)" />
                <circle cx="494" cy="118" r="1.8" fill="var(--text-light)" />
                <circle cx="72" cy="126" r="1.8" fill="var(--text-light)" />
            </g>
            <g class="solar-moon" aria-hidden="true">
                <circle cx="0" cy="0" r="34" fill="none" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="3 5" opacity="0.75" />
                <path d="M 8 -22 A 23 23 0 1 0 22 10 A 18 18 0 1 1 8 -22 Z" fill="var(--accent)" stroke="var(--card-border)" stroke-width="1.5" stroke-linejoin="round" />
            </g>

            <!-- Architectural Horizon Plane & Perspective Grid -->
            <rect x="0" y="214" width="560" height="176" fill="var(--bg-subtle)" />
            <line x1="0" y1="214" x2="560" y2="214" stroke="var(--card-border)" stroke-width="1.6" />
            <line x1="0" y1="219" x2="560" y2="219" stroke="var(--accent)" stroke-width="1.2" opacity="0.6" />

            <!-- Perspective Mesh Lines -->
            <g stroke="var(--border-hairline)" stroke-width="1">
                <line x1="280" y1="214" x2="280" y2="390" />
                <line x1="220" y1="214" x2="110" y2="390" />
                <line x1="160" y1="214" x2="-40" y2="390" />
                <line x1="340" y1="214" x2="450" y2="390" />
                <line x1="400" y1="214" x2="600" y2="390" />
                <line x1="0" y1="244" x2="560" y2="244" />
                <line x1="0" y1="280" x2="560" y2="280" />
                <line x1="0" y1="326" x2="560" y2="326" />
            </g>

            <!-- Glowing Packet Routing Traces between Isometric Nodes -->
            <g fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M 228 292 L 284 264 L 352 296 L 424 258" stroke="url(#hero-trace-grad)" stroke-width="2.4" />
                <path d="M 284 264 L 330 236 L 408 236" stroke="var(--accent-2)" stroke-width="1.8" stroke-dasharray="5 4" />
            </g>

            <!-- Isometric Node Tower A (Center-Right Primary Core) -->
            <g stroke="var(--card-border)" stroke-width="1.5" stroke-linejoin="round">
                <!-- Extruded Base Shadow -->
                <polygon points="352,324 416,294 480,324 416,354" fill="var(--accent-soft)" stroke="none" />
                <!-- Left Face -->
                <polygon points="356,216 416,246 416,336 356,306" fill="var(--bg-light)" />
                <!-- Right Face -->
                <polygon points="416,246 476,216 476,306 416,336" fill="var(--accent-soft)" />
                <!-- Top Face -->
                <polygon points="416,186 476,216 416,246 356,216" fill="var(--bg-light)" />
                <!-- Inner Top Accent Cap -->
                <polygon points="416,198 456,216 416,234 376,216" fill="var(--accent)" stroke="var(--card-border)" stroke-width="1.2" />
                <!-- Rack Slot Lines -->
                <line x1="368" y1="242" x2="404" y2="260" stroke="var(--accent)" stroke-width="2.2" />
                <line x1="368" y1="258" x2="404" y2="276" stroke="var(--accent-2)" stroke-width="2.2" />
                <line x1="368" y1="274" x2="404" y2="292" stroke="var(--border-color)" stroke-width="1.6" />
                <line x1="368" y1="290" x2="404" y2="308" stroke="var(--border-color)" stroke-width="1.6" />
            </g>

            <!-- Isometric Node Tower B (Mid-Back Relay) -->
            <g stroke="var(--card-border)" stroke-width="1.5" stroke-linejoin="round">
                <polygon points="246,238 286,258 286,314 246,294" fill="var(--bg-light)" />
                <polygon points="286,258 326,238 326,294 286,314" fill="var(--accent-2-soft)" />
                <polygon points="286,218 326,238 286,258 246,238" fill="var(--bg-light)" />
                <polygon points="286,227 310,238 286,249 262,238" fill="var(--accent-2)" stroke="var(--card-border)" stroke-width="1.1" />
                <line x1="256" y1="262" x2="276" y2="272" stroke="var(--accent)" stroke-width="2" />
                <line x1="256" y1="276" x2="276" y2="286" stroke="var(--border-color)" stroke-width="1.5" />
            </g>

            <!-- Live Signal Nodes -->
            <circle cx="284" cy="264" r="4.5" fill="var(--accent)" stroke="var(--bg-light)" stroke-width="1.5" class="svg-pulse" />
            <circle cx="352" cy="296" r="4.5" fill="var(--accent-2)" stroke="var(--bg-light)" stroke-width="1.5" class="svg-pulse" />
            <circle cx="496" cy="272" r="3.5" fill="var(--accent)" />

            <!-- Foreground Telemetry Terminal Card (Bottom-Left) -->
            <g>
                <!-- Keycap Vertical Extrusion -->
                <rect x="34" y="256" width="194" height="106" rx="6" fill="var(--card-extrude)" />
                <!-- Main Card Body -->
                <rect x="34" y="251" width="194" height="106" rx="6" fill="var(--bg-light)" stroke="var(--card-border)" stroke-width="1.6" />
                <!-- Header Divider -->
                <line x1="34" y1="273" x2="228" y2="273" stroke="var(--border-hairline)" stroke-width="1.2" />
                <!-- Window Dots -->
                <circle cx="48" cy="262" r="3.2" fill="var(--accent)" />
                <circle cx="60" cy="262" r="3.2" fill="var(--accent-2)" />
                <circle cx="72" cy="262" r="3.2" fill="var(--border-color)" />
                <text x="160" y="266" font-family="IBM Plex Mono, monospace" font-size="9" font-weight="600" fill="var(--text-light)">sys.node</text>

                <!-- Terminal Telemetry Readout -->
                <text x="46" y="292" font-family="IBM Plex Mono, monospace" font-size="10.5" font-weight="600" fill="var(--accent)">$ uname -srm</text>
                <text x="46" y="308" font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--text-color)">Linux · netsec</text>
                <text x="46" y="324" font-family="IBM Plex Mono, monospace" font-size="9.5" fill="var(--text-light)">19.07°N 72.87°E</text>

                <!-- Signal Bars -->
                <rect x="46" y="338" width="12" height="8" rx="1.5" fill="var(--accent)" />
                <rect x="62" y="335" width="12" height="11" rx="1.5" fill="var(--accent)" />
                <rect x="78" y="332" width="12" height="14" rx="1.5" fill="var(--accent-2)" />
                <rect x="94" y="336" width="12" height="10" rx="1.5" fill="var(--accent-2)" />
                <rect x="110" y="340" width="12" height="6" rx="1.5" fill="var(--border-color)" />
                <rect x="196" y="336" width="18" height="10" rx="2" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.2" />
            </g>

            <!-- Top-Left & Top-Right Architectural Coordinate Ticks -->
            <text x="20" y="26" font-family="IBM Plex Mono, monospace" font-size="9.5" font-weight="600" fill="var(--text-light)">// NODE.01</text>
            <text x="478" y="26" font-family="IBM Plex Mono, monospace" font-size="9.5" font-weight="600" fill="var(--accent)">SOLAR.SYNC</text>
        </svg>
    `;
}

// Theme-adaptive bespoke vector schematic for About Page (shifts dynamically with Light/Dark & Solar Phase)
function buildAboutArtworkSVG() {
    const mood = getCurrentSolarMood();
    const ariaDesc = `Architectural Linux terminal and cybersecurity shield schematic styled in ${mood.label}, illustrating kernel, networking, and open-source craft.`;
    return `
        <svg class="theme-svg about-svg-art" viewBox="0 0 560 420" role="img" aria-label="${escapeHTML(ariaDesc)}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="about-blueprint-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="var(--border-hairline)" stroke-width="0.9" />
                </pattern>
                <linearGradient id="about-bus-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="var(--accent)" />
                    <stop offset="100%" stop-color="var(--accent-2)" />
                </linearGradient>
            </defs>

            <!-- Blueprint Surface -->
            <rect width="560" height="420" fill="var(--bg-color)" />
            <rect width="560" height="420" fill="url(#about-blueprint-grid)" opacity="0.72" />

            <!-- Soft Atmospheric Corner Accents -->
            <circle cx="475" cy="72" r="78" fill="var(--accent-2-soft)" />
            <circle cx="88" cy="356" r="84" fill="var(--accent-soft)" />

            <!-- Chamfered PCB Bus Traces -->
            <g fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M 332 162 L 368 162 L 386 180 L 408 180" stroke="url(#about-bus-grad)" />
                <path d="M 332 204 L 384 204 L 404 224 L 404 268" stroke="var(--accent-2)" stroke-dasharray="5 4" />
                <path d="M 118 286 L 118 334 L 146 334" stroke="var(--accent)" />
                <path d="M 226 286 L 226 334 L 254 334" stroke="var(--accent-2)" />
                <path d="M 304 286 L 304 334 L 362 334" stroke="var(--border-color)" />
            </g>

            <!-- Main Linux Terminal Window (Solid Vertical Keycap Extrusion) -->
            <g>
                <rect x="36" y="64" width="296" height="226" rx="7" fill="var(--card-extrude)" />
                <rect x="36" y="58" width="296" height="226" rx="7" fill="var(--bg-light)" stroke="var(--card-border)" stroke-width="1.8" />

                <!-- Terminal Top Bar -->
                <rect x="36" y="58" width="296" height="32" rx="7" fill="var(--bg-subtle)" stroke="var(--card-border)" stroke-width="1.8" />
                <rect x="37" y="80" width="294" height="10" fill="var(--bg-subtle)" />
                <line x1="36" y1="90" x2="332" y2="90" stroke="var(--card-border)" stroke-width="1.4" />

                <!-- Window Controls -->
                <circle cx="56" cy="74" r="4" fill="var(--accent)" />
                <circle cx="71" cy="74" r="4" fill="var(--accent-2)" />
                <circle cx="86" cy="74" r="4" fill="var(--border-color)" />
                <text x="196" y="78" font-family="IBM Plex Mono, monospace" font-size="10.5" font-weight="600" fill="var(--text-light)">uzair@linux:~</text>

                <!-- Terminal Body Text -->
                <text x="54" y="118" font-family="IBM Plex Mono, monospace" font-size="11.5" font-weight="600" fill="var(--accent)">$ whoami</text>
                <text x="54" y="138" font-family="IBM Plex Mono, monospace" font-size="11" fill="var(--text-color)">uzair · linux &amp; netsec</text>

                <text x="54" y="166" font-family="IBM Plex Mono, monospace" font-size="11.5" font-weight="600" fill="var(--accent)">$ cat stack.conf</text>
                <text x="54" y="186" font-family="IBM Plex Mono, monospace" font-size="10.8" fill="var(--text-light)">  [01] cybersecurity</text>
                <text x="54" y="204" font-family="IBM Plex Mono, monospace" font-size="10.8" fill="var(--text-light)">  [02] networking &amp; arch</text>
                <text x="54" y="222" font-family="IBM Plex Mono, monospace" font-size="10.8" fill="var(--text-light)">  [03] python / bash / oss</text>

                <text x="54" y="250" font-family="IBM Plex Mono, monospace" font-size="11.5" font-weight="600" fill="var(--accent-2)">$ status --curiosity</text>
                <text x="54" y="269" font-family="IBM Plex Mono, monospace" font-size="11" fill="var(--text-color)">active (always learning)</text>
                <rect x="220" y="258" width="8" height="13" rx="1.5" fill="var(--accent)" class="svg-cursor" />
            </g>

            <!-- Geometric Security Shield & Node Constellation (Right) -->
            <g transform="translate(446, 178)">
                <circle cx="0" cy="0" r="68" fill="none" stroke="var(--border-hairline)" stroke-width="1.3" stroke-dasharray="4 5" />
                <circle cx="0" cy="0" r="52" fill="var(--bg-light)" stroke="var(--card-border)" stroke-width="1.6" />
                <!-- Hexagonal Security Shield -->
                <path d="M 0 -34 L 29 -19 L 29 7 C 29 24 14 34 0 40 C -14 34 -29 24 -29 7 L -29 -19 Z" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" />
                <!-- Inner Circuit Shield Core -->
                <path d="M 0 -20 L 16 -11 L 16 4 C 16 14 7 21 0 25 C -7 21 -16 14 -16 4 L -16 -11 Z" fill="var(--bg-light)" stroke="var(--accent-2)" stroke-width="1.6" stroke-linejoin="round" />
                <circle cx="0" cy="0" r="5.5" fill="var(--accent)" />
                <line x1="0" y1="5.5" x2="0" y2="15" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" />
                <!-- Orbiting Constellation Nodes -->
                <circle cx="-54" cy="-42" r="4.5" fill="var(--accent-2)" stroke="var(--bg-light)" stroke-width="1.5" class="svg-pulse" />
                <circle cx="58" cy="-34" r="4" fill="var(--accent)" stroke="var(--bg-light)" stroke-width="1.5" />
                <circle cx="48" cy="48" r="4.5" fill="var(--accent-2)" stroke="var(--bg-light)" stroke-width="1.5" class="svg-pulse" />
            </g>

            <!-- Subsystem Keycap Modules (Bottom Row) -->
            <g font-family="IBM Plex Mono, monospace" font-size="10.5" font-weight="600" text-anchor="middle">
                <!-- Module 1: KERNEL -->
                <rect x="64" y="340" width="116" height="40" rx="5" fill="var(--card-extrude)" />
                <rect x="64" y="336" width="116" height="40" rx="5" fill="var(--bg-light)" stroke="var(--card-border)" stroke-width="1.5" />
                <rect x="74" y="346" width="6" height="20" rx="2" fill="var(--accent)" />
                <text x="128" y="360" fill="var(--text-color)">KERNEL</text>

                <!-- Module 2: NETSEC -->
                <rect x="202" y="340" width="116" height="40" rx="5" fill="var(--card-extrude)" />
                <rect x="202" y="336" width="116" height="40" rx="5" fill="var(--bg-light)" stroke="var(--card-border)" stroke-width="1.5" />
                <rect x="212" y="346" width="6" height="20" rx="2" fill="var(--accent-2)" />
                <text x="266" y="360" fill="var(--text-color)">NETSEC</text>

                <!-- Module 3: OPEN SRC -->
                <rect x="340" y="340" width="156" height="40" rx="5" fill="var(--card-extrude)" />
                <rect x="340" y="336" width="156" height="40" rx="5" fill="var(--bg-light)" stroke="var(--card-border)" stroke-width="1.5" />
                <rect x="350" y="346" width="6" height="20" rx="2" fill="var(--accent)" />
                <text x="424" y="360" fill="var(--text-color)">OPEN SOURCE</text>
            </g>

            <!-- Blueprint Registration Header -->
            <text x="36" y="32" font-family="IBM Plex Mono, monospace" font-size="9.5" font-weight="600" fill="var(--text-light)">// WORKSPACE.SPEC</text>
            <text x="450" y="32" font-family="IBM Plex Mono, monospace" font-size="9.5" font-weight="600" fill="var(--accent-2)">REV · 2027</text>
        </svg>
    `;
}

// Theme-adaptive bespoke vector schematic for Experience Page
function buildExperienceArtworkSVG() {
    const mood = getCurrentSolarMood();
    const ariaDesc = `Architectural career trajectory and milestone schematic rendered in ${mood.label}, showing connected progression nodes and a structured dossier plate.`;
    return `
        <svg class="theme-svg masthead-svg-art" viewBox="0 0 400 225" role="img" aria-label="${escapeHTML(ariaDesc)}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="exp-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1" fill="var(--border-hairline)" />
                </pattern>
                <linearGradient id="exp-curve-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="var(--accent)" />
                    <stop offset="100%" stop-color="var(--accent-2)" />
                </linearGradient>
            </defs>
            <rect width="400" height="225" fill="var(--bg-color)" />
            <rect width="400" height="225" fill="url(#exp-grid)" />
            <circle cx="336" cy="54" r="54" fill="var(--accent-soft)" />
            <circle cx="72" cy="186" r="46" fill="var(--accent-2-soft)" />

            <!-- Axis Rails -->
            <line x1="34" y1="186" x2="368" y2="186" stroke="var(--card-border)" stroke-width="1.4" />
            <line x1="34" y1="50" x2="34" y2="186" stroke="var(--card-border)" stroke-width="1.4" />

            <!-- Trajectory Spline -->
            <path d="M 46 168 C 94 168, 102 134, 146 130 C 194 126, 206 94, 250 86 C 292 78, 314 58, 354 56" fill="none" stroke="url(#exp-curve-grad)" stroke-width="2.8" stroke-linecap="round" />

            <!-- Vertical Drop Guides -->
            <g stroke="var(--border-hairline)" stroke-width="1.2" stroke-dasharray="3 3">
                <line x1="146" y1="130" x2="146" y2="186" />
                <line x1="250" y1="86" x2="250" y2="186" />
                <line x1="354" y1="56" x2="354" y2="186" />
            </g>

            <!-- Extruded Mini Dossier Card -->
            <g>
                <rect x="64" y="52" width="132" height="58" rx="5" fill="var(--card-extrude)" />
                <rect x="64" y="48" width="132" height="58" rx="5" fill="var(--bg-light)" stroke="var(--card-border)" stroke-width="1.5" />
                <rect x="74" y="58" width="44" height="5" rx="2" fill="var(--accent)" />
                <rect x="74" y="70" width="96" height="4" rx="2" fill="var(--border-color)" />
                <rect x="74" y="80" width="76" height="4" rx="2" fill="var(--border-hairline)" />
                <rect x="74" y="90" width="54" height="4" rx="2" fill="var(--accent-2)" />
            </g>

            <!-- Milestone Dots -->
            <circle cx="46" cy="168" r="5" fill="var(--bg-light)" stroke="var(--accent)" stroke-width="2.2" />
            <circle cx="146" cy="130" r="5.5" fill="var(--bg-light)" stroke="var(--accent)" stroke-width="2.2" />
            <circle cx="250" cy="86" r="5.5" fill="var(--bg-light)" stroke="var(--accent-2)" stroke-width="2.2" />
            <circle cx="354" cy="56" r="6.5" fill="var(--accent)" stroke="var(--bg-light)" stroke-width="2" class="svg-pulse" />

            <text x="20" y="24" font-family="IBM Plex Mono, monospace" font-size="9" font-weight="600" fill="var(--text-light)">// DOSSIER.LOG</text>
            <text x="316" y="24" font-family="IBM Plex Mono, monospace" font-size="9" font-weight="600" fill="var(--accent)">TIMELINE</text>
        </svg>
    `;
}

// Theme-adaptive bespoke vector schematic for Contact Page
function buildContactArtworkSVG() {
    const mood = getCurrentSolarMood();
    const ariaDesc = `Signal relay and encrypted dispatch console schematic rendered in ${mood.label}, featuring concentric transmission rings and a message packet keycap.`;
    return `
        <svg class="theme-svg masthead-svg-art" viewBox="0 0 400 225" role="img" aria-label="${escapeHTML(ariaDesc)}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="contact-grid" width="22" height="22" patternUnits="userSpaceOnUse">
                    <path d="M 22 0 L 0 0 0 22" fill="none" stroke="var(--border-hairline)" stroke-width="0.85" />
                </pattern>
            </defs>
            <rect width="400" height="225" fill="var(--bg-color)" />
            <rect width="400" height="225" fill="url(#contact-grid)" opacity="0.78" />

            <!-- Concentric Signal Relay Rings -->
            <g transform="translate(292, 118)">
                <circle cx="0" cy="0" r="70" fill="none" stroke="var(--border-hairline)" stroke-width="1.2" stroke-dasharray="4 5" />
                <circle cx="0" cy="0" r="48" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.4" opacity="0.72" />
                <circle cx="0" cy="0" r="24" fill="var(--bg-light)" stroke="var(--card-border)" stroke-width="1.5" />
                <circle cx="0" cy="0" r="7" fill="var(--accent-2)" class="svg-pulse" />
                <circle cx="48" cy="-26" r="4" fill="var(--accent)" stroke="var(--bg-light)" stroke-width="1.5" />
                <circle cx="-38" cy="36" r="3.5" fill="var(--accent-2)" stroke="var(--bg-light)" stroke-width="1.5" />
            </g>

            <!-- Routing Trace -->
            <path d="M 196 118 L 244 118" stroke="var(--accent)" stroke-width="2" stroke-dasharray="5 4" />

            <!-- Extruded Message Packet Card -->
            <g>
                <rect x="34" y="68" width="164" height="106" rx="6" fill="var(--card-extrude)" />
                <rect x="34" y="63" width="164" height="106" rx="6" fill="var(--bg-light)" stroke="var(--card-border)" stroke-width="1.6" />
                <!-- Envelope Flap Geometry -->
                <path d="M 40 69 L 116 116 L 192 69" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" />
                <line x1="40" y1="163" x2="88" y2="122" stroke="var(--border-hairline)" stroke-width="1.3" />
                <line x1="192" y1="163" x2="144" y2="122" stroke="var(--border-hairline)" stroke-width="1.3" />
                <rect x="92" y="138" width="48" height="16" rx="3" fill="var(--accent-2-soft)" stroke="var(--accent-2)" stroke-width="1.2" />
                <text x="116" y="149" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="8.5" font-weight="600" fill="var(--text-color)">PGP.OK</text>
            </g>

            <text x="20" y="24" font-family="IBM Plex Mono, monospace" font-size="9" font-weight="600" fill="var(--text-light)">// DISPATCH.IO</text>
            <text x="316" y="24" font-family="IBM Plex Mono, monospace" font-size="9" font-weight="600" fill="var(--accent-2)">CHANNEL.UP</text>
        </svg>
    `;
}

// Theme-adaptive bespoke vector schematic for Resources Page
function buildResourcesArtworkSVG() {
    const mood = getCurrentSolarMood();
    const ariaDesc = `Layered academic archive folders and indexed study stack schematic rendered in ${mood.label}, representing semester study guides and notes.`;
    return `
        <svg class="theme-svg masthead-svg-art" viewBox="0 0 400 225" role="img" aria-label="${escapeHTML(ariaDesc)}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="res-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1" fill="var(--border-hairline)" />
                </pattern>
            </defs>
            <rect width="400" height="225" fill="var(--bg-color)" />
            <rect width="400" height="225" fill="url(#res-grid)" />
            <circle cx="322" cy="168" r="54" fill="var(--accent-2-soft)" />

            <!-- Back Archive Folder (SEM 04) -->
            <g>
                <path d="M 74 58 H 142 L 154 70 H 316 V 136 H 74 Z" fill="var(--bg-subtle)" stroke="var(--card-border)" stroke-width="1.5" stroke-linejoin="round" />
                <rect x="86" y="63" width="38" height="4" rx="2" fill="var(--accent-2)" />
            </g>

            <!-- Mid Archive Folder (SEM 03) -->
            <g>
                <path d="M 56 80 H 128 L 140 92 H 302 V 160 H 56 Z" fill="var(--accent-soft)" stroke="var(--card-border)" stroke-width="1.5" stroke-linejoin="round" />
                <rect x="68" y="85" width="42" height="4" rx="2" fill="var(--accent)" />
            </g>

            <!-- Front Extruded Study Binder (SEM 01-04) -->
            <g>
                <rect x="38" y="109" width="250" height="82" rx="6" fill="var(--card-extrude)" />
                <path d="M 38 110 C 38 106 41 103 45 103 H 116 L 128 115 H 281 C 285 115 288 118 288 122 V 181 C 288 185 285 188 281 188 H 45 C 41 188 38 185 38 181 Z" fill="var(--bg-light)" stroke="var(--card-border)" stroke-width="1.6" stroke-linejoin="round" />
                <rect x="54" y="132" width="84" height="7" rx="2" fill="var(--accent)" />
                <rect x="54" y="148" width="160" height="5" rx="2" fill="var(--border-color)" />
                <rect x="54" y="160" width="124" height="5" rx="2" fill="var(--border-hairline)" />
                <rect x="228" y="134" width="44" height="36" rx="4" fill="var(--accent-2-soft)" stroke="var(--accent-2)" stroke-width="1.3" />
                <text x="250" y="156" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9.5" font-weight="700" fill="var(--text-color)">PDF</text>
            </g>

            <!-- Index Node Badges (Right) -->
            <g stroke="var(--card-border)" stroke-width="1.4">
                <line x1="316" y1="74" x2="346" y2="74" stroke="var(--accent)" stroke-dasharray="3 3" />
                <line x1="302" y1="112" x2="346" y2="112" stroke="var(--accent-2)" stroke-dasharray="3 3" />
                <line x1="288" y1="150" x2="346" y2="150" stroke="var(--accent)" stroke-dasharray="3 3" />
                <circle cx="352" cy="74" r="6" fill="var(--accent)" class="svg-pulse" />
                <circle cx="352" cy="112" r="6" fill="var(--accent-2)" />
                <circle cx="352" cy="150" r="6" fill="var(--bg-light)" stroke="var(--accent)" stroke-width="2" />
            </g>

            <text x="20" y="24" font-family="IBM Plex Mono, monospace" font-size="9" font-weight="600" fill="var(--text-light)">// ARCHIVE.DB</text>
            <text x="316" y="24" font-family="IBM Plex Mono, monospace" font-size="9" font-weight="600" fill="var(--accent)">INDEXED</text>
        </svg>
    `;
}

function escapeHTML(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Load JSON file (with in-flight promise deduplication)
async function loadJSON(path) {
    if (jsonCache[path]) return jsonCache[path];
    if (jsonPromises.has(path)) return jsonPromises.get(path);

    const req = fetch(path)
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(`Failed to load ${path}: ${response.statusText}`);
            }
            const data = await response.json();
            jsonCache[path] = data;
            return data;
        })
        .finally(() => {
            jsonPromises.delete(path);
        });

    jsonPromises.set(path, req);
    return req;
}

// Network-awareness helpers (respect Save-Data and Slow 3G / 2G cold loads)
function isSlowConnection() {
    try {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!conn) return false;
        if (conn.saveData) return true;
        const eff = String(conn.effectiveType || '').toLowerCase();
        if (eff === 'slow-2g' || eff === '2g' || eff === '3g') return true;
        if (typeof conn.downlink === 'number' && conn.downlink > 0 && conn.downlink < 1.5) return true;
    } catch (_) {}
    return false;
}

function isConstrainedNetwork() {
    try {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!conn) return false;
        if (conn.saveData) return true;
        const eff = String(conn.effectiveType || '').toLowerCase();
        if (eff === 'slow-2g' || eff === '2g') return true;
        if (typeof conn.downlink === 'number' && conn.downlink > 0 && conn.downlink < 0.7) return true;
    } catch (_) {}
    return false;
}

// Ensure async /styles.css has finished loading and switched from media="print" -> "all" before revealing page
function waitForMainStylesheet() {
    const link = document.getElementById('main-stylesheet-link');
    if (!link) return Promise.resolve();
    if (window.__mainCssLoaded || link.media === 'all' || link.sheet) {
        link.media = 'all';
        window.__mainCssLoaded = true;
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            link.media = 'all';
            window.__mainCssLoaded = true;
            resolve();
        };
        link.addEventListener('load', finish, { once: true });
        link.addEventListener('error', finish, { once: true });
        // Safety ceiling so a stalled network never traps the preloader forever
        setTimeout(finish, 8000);
    });
}

// Non-blocking route prefetch on hover/focus or idle
function prefetchPage(pageName, options = {}) {
    const { includeIcons = true } = options;
    if (!VALID_PAGES.has(pageName)) return;
    const jsonPath = `data/pages/${pageName}.json`;
    loadJSON(jsonPath)
        .then((pd) => {
            if (!includeIcons || isSlowConnection()) return;
            const icons = [];
            if (pd.featured) pd.featured.forEach(i => { if (i.icon) icons.push(i.icon); });
            if (pd.skills) pd.skills.forEach(s => { if (s.icon) icons.push(s.icon); });
            if (pd.social) pd.social.forEach(l => { if (l.icon) icons.push(l.icon); });
            [...new Set(icons)].forEach(icon => { renderSVGIcon(icon).catch(() => {}); });
        })
        .catch(() => {});
}

// Resolve initial route from hash (#about, #experience, etc.)
function getPageFromHash() {
    const raw = window.location.hash.replace(/^#/, '').trim().toLowerCase();
    if (raw && VALID_PAGES.has(raw)) {
        return raw;
    }
    return 'home';
}

let drawerController = null;

// Setup navigation (populates desktop top bar + mobile burger drawer links)
function setupNavigation() {
    const navLogo = document.getElementById('nav-logo');
    const navMenu = document.getElementById('nav-menu');
    const drawerNavList = document.getElementById('drawer-nav-list');

    if (navLogo) {
        if (globalConfig.site && globalConfig.site.logo) {
            navLogo.textContent = globalConfig.site.logo;
        }
        navLogo.href = '#home';
        navLogo.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('home');
        });
    }

    const populateList = (ul, closeDrawerOnClick) => {
        if (!ul || !globalConfig.navigation || !globalConfig.navigation.menu) return;
        ul.innerHTML = '';

        globalConfig.navigation.menu.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${item.page}`;
            a.textContent = item.label;
            a.dataset.page = item.page;
            const warm = () => prefetchPage(item.page);
            a.addEventListener('pointerenter', warm, { once: true });
            a.addEventListener('focus', warm, { once: true });
            a.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(item.page);
                if (closeDrawerOnClick && drawerController) {
                    drawerController.close();
                }
            });
            li.appendChild(a);
            ul.appendChild(li);
        });

        // Add devLOGS link (separate page, not SPA route)
        const devlogLi = document.createElement('li');
        const devlogA = document.createElement('a');
        devlogA.href = '/devlogs/';
        devlogA.textContent = 'devLOGS';
        devlogLi.appendChild(devlogA);
        ul.appendChild(devlogLi);
    };

    populateList(navMenu, false);
    populateList(drawerNavList, true);
}

let routeTransitionToken = 0;

function ensureRouteCurtain() {
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

function applyRouteStagger(container) {
    if (!container) return;
    const targets = container.querySelectorAll(
        '.page-masthead, .hero-editorial, .resume-banner, .about-spread, .pillar-card, .skill-item, .experience-timeline-item, .contact-aside, .contact-form, .resource-item, .note-banner'
    );
    targets.forEach((el, idx) => {
        el.style.setProperty('--stagger-i', String(Math.min(idx, 10)));
        el.classList.add('route-stagger-item');
        el.addEventListener('animationend', () => {
            el.classList.remove('route-stagger-item');
            el.style.removeProperty('--stagger-i');
        }, { once: true });
    });
}

function waitMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function navigateTo(pageName, options = {}) {
    const target = VALID_PAGES.has(pageName) ? pageName : 'home';
    const { updateHash = true, scrollToTop = true, animate = true } = options;

    if (target === currentPage && !options.force) {
        if (scrollToTop) window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    if (updateHash) {
        const nextHash = target === 'home' ? '#home' : `#${target}`;
        if (window.location.hash !== nextHash) {
            history.pushState({ page: target }, '', target === 'home' ? window.location.pathname : nextHash);
        }
    }

    loadPage(target, { scrollToTop, announce: true, moveFocus: true, animate });
}

// Load page content (with cinematic pastel ribbon curtain on SPA route switches)
async function loadPage(pageName, options = {}) {
    const { scrollToTop = true, announce = false, moveFocus = false, animate = false, deferRepos = false } = options;
    const token = ++routeTransitionToken;
    currentPage = pageName;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shouldAnimate = animate && !prefersReducedMotion;
    const mainContent = document.getElementById('main-content');

    try {
        updateActiveNavLink(pageName);

        // Start fetching page JSON immediately in parallel with curtain sweep-in
        const pageDataPromise = loadJSON(`data/pages/${pageName}.json`);
        let curtain = null;

        if (shouldAnimate) {
            curtain = ensureRouteCurtain();
            const labelEl = curtain.querySelector('#route-curtain-label');
            if (labelEl) labelEl.textContent = pageName.toUpperCase();

            curtain.classList.remove('phase-out');
            curtain.classList.add('is-active');
            // Force reflow so sweep-in always starts cleanly from bottom
            void curtain.offsetWidth;
            curtain.classList.add('phase-in');
            if (mainContent) mainContent.classList.add('is-route-exiting');

            // Hold curtain gracefully so ribbons settle, // ROUTE stamp breathes, and slow-network JSONs hydrate cleanly
            const [pageData] = await Promise.all([pageDataPromise, waitMs(780)]);
            if (token !== routeTransitionToken) return;

            await renderPage(pageData, { stagger: true });
            if (token !== routeTransitionToken) return;

            if (mainContent) mainContent.classList.remove('is-route-exiting');
            if (scrollToTop) {
                window.scrollTo({ top: 0, behavior: 'auto' });
            }

            // Peel pastel ribbons gently away on next paint frame to reveal staggered blooming page
            requestAnimationFrame(() => {
                if (token !== routeTransitionToken || !curtain) return;
                curtain.classList.remove('phase-in');
                curtain.classList.add('phase-out');
            });

            finalizePageMetadata(pageName, pageData, { announce, moveFocus });

            waitMs(920).then(() => {
                if (token === routeTransitionToken && curtain) {
                    curtain.classList.remove('is-active', 'phase-out');
                }
            });
            return;
        }

        const pageData = await pageDataPromise;
        if (token !== routeTransitionToken) return;

        await renderPage(pageData, { stagger: false, deferRepos });
        if (token !== routeTransitionToken) return;

        if (scrollToTop) {
            window.scrollTo({ top: 0, behavior: 'auto' });
        }

        finalizePageMetadata(pageName, pageData, { announce, moveFocus });
    } catch (error) {
        if (mainContent) mainContent.classList.remove('is-route-exiting');
        const curtain = document.getElementById('route-transition-curtain');
        if (curtain) curtain.classList.remove('is-active', 'phase-in', 'phase-out');
        console.error(`Error loading page ${pageName}:`, error);
        if (mainContent) {
            mainContent.innerHTML = `<div class="container"><div class="loading"><p>Error loading ${escapeHTML(pageName)} page. Please check the data file.</p></div></div>`;
        }
    }
}

function finalizePageMetadata(pageName, pageData, { announce, moveFocus }) {
    const siteName = (globalConfig.site && globalConfig.site.name) ? globalConfig.site.name : 'Uzair Shaikh';
    const pageTitle = pageData.title ? `${pageData.title} - ${siteName}` : `${siteName} - Developer Portfolio`;
    document.title = pageTitle;

    if (announce) {
        announceA11y(`Now on ${pageData.title || pageName}.`);
    }

    if (moveFocus) {
        const heading = document.querySelector('#main-content h1');
        if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus({ preventScroll: true });
        }
    }

    const pageDesc = pageData.description || (globalConfig.site && globalConfig.site.description) || "Uzair Shaikh's developer portfolio — Cybersecurity, networking, system architecture, and programming projects.";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', pageDesc);

    const currentUrl = pageName === 'home' ? 'https://uzair777-dev.github.io/' : `https://uzair777-dev.github.io/#${pageName}`;
    const canonicalEl = document.getElementById('canonical-link');
    if (canonicalEl) canonicalEl.setAttribute('href', currentUrl);

    const ogTitle = document.getElementById('og-title');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);
    const ogDesc = document.getElementById('og-description');
    if (ogDesc) ogDesc.setAttribute('content', pageDesc);
    const ogUrl = document.getElementById('og-url');
    if (ogUrl) ogUrl.setAttribute('content', currentUrl);

    const twTitle = document.getElementById('twitter-title');
    if (twTitle) twTitle.setAttribute('content', pageTitle);
    const twDesc = document.getElementById('twitter-description');
    if (twDesc) twDesc.setAttribute('content', pageDesc);
}

// Update active navigation link (syncs desktop nav bar + burger drawer mobile links)
function updateActiveNavLink(pageName) {
    const navLinks = document.querySelectorAll('.nav-menu a, #drawer-nav-list a');
    navLinks.forEach(link => {
        const isCurrent = link.dataset.page === pageName;
        link.classList.toggle('active', isCurrent);
        if (isCurrent) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

function formatRepoYear(isoDate) {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Fetch and render GitHub repositories from individual URLs
async function fetchGitHubRepos() {
    const grid = document.getElementById('repo-grid');
    if (!grid) return;

    const repoUrls = JSON.parse(grid.dataset.repos || '[]');
    if (repoUrls.length === 0) return;

    const cacheKey = 'github_repos_v2_' + repoUrls.join(',');
    const cacheTTL = 5 * 60 * 1000;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const minRepoShowcaseMs = prefersReducedMotion ? 0 : 420;
    const fetchStartedAt = performance.now();

    const finishWithDelay = async (repos) => {
        const remaining = Math.max(0, minRepoShowcaseMs - (performance.now() - fetchStartedAt));
        if (remaining > 0) await waitMs(remaining);
        if (!document.body.contains(grid)) return;
        renderRepoCards(grid, repos);
    };

    try {
        try {
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Array.isArray(data) && data.length > 0 && (Date.now() - timestamp < cacheTTL)) {
                    await finishWithDelay(data);
                    return;
                }
            }
        } catch (_) {}

        const apiTimeoutMs = isSlowConnection() ? 3600 : 5000;
        const fetches = repoUrls.map(url => {
            const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
            if (!match) return Promise.resolve(null);
            const [, owner, repo] = match;
            const fallbackRepo = {
                name: repo,
                full_name: `${owner}/${repo}`,
                html_url: url,
                description: `GitHub repository: ${owner}/${repo}`,
                language: null,
                stargazers_count: null,
                forks_count: null,
                pushed_at: null
            };

            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timer = controller ? setTimeout(() => controller.abort(), apiTimeoutMs) : null;

            return fetch(`https://api.github.com/repos/${owner}/${repo}`, controller ? { signal: controller.signal } : undefined)
                .then(r => r.ok ? r.json() : fallbackRepo)
                .catch(() => fallbackRepo)
                .finally(() => { if (timer) clearTimeout(timer); });
        });

        const results = await Promise.all(fetches);
        const repos = results.filter(Boolean);

        if (repos.length > 0) {
            try {
                sessionStorage.setItem(cacheKey, JSON.stringify({ data: repos, timestamp: Date.now() }));
            } catch (_) {}
        }
        await finishWithDelay(repos);
    } catch (error) {
        console.error('Error fetching GitHub repos:', error);
        const fallbackRepos = repoUrls.map(url => {
            const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
            if (!match) return null;
            const [, owner, repo] = match;
            return {
                name: repo,
                full_name: `${owner}/${repo}`,
                html_url: url,
                description: `GitHub repository: ${owner}/${repo}`
            };
        }).filter(Boolean);

        await finishWithDelay(fallbackRepos);
    }
}

// Render repo cards into the asymmetric editorial bento grid
function renderRepoCards(grid, repos) {
    if (!repos || repos.length === 0) {
        grid.innerHTML = '<p class="text-secondary" style="text-align:center;grid-column:1/-1;">No repositories found.</p>';
        return;
    }

    let html = '';
    repos.forEach((repo, idx) => {
        const ogImage = `https://opengraph.githubassets.com/1/${repo.full_name}`;
        const indexNum = String(idx + 1).padStart(2, '0');
        const isLead = idx === 0 && repos.length >= 3;

        const metaParts = [];
        if (repo.language) metaParts.push(escapeHTML(repo.language));
        if (typeof repo.stargazers_count === 'number') {
            metaParts.push(`${repo.stargazers_count} ${repo.stargazers_count === 1 ? 'star' : 'stars'}`);
        }
        if (typeof repo.forks_count === 'number' && repo.forks_count > 0) {
            metaParts.push(`${repo.forks_count} ${repo.forks_count === 1 ? 'fork' : 'forks'}`);
        }
        const updated = formatRepoYear(repo.pushed_at);
        if (updated) metaParts.push(`Updated ${updated}`);

        const metaLine = metaParts.length > 0
            ? metaParts.join(' · ')
            : escapeHTML(repo.full_name);

        const skipHeavyOgPreview = isConstrainedNetwork();
        html += `<a href="${escapeHTML(repo.html_url)}" target="_blank" rel="noopener noreferrer" class="repo-card${isLead ? ' repo-card--lead' : ''}" aria-label="${escapeHTML(repo.name)}: ${escapeHTML(repo.description || 'No description')}">`;
        html += `<div class="repo-card-media">`;
        if (!skipHeavyOgPreview) {
            html += `<img src="${ogImage}" alt="Preview image for ${escapeHTML(repo.name)}" class="repo-card-image" loading="lazy" decoding="async" fetchpriority="low" referrerpolicy="no-referrer">`;
        }
        html += `<div class="repo-card-fallback${skipHeavyOgPreview ? ' visible' : ''}" aria-hidden="true"><span>${escapeHTML(repo.full_name)}</span></div>`;
        html += `</div>`;
        html += `<div class="repo-card-body">`;
        html += `<div class="repo-card-topline">`;
        html += `<span class="editorial-index">${indexNum}</span>`;
        html += `<span class="repo-card-arrow" aria-hidden="true">↗</span>`;
        html += `</div>`;
        html += `<h3 class="repo-card-name">${escapeHTML(repo.name)}</h3>`;
        html += `<p class="repo-card-description">${escapeHTML(repo.description || 'No description provided.')}</p>`;
        html += `<p class="repo-card-meta">${metaLine}</p>`;
        html += `</div>`;
        html += `</a>`;
    });

    grid.innerHTML = html;

    // Resilient fallback if GitHub OpenGraph preview image fails to load
    grid.querySelectorAll('.repo-card-image').forEach(img => {
        img.addEventListener('error', () => {
            img.style.display = 'none';
            const fallback = img.nextElementSibling;
            if (fallback) fallback.classList.add('visible');
        });
    });
}

// Render page content
async function renderPage(pageData, options = {}) {
    const mainContent = document.getElementById('main-content');
    let html = '';

    switch (pageData.type) {
        case 'home':
            html = await renderHomePage(pageData);
            break;
        case 'about':
            html = await renderAboutPage(pageData);
            break;
        case 'experience':
            html = renderExperiencePage(pageData);
            break;
        case 'contact':
            html = await renderContactPage(pageData);
            break;
        case 'resources':
            html = renderResourcesPage(pageData);
            break;
        default:
            html = renderGenericPage(pageData);
    }

    mainContent.innerHTML = html;

    if (options.stagger) {
        applyRouteStagger(mainContent);
    }

    if (pageData.type === 'home') {
        if (!options.deferRepos) {
            fetchGitHubRepos();
        }
        setupHeroArtworkTilt();
    }
    if (pageData.type === 'about') {
        setupSkillFilters();
    }
    if (pageData.type === 'contact') {
        setupContactForm();
        setupCopyEmailButtons();
    }
    if (pageData.type === 'resources') {
        setupResourceButtons();
    }

    setupCTAButtons();
}

// Render Home Page — Asymmetric Editorial Split Hero + Marquee + Bento Repositories
async function renderHomePage(data) {
    const hero = data.hero || {};
    const heroRole = (hero.title || 'Security Enthusiast | Student').replace(/\s*\|\s*/g, ' · ');
    const ctaPage = hero.cta?.link || 'about';
    const ctaText = hero.cta?.text || 'Learn More About Me';

    let html = '<div class="container page-enter">';

    html += '<section class="hero-editorial">';
    html += '<div class="hero-copy">';
    html += `<p class="hero-kicker">${escapeHTML(heroRole)}</p>`;
    if (hero.name) {
        html += `<h1 class="hero-display">${escapeHTML(hero.name)}</h1>`;
    }
    if (hero.description) {
        html += `<p class="hero-description">${escapeHTML(hero.description)}</p>`;
    }
    html += '<div class="hero-actions">';
    html += `<a href="#${escapeHTML(ctaPage)}" class="btn hero-cta" data-cta-page="${escapeHTML(ctaPage)}">${escapeHTML(ctaText)} <span aria-hidden="true">→</span></a>`;
    html += `<a href="/devlogs/" class="btn btn-glass">Read devLOGS</a>`;
    html += '</div>';
    html += '</div>';

    // Theme-Reactive Vector Blueprint Frame + Developer Portrait Inset
    html += '<div class="hero-visual">';
    html += '<div class="hero-artwork-frame" id="hero-artwork-frame">';
    html += '<span class="crop-mark crop-tl" aria-hidden="true"></span>';
    html += '<span class="crop-mark crop-tr" aria-hidden="true"></span>';
    html += '<span class="crop-mark crop-bl" aria-hidden="true"></span>';
    html += '<span class="crop-mark crop-br" aria-hidden="true"></span>';
    html += '<div class="hero-artwork-viewport">';
    html += buildHeroArtworkSVG();
    html += '</div>';
    html += '<div class="hero-portrait-bar">';
    if (hero.image) {
        html += `<img src="${escapeHTML(hero.image)}" alt="Portrait of ${escapeHTML(hero.name || 'the developer')}" class="hero-image" width="56" height="56" decoding="async">`;
    }
    html += '<div class="hero-portrait-caption">';
    html += `<span class="hero-portrait-name">${escapeHTML(hero.name || 'Uzair Shaikh')}</span>`;
    html += '<span class="hero-portrait-meta">Mumbai · Linux &amp; Cybersecurity</span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</section>';

    // Sweet hidden screen-reader aside on Home
    html += '<aside class="sr-only" aria-label="Hidden note from Uzair">A quiet note from Uzair: if you are listening to this page instead of looking at it, the artwork up here is a geometric map of glowing network nodes beneath a sun or moon that follows your local clock. Really glad you are here.</aside>';

    // Editorial section divider marquee ribbon (purely decorative; silent for screen readers)
    const marqueeTopics = [
        'Cybersecurity',
        'Linux Systems',
        'Networking',
        'Python',
        'Bash Scripting',
        'System Architecture',
        'Open Source'
    ];
    const ribbonItems = marqueeTopics
        .map(t => `<span>${t}</span><span class="marquee-sep">·</span>`)
        .join('');
    html += '<div class="editorial-marquee" aria-hidden="true">';
    html += '<div class="editorial-marquee-track">';
    html += `${ribbonItems}${ribbonItems}${ribbonItems}${ribbonItems}`;
    html += '</div>';
    html += '</div>';

    // Featured GitHub Repositories (dynamic Bento)
    if (data.github && data.github.repos && data.github.repos.length > 0) {
        html += '<section class="section">';
        html += '<div class="section-header-row">';
        html += '<h2 class="section-title">Featured Repositories</h2>';
        html += '<a href="https://github.com/uzair777-dev" target="_blank" rel="noopener noreferrer" class="section-link">All on GitHub <span aria-hidden="true">↗</span></a>';
        html += '</div>';
        const repoLoader = (window.PortfolioThemeEngine && typeof window.PortfolioThemeEngine.buildSolarLoaderMarkup === 'function')
            ? window.PortfolioThemeEngine.buildSolarLoaderMarkup({ compact: true, label: '// fetching repositories...' })
            : 'Loading repositories...';
        html += `<div class="repo-grid" id="repo-grid" data-repos='${JSON.stringify(data.github.repos)}'>`;
        html += `<div class="repo-skeleton" role="status" aria-live="polite" aria-label="Loading repositories">${repoLoader}</div>`;
        html += '</div>';
        html += '</section>';
    }

    html += '</div>';
    return html;
}

// Subtle RAF-throttled compositor-only 3D tilt on desktop fine-pointer devices
function setupHeroArtworkTilt() {
    const frame = document.getElementById('hero-artwork-frame');
    if (!frame) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let rafId = 0;
    let nextX = 0;
    let nextY = 0;

    frame.addEventListener('pointermove', (e) => {
        const rect = frame.getBoundingClientRect();
        nextX = (e.clientX - rect.left) / rect.width - 0.5;
        nextY = (e.clientY - rect.top) / rect.height - 0.5;
        if (!rafId) {
            rafId = requestAnimationFrame(() => {
                rafId = 0;
                frame.style.transform = `perspective(900px) rotateY(${(nextX * 5).toFixed(2)}deg) rotateX(${(-nextY * 5).toFixed(2)}deg)`;
            });
        }
    }, { passive: true });

    frame.addEventListener('pointerleave', () => {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
        }
        frame.style.transform = '';
    }, { passive: true });
}

// Helper function to render SVG icons (with in-memory cache + promise deduplication)
async function renderSVGIcon(iconPath) {
    if (!iconPath || typeof iconPath !== 'string') return '';

    try {
        if (iconPath.startsWith('res/svg/') && iconPath.endsWith('.svg')) {
            if (svgCache[iconPath]) return svgCache[iconPath];
            if (svgPromises.has(iconPath)) return svgPromises.get(iconPath);

            const req = fetch(iconPath)
                .then(async (response) => {
                    if (response.ok) {
                        const svgContent = await response.text();
                        svgCache[iconPath] = svgContent;
                        return svgContent;
                    }
                    return iconPath;
                })
                .catch(() => iconPath)
                .finally(() => {
                    svgPromises.delete(iconPath);
                });

            svgPromises.set(iconPath, req);
            return req;
        }
        return iconPath;
    } catch (error) {
        console.error('Error loading SVG icon:', error);
        return iconPath;
    }
}

function getSkillLevelBars(level) {
    const normalized = String(level || '').toLowerCase();
    const filled = normalized === 'advanced' ? 3 : normalized === 'intermediate' ? 2 : 1;
    let bars = '<div class="skill-meter" aria-hidden="true">';
    for (let i = 1; i <= 3; i++) {
        bars += `<span class="skill-meter-seg${i <= filled ? ' filled' : ''}"></span>`;
    }
    bars += '</div>';
    return bars;
}

// Render About Page — Magazine Editorial Spread + Filterable Skills Matrix
async function renderAboutPage(data) {
    currentSkillFilter = 'all';

    let html = '<div class="container page-enter">';
    html += '<section class="section">';
    html += '<div class="page-masthead">';
    html += '<p class="hero-kicker">Profile · Approach · Stack</p>';
    html += `<h1 class="section-title section-title--xl">${escapeHTML(data.title || 'About')}</h1>`;
    html += '</div>';

    // Editorial 2-column intro spread with theme-reactive vector schematic
    html += '<div class="about-spread">';
    html += '<figure class="about-figure">';
    html += '<div class="about-svg-viewport">';
    html += buildAboutArtworkSVG();
    html += '</div>';
    html += '<figcaption class="about-figcaption">Linux development · Cybersecurity · Open-source tooling</figcaption>';
    html += '</figure>';

    html += '<div class="about-narrative">';
    if (data.content) {
        const paragraphs = Array.isArray(data.content) ? data.content : [data.content];
        paragraphs.forEach((paragraph, idx) => {
            html += `<p class="about-content${idx === 0 ? ' about-lead' : ''}">${escapeHTML(paragraph)}</p>`;
        });
    }
    html += '<div class="about-cta-row">';
    html += '<a href="#experience" class="btn" data-cta-page="experience">View Experience <span aria-hidden="true">→</span></a>';
    html += '<a href="#contact" class="btn btn-glass" data-cta-page="contact">Get In Touch</a>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // Parallelize all About SVG icon fetches up front
    const featuredIcons = data.featured
        ? await Promise.all(data.featured.map(item => item.icon ? renderSVGIcon(item.icon) : Promise.resolve('')))
        : [];
    const skillIcons = data.skills
        ? await Promise.all(data.skills.map(skill => skill.icon ? renderSVGIcon(skill.icon) : Promise.resolve('')))
        : [];

    // What I Bring — numbered editorial pillars
    if (data.featured && data.featured.length > 0) {
        html += '<div class="editorial-block">';
        html += '<h2 class="skills-heading">What I Bring</h2>';
        html += '<div class="pillars-grid">';
        for (let i = 0; i < data.featured.length; i++) {
            const item = data.featured[i];
            const num = String(i + 1).padStart(2, '0');
            html += '<article class="pillar-card">';
            html += '<div class="pillar-top">';
            html += `<span class="editorial-index">${num}.</span>`;
            if (featuredIcons[i]) {
                html += `<div class="svg-icon">${featuredIcons[i]}</div>`;
            }
            html += '</div>';
            html += `<h3>${escapeHTML(item.title)}</h3>`;
            if (item.description) {
                html += `<p class="text-secondary">${escapeHTML(item.description)}</p>`;
            }
            html += '</article>';
        }
        html += '</div>';
        html += '</div>';
    }

    // Skills Matrix with interactive proficiency filter
    if (data.skills && data.skills.length > 0) {
        const levels = [...new Set(data.skills.map(s => s.level).filter(Boolean))];
        html += '<div class="editorial-block">';
        html += '<div class="section-header-row">';
        html += '<h2 class="skills-heading">Technical Skills</h2>';
        html += '<div class="segmented-control" role="group" aria-label="Filter skills by proficiency">';
        html += '<button type="button" class="segmented-btn active" data-skill-filter="all" aria-pressed="true">All</button>';
        levels.forEach(lvl => {
            html += `<button type="button" class="segmented-btn" data-skill-filter="${escapeHTML(lvl.toLowerCase())}" aria-pressed="false">${escapeHTML(lvl)}</button>`;
        });
        html += '</div>';
        html += '</div>';

        html += '<div class="skills-grid" id="skills-grid">';
        data.skills.forEach((skill, idx) => {
            const levelKey = (skill.level || '').toLowerCase();
            html += `<div class="skill-item" data-skill-level="${escapeHTML(levelKey)}">`;
            html += '<div class="skill-item-head">';
            if (skillIcons[idx]) {
                html += `<div class="svg-icon">${skillIcons[idx]}</div>`;
            }
            html += getSkillLevelBars(skill.level);
            html += '</div>';
            html += `<h4>${escapeHTML(skill.name)}</h4>`;
            if (skill.level) {
                html += `<p class="skill-level-label">${escapeHTML(skill.level)}</p>`;
            }
            html += '</div>';
        });
        html += '</div>';
        html += '</div>';
    }

    html += '<aside class="sr-only" aria-label="Hidden footnote">Hidden footnote for sharp ears: behind all the cybersecurity and Linux talk is just someone who still gets genuinely happy when a bash script runs cleanly on the first try. Hope your day is being kind to you.</aside>';
    html += '</section>';
    html += '</div>';
    return html;
}

function setupSkillFilters() {
    const buttons = document.querySelectorAll('[data-skill-filter]');
    const items = document.querySelectorAll('#skills-grid .skill-item');
    if (!buttons.length || !items.length) return;

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.skillFilter;
            currentSkillFilter = filter;
            buttons.forEach(b => {
                const active = b.dataset.skillFilter === filter;
                b.classList.toggle('active', active);
                b.setAttribute('aria-pressed', String(active));
            });

            let visibleCount = 0;
            items.forEach(item => {
                const match = filter === 'all' || item.dataset.skillLevel === filter;
                item.style.display = match ? '' : 'none';
                if (match) visibleCount += 1;
            });
            const label = filter === 'all' ? 'all' : filter;
            announceA11y(`Showing ${visibleCount} ${label} skills.`);
        });
    });
}

// Render Experience Page — Editorial Broadsheet Dossier
function renderExperiencePage(data) {
    let html = '<div class="container page-enter">';
    html += '<section class="section">';
    html += '<div class="page-masthead page-masthead--illustrated">';
    html += '<div class="page-masthead-copy">';
    html += '<p class="hero-kicker">Track Record · Education · Curriculum Vitae</p>';
    html += `<h1 class="section-title section-title--xl">${escapeHTML(data.title || 'Experience')}</h1>`;
    html += '<p class="page-masthead-lead">Hands-on builds, security exploration, and academic milestones plotted chronologically.</p>';
    html += '</div>';
    html += '<div class="masthead-svg-frame">';
    html += '<span class="crop-mark crop-tl" aria-hidden="true"></span>';
    html += '<span class="crop-mark crop-tr" aria-hidden="true"></span>';
    html += '<span class="crop-mark crop-bl" aria-hidden="true"></span>';
    html += '<span class="crop-mark crop-br" aria-hidden="true"></span>';
    html += '<div class="masthead-svg-viewport">';
    html += buildExperienceArtworkSVG();
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // Resume dossier banner
    if (data.resume && data.resume.link) {
        html += '<div class="resume-banner">';
        html += '<div class="resume-banner-copy">';
        html += `<h2 class="resume-title">${escapeHTML(data.resume.outsideText || 'Download my Resume')}</h2>`;
        html += '<p class="text-secondary">Formatted PDF edition ready for printing or ATS review.</p>';
        html += '</div>';
        html += '<div class="resume-banner-actions">';
        html += `<a href="${escapeHTML(data.resume.link)}" target="_blank" rel="noopener noreferrer" class="btn resume-download-link" aria-label="Preview Resume PDF in a new tab">${escapeHTML(data.resume.insideText || 'Preview PDF')} <span aria-hidden="true">↗</span></a>`;
        html += `<a href="${escapeHTML(data.resume.link)}" download="Uzair_Shaikh_Resume.pdf" class="btn btn-glass" aria-label="Download Resume as Uzair_Shaikh_Resume.pdf">Download PDF <span aria-hidden="true">↓</span></a>`;
        html += '</div>';
        html += '</div>';
    }

    if (data.work && data.work.length > 0) {
        html += '<div class="editorial-block">';
        html += '<h2 class="experience-subtitle">Work Experience</h2>';
        html += '<div class="experience-timeline">';
        data.work.forEach((exp, idx) => {
            html += renderExperienceRow(exp, idx + 1);
        });
        html += '</div>';
        html += '</div>';
    }

    if (data.academic && data.academic.length > 0) {
        html += '<div class="editorial-block">';
        html += '<h2 class="experience-subtitle">Education</h2>';
        html += '<div class="experience-timeline">';
        data.academic.forEach((exp, idx) => {
            html += renderExperienceRow(exp, idx + 1);
        });
        html += '</div>';
        html += '</div>';
    }

    html += '<aside class="sr-only" aria-label="Hidden milestone whisper">Quiet aside between milestones: timelines make every journey look neat and straight, never showing the late nights, broken configs, and small victories in between. Keep going at your own pace.</aside>';
    html += '</section>';
    html += '</div>';
    return html;
}

// Render Experience Row — Connected Vertical Milestone Timeline Node + Card
function renderExperienceRow(exp, index) {
    const num = String(index).padStart(2, '0');
    let html = '<article class="experience-timeline-item">';

    // Milestone node on the vertical timeline spine
    html += '<div class="timeline-marker" aria-hidden="true">';
    html += '<span class="timeline-dot"></span>';
    html += '<span class="timeline-connector"></span>';
    html += '</div>';

    // Milestone detail card
    html += '<div class="experience-card">';
    html += '<div class="experience-card-meta">';
    html += '<div class="experience-meta-left">';
    html += `<span class="editorial-index">${num}</span>`;
    if (exp.duration) {
        html += `<span class="duration">${escapeHTML(exp.duration)}</span>`;
    }
    html += '</div>';
    if (exp.location) {
        html += `<span class="location">${escapeHTML(exp.location)}</span>`;
    }
    html += '</div>';

    html += `<h3>${escapeHTML(exp.title || 'Position')}</h3>`;

    if (exp.company || exp.institution) {
        html += `<p class="company">${escapeHTML(exp.company || exp.institution)}</p>`;
    }

    if (exp.description) {
        if (Array.isArray(exp.description)) {
            html += '<ul>';
            exp.description.forEach(item => {
                html += `<li>${escapeHTML(item)}</li>`;
            });
            html += '</ul>';
        } else {
            html += `<p class="description">${escapeHTML(exp.description)}</p>`;
        }
    }

    if (exp.technologies && Array.isArray(exp.technologies) && exp.technologies.length > 0) {
        html += '<p class="tech-list">';
        html += '<span class="tech-list-label">Stack:</span> ';
        html += exp.technologies.map(tech => escapeHTML(tech)).join(' · ');
        html += '</p>';
    }

    html += '</div>';
    html += '</article>';
    return html;
}

// Render Contact Page — Studio Dispatch 2-Column Layout
async function renderContactPage(data) {
    const emailEntry = (data.social || []).find(s => String(s.url).trim().startsWith('mailto:'));
    const directEmail = emailEntry ? emailEntry.url.replace(/^mailto:\s*/i, '').trim() : 'uzairshaikhking777@gmail.com';

    let html = '<div class="container page-enter">';
    html += '<section class="section">';
    html += '<div class="page-masthead page-masthead--illustrated">';
    html += '<div class="page-masthead-copy">';
    html += '<p class="hero-kicker">Direct Channels · Collaboration</p>';
    html += `<h1 class="section-title section-title--xl">${escapeHTML(data.title || 'Contact')}</h1>`;
    html += '<p class="page-masthead-lead">Open channels for Linux systems, security discussions, open-source collabs, or a quick hello.</p>';
    html += '</div>';
    html += '<div class="masthead-svg-frame">';
    html += '<span class="crop-mark crop-tl" aria-hidden="true"></span>';
    html += '<span class="crop-mark crop-tr" aria-hidden="true"></span>';
    html += '<span class="crop-mark crop-bl" aria-hidden="true"></span>';
    html += '<span class="crop-mark crop-br" aria-hidden="true"></span>';
    html += '<div class="masthead-svg-viewport">';
    html += buildContactArtworkSVG();
    html += '</div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="contact-layout">';

    // Left column: direct dispatch info & social channels
    html += '<div class="contact-aside">';
    if (data.description) {
        html += `<p class="contact-lead">${escapeHTML(data.description)}</p>`;
    }

    html += '<div class="direct-email-box">';
    html += '<span class="direct-email-label">Direct Email</span>';
    html += `<a href="mailto:${escapeHTML(directEmail)}" class="direct-email-address">${escapeHTML(directEmail)}</a>`;
    html += `<button type="button" class="btn btn-glass btn-sm copy-email-btn" data-email="${escapeHTML(directEmail)}">Copy Email Address</button>`;
    html += '</div>';

    if (data.social && data.social.length > 0) {
        const socialIcons = await Promise.all(
            data.social.map(link => link.icon ? renderSVGIcon(link.icon) : Promise.resolve(''))
        );
        html += '<div class="contact-channels">';
        html += '<h2 class="channels-heading">Elsewhere</h2>';
        html += '<div class="social-links social-links--left">';
        data.social.forEach((link, idx) => {
            const cleanUrl = String(link.url || '').replace(/^mailto:\s+/i, 'mailto:');
            html += `<a href="${escapeHTML(cleanUrl)}" target="_blank" rel="noopener noreferrer" title="${escapeHTML(link.name)}" aria-label="Visit ${escapeHTML(link.name)}" class="channel-link">`;
            html += `<span class="svg-icon">${socialIcons[idx]}</span>`;
            html += `<span>${escapeHTML(link.name)}</span>`;
            html += '</a>';
        });
        html += '</div>';
        html += '</div>';
    }
    html += '</div>';

    // Right column: validated contact composer (no window.alert!)
    html += '<div class="contact-form">';
    html += '<form id="contact-form" novalidate>';

    if (data.form && data.form.fields) {
        data.form.fields.forEach(field => {
            html += '<div class="form-group">';
            html += `<label for="${escapeHTML(field.name)}">${escapeHTML(field.label)}</label>`;
            if (field.type === 'textarea') {
                html += `<textarea id="${escapeHTML(field.name)}" name="${escapeHTML(field.name)}" ${field.required ? 'required' : ''} placeholder="Tell me about what you are building or exploring..."></textarea>`;
            } else {
                const ph = field.type === 'email' ? 'you@example.com' : field.name === 'subject' ? 'Project inquiry, collaboration, or hello' : 'Your name';
                html += `<input type="${escapeHTML(field.type || 'text')}" id="${escapeHTML(field.name)}" name="${escapeHTML(field.name)}" ${field.required ? 'required' : ''} placeholder="${ph}">`;
            }
            html += `<span class="field-error" id="error-${escapeHTML(field.name)}" role="alert"></span>`;
            html += '</div>';
        });
    }

    html += '<button type="submit" class="btn btn-full" aria-label="Send contact message">Prepare Message <span aria-hidden="true">→</span></button>';
    html += `<div id="contact-feedback" class="contact-feedback" aria-live="polite" hidden data-email="${escapeHTML(directEmail)}"></div>`;
    html += '</form>';
    html += '</div>';

    html += '</div>';
    html += '<aside class="sr-only" aria-label="Hidden hello">A quiet note: whether you want to chat about Linux, security, accessibility, or just say hi, your message genuinely makes my day.</aside>';
    html += '</section>';
    html += '</div>';
    return html;
}

function setupCopyEmailButtons() {
    document.querySelectorAll('.copy-email-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const email = btn.dataset.email || '';
            try {
                await navigator.clipboard.writeText(email);
                const prev = btn.textContent;
                btn.textContent = 'Copied to Clipboard';
                announceA11y('Email address copied to clipboard.');
                setTimeout(() => { btn.textContent = prev; }, 2000);
            } catch (_) {
                btn.textContent = email;
            }
        });
    });
}

// Render Resources Page — Clean Semantic Academic Archive
function renderResourcesPage(data) {
    let html = '<div class="container page-enter">';
    html += '<section class="section">';
    html += '<div class="page-masthead page-masthead--illustrated">';
    html += '<div class="page-masthead-copy">';
    html += '<p class="hero-kicker">Academic Archive · Study Notes</p>';
    html += `<h1 class="section-title section-title--xl">${escapeHTML(data.title || 'Resources')}</h1>`;
    html += '<p class="page-masthead-lead">Curated semester notes, lab guides, and reference folders kept clean and accessible.</p>';
    html += '</div>';
    html += '<div class="masthead-svg-frame">';
    html += '<span class="crop-mark crop-tl" aria-hidden="true"></span>';
    html += '<span class="crop-mark crop-tr" aria-hidden="true"></span>';
    html += '<span class="crop-mark crop-bl" aria-hidden="true"></span>';
    html += '<span class="crop-mark crop-br" aria-hidden="true"></span>';
    html += '<div class="masthead-svg-viewport">';
    html += buildResourcesArtworkSVG();
    html += '</div>';
    html += '</div>';
    html += '</div>';

    if (data.note1) {
        html += `<div class="note-banner">${data.note1}</div>`;
    }

    if (data.description) {
        html += `<p class="description-centered">${escapeHTML(data.description)}</p>`;
    }

    if (data.folders && data.folders.length > 0) {
        html += '<div class="resources-grid">';

        data.folders.forEach((folder, idx) => {
            const folderId = extractGoogleDriveFolderId(folder.link);
            const semNum = String(folder.sem ?? idx + 1).padStart(2, '0');

            html += '<article class="resource-item">';
            html += '<div class="resource-item-top">';
            html += `<span class="editorial-index">SEM ${escapeHTML(semNum)}</span>`;
            html += `<a href="${escapeHTML(folder.link)}" target="_blank" rel="noopener noreferrer" class="resource-ext-link" aria-label="Open ${escapeHTML(folder.text)} in Google Drive">Drive ↗</a>`;
            html += '</div>';
            html += `<h3 class="resource-item-title">${escapeHTML(folder.text)}</h3>`;
            html += `<button type="button" class="btn btn-resource" data-folder-id="${escapeHTML(folderId)}" data-folder-url="${escapeHTML(folder.link)}">`;
            html += `View ${escapeHTML(folder.text)} Resources`;
            html += '</button>';
            html += '</article>';
        });

        html += '</div>';
    }

    if (data.note2) {
        html += `<p class="note-text">${escapeHTML(data.note2)}</p>`;
    }

    html += '<aside class="sr-only" aria-label="Hidden study note">Tucked-away note: every folder here was kept because it rescued me when I was stuck. May it save you an afternoon too.</aside>';
    html += '</section>';
    html += '</div>';
    return html;
}

// Helper function to extract Google Drive folder ID from URL
function extractGoogleDriveFolderId(url) {
    try {
        const match = url.match(/[-\w]{25,}/);
        return match ? match[0] : '';
    } catch (error) {
        console.error('Error extracting folder ID:', error);
        return '';
    }
}

// Render Generic Page
function renderGenericPage(data) {
    let html = '<div class="container page-enter">';
    html += '<section class="section">';
    html += `<h1 class="section-title">${escapeHTML(data.title || 'Page')}</h1>`;
    html += '<div class="section-content">';

    if (data.content) {
        if (Array.isArray(data.content)) {
            data.content.forEach(item => {
                if (item.type === 'paragraph') {
                    html += `<p>${escapeHTML(item.text)}</p>`;
                } else if (item.type === 'heading') {
                    const level = Math.min(Math.max(parseInt(item.level, 10) || 2, 1), 6);
                    html += `<h${level}>${escapeHTML(item.text)}</h${level}>`;
                }
            });
        } else {
            html += `<p>${escapeHTML(data.content)}</p>`;
        }
    }

    html += '</div>';
    html += '</section>';
    html += '</div>';
    return html;
}

// Setup CTA Buttons
function setupCTAButtons() {
    const ctaButtons = document.querySelectorAll('[data-cta-page]');
    ctaButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const page = button.getAttribute('data-cta-page');
            navigateTo(page);
        });
    });
}

// Setup Contact Form — real inline validation & mailto/copy dispatch (zero window.alert)
function setupContactForm() {
    const form = document.getElementById('contact-form');
    const feedback = document.getElementById('contact-feedback');
    if (!form || !feedback) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const name = String(formData.get('name') || '').trim();
        const email = String(formData.get('email') || '').trim();
        const subject = String(formData.get('subject') || '').trim();
        const message = String(formData.get('message') || '').trim();

        const errors = {};
        if (!name) errors.name = 'Please enter your name.';
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Please enter a valid email address.';
        }
        if (!subject) errors.subject = 'Please add a short subject.';
        if (!message || message.length < 5) errors.message = 'Please write a brief message (at least 5 characters).';

        ['name', 'email', 'subject', 'message'].forEach(field => {
            const errEl = document.getElementById(`error-${field}`);
            const inputEl = document.getElementById(field);
            if (errEl) errEl.textContent = errors[field] || '';
            if (inputEl) inputEl.setAttribute('aria-invalid', errors[field] ? 'true' : 'false');
        });

        if (Object.keys(errors).length > 0) {
            const firstInvalid = Object.keys(errors)[0];
            document.getElementById(firstInvalid)?.focus();
            feedback.hidden = true;
            return;
        }

        const recipient = feedback.dataset.email || 'uzairshaikhking777@gmail.com';
        const formattedBody = `From: ${name} (${email})\n\n${message}`;
        const mailtoHref = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formattedBody)}`;

        feedback.hidden = false;
        feedback.innerHTML = `
            <p class="feedback-title">Message ready to send</p>
            <p class="feedback-copy">Because this is a static portfolio without a mail server, you can launch your email client with everything pre-filled or copy the message below.</p>
            <div class="feedback-actions">
                <a href="${escapeHTML(mailtoHref)}" class="btn btn-sm">Open in Email Client ↗</a>
                <button type="button" class="btn btn-glass btn-sm" id="copy-composed-msg">Copy Message</button>
            </div>
        `;

        const copyBtn = document.getElementById('copy-composed-msg');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(`To: ${recipient}\nSubject: ${subject}\n\n${formattedBody}`);
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => { copyBtn.textContent = 'Copy Message'; }, 2000);
                } catch (_) {
                    copyBtn.textContent = 'Copy unavailable';
                }
            });
        }

        form.reset();
    });
}

// Setup Resource Buttons — clean modal lifecycle with zero listener leaks
function setupResourceButtons() {
    const resourceButtons = document.querySelectorAll('.btn-resource');
    let currentPopup = null;
    let activeEscapeHandler = null;

    const cleanupPopup = (returnFocusEl) => {
        if (activeEscapeHandler) {
            document.removeEventListener('keydown', activeEscapeHandler);
            activeEscapeHandler = null;
        }
        if (currentPopup) {
            currentPopup.remove();
            currentPopup = null;
        }
        document.body.style.overflow = '';
        if (returnFocusEl) returnFocusEl.focus();
    };

    resourceButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const folderId = button.getAttribute('data-folder-id');
            const folderUrl = button.getAttribute('data-folder-url') || `https://drive.google.com/drive/folders/${folderId}`;
            const semesterText = button.textContent.replace('View ', '').replace('Hide ', '').replace(' Resources', '').trim();

            cleanupPopup(null);

            currentPopup = document.createElement('div');
            currentPopup.id = 'exclusive-resource-popup';
            currentPopup.className = 'resource-popup';
            currentPopup.setAttribute('role', 'dialog');
            currentPopup.setAttribute('aria-modal', 'true');

            const popupContent = document.createElement('div');
            popupContent.className = 'resource-popup-content';

            const popupHeader = document.createElement('div');
            popupHeader.className = 'resource-popup-header';

            const popupTitleId = 'resource-popup-title-' + folderId;
            const popupTitle = document.createElement('h2');
            popupTitle.textContent = `${semesterText} Resources`;
            popupTitle.className = 'resource-popup-title';
            popupTitle.id = popupTitleId;
            currentPopup.setAttribute('aria-labelledby', popupTitleId);

            const headerActions = document.createElement('div');
            headerActions.className = 'resource-popup-actions';

            const extLink = document.createElement('a');
            extLink.href = folderUrl;
            extLink.target = '_blank';
            extLink.rel = 'noopener noreferrer';
            extLink.className = 'btn btn-glass btn-sm';
            extLink.textContent = 'Open in Drive ↗';

            const closeButton = document.createElement('button');
            closeButton.type = 'button';
            closeButton.textContent = '×';
            closeButton.className = 'resource-popup-close';
            closeButton.setAttribute('aria-label', 'Close resources popup');
            closeButton.addEventListener('click', () => cleanupPopup(button));

            headerActions.appendChild(extLink);
            headerActions.appendChild(closeButton);
            popupHeader.appendChild(popupTitle);
            popupHeader.appendChild(headerActions);

            const iframeContainer = document.createElement('div');
            iframeContainer.className = 'resource-popup-iframe';

            const loadingNote = document.createElement('div');
            loadingNote.className = 'resource-iframe-loading';
            loadingNote.textContent = 'Loading Google Drive folder...';
            iframeContainer.appendChild(loadingNote);

            const iframe = document.createElement('iframe');
            iframe.src = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
            iframe.allow = 'fullscreen; clipboard-read; clipboard-write';
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            iframe.title = `${semesterText} Resources - Google Drive`;

            iframe.addEventListener('load', () => {
                loadingNote.remove();
            });

            iframe.addEventListener('error', () => {
                iframeContainer.innerHTML = `
                    <div class="resource-error-box">
                        <h3>Unable to load Google Drive content</h3>
                        <p class="text-secondary">You can still browse the folder directly on Google Drive.</p>
                        <a href="${escapeHTML(folderUrl)}" target="_blank" rel="noopener noreferrer" class="btn">
                            Open in Google Drive ↗
                        </a>
                    </div>
                `;
            });

            iframeContainer.appendChild(iframe);
            popupContent.appendChild(popupHeader);
            popupContent.appendChild(iframeContainer);
            currentPopup.appendChild(popupContent);

            currentPopup.addEventListener('click', (evt) => {
                if (evt.target === currentPopup) {
                    cleanupPopup(button);
                }
            });

            activeEscapeHandler = (evt) => {
                if (evt.key === 'Escape') {
                    cleanupPopup(button);
                }
            };
            document.addEventListener('keydown', activeEscapeHandler);

            document.body.style.overflow = 'hidden';
            document.body.appendChild(currentPopup);
            closeButton.focus();
        });
    });
}

// Setup Footer (renders synchronously first, then hydrates social SVGs non-blockingly)
function setupFooter() {
    try {
        const footer = document.getElementById('footer');
        if (!footer || !globalConfig.footer) return;

        let footerHTML = '<div class="container footer-inner">';
        footerHTML += '<div class="footer-top">';
        if (globalConfig.footer.copyright) {
            footerHTML += `<p class="footer-copyright">${escapeHTML(globalConfig.footer.copyright)}</p>`;
        }
        if (globalConfig.footer.links && globalConfig.footer.links.length > 0) {
            footerHTML += '<nav aria-label="Social media links"><div class="social-links footer-social">';
            globalConfig.footer.links.forEach((link, idx) => {
                const shortLabel = escapeHTML((link.name || '').slice(0, 2).toUpperCase());
                footerHTML += `<a href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHTML(link.name)}" aria-label="Visit ${escapeHTML(link.name)}" class="svg-icon" data-footer-icon-idx="${idx}"><span class="sr-only">${escapeHTML(link.name)}</span><span aria-hidden="true" style="font-family:var(--font-mono);font-size:0.72rem;font-weight:600">${shortLabel}</span></a>`;
            });
            footerHTML += '</div></nav>';
        }
        footerHTML += '</div>';
        if (globalConfig.footer.footerNote) {
            footerHTML += `<div class="footer-note">${globalConfig.footer.footerNote}</div>`;
        }
        // Sweet hidden pocket note exclusively discoverable via keyboard Tab or screen reader
        footerHTML += `<button type="button" class="sr-only sr-only-focusable secret-a11y-egg" id="secret-a11y-egg">Psst — you found Uzair's hidden pocket note. Press Enter for a little kindness.</button>`;
        footerHTML += '</div>';
        footer.innerHTML = footerHTML;

        const eggBtn = document.getElementById('secret-a11y-egg');
        if (eggBtn) {
            eggBtn.addEventListener('click', () => {
                const note = HIDDEN_POCKET_NOTES[pocketNoteIndex % HIDDEN_POCKET_NOTES.length];
                pocketNoteIndex += 1;
                eggBtn.textContent = note;
                announceA11y(note);
            });
        }

        // Hydrate footer SVG icons in background without blocking initial page reveal
        if (globalConfig.footer.links && globalConfig.footer.links.length > 0) {
            globalConfig.footer.links.forEach((link, idx) => {
                if (!link.icon) return;
                renderSVGIcon(link.icon).then((svgMarkup) => {
                    const anchor = footer.querySelector(`a[data-footer-icon-idx="${idx}"]`);
                    if (anchor && svgMarkup) {
                        anchor.innerHTML = svgMarkup;
                    }
                }).catch(() => {});
            });
        }
    } catch (error) {
        console.error('Error setting up footer:', error);
    }
}

// Snappy, FOUC-free Preloader powered by time-synced custom solar loaders
function showPreloader() {
    let preloader = document.getElementById('preloader');
    const loaderMarkup = (window.PortfolioThemeEngine && typeof window.PortfolioThemeEngine.buildSolarLoaderMarkup === 'function')
        ? window.PortfolioThemeEngine.buildSolarLoaderMarkup()
        : '<div class="solar-loader"><span class="solar-loader-label">// loading portfolio...</span></div>';

    if (!preloader) {
        preloader = document.createElement('div');
        preloader.id = 'preloader';
        preloader.className = 'site-preloader';
        preloader.setAttribute('role', 'status');
        preloader.setAttribute('aria-live', 'polite');
        preloader.innerHTML = `<div class="preloader-inner" id="preloader-inner">${loaderMarkup}</div>`;
        document.body.appendChild(preloader);
    } else {
        // Upgrade packet-1 inline preloader seamlessly to the full 4-phase solar SVG once theme-engine.js arrives
        const inner = preloader.querySelector('.preloader-inner');
        if (inner && !inner.querySelector('[data-solar-loader]')) {
            inner.innerHTML = loaderMarkup;
        }
    }
    preloader.classList.remove('is-hidden');
}

function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.classList.add('is-hidden');
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 440);
    }
}

// Idle background prefetcher (runs AFTER first reveal and skips eager flooding on Slow 3G / Save-Data)
function scheduleBackgroundPrefetch(initialPage) {
    if (isSlowConnection()) return;
    const runPrefetch = () => {
        if (isSlowConnection()) return;
        const pageNames = (globalConfig.navigation?.menu?.map(m => m.page) || ['home', 'about', 'experience', 'contact', 'resources'])
            .filter(p => p !== initialPage);
        // Warm tiny route JSONs only on idle; page SVGs prefetch on nav hover/focus
        pageNames.forEach(p => prefetchPage(p, { includeIcons: false }));
    };

    const kick = () => {
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(runPrefetch, { timeout: 2500 });
        } else {
            setTimeout(runPrefetch, 800);
        }
    };
    setTimeout(kick, 1200);
}

// Initialize when DOM is loaded (packet-1 preloader is already painted; hydrates critical JSON + CSS cleanly)
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.__preloaderStartTime !== 'number') {
        window.__preloaderStartTime = performance.now();
    }
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const themeEngine = window.PortfolioThemeEngine || null;
    if (themeEngine) {
        drawerController = themeEngine.initDrawer();
    }
    const arrivedViaCurtain = !prefersReducedMotion && Boolean(themeEngine && typeof themeEngine.hasIncomingCurtainHandoff === 'function' && themeEngine.hasIncomingCurtainHandoff());

    const solarWelcome = document.getElementById('a11y-solar-welcome');
    if (solarWelcome) {
        solarWelcome.textContent = getCurrentSolarMood().greeting;
    }
    if (arrivedViaCurtain) {
        const pre = document.getElementById('preloader');
        if (pre) pre.style.display = 'none';
    } else {
        showPreloader();
    }

    const initialPage = getPageFromHash();
    const slowNet = isSlowConnection();

    try {
        // Hydrate global config + active route JSON + main stylesheet in parallel (zero font-blocking on slow networks)
        const fontsReadyBounded = (!slowNet && document.fonts && document.fonts.ready)
            ? Promise.race([document.fonts.ready, waitMs(220)])
            : Promise.resolve();

        const [cfg] = await Promise.all([
            loadJSON('data/global.json'),
            loadJSON(`data/pages/${initialPage}.json`),
            waitForMainStylesheet(),
            fontsReadyBounded,
        ]);
        globalConfig = cfg;
        setupNavigation();
        setupFooter();

        // Render initial page immediately (defer GitHub repo network calls until right after reveal)
        await loadPage(initialPage, { scrollToTop: false, deferRepos: initialPage === 'home' });

        // Browser back / forward & hash deep-link support
        window.addEventListener('hashchange', () => {
            const target = getPageFromHash();
            if (target !== currentPage) {
                loadPage(target, { scrollToTop: true, animate: true });
            }
        });
        window.addEventListener('popstate', () => {
            const target = getPageFromHash();
            if (target !== currentPage) {
                loadPage(target, { scrollToTop: true, animate: true });
            }
        });
    } catch (error) {
        console.error('Error initializing app:', error);
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<div class="container"><div class="loading"><p>Error loading content. Please check your data files.</p></div></div>';
        }
    } finally {
        const mainContent = document.getElementById('main-content');
        const kickPostRevealWork = () => {
            if (initialPage === 'home' && currentPage === 'home') {
                fetchGitHubRepos();
            }
            scheduleBackgroundPrefetch(initialPage);
        };

        if (arrivedViaCurtain && themeEngine && typeof themeEngine.releaseIncomingCurtain === 'function') {
            themeEngine.releaseIncomingCurtain({
                minHoldMs: 260,
                onReveal: () => {
                    if (!prefersReducedMotion) {
                        applyRouteStagger(mainContent);
                    }
                    kickPostRevealWork();
                },
            });
        } else {
            // Preserve brief solar-loader showcase (~680ms total from packet 1) on fast links,
            // while adding 0ms extra wait when slow networks already spent >680ms hydrating assets.
            const minDuration = prefersReducedMotion ? 0 : 680;
            const elapsed = performance.now() - window.__preloaderStartTime;
            const remaining = Math.max(0, minDuration - elapsed);
            setTimeout(() => {
                hidePreloader();
                if (!prefersReducedMotion) {
                    applyRouteStagger(mainContent);
                }
                kickPostRevealWork();
            }, remaining);
        }
    }
});
