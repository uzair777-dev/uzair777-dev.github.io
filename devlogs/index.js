// ═══════════════════════════════════════════════
// index.js — devLOGS Editorial Zine & Reader
// ═══════════════════════════════════════════════
import { loadXML } from './parser.js';

let devLogs = [];
let currentFilter = 'all';
let currentSearch = '';
let currentPage = 1;
let sortOrder = 'desc';
let cachedGlobalConfig = null;
const LOGS_PER_PAGE = 5;
const GLITCH_FONT_NAMES = [
    'glitch-font-0', 'glitch-font-1', 'glitch-font-2', 'glitch-font-3',
    'glitch-font-4', 'glitch-font-5', 'glitch-font-6'
];

// ═══════════════════════════════════════════════
//  Initialisation (Non-blocking critical path)
// ═══════════════════════════════════════════════
async function init() {
    currentPage = 1;
    const bootStartedAt = performance.now();
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const themeEngine = window.PortfolioThemeEngine || null;
    const arrivedViaCurtain = !prefersReducedMotion && Boolean(themeEngine && typeof themeEngine.hasIncomingCurtainHandoff === 'function' && themeEngine.hasIncomingCurtainHandoff());

    try {
        if (themeEngine) {
            themeEngine.initDrawer();
            if (!arrivedViaCurtain && typeof themeEngine.mountSolarLoader === 'function') {
                themeEngine.mountSolarLoader('#devlog-loader-slot', {
                    label: '// syncing dev logs...'
                });
            }
        }

        createOverlay();

        // Load glitch fonts in background without blocking XML render
        loadGlitchFonts().catch(() => {});

        const fontsReadyBounded = (document.fonts && document.fonts.ready)
            ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 450))])
            : Promise.resolve();

        // Fetch global navigation config, logs.xml, and web fonts in parallel
        const [, result] = await Promise.all([
            setupNavigation(),
            loadXML('logs.xml'),
            fontsReadyBounded,
        ]);

        if (!result.success) {
            if (arrivedViaCurtain && themeEngine) themeEngine.releaseIncomingCurtain({ minHoldMs: 0 });
            showError(`Error loading dev logs: ${result.error}`);
            return;
        }

        devLogs = result.data;
        if (devLogs.length === 0) {
            if (arrivedViaCurtain && themeEngine) themeEngine.releaseIncomingCurtain({ minHoldMs: 0 });
            showError('No dev logs found');
            return;
        }

        devLogs = devLogs.map(log => ({
            ...log,
            rawText: stripTags(`${log.title} ${log.heading} ${log.description} ${log.content}`),
            readMins: estimateReadTime(`${log.description} ${log.content}`),
            content: processContent(log.content),
        }));

        setupControls();
        renderDevLogs();

        if (!arrivedViaCurtain) {
            // Intentional showcase & slow-network hydration floor on direct load so visitors can appreciate the solar loader
            const minShowcaseMs = prefersReducedMotion ? 0 : 620;
            const remaining = Math.max(0, minShowcaseMs - (performance.now() - bootStartedAt));
            if (remaining > 0) {
                await new Promise(r => setTimeout(r, remaining));
            }
        }

        document.getElementById('loading').style.display = 'none';
        const listEl = document.getElementById('devlog-list');
        listEl.style.display = 'flex';

        if (arrivedViaCurtain && themeEngine && typeof themeEngine.releaseIncomingCurtain === 'function') {
            themeEngine.releaseIncomingCurtain({
                minHoldMs: 260,
                onReveal: () => {
                    if (!prefersReducedMotion && typeof themeEngine.applyRouteStagger === 'function') {
                        themeEngine.applyRouteStagger(document.body, '.devlog-hero-inner, .devlog-controls, .devlog-card');
                    }
                },
            });
        } else if (!prefersReducedMotion) {
            listEl.classList.add('page-enter');
        }

        setupFooter();

        handleHashNavigation();
        window.addEventListener('hashchange', handleHashNavigation);
    } catch (error) {
        if (arrivedViaCurtain && themeEngine) themeEngine.releaseIncomingCurtain({ minHoldMs: 0 });
        showError(`Unexpected error: ${error.message}`);
    }
}

// ═══════════════════════════════════════════════
//  Content Processing (multi-line censor / glitch)
// ═══════════════════════════════════════════════
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function stripTags(str) {
    return String(str || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function estimateReadTime(text) {
    const words = stripTags(text).split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
}

function processContent(content) {
    content = content.replace(/<(img|input|source|embed|area|col|track)\s+([^>]*?)\/>/gi, '<$1 $2>');
    content = content.replace(/<(br|hr|wbr)\s*\/>/gi, '<$1>');

    // Multi-line full censor
    content = content.replace(/<censor>([\s\S]*?)<\/censor>/gi, (_m, p1) =>
        `<span class="censor-text" aria-label="Redacted text">${'█'.repeat(p1.replace(/\s+/g, ' ').length)}</span>`
    );

    // Multi-line partial censor
    content = content.replace(/<PCensor>([\s\S]*?)<\/PCensor>/gi, (_m, p1) => {
        return p1.split(/(\s+)/).map(token => {
            if (/^\s+$/.test(token) || token.length <= 2) return token;
            if (token.length === 3) return token[0] + '*' + token[2];
            const secondToLast = token.length - 2;
            return token.split('').map((ch, i) => (i === 0 || i === secondToLast) ? ch : '*').join('');
        }).join('');
    });

    // Multi-line & self-closing glitch (supports explicit or default intensity)
    content = content.replace(/<glitch(?:\s+intensity="(\d+)")?\s*>([\s\S]*?)<\/glitch>/gi, (_m, int, txt) => {
        const level = int ? Math.min(Math.max(parseInt(int, 10), 2), 10) : 5;
        return renderGlitchText(txt, level);
    });
    content = content.replace(/<glitch(?:\s+intensity="(\d+)")?\s*\/>/gi, (_m, int) => {
        const level = int ? Math.min(Math.max(parseInt(int, 10), 2), 10) : 5;
        return renderGlitchText('', level);
    });

    const tmp = document.createElement('div');
    tmp.innerHTML = content;
    return tmp.innerHTML;
}

function renderGlitchText(text, intensity) {
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
    if (!text || text.trim().length === 0) {
        const len = Math.floor(Math.random() * 5) + 3;
        text = Array.from({ length: len }, () => pool[Math.floor(Math.random() * pool.length)]).join('');
    }
    // Photosensitive-safe period (>= 0.85s / < 1.2 Hz, strictly below 3 Hz WCAG threshold)
    const speed = Math.max(0.85, 1.45 - intensity * 0.055);
    const spans = text.split('').map(ch => {
        if (/\s/.test(ch)) return ' ';
        const display = escapeHtml(pool[Math.floor(Math.random() * pool.length)]);
        const font = GLITCH_FONT_NAMES[Math.floor(Math.random() * GLITCH_FONT_NAMES.length)];
        const fontCSS = `font-family:'${font}',monospace;`;
        return `<span class="glitch-char" style="${fontCSS}--glitch-speed:${speed}s;">${display}</span>`;
    }).join('');
    return `<span class="glitch-container">${spans}</span>`;
}

// ═══════════════════════════════════════════════
//  Font Loading (Background swap — never blocks FCP)
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

    await Promise.allSettled(files.map(async (file, i) => {
        const name = GLITCH_FONT_NAMES[i];
        if (cache) {
            const cached = await cache.match(file);
            if (!cached) await cache.add(file);
        }
        const face = new FontFace(name, `url(${file})`, { display: 'swap' });
        await face.load();
        document.fonts.add(face);
    }));
}

// ═══════════════════════════════════════════════
//  Full-Screen Distraction-Free Editorial Reader
// ═══════════════════════════════════════════════
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'devlog-overlay';
    overlay.className = 'devlog-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Devlog reader');
    overlay.innerHTML = `
        <div class="overlay-backdrop"></div>
        <div class="overlay-panel" id="overlay-panel">
            <div class="reading-progress-track" aria-hidden="true">
                <div class="reading-progress-bar" id="reading-progress-bar"></div>
            </div>
            <div class="overlay-topbar">
                <button type="button" class="overlay-close" id="overlay-close" aria-label="Back to devLOGS">
                    ← Back to devLOGS
                </button>
                <button type="button" class="overlay-share-btn" id="overlay-share-btn">
                    Copy Link
                </button>
            </div>
            <article class="overlay-article">
                <header class="overlay-header" id="overlay-header"></header>
                <div class="overlay-body" id="overlay-body"></div>
                <nav class="overlay-pager" id="overlay-pager" aria-label="Adjacent devlog entries"></nav>
            </article>
        </div>
    `;
    document.body.appendChild(overlay);

    const panel = overlay.querySelector('#overlay-panel');
    const progressBar = overlay.querySelector('#reading-progress-bar');

    panel.addEventListener('scroll', () => {
        const maxScroll = panel.scrollHeight - panel.clientHeight;
        const pct = maxScroll > 0 ? Math.min(1, Math.max(0, panel.scrollTop / maxScroll)) : 0;
        progressBar.style.transform = `scaleX(${pct})`;
    }, { passive: true });

    overlay.querySelector('#overlay-close').addEventListener('click', () => closeOverlay(true));
    overlay.querySelector('.overlay-backdrop').addEventListener('click', () => closeOverlay(true));
    overlay.querySelector('#overlay-share-btn').addEventListener('click', async () => {
        const btn = overlay.querySelector('#overlay-share-btn');
        try {
            await navigator.clipboard.writeText(window.location.href);
            btn.textContent = 'Link Copied';
            setTimeout(() => { btn.textContent = 'Copy Link'; }, 1800);
        } catch (_) {
            btn.textContent = 'Copy Failed';
            setTimeout(() => { btn.textContent = 'Copy Link'; }, 1800);
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && overlay.classList.contains('open')) closeOverlay(true);
    });
}

function getSortedLogs() {
    return [...devLogs].sort((a, b) => {
        const tA = a.pubDate?.date || 0;
        const tB = b.pubDate?.date || 0;
        return sortOrder === 'desc' ? tB - tA : tA - tB;
    });
}

function openOverlay(logId, pushHash = true) {
    const sorted = getSortedLogs();
    const index = sorted.findIndex(l => l.id === String(logId));
    if (index === -1) return;
    const log = sorted[index];

    const overlay = document.getElementById('devlog-overlay');
    const panel = document.getElementById('overlay-panel');
    const progressBar = document.getElementById('reading-progress-bar');
    const header = document.getElementById('overlay-header');
    const body = document.getElementById('overlay-body');
    const pager = document.getElementById('overlay-pager');

    const metaParts = [
        `ENTRY #${String(log.id).padStart(2, '0')}`,
        `${formatDate(log.pubDate.date)}${log.pubDate.timezone ? ` (${log.pubDate.timezone})` : ''}`,
        `${log.readMins} min read`
    ];
    if (log.type) metaParts.push(log.type.toUpperCase());

    header.innerHTML = `
        <div class="overlay-meta-line">${escapeHtml(metaParts.join(' · '))}</div>
        <h2 class="overlay-title">${escapeHtml(log.heading || log.title)}</h2>
        ${log.description ? `<p class="overlay-description">${escapeHtml(log.description)}</p>` : ''}
    `;
    body.innerHTML = log.content;

    const prevLog = index > 0 ? sorted[index - 1] : null;
    const nextLog = index < sorted.length - 1 ? sorted[index + 1] : null;
    pager.innerHTML = `
        <div class="overlay-pager-slot">
            ${prevLog ? `<button type="button" class="overlay-pager-btn" data-jump-id="${escapeHtml(prevLog.id)}">
                <span class="editorial-index">← Previous</span>
                <strong>${escapeHtml(prevLog.heading || prevLog.title)}</strong>
            </button>` : ''}
        </div>
        <div class="overlay-pager-slot overlay-pager-slot--right">
            ${nextLog ? `<button type="button" class="overlay-pager-btn" data-jump-id="${escapeHtml(nextLog.id)}">
                <span class="editorial-index">Next →</span>
                <strong>${escapeHtml(nextLog.heading || nextLog.title)}</strong>
            </button>` : ''}
        </div>
    `;

    pager.querySelectorAll('[data-jump-id]').forEach(btn => {
        btn.addEventListener('click', () => openOverlay(btn.dataset.jumpId, true));
    });

    panel.scrollTop = 0;
    progressBar.style.transform = 'scaleX(0)';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    if (pushHash && window.location.hash !== `#${log.id}`) {
        history.pushState(null, '', `#${log.id}`);
    }

    const titleText = `${log.title} — devLOGS`;
    document.title = titleText;
    const descText = log.description || `${log.title} - Read post on devLOGS by Uzair Shaikh`;
    const metaDesc = document.getElementById('meta-description');
    if (metaDesc) metaDesc.setAttribute('content', descText);
}

function closeOverlay(updateHistory = true) {
    const overlay = document.getElementById('devlog-overlay');
    if (!overlay || !overlay.classList.contains('open')) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';

    if (updateHistory && window.location.hash) {
        history.pushState(null, '', window.location.pathname);
    }

    document.title = 'devLOGS — Uzair Shaikh';
    const defaultDesc = 'devLOGS — Developer thoughts, builds, security research, and programming experiments by Uzair Shaikh.';
    const metaDesc = document.getElementById('meta-description');
    if (metaDesc) metaDesc.setAttribute('content', defaultDesc);
}

function handleHashNavigation() {
    const hash = window.location.hash.replace('#', '');
    if (hash && devLogs.length > 0) {
        openOverlay(hash, false);
    } else {
        closeOverlay(false);
    }
}

// ═══════════════════════════════════════════════
//  Navigation (Links back to main portfolio /#page)
// ═══════════════════════════════════════════════
async function setupNavigation() {
    const navMenu = document.getElementById('nav-menu');
    const drawerNavList = document.getElementById('drawer-nav-list');
    if (!navMenu) return;

    const populateNav = (ul, items) => {
        if (!ul) return;
        ul.innerHTML = '';
        items.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `/#${item.page}`;
            a.textContent = item.label;
            li.appendChild(a);
            ul.appendChild(li);
        });

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '/devlogs/';
        a.textContent = 'devLOGS';
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
        a.addEventListener('click', (e) => {
            e.preventDefault();
            closeOverlay(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        li.appendChild(a);
        ul.appendChild(li);
    };

    try {
        const resp = await fetch('/data/global.json');
        if (!resp.ok) throw new Error();
        const cfg = await resp.json();
        cachedGlobalConfig = cfg;

        if (cfg.navigation?.menu) {
            populateNav(navMenu, cfg.navigation.menu);
            populateNav(drawerNavList, cfg.navigation.menu);
        }
    } catch (_) {
        const fallback = '<li><a href="/#home">Home</a></li><li><a href="/devlogs/" class="active">devLOGS</a></li>';
        navMenu.innerHTML = fallback;
        if (drawerNavList) drawerNavList.innerHTML = fallback;
    }
}

// ═══════════════════════════════════════════════
//  Controls (Live Search + Filters + Sort + Composer)
// ═══════════════════════════════════════════════
function setupControls() {
    const container = document.getElementById('filter-container');
    container.classList.add('devlog-controls-wrap');
    container.style.display = 'block';

    const types = [...new Set(devLogs.map(l => l.type).filter(Boolean))];
    let html = '<div class="devlog-controls">';
    html += '<div class="devlog-search-wrap">';
    html += '<input type="search" id="devlog-search" class="devlog-search-input" placeholder="Search entries, topics, or keywords..." aria-label="Search dev logs">';
    html += '</div>';
    html += '<div class="devlog-control-group">';

    if (types.length > 1) {
        html += '<div class="devlog-filters" role="group" aria-label="Filter entries by category">';
        html += '<button type="button" class="filter-btn active" data-filter="all">All</button>';
        types.forEach(t => {
            html += `<button type="button" class="filter-btn" data-filter="${escapeHtml(t)}">${escapeHtml(t)}</button>`;
        });
        html += '</div>';
    }

    html += `<button type="button" class="sort-btn" id="sort-btn" title="Toggle chronological order">Date <span class="sort-arrow">↓</span></button>`;
    html += `<a href="/devlogs/editor.html" class="sort-btn" data-curtain-label="CUSTOM XML">Custom XML Composer ↗</a>`;
    html += '</div></div>';
    container.innerHTML = html;

    const searchInput = document.getElementById('devlog-search');
    searchInput.addEventListener('input', () => {
        currentSearch = searchInput.value.trim().toLowerCase();
        currentPage = 1;
        renderDevLogs();
    });

    container.querySelectorAll('.filter-btn').forEach(btn =>
        btn.addEventListener('click', () => {
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            currentPage = 1;
            renderDevLogs();
        })
    );

    document.getElementById('sort-btn').addEventListener('click', () => {
        sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
        document.getElementById('sort-btn').classList.toggle('asc', sortOrder === 'asc');
        currentPage = 1;
        renderDevLogs();
    });
}

// ═══════════════════════════════════════════════
//  Rendering Cards
// ═══════════════════════════════════════════════
function renderDevLogs() {
    const list = document.getElementById('devlog-list');
    const pag = document.getElementById('pagination-container');
    list.innerHTML = '';
    pag.innerHTML = '';

    let filtered = currentFilter === 'all' ? [...devLogs] : devLogs.filter(l => l.type === currentFilter);
    if (currentSearch) {
        filtered = filtered.filter(l => l.rawText.toLowerCase().includes(currentSearch));
    }

    filtered.sort((a, b) => {
        const tA = a.pubDate?.date || 0;
        const tB = b.pubDate?.date || 0;
        return sortOrder === 'desc' ? tB - tA : tA - tB;
    });

    const totalPages = Math.ceil(filtered.length / LOGS_PER_PAGE);
    const start = (currentPage - 1) * LOGS_PER_PAGE;
    const page = filtered.slice(start, start + LOGS_PER_PAGE);

    if (totalPages > 1) {
        pag.innerHTML = `
            <div class="pagination">
                <button type="button" ${currentPage === 1 ? 'disabled' : ''} id="prev-page" aria-label="Previous page">←</button>
                <span class="page-info">Page ${currentPage} of ${totalPages}</span>
                <button type="button" ${currentPage === totalPages ? 'disabled' : ''} id="next-page" aria-label="Next page">→</button>
            </div>`;
        document.getElementById('prev-page').addEventListener('click', () => {
            if (currentPage > 1) { currentPage--; renderDevLogs(); }
        });
        document.getElementById('next-page').addEventListener('click', () => {
            if (currentPage < totalPages) { currentPage++; renderDevLogs(); }
        });
    }

    if (page.length === 0) {
        list.innerHTML = `
            <div class="devlog-empty">
                <p>No devlog entries matched your current filter.</p>
            </div>`;
        return;
    }

    page.forEach(log => list.appendChild(createCard(log)));
}

function createCard(log) {
    const card = document.createElement('article');
    card.className = 'devlog-card';

    const metaParts = [
        `${formatDate(log.pubDate.date)}${log.pubDate.timezone ? ` (${log.pubDate.timezone})` : ''}`,
        `${log.readMins} min read`
    ];
    if (log.type) metaParts.push(log.type.toUpperCase());

    card.innerHTML = `
        <div class="devlog-card-topline">
            <span class="editorial-index">ENTRY #${String(log.id).padStart(2, '0')}</span>
            <span class="devlog-meta-line">${escapeHtml(metaParts.join(' · '))}</span>
        </div>
        <h2 class="devlog-title">
            <button type="button" class="devlog-title-btn" data-id="${escapeHtml(log.id)}">${escapeHtml(log.heading || log.title)}</button>
        </h2>
        ${log.description ? `<p class="devlog-description">${escapeHtml(log.description)}</p>` : ''}
        <button type="button" class="devlog-toggle" data-id="${escapeHtml(log.id)}">Read Entry <span class="toggle-arrow">→</span></button>
    `;

    card.querySelector('.devlog-title-btn').addEventListener('click', () => openOverlay(log.id, true));
    card.querySelector('.devlog-toggle').addEventListener('click', () => openOverlay(log.id, true));
    return card;
}

// ═══════════════════════════════════════════════
//  Footer
// ═══════════════════════════════════════════════
async function setupFooter() {
    try {
        let cfg = cachedGlobalConfig;
        if (!cfg) {
            const resp = await fetch('/data/global.json');
            if (!resp.ok) return;
            cfg = await resp.json();
        }
        const footer = document.getElementById('footer');
        if (!cfg.footer || !footer) return;

        let html = '';
        if (cfg.footer.copyright) html += `<p>${cfg.footer.copyright}</p>`;
        if (cfg.footer.links?.length) {
            const icons = await Promise.all(cfg.footer.links.map(async (link) => {
                try {
                    const r = await fetch('/' + link.icon);
                    return r.ok ? await r.text() : '';
                } catch (_) {
                    return '';
                }
            }));
            html += '<div class="social-links">';
            cfg.footer.links.forEach((link, idx) => {
                html += `<a href="${link.url}" target="_blank" rel="noopener noreferrer" title="${link.name}" class="svg-icon">${icons[idx]}</a>`;
            });
            html += '</div>';
        }
        if (cfg.footer.footerNote) html += cfg.footer.footerNote;
        footer.innerHTML = html;
    } catch (_) {}
}

function formatDate(ts) {
    if (!ts) return 'Unknown date';
    return new Date(parseInt(ts, 10) * 1000).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function showError(msg) {
    document.getElementById('error').textContent = msg;
    document.getElementById('error').style.display = 'block';
    document.getElementById('loading').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', init);