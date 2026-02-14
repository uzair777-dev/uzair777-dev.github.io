// ═══════════════════════════════════════════════
// index.js — devLOGS page renderer
// Mirrors the architecture of /app.js:
//   • Dynamically loads navigation from global.json
//   • Theme toggle & mobile menu
//   • Renders cards from parsed XML data
//   • Full-screen overlay for reading posts
//   • Hash-based deep-linking (/devlogs/#id)
// ═══════════════════════════════════════════════
import { loadXML } from './parser.js';

// ─── State ───
let devLogs       = [];
let currentFilter = 'all';
let currentPage   = 1;
const LOGS_PER_PAGE = 5;
const glitchFonts   = [];

// ═══════════════════════════════════════════════
//  Initialisation
// ═══════════════════════════════════════════════
async function init() {
    currentPage = 1;
    try {
        // UI controls
        setupThemeToggle();
        setTheme(getPreferredTheme());
        setupMobileMenu();
        await setupNavigation();

        // Create the overlay element
        createOverlay();

        // Load custom fonts for glitch effect
        await loadGlitchFonts();

        // Load & parse XML
        const result = await loadXML('logs.xml');
        if (!result.success) { showError(`Error loading dev logs: ${result.error}`); return; }

        devLogs = result.data;
        if (devLogs.length === 0) { showError('No dev logs found'); return; }

        // Process custom tags on main thread (needs DOM)
        devLogs = devLogs.map(log => ({ ...log, content: processContent(log.content) }));

        // Build filter bar (only if >1 types)
        setupFilters();

        // Render
        renderDevLogs();
        document.getElementById('loading').style.display = 'none';
        document.getElementById('devlog-list').style.display = 'flex';

        // Footer (same data source as main site)
        await setupFooter();

        // Check for hash deep-link (#id)
        handleHashNavigation();
        window.addEventListener('hashchange', handleHashNavigation);
    } catch (error) {
        showError(`Unexpected error: ${error.message}`);
    }
}

// ═══════════════════════════════════════════════
//  Content Processing  (HTML normalise + censor / pcensor / glitch)
//
//  Custom tags (defined in logs.xml):
//   <censor>text</censor>
//       → replaces every char with █ (U+2588)
//   <PCensor>text</PCensor>
//       → partial censor: only the first and second-to-last
//         character of each word are visible,
//         everything else is * (applied per-word)
//   <glitch intensity="N">text</glitch>
//       → replaces the font of every letter with a random font,
//         replaces the letter with a random letter.
//         If no text given, generates 3-7 random chars.
//         Intensity (2-10) controls animation speed.
//
//  Supported HTML tags: <br>, <img>, <a>, <p>, <i>, <b>,
//  <u>, <s>, <sub>, <sup>, <hr>, <ul>, <ol>, <li>, <code>, <pre>
// ═══════════════════════════════════════════════

function processContent(content) {
    // ── 1. Normalise HTML tags that XML serialisation may mangle ──
    // XML self-closes void elements: <br/> <hr/> <img .../>
    content = content.replace(/<br\s*\/>/gi, '<br>');
    content = content.replace(/<hr\s*\/>/gi, '<hr>');
    // Fix img self-closing (XML: <img src="..." />) to HTML
    content = content.replace(/<img\s+([^>]*?)\/>/gi, '<img $1>');

    // ── 2. Custom tag: full censor — replace every character with █ ──
    content = content.replace(/<censor>(.*?)<\/censor>/gi, (_m, p1) =>
        `<span class="censor-text">${'█'.repeat(p1.length)}</span>`
    );

    // ── 3. Custom tag: partial censor — first + second-to-last char visible ──
    content = content.replace(/<PCensor>(.*?)<\/PCensor>/gi, (_m, p1) => {
        return p1.split(' ').map(word => {
            if (word.length <= 2) return word;
            if (word.length === 3) return word[0] + '*' + word[2];
            const secondToLast = word.length - 2;
            return word.split('').map((ch, i) => {
                if (i === 0 || i === secondToLast) return ch;
                return '*';
            }).join('');
        }).join(' ');
    });

    // ── 4. Custom tag: glitch ──
    // Handles both <glitch intensity="N">text</glitch> and <glitch intensity="N"/>
    content = content.replace(/<glitch\s+intensity="(\d+)">(.*?)<\/glitch>/gi, (_m, int, txt) => {
        return renderGlitchText(txt, Math.min(Math.max(parseInt(int), 2), 10));
    });
    content = content.replace(/<glitch\s+intensity="(\d+)"\s*\/>/gi, (_m, int) => {
        return renderGlitchText('', Math.min(Math.max(parseInt(int), 2), 10));
    });

    // ── 5. Normalise through a temp element (safe HTML pass-through) ──
    const tmp = document.createElement('div');
    tmp.innerHTML = content;
    return tmp.innerHTML;
}

/**
 * Glitch effect — per the XML spec:
 *  1. Count letters between tags (excluding spaces).
 *     If none given, pick a random count between 3-7.
 *  2. Replace the font of EVERY letter with a random font
 *     from data/fonts/.
 *  3. Replace EVERY letter with a random letter.
 *  4. Intensity (2-10) controls the animation jitter speed.
 */
function renderGlitchText(text, intensity) {
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';

    // If no text given, generate random 3-7 characters
    if (!text || text.trim().length === 0) {
        const len = Math.floor(Math.random() * 5) + 3;
        text = Array.from({ length: len }, () =>
            pool[Math.floor(Math.random() * pool.length)]
        ).join('');
    }

    // Higher intensity = faster, more aggressive jitter
    const speed = Math.max(0.08, 0.6 - intensity * 0.05);

    const spans = text.split('').map(ch => {
        if (ch === ' ') return ' ';
        const display = pool[Math.floor(Math.random() * pool.length)];
        let fontCSS = '';
        if (glitchFonts.length > 0) {
            const font = glitchFonts[Math.floor(Math.random() * glitchFonts.length)];
            fontCSS = `font-family:'${font}',monospace;`;
        }
        return `<span class="glitch-char" style="${fontCSS}--glitch-speed:${speed}s;">${display}</span>`;
    }).join('');

    return `<span class="glitch-container">${spans}</span>`;
}

// ═══════════════════════════════════════════════
//  Font Loading (with browser Cache API)
// ═══════════════════════════════════════════════

const FONT_CACHE_NAME = 'devlogs-glitch-fonts-v1';

async function loadGlitchFonts() {
    const files = [
        '/data/fonts/font-0.ttf', '/data/fonts/font-1.ttf',
        '/data/fonts/font-2.otf', '/data/fonts/font-3.otf',
        '/data/fonts/font-4.ttf', '/data/fonts/font-5.ttf',
        '/data/fonts/font-6.otf'
    ];

    let cache = null;
    try { cache = await caches.open(FONT_CACHE_NAME); } catch (_) {}

    for (let i = 0; i < files.length; i++) {
        try {
            const name = `glitch-font-${i}`;
            if (cache) {
                const cached = await cache.match(files[i]);
                if (!cached) await cache.add(files[i]);
            }
            const face = new FontFace(name, `url(${files[i]})`);
            await face.load();
            document.fonts.add(face);
            glitchFonts.push(name);
        } catch (e) {
            console.warn(`Glitch font ${files[i]} skipped:`, e);
        }
    }
}

// ═══════════════════════════════════════════════
//  Full-Screen Overlay
// ═══════════════════════════════════════════════

function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'devlog-overlay';
    overlay.className = 'devlog-overlay';
    overlay.innerHTML = `
        <div class="overlay-backdrop"></div>
        <div class="overlay-panel">
            <button class="overlay-close" id="overlay-close" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2.5"
                     stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="overlay-header" id="overlay-header"></div>
            <div class="overlay-body" id="overlay-body"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Close handlers
    overlay.querySelector('#overlay-close').addEventListener('click', closeOverlay);
    overlay.querySelector('.overlay-backdrop').addEventListener('click', closeOverlay);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && overlay.classList.contains('open')) closeOverlay();
    });
}

function openOverlay(logId) {
    const log = devLogs.find(l => l.id === String(logId));
    if (!log) return;

    const overlay = document.getElementById('devlog-overlay');
    const header  = document.getElementById('overlay-header');
    const body    = document.getElementById('overlay-body');

    header.innerHTML = `
        <h2 class="overlay-title">${log.heading || log.title}</h2>
        <div class="overlay-meta">
            <span class="overlay-date">${formatDate(log.pubDate.date)}${log.pubDate.timezone ? ` (${log.pubDate.timezone})` : ''}</span>
            ${log.type ? `<span class="overlay-type">${log.type}</span>` : ''}
        </div>
        ${log.description ? `<p class="overlay-description">${log.description}</p>` : ''}
    `;
    body.innerHTML = log.content;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Update URL hash
    history.pushState(null, '', `#${log.id}`);
}

function closeOverlay() {
    const overlay = document.getElementById('devlog-overlay');
    overlay.classList.remove('open');
    document.body.style.overflow = '';

    // Clear hash
    history.pushState(null, '', window.location.pathname);
}

// ═══════════════════════════════════════════════
//  Hash Deep-Linking  (/devlogs/#id)
// ═══════════════════════════════════════════════

function handleHashNavigation() {
    const hash = window.location.hash.replace('#', '');
    if (hash && devLogs.length > 0) {
        openOverlay(hash);
    }
}

// ═══════════════════════════════════════════════
//  Navigation  (loaded from global.json like app.js)
// ═══════════════════════════════════════════════

async function setupNavigation() {
    const navMenu = document.getElementById('nav-menu');
    try {
        const resp = await fetch('/data/global.json');
        if (!resp.ok) throw new Error();
        const cfg = await resp.json();

        if (cfg.navigation?.menu) {
            navMenu.innerHTML = '';
            cfg.navigation.menu.forEach(item => {
                const li = document.createElement('li');
                const a  = document.createElement('a');
                a.href        = '/';
                a.textContent = item.label;
                li.appendChild(a);
                navMenu.appendChild(li);
            });
            // "devLOGS" as active link
            const li = document.createElement('li');
            const a  = document.createElement('a');
            a.href = '/devlogs/';
            a.textContent = 'devLOGS';
            a.classList.add('active');
            li.appendChild(a);
            navMenu.appendChild(li);
        }
    } catch (_) {
        navMenu.innerHTML = '<li><a href="/">Home</a></li><li><a href="/devlogs/" class="active">devLOGS</a></li>';
    }
}

// ═══════════════════════════════════════════════
//  Theme  (matches app.js behaviour)
// ═══════════════════════════════════════════════

function getPreferredTheme() {
    return localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function setTheme(theme) {
    const resolved = theme === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem('theme', theme);
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

function setupThemeToggle() {
    document.querySelectorAll('.theme-option').forEach(btn =>
        btn.addEventListener('click', () => setTheme(btn.dataset.theme))
    );
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem('theme') === 'auto') setTheme('auto');
    });
}

// ═══════════════════════════════════════════════
//  Mobile Menu
// ═══════════════════════════════════════════════

function setupMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu   = document.getElementById('nav-menu');
    hamburger.addEventListener('click', () => navMenu.classList.toggle('active'));
    navMenu.addEventListener('click', e => { if (e.target.tagName === 'A') navMenu.classList.remove('active'); });
}

// ═══════════════════════════════════════════════
//  Filters
// ═══════════════════════════════════════════════

function setupFilters() {
    const types = [...new Set(devLogs.map(l => l.type).filter(Boolean))];
    if (types.length <= 1) return;

    const container = document.getElementById('filter-container');
    container.style.display = 'block';
    let html = '<div class="devlog-filters"><button class="filter-btn active" data-filter="all">All</button>';
    types.forEach(t => { html += `<button class="filter-btn" data-filter="${t}">${t}</button>`; });
    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll('.filter-btn').forEach(btn =>
        btn.addEventListener('click', () => {
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            currentPage = 1;
            renderDevLogs();
        })
    );
}

// ═══════════════════════════════════════════════
//  Rendering
// ═══════════════════════════════════════════════

function renderDevLogs() {
    const list = document.getElementById('devlog-list');
    const pag  = document.getElementById('pagination-container');
    list.innerHTML = '';
    pag.innerHTML  = '';

    const filtered   = currentFilter === 'all' ? devLogs : devLogs.filter(l => l.type === currentFilter);
    const totalPages = Math.ceil(filtered.length / LOGS_PER_PAGE);
    const start      = (currentPage - 1) * LOGS_PER_PAGE;
    const page       = filtered.slice(start, start + LOGS_PER_PAGE);

    // Pagination controls
    if (totalPages > 1) {
        pag.innerHTML = `
            <div class="pagination">
                <button ${currentPage === 1 ? 'disabled' : ''} id="prev-page" aria-label="Previous page">←</button>
                <span class="page-info">Page ${currentPage} of ${totalPages}</span>
                <button ${currentPage === totalPages ? 'disabled' : ''} id="next-page" aria-label="Next page">→</button>
            </div>`;
        document.getElementById('prev-page').addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderDevLogs(); } });
        document.getElementById('next-page').addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderDevLogs(); } });
    }

    // Empty state
    if (page.length === 0) {
        list.innerHTML = `
            <div class="devlog-empty">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <p>No logs found for this filter</p>
            </div>`;
        return;
    }

    page.forEach(log => list.appendChild(createCard(log)));
}

function createCard(log) {
    const card = document.createElement('div');
    card.className = 'devlog-card';
    card.innerHTML = `
        <div class="devlog-header">
            <div>
                <h3 class="devlog-title">${log.heading || log.title}</h3>
                <p class="devlog-date">${formatDate(log.pubDate.date)}${log.pubDate.timezone ? ` (${log.pubDate.timezone})` : ''}</p>
            </div>
            ${log.type ? `<span class="devlog-type">${log.type}</span>` : ''}
        </div>
        <p class="devlog-description">${log.description}</p>
        <button class="devlog-toggle" data-id="${log.id}">Read More <span class="toggle-arrow">→</span></button>`;

    card.querySelector('.devlog-toggle').addEventListener('click', () => openOverlay(log.id));
    return card;
}

// ═══════════════════════════════════════════════
//  Footer  (re-uses global.json, same as app.js)
// ═══════════════════════════════════════════════

async function setupFooter() {
    try {
        const resp = await fetch('/data/global.json');
        if (!resp.ok) return;
        const cfg = await resp.json();
        const footer = document.getElementById('footer');
        if (!cfg.footer) return;

        let html = '';
        if (cfg.footer.copyright) html += `<p>${cfg.footer.copyright}</p>`;

        if (cfg.footer.links?.length) {
            html += '<div class="social-links">';
            for (const link of cfg.footer.links) {
                let icon = '';
                try { const r = await fetch('/' + link.icon); if (r.ok) icon = await r.text(); } catch (_) {}
                html += `<a href="${link.url}" target="_blank" rel="noopener noreferrer" title="${link.name}" class="svg-icon">${icon}</a>`;
            }
            html += '</div>';
        }
        if (cfg.footer.footerNote) html += cfg.footer.footerNote;
        footer.innerHTML = html;
    } catch (_) { /* silent */ }
}

// ═══════════════════════════════════════════════
//  Utilities
// ═══════════════════════════════════════════════

function formatDate(ts) {
    if (!ts) return 'Unknown date';
    return new Date(parseInt(ts) * 1000).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function showError(msg) {
    document.getElementById('error').textContent = msg;
    document.getElementById('error').style.display = 'block';
    document.getElementById('loading').style.display = 'none';
}

// ─── Boot ───
document.addEventListener('DOMContentLoaded', init);