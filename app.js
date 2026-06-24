// Global state
let globalConfig = {};
let currentPage = 'home';
const svgCache = {};

// Load JSON file
async function loadJSON(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.statusText}`);
    }
    return await response.json();
}

// Setup navigation
function setupNavigation() {
    const navLogo = document.getElementById('nav-logo');
    const navMenu = document.getElementById('nav-menu');

    // Set logo text
    if (globalConfig.site && globalConfig.site.logo) {
        navLogo.textContent = globalConfig.site.logo;
    }

    // Build navigation menu
    if (globalConfig.navigation && globalConfig.navigation.menu) {
        navMenu.innerHTML = '';
        globalConfig.navigation.menu.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = item.label;
            a.dataset.page = item.page;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                loadPage(item.page);
            });
            li.appendChild(a);
            navMenu.appendChild(li);
        });

        // Add devLOGS link (separate page, not SPA route)
        const devlogLi = document.createElement('li');
        const devlogA = document.createElement('a');
        devlogA.href = '/devlogs/';
        devlogA.textContent = 'devLOGS';
        devlogLi.appendChild(devlogA);
        navMenu.appendChild(devlogLi);
    }
}

// Setup mobile menu toggle
function setupMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Close menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
}

// Load page content
async function loadPage(pageName) {
    currentPage = pageName;

    try {
        // Update active nav link
        updateActiveNavLink(pageName);

        // Load page-specific JSON
        const pageData = await loadJSON(`data/pages/${pageName}.json`);

        // Render page content
        renderPage(pageData);

        // Update page title
        if (pageData.title && globalConfig.site) {
            document.title = `${pageData.title} - ${globalConfig.site.name}`;
        }
    } catch (error) {
        console.error(`Error loading page ${pageName}:`, error);
        document.getElementById('main-content').innerHTML =
            `<div class="loading"><p>Error loading ${pageName} page. Please check the data file.</p></div>`;
    }
}

// Update active navigation link
function updateActiveNavLink(pageName) {
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Fetch and render GitHub repositories from individual URLs
async function fetchGitHubRepos() {
    const grid = document.getElementById('repo-grid');
    if (!grid) return;

    const repoUrls = JSON.parse(grid.dataset.repos || '[]');
    if (repoUrls.length === 0) return;

    const cacheKey = 'github_repos_' + repoUrls.join(',');
    const cacheTTL = 5 * 60 * 1000; // 5 minutes

    try {
        // Check sessionStorage cache first
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < cacheTTL) {
                renderRepoCards(grid, data);
                return;
            }
        }

        // Parse each URL into owner/repo and fetch individually
        const fetches = repoUrls.map(url => {
            const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
            if (!match) return Promise.resolve(null);
            const [, owner, repo] = match;
            return fetch(`https://api.github.com/repos/${owner}/${repo}`)
                .then(r => r.ok ? r.json() : null)
                .catch(() => null);
        });

        const results = await Promise.all(fetches);
        const repos = results.filter(Boolean);

        // Cache the result
        sessionStorage.setItem(cacheKey, JSON.stringify({ data: repos, timestamp: Date.now() }));
        renderRepoCards(grid, repos);
    } catch (error) {
        console.error('Error fetching GitHub repos:', error);
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;">
                <p class="text-secondary">Unable to load repositories right now.</p>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="btn" style="margin-top:1rem;display:inline-block;text-decoration:none;">Visit GitHub</a>
            </div>`;
    }
}

// Render repo cards into the grid
function renderRepoCards(grid, repos) {
    if (!repos || repos.length === 0) {
        grid.innerHTML = '<p class="text-secondary" style="text-align:center;grid-column:1/-1;">No repositories found.</p>';
        return;
    }

    let html = '';
    for (const repo of repos) {
        const ogImage = `https://opengraph.githubassets.com/1/${repo.full_name}`;
        html += `<a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-card">`;
        html += `<img src="${ogImage}" alt="${repo.name}" class="repo-card-image" loading="lazy">`;
        html += `<div class="repo-card-body">`;
        html += `<h4 class="repo-card-name">${repo.name}</h4>`;
        html += `<p class="repo-card-description">${repo.description || 'No description provided.'}</p>`;
        html += `</div>`;
        html += `</a>`;
    }
    grid.innerHTML = html;
}

// Render page content
async function renderPage(pageData) {
    const mainContent = document.getElementById('main-content');
    let html = '';

    // Render based on page type
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

    // Setup page-specific interactions
    if (pageData.type === 'home') {
        fetchGitHubRepos();
    }
    if (pageData.type === 'contact') {
        setupContactForm();
    }
    if (pageData.type === 'resources') {
        setupResourceButtons();
    }

    // Setup CTA buttons
    setupCTAButtons();
}

// Render Home Page
async function renderHomePage(data) {
    let html = '<div class="container">';
    html += '<section class="hero">';

    if (data.hero && data.hero.image) {
        html += `<img src="${data.hero.image}" alt="${data.hero.name || 'Profile'}" class="hero-image">`;
    }

    if (data.hero && data.hero.name) {
        html += `<h1>${data.hero.name}</h1>`;
    }

    if (data.hero && data.hero.title) {
        html += `<p>${data.hero.title}</p>`;
    }

    if (data.hero && data.hero.description) {
        html += `<p class="hero-description">${data.hero.description}</p>`;
    }

    if (data.hero && data.hero.cta) {
        const ctaPage = data.hero.cta.link || 'about';
        html += `<a href="#" class="btn btn-glass hero-cta" data-cta-page="${ctaPage}">${data.hero.cta.text || 'Learn More'}</a>`;
    }

    html += '</section>';

    // Featured GitHub Repositories (dynamic)
    if (data.github && data.github.repos && data.github.repos.length > 0) {
        html += '<section class="section">';
        html += '<h2 class="section-title">Featured Repositories</h2>';
        html += `<div class="repo-grid" id="repo-grid" data-repos='${JSON.stringify(data.github.repos)}'>`;
        html += '<p class="text-secondary" style="text-align:center;grid-column:1/-1;">Loading repositories...</p>';
        html += '</div>';
        html += '</section>';
    }

    html += '</div>';
    return html;
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

// Render About Page
async function renderAboutPage(data) {
    let html = '<div class="container">';
    html += '<section class="section">';
    html += `<h1 class="section-title">${data.title || 'About'}</h1>`;
    html += '<div class="section-content">';

    if (data.image) {
        html += `<img src="${data.image}" alt="About" class="about-image">`;
    }

    if (data.content) {
        if (Array.isArray(data.content)) {
            data.content.forEach(paragraph => {
                html += `<p class="about-content">${paragraph}</p>`;
            });
        } else {
            html += `<p class="about-content">${data.content}</p>`;
        }
    }

    // Featured soft-skills section (relocated from home)
    if (data.featured && data.featured.length > 0) {
        html += '<h2 class="skills-heading">What I Bring</h2>';
        html += '<div class="skills-grid">';
        for (const item of data.featured) {
            html += `<div class="skill-item">`;
            if (item.icon) {
                const iconContent = await renderSVGIcon(item.icon);
                html += `<div class="svg-icon">${iconContent}</div>`;
            }
            html += `<h4>${item.title}</h4>`;
            if (item.description) {
                html += `<p class="text-secondary">${item.description}</p>`;
            }
            html += `</div>`;
        }
        html += '</div>';
    }

    // Skills section
    if (data.skills && data.skills.length > 0) {
        html += '<h2 class="skills-heading">Skills</h2>';
        html += '<div class="skills-grid">';
        for (const skill of data.skills) {
            html += `<div class="skill-item">`;
            if (skill.icon) {
                const iconContent = await renderSVGIcon(skill.icon);
                html += `<div class="svg-icon">${iconContent}</div>`;
            }
            html += `<h4>${skill.name}</h4>`;
            if (skill.level) {
                html += `<p class="text-secondary">${skill.level}</p>`;
            }
            html += `</div>`;
        }
        html += '</div>';
    }

    html += '</div>';
    html += '</section>';
    html += '</div>';
    return html;
}

// Render Experience Page (timeline layout similar to referenced portfolio)
function renderExperiencePage(data) {
    let html = '<div class="container">';
    html += '<section class="section">';
    html += `<h1 class="section-title">${data.title || 'Experience'}</h1>`;

    // Resume button at the top
    if (data.resume && data.resume.link) {
        html += '<div class="resume-wrapper">';
        html += '<div class="experience-card">';
        html += `<h3 class="resume-title">${data.resume.outsideText || 'Download my Resume'}</h3>`;
        html += `<a href="${data.resume.link}" target="_blank" class="btn resume-download-link">`;
        html += `${data.resume.insideText || 'Download Resume'}`;
        html += '</a>';
        html += '</div>';
        html += '</div>';
    }

    // Work Experience timeline (includes "Looking for Work" as first item)
    if (data.work && data.work.length > 0) {
        html += '<h2 class="experience-subtitle">Work Experience</h2>';
        html += '<div class="experience-timeline">';
        data.work.forEach(exp => {
            html += '<div class="experience-timeline-item">';
            html += renderExperienceCard(exp);
            html += '</div>';
        });
        html += '</div>';
    }

    // Education timeline
    if (data.academic && data.academic.length > 0) {
        html += '<h2 class="experience-subtitle">Education</h2>';
        html += '<div class="experience-timeline">';
        data.academic.forEach(exp => {
            html += '<div class="experience-timeline-item">';
            html += renderExperienceCard(exp);
            html += '</div>';
        });
        html += '</div>';
    }

    html += '</section>';
    html += '</div>';
    return html;
}

// Render Experience Card (used inside timeline items)
function renderExperienceCard(exp) {
    let html = '<div class="experience-card">';
    html += `<h3>${exp.title || 'Position'}</h3>`;

    if (exp.company || exp.institution) {
        html += `<p class="company">${exp.company || exp.institution}</p>`;
    }

    if (exp.duration) {
        html += `<p class="duration">${exp.duration}</p>`;
    }

    if (exp.location) {
        html += `<p class="duration">📍 ${exp.location}</p>`;
    }

    if (exp.description) {
        if (Array.isArray(exp.description)) {
            html += '<ul>';
            exp.description.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += '</ul>';
        } else {
            html += `<p class="description">${exp.description}</p>`;
        }
    }

    if (exp.technologies && Array.isArray(exp.technologies)) {
        html += '<div class="tech-tags">';
        html += '<strong>Technologies: </strong>';
        html += exp.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('');
        html += '</div>';
    }

    html += '</div>';
    return html;
}

// Render Contact Page
async function renderContactPage(data) {
    let html = '<div class="container">';
    html += '<section class="section">';
    html += `<h1 class="section-title">${data.title || 'Contact'}</h1>`;
    html += '<div class="section-content">';

    if (data.description) {
        html += `<p class="description-centered">${data.description}</p>`;
    }

    html += '<div class="contact-form">';
    html += '<form id="contact-form">';

    if (data.form && data.form.fields) {
        data.form.fields.forEach(field => {
            html += '<div class="form-group">';
            html += `<label for="${field.name}">${field.label}</label>`;
            if (field.type === 'textarea') {
                html += `<textarea id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}></textarea>`;
            } else {
                html += `<input type="${field.type || 'text'}" id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>`;
            }
            html += '</div>';
        });
    }

    html += '<button type="submit" class="btn">Send Message</button>';
    html += '</form>';
    html += '</div>';

    // Social links
    if (data.social && data.social.length > 0) {
        html += '<div class="social-links">';
        for (const link of data.social) {
            const iconContent = await renderSVGIcon(link.icon);
            html += `<a href="${link.url}" target="_blank" rel="noopener noreferrer" title="${link.name}" class="svg-icon">${iconContent}</a>`;
        }
        html += '</div>';
    }

    html += '</div>';
    html += '</section>';
    html += '</div>';
    return html;
}

// Render Resources Page
function renderResourcesPage(data) {
    let html = '<div class="container">';
    html += '<section class="section">';
    html += `<h1 class="section-title">${data.title || 'Resources'}</h1>`;
    const note1 = data.note1;
    html += '<p class="note-text"><center>'
    html += note1;
    html += '</center></p>';
    html += '<div class="section-content">';

    if (data.description) {
        html += `<p class="description-centered">${data.description}</p>`;
    }

    // Semester buttons vertical layout
    if (data.folders && data.folders.length > 0) {
        html += '<div class="resources-vertical">';

        data.folders.forEach(folder => {
            // Extract folder ID from Google Drive link
            const folderId = extractGoogleDriveFolderId(folder.link);

            html += '<div class="resource-item">';
            html += `<h3 class="resource-item-title">${folder.text}</h3>`;
            html += `<button class="btn btn-resource" data-folder-id="${folderId}">`;
            html += `View ${folder.text} Resources`;
            html += '</button>';
            html += '</div>';
        });

        html += '</div>';
    }

    html += '</div>';
    const note2 = data.note2;
    html += '<p class="note-text"><center>'
    html += note2;
    html += '</center></p>';
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
    let html = '<div class="container">';
    html += '<section class="section">';
    html += `<h1 class="section-title">${data.title || 'Page'}</h1>`;
    html += '<div class="section-content">';

    if (data.content) {
        if (Array.isArray(data.content)) {
            data.content.forEach(item => {
                if (item.type === 'paragraph') {
                    html += `<p>${item.text}</p>`;
                } else if (item.type === 'heading') {
                    html += `<h${item.level || 2}>${item.text}</h${item.level || 2}>`;
                }
            });
        } else {
            html += `<p>${data.content}</p>`;
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
            loadPage(page);
        });
    });
}

// Setup Contact Form
function setupContactForm() {
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Get form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            // In a real application, you would send this to a server
            // For now, we'll just show an alert
            alert('Thank you for your message! (This is a stub form submission is not configured, imma do it later, hopefully)');
            form.reset();
        });
    }
}

// Setup Resource Buttons
function setupResourceButtons() {
    const resourceButtons = document.querySelectorAll('.btn-resource');
    let currentPopup = null;

    resourceButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const folderId = button.getAttribute('data-folder-id');
            const semesterText = button.textContent.replace('View ', '').replace('Hide ', '').replace(' Resources', '');

            // Close any existing popup
            if (currentPopup) {
                currentPopup.remove();
                currentPopup = null;
            }

            // Create exclusive popup iframe
            currentPopup = document.createElement('div');
            currentPopup.id = 'exclusive-resource-popup';
            currentPopup.className = 'resource-popup';

            // Create popup content container
            const popupContent = document.createElement('div');
            popupContent.className = 'resource-popup-content';

            // Create close button
            const closeButton = document.createElement('button');
            closeButton.textContent = '×';
            closeButton.className = 'resource-popup-close';

            closeButton.addEventListener('click', () => {
                currentPopup.remove();
                currentPopup = null;
            });

            // Create title
            const popupTitle = document.createElement('h2');
            popupTitle.textContent = `${semesterText} Resources`;
            popupTitle.className = 'resource-popup-title';

            // Create iframe container
            const iframeContainer = document.createElement('div');
            iframeContainer.className = 'resource-popup-iframe';

            // Create iframe without sandboxing for full Google Drive functionality
            const iframe = document.createElement('iframe');
            iframe.src = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
            iframe.allow = 'fullscreen; clipboard-read; clipboard-write';
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';

            // Add load event listener for better user experience
            iframe.addEventListener('load', function () {
                console.log('Google Drive iframe loaded successfully');
            });

            iframe.addEventListener('error', function () {
                console.error('Error loading Google Drive iframe');
                iframeContainer.innerHTML = `
                    <div style="padding: 2rem; text-align: center; color: var(--text-color);">
                        <h3>Unable to load Google Drive content</h3>
                        <p>There was an error loading the resources. Please try again later.</p>
                        <p class="text-secondary" style="margin-top: 1rem;">
                            If this issue persists, you may need to check your browser settings or try a different browser.
                        </p>
                        <button class="btn" style="margin-top: 1rem;"
                                onclick="window.open('https://drive.google.com/drive/folders/${folderId}', '_blank')">
                            Open in Google Drive
                        </button>
                    </div>
                `;
            });

            iframeContainer.appendChild(iframe);

            // Assemble popup
            popupContent.appendChild(closeButton);
            popupContent.appendChild(popupTitle);
            popupContent.appendChild(iframeContainer);
            currentPopup.appendChild(popupContent);

            // Add click outside to close
            currentPopup.addEventListener('click', (e) => {
                if (e.target === currentPopup) {
                    currentPopup.remove();
                    currentPopup = null;
                }
            });

            // Add to body
            document.body.appendChild(currentPopup);
        });
    });
}

// Setup Footer
async function setupFooter() {
    try {
        const footer = document.getElementById('footer');
        if (globalConfig.footer) {
            let footerHTML = '';
            if (globalConfig.footer.copyright) {
                footerHTML += `<p>${globalConfig.footer.copyright}</p>`;
            }
            if (globalConfig.footer.links && globalConfig.footer.links.length > 0) {
                footerHTML += '<div class="social-links">';
                for (const link of globalConfig.footer.links) {
                    const iconContent = await renderSVGIcon(link.icon);
                    footerHTML += `<a href="${link.url}" target="_blank" rel="noopener noreferrer" title="${link.name}" class="svg-icon">${iconContent}</a>`;
                }
                footerHTML += '</div>';
            }
            footerHTML += globalConfig.footer.footerNote;
            footer.innerHTML = footerHTML;
        }
    } catch (error) {
        console.error('Error setting up footer:', error);
    }
}

// Theme functions
function getPreferredTheme() {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
        return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme) {
    if (theme === 'auto') {
        const autoTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', autoTheme);
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('theme', theme);
    updateActiveThemeButton(theme);
}

function updateActiveThemeButton(theme) {
    const buttons = document.querySelectorAll('.theme-option');
    buttons.forEach(button => {
        button.classList.remove('active');
        if (button.dataset.theme === theme) {
            button.classList.add('active');
        }
    });
}

function setupThemeToggle() {
    const themeButtons = document.querySelectorAll('.theme-option');
    themeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const theme = e.currentTarget.dataset.theme;
            setTheme(theme);
        });
    });

    // Watch for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem('theme') === 'auto') {
            setTheme('auto');
        }
    });
}

// Preloader functions
function showPreloader() {
    let preloader = document.getElementById('preloader');
    if (!preloader) {
        preloader = document.createElement('div');
        preloader.id = 'preloader';
        preloader.style.position = 'fixed';
        preloader.style.top = '0';
        preloader.style.left = '0';
        preloader.style.width = '100%';
        preloader.style.height = '100%';
        preloader.style.backgroundColor = 'var(--preloader-bg)';
        preloader.style.display = 'flex';
        preloader.style.justifyContent = 'center';
        preloader.style.alignItems = 'center';
        preloader.style.zIndex = '9999';

        if (!document.getElementById('preloader-styles')) {
            const style = document.createElement('style');
            style.id = 'preloader-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.3; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1); }
                }
                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }

        const preloaderContent = document.createElement('div');
        preloaderContent.style.textAlign = 'center';

        const spinner = document.createElement('div');
        spinner.style.border = '4px solid rgba(255, 255, 255, 0.3)';
        spinner.style.borderRadius = '50%';
        spinner.style.borderTop = '4px solid var(--primary)';
        spinner.style.width = '40px';
        spinner.style.height = '40px';

        // Use custom animation from config or default to 'spin'
        const animation = globalConfig.preloader?.customAnimation || 'spin';
        const duration = (globalConfig.preloader?.duration || 2000) / 1000;
        spinner.style.animation = `${animation} ${duration}s linear infinite`;

        // Add animationend event to hide preloader when animation completes
        spinner.addEventListener('animationend', () => {
            const preloader = document.getElementById('preloader');
            if (preloader) {
                preloader.style.display = 'none';
            }
        });

        const text = document.createElement('div');
        text.textContent = 'Loading...';
        text.style.marginTop = '1rem';
        text.style.color = 'var(--text-primary)';

        preloaderContent.appendChild(spinner);
        preloaderContent.appendChild(text);
        preloader.appendChild(preloaderContent);
        document.body.appendChild(preloader);
    }
    preloader.style.display = 'flex';
}

function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.display = 'none';
    }
}

// Preload assets — fetches all JSONs, images, and SVGs into browser cache
async function preloadAssets() {
    try {
        // 1. Load global config first (needed by rest of app)
        globalConfig = await loadJSON('data/global.json');

        const assetsToPreload = [];

        // 2. Collect footer SVG icons
        if (globalConfig.footer?.links) {
            globalConfig.footer.links.forEach(link => {
                if (link.icon) assetsToPreload.push(link.icon);
            });
        }

        // 3. Determine page names from navigation config
        const pageNames = globalConfig.navigation?.menu?.map(m => m.page) || ['home', 'about', 'experience', 'contact', 'resources'];

        // 4. Fetch all page JSONs in parallel and collect image/SVG paths
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

        // 5. Deduplicate and preload all assets (SVGs also go into in-memory cache)
        const unique = [...new Set(assetsToPreload)];
        await Promise.allSettled(unique.map(async (url) => {
            try {
                const resp = await fetch(url);
                if (resp.ok && url.endsWith('.svg')) {
                    svgCache[url] = await resp.text();
                }
            } catch (_) { }
        }));
    } catch (error) {
        console.warn('Asset preloading failed:', error);
    }
}

// Relocate theme toggle based on viewport size
function handleResponsiveThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navContainer = document.querySelector('.nav-container');
    const hamburger = document.getElementById('hamburger');

    if (!themeToggle || !navMenu || !navContainer || !hamburger) return;

    if (window.innerWidth <= 768) {
        // Move to nav-menu if not already there
        if (themeToggle.parentElement !== navMenu) {
            let li = document.getElementById('mobile-theme-toggle-container');
            if (!li) {
                li = document.createElement('li');
                li.id = 'mobile-theme-toggle-container';
                li.style.display = 'flex';
                li.style.justifyContent = 'center';
                li.style.marginTop = '1rem';
                li.style.paddingBottom = '1rem';
            }
            li.appendChild(themeToggle);
            navMenu.appendChild(li);
        }
    } else {
        // Move back to nav container if not already there
        if (themeToggle.parentElement !== navContainer) {
            const li = document.getElementById('mobile-theme-toggle-container');
            if (li) {
                li.remove();
            }
            navContainer.insertBefore(themeToggle, hamburger);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.__preloaderStartTime = performance.now();
    showPreloader();
    try {
        // Preload all assets and set globalConfig
        await preloadAssets();

        // Set up navigation
        setupNavigation();

        // Load initial page
        loadPage('home');

        // Set up mobile menu toggle
        setupMobileMenu();

        // Set up theme toggle
        setupThemeToggle();
        setTheme(getPreferredTheme());

        // Setup footer
        await setupFooter();

        // Setup responsive theme toggle
        window.addEventListener('resize', handleResponsiveThemeToggle);
        handleResponsiveThemeToggle();
    } catch (error) {
        console.error('Error initializing app:', error);
        document.getElementById('main-content').innerHTML =
            '<div class="loading"><p>Error loading content. Please check your data files.</p></div>';
    } finally {
        // Ensure preloader is hidden after minimum duration
        const minDuration = globalConfig.preloader?.duration || 2000;
        const elapsed = performance.now() - window.__preloaderStartTime;
        const remaining = Math.max(0, minDuration - elapsed);

        setTimeout(() => {
            hidePreloader();
        }, remaining);
    }
});
