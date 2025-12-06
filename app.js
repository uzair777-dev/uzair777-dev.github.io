// Global state
let globalConfig = {};
let currentPage = 'home';

// Initialize the application
async function init() {
    showPreloader();
    try {
        // Load global configuration
        globalConfig = await loadJSON('data/global.json');
        
        // Set up navigation
        setupNavigation();
        
        // Load initial page
        loadPage('home');
        
        // Set up mobile menu toggle
        setupMobileMenu();
        
        // Set up theme toggle
        setupThemeToggle();
        setTheme(getPreferredTheme());
    } catch (error) {
        console.error('Error initializing app:', error);
        document.getElementById('main-content').innerHTML = 
            '<div class="loading"><p>Error loading content. Please check your data files.</p></div>';
        hidePreloader();
    } finally {
        hidePreloader();
    }
}

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

// Render page content
function renderPage(pageData) {
    const mainContent = document.getElementById('main-content');
    let html = '';
    
    // Render based on page type
    switch (pageData.type) {
        case 'home':
            html = renderHomePage(pageData);
            break;
        case 'about':
            html = renderAboutPage(pageData);
            break;
        case 'experience':
            html = renderExperiencePage(pageData);
            break;
        case 'contact':
            html = renderContactPage(pageData);
            break;
        default:
            html = renderGenericPage(pageData);
    }
    
    mainContent.innerHTML = html;
    
    // Setup page-specific interactions
    if (pageData.type === 'contact') {
        setupContactForm();
    }
    
    // Setup CTA buttons
    setupCTAButtons();
}

// Render Home Page
function renderHomePage(data) {
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
        html += `<p style="max-width: 600px; margin: 0 auto;">${data.hero.description}</p>`;
    }
    
    if (data.hero && data.hero.cta) {
        const ctaPage = data.hero.cta.link || 'about';
        html += `<a href="#" class="btn btn-glass" data-cta-page="${ctaPage}" style="display: inline-block; margin-top: 2rem; text-decoration: none;">${data.hero.cta.text || 'Learn More'}</a>`;
    }
    
    html += '</section>';
    
    // Featured skills or projects
    if (data.featured && data.featured.length > 0) {
        html += '<section class="section">';
        html += '<h2 class="section-title">Featured</h2>';
        html += '<div class="skills-grid">';
        data.featured.forEach(item => {
            html += `<div class="skill-item">`;
            if (item.icon) {
                html += `<div style="font-size: 2rem; margin-bottom: 0.5rem;">${item.icon}</div>`;
            }
            html += `<h4>${item.title}</h4>`;
            if (item.description) {
                html += `<p style="font-size: 0.9rem; color: var(--text-light);">${item.description}</p>`;
            }
            html += `</div>`;
        });
        html += '</div>';
        html += '</section>';
    }
    
    html += '</div>';
    return html;
}

// Render About Page
function renderAboutPage(data) {
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
    
    // Skills section
    if (data.skills && data.skills.length > 0) {
        html += '<h2 style="margin-top: 3rem; margin-bottom: 1.5rem;">Skills</h2>';
        html += '<div class="skills-grid">';
        data.skills.forEach(skill => {
            html += `<div class="skill-item">`;
            if (skill.icon) {
                html += `<div style="font-size: 2rem; margin-bottom: 0.5rem;">${skill.icon}</div>`;
            }
            html += `<h4>${skill.name}</h4>`;
            if (skill.level) {
                html += `<p style="font-size: 0.9rem; color: var(--text-light);">${skill.level}</p>`;
            }
            html += `</div>`;
        });
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
        html += '<div style="margin-top: 1rem;">';
        html += '<strong>Technologies: </strong>';
        html += exp.technologies.map(tech => `<span style="background: var(--bg-light); padding: 0.25rem 0.5rem; border-radius: 3px; margin-right: 0.5rem; font-size: 0.9rem;">${tech}</span>`).join('');
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

// Render Contact Page
function renderContactPage(data) {
    let html = '<div class="container">';
    html += '<section class="section">';
    html += `<h1 class="section-title">${data.title || 'Contact'}</h1>`;
    html += '<div class="section-content">';
    
    if (data.description) {
        html += `<p style="text-align: center; margin-bottom: 2rem; color: var(--text-light);">${data.description}</p>`;
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
        data.social.forEach(link => {
            html += `<a href="${link.url}" target="_blank" rel="noopener noreferrer" title="${link.name}">${link.icon || link.name}</a>`;
        });
        html += '</div>';
    }
    
    html += '</div>';
    html += '</section>';
    html += '</div>';
    return html;
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
            alert('Thank you for your message! (This is a demo - form submission is not configured)');
            form.reset();
        });
    }
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
                globalConfig.footer.links.forEach(link => {
                    footerHTML += `<a href="${link.url}" target="_blank" rel="noopener noreferrer" title="${link.name}">${link.icon || link.name}</a>`;
                });
                footerHTML += '</div>';
            }
            footer.innerHTML = footerHTML += "<br>PS: This whole website is genrated on the spot using various clever techniques. 😜 <br> Visit the Github repo for more info.";
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

// Preload assets
async function preloadAssets() {
    if (!globalConfig.preloader?.enabled) {
        return;
    }
    
    const assets = [];
    
    // Preload images from pages
    const pageFiles = ['home', 'about', 'experience', 'contact'];
    for (const page of pageFiles) {
        try {
            const pageData = await loadJSON(`data/pages/${page}.json`);
            if (pageData.hero?.image) {
                assets.push(pageData.hero.image);
            }
            if (pageData.image) {
                assets.push(pageData.image);
            }
            if (pageData.work) {
                pageData.work.forEach(exp => {
                    if (exp.image) assets.push(exp.image);
                });
            }
            if (pageData.academic) {
                pageData.academic.forEach(exp => {
                    if (exp.image) assets.push(exp.image);
                });
            }
        } catch (error) {
            console.warn(`Could not preload assets for ${page}:`, error);
        }
    }
    
    // Preload other assets
    assets.push('styles.css');
    assets.push('app.js');
    
    // Load assets
    const promises = assets.map(asset => {
        return new Promise((resolve, reject) => {
            if (asset.endsWith('.css')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = asset;
                link.onload = resolve;
                link.onerror = reject;
                document.head.appendChild(link);
            } else if (asset.endsWith('.js')) {
                const script = document.createElement('script');
                script.src = asset;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            } else {
                const img = new Image();
                img.onload = resolve;
                img.onerror = reject;
                img.src = asset;
            }
        });
    });
    
    await Promise.allSettled(promises);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.__preloaderStartTime = performance.now();
    showPreloader();
    try {
        // Preload assets first
        await preloadAssets();
        
        // Load global configuration
        globalConfig = await loadJSON('data/global.json');
        
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
