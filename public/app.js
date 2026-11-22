// Global state
let globalConfig = {};
let currentPage = 'home';
let currentSkillFilter = 'all';
const svgCache = {};
const jsonCache = {};

const HERO_ARTWORK_PATH = '/src/assets/images/hero_cyber_jade_artwork_1795271990034.jpg';
const VALID_PAGES = new Set(['home', 'about', 'experience', 'contact', 'resources']);

function escapeHTML(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Load JSON file
async function loadJSON(path) {
    if (jsonCache[path]) return jsonCache[path];

    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.statusText}`);
    }
    const data = await response.json();
    jsonCache[path] = data;
    return data;
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

function navigateTo(pageName, options = {}) {
    const target = VALID_PAGES.has(pageName) ? pageName : 'home';
    const { updateHash = true, scrollToTop = true } = options;

    if (updateHash) {
        const nextHash = target === 'home' ? '#home' : `#${target}`;
        if (window.location.hash !== nextHash) {
            history.pushState({ page: target }, '', target === 'home' ? window.location.pathname : nextHash);
        }
    }

    loadPage(target, { scrollToTop });
}

// Load page content
async function loadPage(pageName, options = {}) {
    const { scrollToTop = true } = options;
    currentPage = pageName;

    try {
        updateActiveNavLink(pageName);

        const pageData = await loadJSON(`data/pages/${pageName}.json`);
        await renderPage(pageData);

        if (scrollToTop) {
            window.scrollTo({ top: 0, behavior: 'auto' });
        }

        const siteName = (globalConfig.site && globalConfig.site.name) ? globalConfig.site.name : 'Uzair Shaikh';
        const pageTitle = pageData.title ? `${pageData.title} - ${siteName}` : `${siteName} - Developer Portfolio`;
        document.title = pageTitle;

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
    } catch (error) {
        console.error(`Error loading page ${pageName}:`, error);
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `<div class="container"><div class="loading"><p>Error loading ${escapeHTML(pageName)} page. Please check the data file.</p></div></div>`;
        }
    }
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

    try {
        try {
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Array.isArray(data) && data.length > 0 && (Date.now() - timestamp < cacheTTL)) {
                    renderRepoCards(grid, data);
                    return;
                }
            }
        } catch (_) {}

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

            return fetch(`https://api.github.com/repos/${owner}/${repo}`)
                .then(r => r.ok ? r.json() : fallbackRepo)
                .catch(() => fallbackRepo);
        });

        const results = await Promise.all(fetches);
        const repos = results.filter(Boolean);

        if (repos.length > 0) {
            try {
                sessionStorage.setItem(cacheKey, JSON.stringify({ data: repos, timestamp: Date.now() }));
            } catch (_) {}
        }
        renderRepoCards(grid, repos);
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

        renderRepoCards(grid, fallbackRepos);
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

        html += `<a href="${escapeHTML(repo.html_url)}" target="_blank" rel="noopener noreferrer" class="repo-card${isLead ? ' repo-card--lead' : ''}" aria-label="${escapeHTML(repo.name)}: ${escapeHTML(repo.description || 'No description')}">`;
        html += `<div class="repo-card-media">`;
        html += `<img src="${ogImage}" alt="Preview image for ${escapeHTML(repo.name)}" class="repo-card-image" loading="lazy" referrerpolicy="no-referrer">`;
        html += `<div class="repo-card-fallback" aria-hidden="true"><span>${escapeHTML(repo.full_name)}</span></div>`;
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
async function renderPage(pageData) {
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

    if (pageData.type === 'home') {
        fetchGitHubRepos();
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

    // Editorial Risograph Art Print Frame + Developer Portrait Inset
    html += '<div class="hero-visual">';
    html += '<div class="hero-artwork-frame" id="hero-artwork-frame">';
    html += '<span class="crop-mark crop-tl" aria-hidden="true"></span>';
    html += '<span class="crop-mark crop-tr" aria-hidden="true"></span>';
    html += '<span class="crop-mark crop-bl" aria-hidden="true"></span>';
    html += '<span class="crop-mark crop-br" aria-hidden="true"></span>';
    html += '<div class="hero-artwork-viewport">';
    html += `<img src="${HERO_ARTWORK_PATH}" alt="Swiss modernist architectural print inspired by Linux systems and network topology" class="hero-artwork-img" referrerpolicy="no-referrer">`;
    html += '</div>';
    html += '<div class="hero-portrait-bar">';
    if (hero.image) {
        html += `<img src="${escapeHTML(hero.image)}" alt="Portrait of ${escapeHTML(hero.name || 'the developer')}" class="hero-image" width="56" height="56">`;
    }
    html += '<div class="hero-portrait-caption">';
    html += `<span class="hero-portrait-name">${escapeHTML(hero.name || 'Uzair Shaikh')}</span>`;
    html += '<span class="hero-portrait-meta">Mumbai · Linux &amp; Cybersecurity</span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</section>';

    // Editorial section divider marquee ribbon
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
        html += `<div class="repo-grid" id="repo-grid" data-repos='${JSON.stringify(data.github.repos)}'>`;
        html += '<div class="repo-skeleton" aria-label="Loading repositories">Loading repositories...</div>';
        html += '</div>';
        html += '</section>';
    }

    html += '</div>';
    return html;
}

// Subtle compositor-only 3D tilt on hero artwork frame (respects reduced motion)
function setupHeroArtworkTilt() {
    const frame = document.getElementById('hero-artwork-frame');
    if (!frame) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    frame.addEventListener('pointermove', (e) => {
        const rect = frame.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        frame.style.transform = `perspective(900px) rotateY(${(x * 5).toFixed(2)}deg) rotateX(${(-y * 5).toFixed(2)}deg)`;
    });

    frame.addEventListener('pointerleave', () => {
        frame.style.transform = '';
    });
}

// Helper function to render SVG icons (with in-memory cache)
async function renderSVGIcon(iconPath) {
    if (!iconPath || typeof iconPath !== 'string') return '';

    try {
        if (iconPath.startsWith('res/svg/') && iconPath.endsWith('.svg')) {
            if (svgCache[iconPath]) return svgCache[iconPath];
            const response = await fetch(iconPath);
            if (response.ok) {
                const svgContent = await response.text();
                svgCache[iconPath] = svgContent;
                return svgContent;
            }
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

    // Editorial 2-column intro spread
    html += '<div class="about-spread">';
    if (data.image) {
        html += '<figure class="about-figure">';
        html += `<img src="${escapeHTML(data.image)}" alt="Workspace and tools of Uzair Shaikh" class="about-image" width="600" height="450" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='res/img/guy.png';">`;
        html += '<figcaption class="about-figcaption">Linux development · Cybersecurity · Open-source tooling</figcaption>';
        html += '</figure>';
    }

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
            if (item.icon) {
                const iconContent = await renderSVGIcon(item.icon);
                html += `<div class="svg-icon">${iconContent}</div>`;
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
        for (const skill of data.skills) {
            const levelKey = (skill.level || '').toLowerCase();
            html += `<div class="skill-item" data-skill-level="${escapeHTML(levelKey)}">`;
            html += '<div class="skill-item-head">';
            if (skill.icon) {
                const iconContent = await renderSVGIcon(skill.icon);
                html += `<div class="svg-icon">${iconContent}</div>`;
            }
            html += getSkillLevelBars(skill.level);
            html += '</div>';
            html += `<h4>${escapeHTML(skill.name)}</h4>`;
            if (skill.level) {
                html += `<p class="skill-level-label">${escapeHTML(skill.level)}</p>`;
            }
            html += '</div>';
        }
        html += '</div>';
        html += '</div>';
    }

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

            items.forEach(item => {
                const match = filter === 'all' || item.dataset.skillLevel === filter;
                item.style.display = match ? '' : 'none';
            });
        });
    });
}

// Render Experience Page — Editorial Broadsheet Dossier
function renderExperiencePage(data) {
    let html = '<div class="container page-enter">';
    html += '<section class="section">';
    html += '<div class="page-masthead">';
    html += '<p class="hero-kicker">Track Record · Education · Curriculum Vitae</p>';
    html += `<h1 class="section-title section-title--xl">${escapeHTML(data.title || 'Experience')}</h1>`;
    html += '</div>';

    // Resume dossier banner
    if (data.resume && data.resume.link) {
        html += '<div class="resume-banner">';
        html += '<div class="resume-banner-copy">';
        html += `<h2 class="resume-title">${escapeHTML(data.resume.outsideText || 'Download my Resume')}</h2>`;
        html += '<p class="text-secondary">Formatted PDF edition ready for printing or ATS review.</p>';
        html += '</div>';
        html += '<div class="resume-banner-actions">';
        html += `<a href="${escapeHTML(data.resume.link)}" target="_blank" rel="noopener noreferrer" class="btn resume-download-link">${escapeHTML(data.resume.insideText || 'View Resume')} <span aria-hidden="true">↗</span></a>`;
        html += `<a href="${escapeHTML(data.resume.link)}" download="Uzair_Shaikh_Resume.pdf" class="btn btn-glass">Download PDF</a>`;
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
    html += '<div class="page-masthead">';
    html += '<p class="hero-kicker">Direct Channels · Collaboration</p>';
    html += `<h1 class="section-title section-title--xl">${escapeHTML(data.title || 'Contact')}</h1>`;
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
        html += '<div class="contact-channels">';
        html += '<h2 class="channels-heading">Elsewhere</h2>';
        html += '<div class="social-links social-links--left">';
        for (const link of data.social) {
            const cleanUrl = String(link.url || '').replace(/^mailto:\s+/i, 'mailto:');
            const iconContent = await renderSVGIcon(link.icon);
            html += `<a href="${escapeHTML(cleanUrl)}" target="_blank" rel="noopener noreferrer" title="${escapeHTML(link.name)}" aria-label="Visit ${escapeHTML(link.name)}" class="channel-link">`;
            html += `<span class="svg-icon">${iconContent}</span>`;
            html += `<span>${escapeHTML(link.name)}</span>`;
            html += '</a>';
        }
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
    html += '<div class="page-masthead">';
    html += '<p class="hero-kicker">Academic Archive · Study Notes</p>';
    html += `<h1 class="section-title section-title--xl">${escapeHTML(data.title || 'Resources')}</h1>`;
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

// Setup Footer
async function setupFooter() {
    try {
        const footer = document.getElementById('footer');
        if (globalConfig.footer) {
            let footerHTML = '<div class="container footer-inner">';
            footerHTML += '<div class="footer-top">';
            if (globalConfig.footer.copyright) {
                footerHTML += `<p class="footer-copyright">${escapeHTML(globalConfig.footer.copyright)}</p>`;
            }
            if (globalConfig.footer.links && globalConfig.footer.links.length > 0) {
                footerHTML += '<nav aria-label="Social media links"><div class="social-links footer-social">';
                for (const link of globalConfig.footer.links) {
                    const iconContent = await renderSVGIcon(link.icon);
                    footerHTML += `<a href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHTML(link.name)}" aria-label="Visit ${escapeHTML(link.name)}" class="svg-icon">${iconContent}</a>`;
                }
                footerHTML += '</div></nav>';
            }
            footerHTML += '</div>';
            if (globalConfig.footer.footerNote) {
                footerHTML += `<div class="footer-note">${globalConfig.footer.footerNote}</div>`;
            }
            footerHTML += '</div>';
            footer.innerHTML = footerHTML;
        }
    } catch (error) {
        console.error('Error setting up footer:', error);
    }
}

// Snappy, FOUC-free Preloader (resolves as soon as assets are ready)
function showPreloader() {
    let preloader = document.getElementById('preloader');
    if (!preloader) {
        preloader = document.createElement('div');
        preloader.id = 'preloader';
        preloader.className = 'site-preloader';
        preloader.innerHTML = `
            <div class="preloader-inner">
                <div class="preloader-spinner" aria-hidden="true"></div>
                <span class="preloader-label">Loading portfolio</span>
            </div>
        `;
        document.body.appendChild(preloader);
    }
    preloader.classList.remove('is-hidden');
}

function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.classList.add('is-hidden');
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 260);
    }
}

// Preload assets — fetches all JSONs, images, and SVGs into browser cache
async function preloadAssets() {
    try {
        globalConfig = await loadJSON('data/global.json');
        const assetsToPreload = [];

        if (globalConfig.footer?.links) {
            globalConfig.footer.links.forEach(link => {
                if (link.icon) assetsToPreload.push(link.icon);
            });
        }

        const pageNames = globalConfig.navigation?.menu?.map(m => m.page) || ['home', 'about', 'experience', 'contact', 'resources'];

        const pageResults = await Promise.allSettled(
            pageNames.map(p => loadJSON(`data/pages/${p}.json`))
        );

        for (const result of pageResults) {
            if (result.status !== 'fulfilled') continue;
            const pd = result.value;
            if (pd.hero?.image) assetsToPreload.push(pd.hero.image);
            if (pd.image) assetsToPreload.push(pd.image);
            if (pd.featured) pd.featured.forEach(i => { if (i.icon) assetsToPreload.push(i.icon); });
            if (pd.skills) pd.skills.forEach(s => { if (s.icon) assetsToPreload.push(s.icon); });
            if (pd.social) pd.social.forEach(l => { if (l.icon) assetsToPreload.push(l.icon); });
            if (pd.work) pd.work.forEach(w => { if (w.image) assetsToPreload.push(w.image); });
            if (pd.academic) pd.academic.forEach(a => { if (a.image) assetsToPreload.push(a.image); });
        }

        const unique = [...new Set(assetsToPreload)];
        await Promise.allSettled(unique.map(async (url) => {
            try {
                const resp = await fetch(url);
                if (resp.ok && url.endsWith('.svg')) {
                    svgCache[url] = await resp.text();
                }
            } catch (_) {}
        }));
    } catch (error) {
        console.warn('Asset preloading failed:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.__preloaderStartTime = performance.now();
    if (window.PortfolioThemeEngine) {
        drawerController = window.PortfolioThemeEngine.initDrawer();
    }
    showPreloader();

    try {
        await preloadAssets();
        setupNavigation();

        // Initial page from URL hash (#about, #experience, etc.)
        const initialPage = getPageFromHash();
        await loadPage(initialPage, { scrollToTop: false });

        // Browser back / forward & hash deep-link support
        window.addEventListener('hashchange', () => {
            const target = getPageFromHash();
            if (target !== currentPage) {
                loadPage(target, { scrollToTop: true });
            }
        });
        window.addEventListener('popstate', () => {
            const target = getPageFromHash();
            if (target !== currentPage) {
                loadPage(target, { scrollToTop: true });
            }
        });

        await setupFooter();
    } catch (error) {
        console.error('Error initializing app:', error);
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<div class="container"><div class="loading"><p>Error loading content. Please check your data files.</p></div></div>';
        }
    } finally {
        const minDuration = 280;
        const elapsed = performance.now() - window.__preloaderStartTime;
        const remaining = Math.max(0, minDuration - elapsed);
        setTimeout(() => {
            hidePreloader();
        }, remaining);
    }
});
