import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const siteRoot = rootDir;

function readJson(relPath: string) {
  const fullPath = path.join(siteRoot, relPath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

test('global.json and all navigation page JSON files exist and are valid', () => {
  const globalCfg = readJson('data/global.json');
  assert.equal(globalCfg.site.logo, 'Portfolio');
  assert.ok(Array.isArray(globalCfg.navigation.menu));
  assert.equal(globalCfg.navigation.menu.length, 5);

  for (const item of globalCfg.navigation.menu) {
    const pageJson = readJson(`data/pages/${item.page}.json`);
    assert.equal(pageJson.type, item.page);
  }
});

test('contact.json mailto URL has no malformed leading space and experience.json uses clear resume labels', () => {
  const contact = readJson('data/pages/contact.json');
  const emailEntry = contact.social.find((s: {name: string}) => s.name === 'Email');
  assert.ok(emailEntry, 'Expected Email social entry');
  assert.equal(emailEntry.url, 'mailto:uzairshaikhking777@gmail.com');

  const experience = readJson('data/pages/experience.json');
  assert.equal(experience.resume.insideText, 'Preview PDF');
  assert.equal(experience.resume.outsideText, 'Want a formatted PDF of my Resume?');
});

test('all referenced local images, SVGs, resume, generated artwork, and glitch fonts exist', () => {
  const globalCfg = readJson('data/global.json');
  const home = readJson('data/pages/home.json');
  const about = readJson('data/pages/about.json');
  const experience = readJson('data/pages/experience.json');
  const contact = readJson('data/pages/contact.json');

  const publicAssets: string[] = [];
  for (const link of globalCfg.footer.links) publicAssets.push(link.icon);
  if (home.hero?.image) publicAssets.push(home.hero.image);
  for (const feat of about.featured) publicAssets.push(feat.icon);
  for (const skill of about.skills) publicAssets.push(skill.icon);
  if (experience.resume?.link) publicAssets.push(experience.resume.link.replace(/^\//, ''));
  for (const link of contact.social) publicAssets.push(link.icon);

  const fontFiles = [
    'data/fonts/font-0.ttf',
    'data/fonts/font-1.ttf',
    'data/fonts/font-2.otf',
    'data/fonts/font-3.otf',
    'data/fonts/font-4.ttf',
    'data/fonts/font-5.ttf',
    'data/fonts/font-6.otf',
  ];
  publicAssets.push(...fontFiles);

  for (const rel of publicAssets) {
    const full = path.join(siteRoot, rel);
    assert.equal(fs.existsSync(full), true, `Missing asset in public/: ${rel}`);
  }
});

test('app.js avoids window.alert, invalid <center> nesting, uses theme-reactive SVGs, and includes silent a11y easter eggs', () => {
  const appSource = fs.readFileSync(path.join(siteRoot, 'app.js'), 'utf-8');
  assert.equal(/\balert\s*\(/.test(appSource), false, 'app.js should not call window.alert()');
  assert.equal(appSource.includes('<center>'), false, 'app.js should not output invalid <center> tags');
  assert.ok(appSource.includes('hashchange'), 'app.js should listen to hashchange for SPA routing');
  assert.ok(appSource.includes('getPageFromHash'), 'app.js should resolve routes from location.hash');

  // Theme-adaptive SVGs across Home, About, Experience, Contact, and Resources
  assert.ok(appSource.includes('buildHeroArtworkSVG'), 'app.js must render theme-reactive SVG on Home');
  assert.ok(appSource.includes('buildAboutArtworkSVG'), 'app.js must render theme-reactive SVG on About');
  assert.ok(appSource.includes('buildExperienceArtworkSVG'), 'app.js must render theme-reactive SVG on Experience');
  assert.ok(appSource.includes('buildContactArtworkSVG'), 'app.js must render theme-reactive SVG on Contact');
  assert.ok(appSource.includes('buildResourcesArtworkSVG'), 'app.js must render theme-reactive SVG on Resources');
  assert.ok(appSource.includes('REV · 2027'), 'About SVG should show REV · 2027');
  assert.equal(appSource.includes('hero_cyber_jade_artwork'), false, 'app.js must not reference removed AI raster hero image');
  assert.equal(appSource.includes('about_cyber_desk'), false, 'app.js must not reference removed AI raster about image');

  // Performance: promise deduplication, non-blocking startup, hover/idle prefetch, portable solar loaders, pastel SPA route transitions
  assert.ok(appSource.includes('jsonPromises'), 'app.js should deduplicate concurrent JSON fetches');
  assert.ok(appSource.includes('svgPromises'), 'app.js should deduplicate concurrent SVG fetches');
  assert.ok(appSource.includes('scheduleBackgroundPrefetch'), 'app.js should prefetch non-active routes after first paint');
  assert.ok(appSource.includes('buildSolarLoaderMarkup'), 'app.js should use time-synced solar loaders');
  assert.ok(appSource.includes('ensureRouteCurtain') && appSource.includes('applyRouteStagger'), 'app.js should drive pastel curtain route transitions with staggered card reveal');

  // Silent accessibility & sweet hidden screen-reader easter eggs
  assert.ok(appSource.includes('HIDDEN_POCKET_NOTES'), 'app.js must include hidden screen-reader pocket notes');
  assert.ok(appSource.includes('secret-a11y-egg'), 'app.js must include focus-only easter egg button in footer');
  assert.ok(appSource.includes('announceA11y'), 'app.js must announce route/action updates politely');
});

test('copyright is updated to 2027 across portfolio and 404', () => {
  const globalCfg = readJson('data/global.json');
  const html404 = fs.readFileSync(path.join(rootDir, '404.html'), 'utf-8');
  assert.ok(String(globalCfg.footer.copyright).includes('2027'), 'global.json copyright must be 2027');
  assert.ok(html404.includes('2027'), '404.html copyright must be 2027');
});

test('devlogs/index.js routes back to main portfolio sections via hash links, uses solar loader, and avoids blocking on glitch fonts', () => {
  const devlogsJs = fs.readFileSync(path.join(rootDir, 'devlogs/index.js'), 'utf-8');
  assert.ok(devlogsJs.includes('/#${item.page}'), 'devlogs nav should link directly to /#page sections');
  assert.ok(devlogsJs.includes('devlog-search'), 'devlogs should include search input');
  assert.ok(devlogsJs.includes('reading-progress-bar'), 'devlogs reader should include reading progress bar');
  assert.ok(devlogsJs.includes('closeOverlay(false)'), 'hashchange should close overlay when hash is cleared');
  assert.ok(devlogsJs.includes('mountSolarLoader'), 'devlogs should mount portable solar loader');
  assert.equal(devlogsJs.includes('await loadGlitchFonts()'), false, 'devlogs must not block XML render on glitch fonts');
  assert.equal(devlogsJs.includes('Math.max(0.08'), false, 'devlogs glitch speed must never exceed 3Hz seizure threshold');
  assert.ok(devlogsJs.includes('Math.max(0.85'), 'devlogs glitch speed must stay calmly below 1.2Hz');
});

test('devlogs/logs.xml exists and contains valid feed items', () => {
  const xmlPath = path.join(siteRoot, 'devlogs/logs.xml');
  assert.equal(fs.existsSync(xmlPath), true);
  const xml = fs.readFileSync(xmlPath, 'utf-8');
  assert.ok(xml.includes('<feed') && xml.includes('<channel>'));
  const itemMatches = xml.match(/<item>/g) || [];
  assert.ok(itemMatches.length > 0, 'Expected at least one <item> in devlogs/logs.xml');
});

test('all multi-page HTML entry points use semantic button hamburgers, burger drawers, decorative SVGs, preloads, and lean fonts', () => {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const devlogsHtml = fs.readFileSync(path.join(rootDir, 'devlogs/index.html'), 'utf-8');
  const html404 = fs.readFileSync(path.join(rootDir, '404.html'), 'utf-8');
  const editorHtml = fs.readFileSync(path.join(rootDir, 'devlogs/editor.html'), 'utf-8');

  assert.ok(indexHtml.includes('Bricolage+Grotesque'), 'index.html should load Bricolage Grotesque');
  assert.ok(devlogsHtml.includes('Bricolage+Grotesque'), 'devlogs/index.html should load Bricolage Grotesque');
  assert.ok(editorHtml.includes('Bricolage+Grotesque'), 'devlogs/editor.html should load Bricolage Grotesque');
  assert.equal(indexHtml.includes('Instrument+Serif'), false, 'index.html should drop unused Instrument Serif font');
  assert.equal(devlogsHtml.includes('Instrument+Serif'), false, 'devlogs/index.html should drop unused Instrument Serif font');
  assert.equal(html404.includes('Instrument+Serif'), false, '404.html should drop unused Instrument Serif font');

  assert.ok(indexHtml.includes('rel="preload" href="/data/global.json"'), 'index.html should preload global.json');
  assert.ok(devlogsHtml.includes('rel="preload" href="/devlogs/logs.xml"'), 'devlogs/index.html should preload logs.xml');

  assert.ok(devlogsHtml.includes('DEVLOGS.XML'), 'devlogs/index.html should render decorative theme-reactive SVG');
  assert.ok(html404.includes('ROUTE.NULL'), '404.html should render decorative theme-reactive SVG');

  assert.ok(/<button[^>]*class="hamburger"/.test(devlogsHtml), 'devlogs hamburger must be a semantic <button>');
  assert.ok(indexHtml.includes('id="burger-drawer"'), 'index.html must include unified burger drawer');
  assert.ok(devlogsHtml.includes('id="burger-drawer"'), 'devlogs/index.html must include unified burger drawer');
  assert.ok(indexHtml.includes('id="a11y-announcer"'), 'index.html must include polite ARIA live announcer');
  assert.ok(devlogsHtml.includes('id="a11y-announcer"'), 'devlogs/index.html must include polite ARIA live announcer');
  assert.ok(indexHtml.includes('id="nav-theme-slot"'), 'index.html must mount desktop dark-mode toggle directly in navbar');
  assert.ok(devlogsHtml.includes('id="nav-theme-slot"'), 'devlogs/index.html must mount desktop dark-mode toggle directly in navbar');
  assert.equal(indexHtml.includes('drawer-close-btn'), false, 'index.html must not render duplicate X close button inside burger drawer');
  assert.equal(devlogsHtml.includes('drawer-close-btn'), false, 'devlogs/index.html must not render duplicate X close button inside burger drawer');
  assert.equal(html404.includes('drawer-close-btn'), false, '404.html must not render duplicate X close button inside burger drawer');
  assert.equal(editorHtml.includes('drawer-close-btn'), false, 'devlogs/editor.html must not render duplicate X close button');
  assert.equal(editorHtml.includes('--accent-gradient'), false, 'devlogs/editor.html must not reference removed --accent-gradient');
  assert.ok(editorHtml.includes('escapeCdata'), 'devlogs/editor.html should sanitize ]]> inside CDATA');
  assert.ok(editorHtml.includes('[\\s\\S]*?'), 'devlogs/editor.html should support multi-line custom tags');
});

test('styles.css defines 4 solar palettes, vertical burger list, animated sky switch, GPU solar loaders, // prefixes, milestone timeline, and perf optimizations', () => {
  const css = fs.readFileSync(path.join(siteRoot, 'styles.css'), 'utf-8');
  const devlogsCss = fs.readFileSync(path.join(siteRoot, 'devlogs/styles.css'), 'utf-8');
  const appSource = fs.readFileSync(path.join(siteRoot, 'app.js'), 'utf-8');

  assert.ok(css.includes('--accent-2:'), 'styles.css should define secondary pastel cyber accent (--accent-2)');
  assert.equal(css.includes('--border-color: #3a3833'), false, 'dark-mode border must not use low-visibility #3a3833');
  assert.equal(css.includes('background-attachment: fixed'), false, 'styles.css should avoid scroll-repainting background-attachment: fixed');
  assert.equal(css.includes('content-visibility: auto'), false, 'styles.css must not use paint-clipping content-visibility: auto on extruded card grids');
  assert.equal(devlogsCss.includes('content-visibility: auto'), false, 'devlogs/styles.css must not clip extruded card shadows with content-visibility: auto');

  for (const palette of ['dawn', 'noon', 'dusk', 'night']) {
    assert.ok(css.includes(`:root[data-palette="${palette}"]`), `Missing :root-scoped light solar palette tokens for ${palette}`);
    assert.ok(css.includes(`:root[data-theme="dark"][data-palette="${palette}"]`), `Missing :root-scoped dark solar palette tokens for ${palette}`);
  }

  // Zero clipped diagonal offset shadows
  assert.equal(/\d+px\s+\d+px\s+0px/.test(css), false, 'styles.css should not use diagonal offset shadows that clip corners');
  assert.equal(/\d+px\s+\d+px\s+0px/.test(devlogsCss), false, 'devlogs/styles.css should not use diagonal offset shadows that clip corners');
  assert.ok(css.includes('--btn-extrude:'), 'styles.css should define solid vertical button extrusion token');

  // Burger menu nav is a vertical list (not a 2-col grid) + animated sky diorama toggle
  const drawerListBlock = css.slice(css.indexOf('.drawer-nav-list {'), css.indexOf('.drawer-nav-list a {'));
  assert.ok(drawerListBlock.includes('flex-direction: column'), '.drawer-nav-list should render as a vertical list');
  assert.equal(drawerListBlock.includes('grid-template-columns'), false, '.drawer-nav-list must not be a 2-column grid');
  assert.ok(css.includes('.sky-toggle') && css.includes('.sky-eclipse-cut') && css.includes('.sky-shooting-star'), 'styles.css should define animated sky diorama switch styles');

  // Solar loader animations
  assert.ok(css.includes('.solar-loader') && css.includes('@keyframes slDawnRise') && css.includes('@keyframes slEqBounce'), 'styles.css should define GPU animations for solar loaders');

  // Pastel // heading prefixes
  assert.ok(css.includes("content: '// '"), 'styles.css should render // prefixes on headings');
  assert.ok(devlogsCss.includes("content: '// '"), 'devlogs/styles.css should render // prefixes on headings');

  // Connected vertical milestone timeline
  assert.ok(css.includes('.experience-timeline::before'), 'styles.css should draw vertical timeline spine');
  assert.ok(css.includes('.timeline-dot'), 'styles.css should style timeline milestone dots');
  assert.ok(appSource.includes('timeline-marker') && appSource.includes('timeline-dot'), 'app.js should emit timeline milestone nodes');
});

test('theme-engine.js resolves solar palettes, builds 4 custom solar loaders, and renders animated sky switch without palette pickers', async () => {
  const vm = await import('node:vm');
  const engineCode = fs.readFileSync(path.join(siteRoot, 'theme-engine.js'), 'utf-8');
  const css = fs.readFileSync(path.join(siteRoot, 'styles.css'), 'utf-8');
  const sandbox: Record<string, unknown> = { module: { exports: {} }, URL };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(engineCode, sandbox);
  const api = (sandbox.module as { exports: Record<string, any> }).exports;
  const validIds = new Set(api.PALETTES);

  assert.equal(validIds.size, 4);

  // Solar clock across all 24 hours
  for (let h = 0; h < 24; h++) {
    const palette = api.resolvePaletteFromClock(h);
    assert.ok(validIds.has(palette), `Clock hour ${h} returned invalid palette ${palette}`);
  }
  assert.equal(api.resolvePaletteFromClock(7), 'dawn');   // Sunrise
  assert.equal(api.resolvePaletteFromClock(13), 'noon');  // Midday warm sunlight
  assert.equal(api.resolvePaletteFromClock(18), 'dusk');  // Golden hour sunset
  assert.equal(api.resolvePaletteFromClock(23), 'night'); // Late night moonlit
  assert.equal(api.resolvePaletteFromClock(2), 'night');

  // Sweet hidden greeting + distinct custom solar loader SVG exist for every solar phase
  const seenSvgs = new Set<string>();
  for (const phase of ['dawn', 'noon', 'dusk', 'night']) {
    const meta = api.getSolarMeta(phase);
    assert.ok(meta.greeting.length > 40, `Expected warm hidden greeting for ${phase}`);
    const loaderMeta = api.getSolarLoaderMeta(phase);
    assert.ok(loaderMeta.caption.startsWith('// '), `Expected // caption for ${phase} loader`);
    const markup = api.buildSolarLoaderMarkup({ phase });
    assert.ok(markup.includes(`data-solar-loader="${phase}"`), `Expected phase marker for ${phase}`);
    assert.ok(markup.includes(`solar-loader-svg--${phase}`), `Expected distinct SVG class for ${phase}`);
    seenSvgs.add(api.buildSolarLoaderSVG(phase));
  }
  assert.equal(seenSvgs.size, 4, 'All 4 solar phases must render distinct custom loader SVGs');

  // Ensure palette chooser & auto-theme sensor controls remain absent from drawer UI
  assert.equal(engineCode.includes('palette-grid'), false, 'theme-engine.js must not render palette picker UI');
  assert.equal(engineCode.includes('driver-grid'), false, 'theme-engine.js must not render auto-theme sensor UI');
  assert.equal(engineCode.includes('Auto-Theme Sensor'), false, 'theme-engine.js must not include Auto-Theme Sensor label');
  assert.equal(css.includes('.palette-grid'), false, 'styles.css must not keep dead .palette-grid rules');
  assert.equal(css.includes('.driver-grid'), false, 'styles.css must not keep dead .driver-grid rules');

  // Animated sky diorama switch + glitch-free bi-directional pinhole iris zoom transition
  assert.ok(engineCode.includes('role="switch"') && engineCode.includes('class="sky-toggle') && engineCode.includes('sky-toggle--compact'), 'Drawer and desktop navbar must render animated sky diorama switch');
  assert.ok(engineCode.includes('startViewTransition') && engineCode.includes('spawnIrisHaloRing'), 'theme-engine.js must drive pinhole iris zoom transition');
  assert.ok(engineCode.includes("fill: 'both'"), 'Pinhole iris WAAPI animation must use fill:both to prevent Dark->Light final-frame flash');
  assert.ok(engineCode.includes('theme-iris-freeze') && css.includes('html.theme-iris-freeze'), 'View Transition must freeze CSS color transitions during snapshot capture');
  assert.ok(css.includes('::view-transition-new(root)') && css.includes('.theme-iris-ring'), 'styles.css must configure pinhole iris view-transition stacking and rim halo');
  assert.ok(css.includes('view-transition-name: sky-celestial-orb') && css.includes('::view-transition-group(sky-celestial-orb)'), 'styles.css must glide Sun/Moon orb smoothly across the toggle during pinhole iris');
  assert.ok(css.includes('.burger-drawer:not(.open) .sky-toggle *'), 'styles.css must pause sky diorama loops while burger drawer is closed');
  assert.ok(css.includes('.site-preloader.is-hidden .solar-loader *'), 'styles.css must pause solar loader loops once preloader hides');

  // Cross-page pastel curtain route label resolution & link interception eligibility
  assert.equal(api.resolveCurtainLabel('/devlogs/'), 'DEVLOGS');
  assert.equal(api.resolveCurtainLabel('/devlogs/index.html'), 'DEVLOGS');
  assert.equal(api.resolveCurtainLabel('/devlogs/editor.html'), 'CUSTOM XML');
  assert.equal(api.resolveCurtainLabel('/#about'), 'ABOUT');
  assert.equal(api.resolveCurtainLabel('/#experience'), 'EXPERIENCE');
  assert.equal(api.resolveCurtainLabel('/#contact'), 'CONTACT');
  assert.equal(api.resolveCurtainLabel('/#resources'), 'RESOURCES');
  assert.equal(api.resolveCurtainLabel('/'), 'HOME');

  const rootLoc = { origin: 'https://uzair777-dev.github.io', pathname: '/', href: 'https://uzair777-dev.github.io/' };
  const devlogsLoc = { origin: 'https://uzair777-dev.github.io', pathname: '/devlogs/', href: 'https://uzair777-dev.github.io/devlogs/' };
  assert.equal(api.shouldUseCrossPageCurtain({ href: '/devlogs/' }, rootLoc), true);
  assert.equal(api.shouldUseCrossPageCurtain({ href: '/#about' }, devlogsLoc), true);
  assert.equal(api.shouldUseCrossPageCurtain({ href: '/' }, devlogsLoc), true);
  assert.equal(api.shouldUseCrossPageCurtain({ href: '/devlogs/editor.html' }, devlogsLoc), true);
  assert.equal(api.shouldUseCrossPageCurtain({ href: '#about' }, rootLoc), false);
  assert.equal(api.shouldUseCrossPageCurtain({ href: '/devlogs/' }, devlogsLoc), false);
  assert.equal(api.shouldUseCrossPageCurtain({ href: 'https://github.com/uzair777-dev' }, rootLoc), false);
  assert.equal(api.shouldUseCrossPageCurtain({ href: 'mailto:uzairshaikhking777@gmail.com' }, rootLoc), false);
  assert.equal(api.shouldUseCrossPageCurtain({ href: '/devlogs/', target: '_blank' }, rootLoc), false);
});

test('devlogs cross-page curtain handoff, Custom XML labeling, and live editor glitch preview are wired cleanly', () => {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const devlogsHtml = fs.readFileSync(path.join(rootDir, 'devlogs/index.html'), 'utf-8');
  const editorHtml = fs.readFileSync(path.join(rootDir, 'devlogs/editor.html'), 'utf-8');
  const devlogsJs = fs.readFileSync(path.join(rootDir, 'devlogs/index.js'), 'utf-8');
  const appJs = fs.readFileSync(path.join(siteRoot, 'app.js'), 'utf-8');
  const css = fs.readFileSync(path.join(siteRoot, 'styles.css'), 'utf-8');

  // Cross-page handoff wiring across entry points
  assert.ok(indexHtml.includes('portfolio_curtain_handoff'), 'index.html must detect incoming cross-page curtain handoff before first paint');
  assert.ok(devlogsHtml.includes('portfolio_curtain_handoff'), 'devlogs/index.html must detect incoming cross-page curtain handoff before first paint');
  assert.ok(editorHtml.includes('portfolio_curtain_handoff'), 'devlogs/editor.html must detect incoming cross-page curtain handoff before first paint');
  assert.ok(appJs.includes('releaseIncomingCurtain'), 'app.js must release incoming curtain smoothly on arrival from devLOGS');
  assert.ok(devlogsJs.includes('releaseIncomingCurtain'), 'devlogs/index.js must release incoming curtain smoothly on arrival from Portfolio');
  assert.ok(css.includes('html[data-curtain-handoff]::before') && css.includes('.route-curtain.is-held'), 'styles.css must define zero-flash pre-paint veil and held curtain state');

  // Custom XML branding & real animated glitch effect in editor preview
  assert.ok(devlogsJs.includes('Custom XML Composer'), 'devlogs/index.js must label the composer as Custom XML Composer');
  assert.ok(editorHtml.includes('Custom XML Composer') && editorHtml.includes('Custom XML Snippet') && editorHtml.includes('Valid Custom XML'), 'devlogs/editor.html must label Custom XML prominently');
  assert.ok(editorHtml.includes('loadGlitchFonts') && editorHtml.includes('renderGlitchText') && editorHtml.includes('glitch-char') && editorHtml.includes('@keyframes glitchJitter'), 'devlogs/editor.html must load custom glitch fonts and animate .glitch-char in live preview');
  assert.ok(editorHtml.includes('Math.max(0.85'), 'devlogs/editor.html glitch animation must stay safely below 3Hz photosensitive threshold');
});

test('project is standalone with zero Gemini API, env key, or platform runtime dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  assert.equal('@google/genai' in allDeps, false, 'package.json must not depend on @google/genai');
  assert.equal('react' in allDeps, false, 'package.json must not carry unused React dependency');
  assert.equal('express' in allDeps, false, 'package.json must not carry unused Express dependency');
  assert.equal('dotenv' in allDeps, false, 'package.json must not carry unused dotenv dependency');
  assert.equal(fs.existsSync(path.join(rootDir, '.env.example')), false, 'No .env.example asking for API keys should exist');
  assert.equal(fs.existsSync(path.join(rootDir, 'public/app.js')), false, 'All static site files should live directly in project root (no public/ split)');
  assert.equal(fs.existsSync(path.join(rootDir, 'public/styles.css')), false, 'styles.css should live directly in project root (no public/ split)');

  // Verify original uzair777-dev.github.io root structure
  for (const rel of [
    'index.html',
    '404.html',
    'app.js',
    'styles.css',
    'theme-engine.js',
    'data/global.json',
    'res/resume/resume.pdf',
    'devlogs/index.html',
    'devlogs/index.js',
    'devlogs/parser.js',
    'devlogs/styles.css',
    'devlogs/logs.xml',
    'devlogs/editor.html',
  ]) {
    assert.equal(fs.existsSync(path.join(rootDir, rel)), true, `Expected root-level static file: ${rel}`);
  }

  const viteCfg = fs.readFileSync(path.join(rootDir, 'vite.config.ts'), 'utf-8');
  assert.equal(/aistudio|AI Studio|@vitejs\/plugin-react|@tailwindcss\/vite/i.test(viteCfg), false, 'vite.config.ts must be clean and platform-agnostic');
});

test('Slow-3G cold-load optimizations and devLOGS overlay pager contrast are enforced', () => {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const appJs = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf-8');
  const devlogsCss = fs.readFileSync(path.join(rootDir, 'devlogs/styles.css'), 'utf-8');

  // Packet-1 inline preloader & non-blocking fonts + main stylesheet
  assert.ok(indexHtml.includes('id="critical-preloader-css"'), 'index.html must inline critical preloader CSS for packet-1 paint');
  assert.ok(indexHtml.includes('id="preloader"'), 'index.html must include packet-1 #preloader markup');
  assert.ok(indexHtml.includes('id="main-stylesheet-link"') && indexHtml.includes('media="print"'), 'index.html must load /styles.css non-render-blockingly behind the inline preloader');
  assert.equal(indexHtml.includes('rel="preconnect" href="https://api.github.com"'), false, 'index.html should not waste Slow-3G t=0 sockets preconnecting to GitHub');

  // Connection-aware startup & non-blocking footer/repo hydration
  assert.ok(appJs.includes('isSlowConnection') && appJs.includes('isConstrainedNetwork'), 'app.js must adapt prefetching and heavy previews on slow networks');
  assert.ok(appJs.includes('waitForMainStylesheet'), 'app.js must wait for async main stylesheet before dismissing preloader');
  assert.ok(appJs.includes('deferRepos'), 'app.js must defer GitHub API requests until after homepage reveal');

  // Image payload budgets
  const guySize = fs.statSync(path.join(rootDir, 'res/img/guy.png')).size;
  const clippySize = fs.statSync(path.join(rootDir, 'res/img/clippy.png')).size;
  assert.ok(guySize < 15 * 1024, `res/img/guy.png should be under 15KB (got ${guySize} bytes)`);
  assert.ok(clippySize < 150 * 1024, `res/img/clippy.png should be under 150KB (got ${clippySize} bytes)`);

  // devLOGS overlay Prev/Next button contrast & display typography
  const pagerBlock = devlogsCss.slice(devlogsCss.indexOf('.overlay-pager-btn {'), devlogsCss.indexOf('/* Pagination */'));
  assert.ok(pagerBlock.includes('color: var(--ink)'), '.overlay-pager-btn must explicitly set readable theme-aware ink color');
  assert.ok(pagerBlock.includes('.overlay-pager-btn strong'), '.overlay-pager-btn strong must style the adjacent post title with display font and var(--ink)');

  // True AMOLED pitch-black dark theme across all 4 solar palettes + desktop toggle + single-X mobile drawer
  const css = fs.readFileSync(path.join(siteRoot, 'styles.css'), 'utf-8');
  const amoledMatches = css.match(/--bg-color:\s*#000000;/g) || [];
  assert.ok(amoledMatches.length >= 4, `Expected AMOLED #000000 --bg-color across all 4 dark solar palettes (found ${amoledMatches.length})`);
  assert.ok(css.includes('.sky-toggle--compact'), 'styles.css must style the compact scaled desktop navbar sky toggle');
  assert.ok(css.includes('html.theme-iris-freeze .sky-toggle.is-iris-active'), 'styles.css must scope View Transition name to clicked toggle only');
});


