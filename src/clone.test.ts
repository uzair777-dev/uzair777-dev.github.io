import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');

function readJson(relPath: string) {
  const fullPath = path.join(publicDir, relPath);
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

test('contact.json mailto URL has no malformed leading space', () => {
  const contact = readJson('data/pages/contact.json');
  const emailEntry = contact.social.find((s: {name: string}) => s.name === 'Email');
  assert.ok(emailEntry, 'Expected Email social entry');
  assert.equal(emailEntry.url, 'mailto:uzairshaikhking777@gmail.com');
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
    const full = path.join(publicDir, rel);
    assert.equal(fs.existsSync(full), true, `Missing asset in public/: ${rel}`);
  }

  // Verify generated editorial images exist in src/assets/images
  assert.equal(
    fs.existsSync(path.join(rootDir, about.image.replace(/^\//, ''))),
    true,
    `Missing About image: ${about.image}`,
  );
  assert.equal(
    fs.existsSync(path.join(rootDir, 'src/assets/images/hero_cyber_jade_artwork_1795271990034.jpg')),
    true,
    'Missing pastel cyber-jade hero artwork',
  );
});

test('app.js avoids window.alert, invalid <center> nesting, and includes hash routing', () => {
  const appSource = fs.readFileSync(path.join(publicDir, 'app.js'), 'utf-8');
  assert.equal(/\balert\s*\(/.test(appSource), false, 'app.js should not call window.alert()');
  assert.equal(appSource.includes('<center>'), false, 'app.js should not output invalid <center> tags');
  assert.ok(appSource.includes('hashchange'), 'app.js should listen to hashchange for SPA routing');
  assert.ok(appSource.includes('getPageFromHash'), 'app.js should resolve routes from location.hash');
});

test('devlogs/index.js routes back to main portfolio sections via hash links and supports search', () => {
  const devlogsJs = fs.readFileSync(path.join(rootDir, 'devlogs/index.js'), 'utf-8');
  assert.ok(devlogsJs.includes('/#${item.page}'), 'devlogs nav should link directly to /#page sections');
  assert.ok(devlogsJs.includes('devlog-search'), 'devlogs should include search input');
  assert.ok(devlogsJs.includes('reading-progress-bar'), 'devlogs reader should include reading progress bar');
  assert.ok(devlogsJs.includes('closeOverlay(false)'), 'hashchange should close overlay when hash is cleared');
});

test('devlogs/logs.xml exists and contains valid feed items', () => {
  const xmlPath = path.join(publicDir, 'devlogs/logs.xml');
  assert.equal(fs.existsSync(xmlPath), true);
  const xml = fs.readFileSync(xmlPath, 'utf-8');
  assert.ok(xml.includes('<feed') && xml.includes('<channel>'));
  const itemMatches = xml.match(/<item>/g) || [];
  assert.ok(itemMatches.length > 0, 'Expected at least one <item> in devlogs/logs.xml');
});

test('all multi-page HTML entry points use semantic button hamburgers, burger drawers, and editorial fonts', () => {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const devlogsHtml = fs.readFileSync(path.join(rootDir, 'devlogs/index.html'), 'utf-8');
  const editorHtml = fs.readFileSync(path.join(rootDir, 'devlogs/editor.html'), 'utf-8');
  assert.ok(indexHtml.includes('Bricolage+Grotesque'), 'index.html should load Bricolage Grotesque');
  assert.ok(devlogsHtml.includes('Bricolage+Grotesque'), 'devlogs/index.html should load Bricolage Grotesque');
  assert.ok(editorHtml.includes('Bricolage+Grotesque'), 'devlogs/editor.html should load Bricolage Grotesque');
  assert.ok(/<button[^>]*class="hamburger"/.test(devlogsHtml), 'devlogs hamburger must be a semantic <button>');
  assert.ok(indexHtml.includes('id="burger-drawer"'), 'index.html must include unified burger drawer');
  assert.ok(devlogsHtml.includes('id="burger-drawer"'), 'devlogs/index.html must include unified burger drawer');
  assert.equal(indexHtml.includes('id="theme-toggle"'), false, 'index.html navbar must not have standalone theme toggle outside burger drawer');
  assert.equal(devlogsHtml.includes('id="theme-toggle"'), false, 'devlogs/index.html navbar must not have standalone theme toggle outside burger drawer');
  assert.equal(editorHtml.includes('--accent-gradient'), false, 'devlogs/editor.html must not reference removed --accent-gradient');
  assert.ok(editorHtml.includes('escapeCdata'), 'devlogs/editor.html should sanitize ]]> inside CDATA');
  assert.ok(editorHtml.includes('[\\s\\S]*?'), 'devlogs/editor.html should support multi-line custom tags');
});

test('styles.css defines 4 pastel palettes, high-visibility dark borders, // heading prefixes, milestone timeline, and zero diagonal clipped shadows', () => {
  const css = fs.readFileSync(path.join(publicDir, 'styles.css'), 'utf-8');
  const devlogsCss = fs.readFileSync(path.join(publicDir, 'devlogs/styles.css'), 'utf-8');
  const appSource = fs.readFileSync(path.join(publicDir, 'app.js'), 'utf-8');

  assert.ok(css.includes('--accent-2:'), 'styles.css should define secondary pastel cyber accent (--accent-2)');
  assert.equal(css.includes('--border-color: #3a3833'), false, 'dark-mode border must not use low-visibility #3a3833');
  assert.ok(css.includes('--border-color: #6f909c'), 'dark-mode border should use high-visibility pastel steel-mint #6f909c');

  for (const palette of ['jade', 'glacier', 'matcha', 'wisteria']) {
    assert.ok(css.includes(`:root[data-palette="${palette}"]`), `Missing :root-scoped light palette tokens for ${palette}`);
    assert.ok(css.includes(`:root[data-theme="dark"][data-palette="${palette}"]`), `Missing :root-scoped dark palette tokens for ${palette}`);
  }

  // Zero clipped diagonal offset shadows
  assert.equal(/\d+px\s+\d+px\s+0px/.test(css), false, 'styles.css should not use diagonal offset shadows that clip corners');
  assert.equal(/\d+px\s+\d+px\s+0px/.test(devlogsCss), false, 'devlogs/styles.css should not use diagonal offset shadows that clip corners');
  assert.ok(css.includes('--btn-extrude:'), 'styles.css should define solid vertical button extrusion token');

  // Pastel // heading prefixes
  assert.ok(css.includes("content: '// '"), 'styles.css should render // prefixes on headings');
  assert.ok(devlogsCss.includes("content: '// '"), 'devlogs/styles.css should render // prefixes on headings');

  // Connected vertical milestone timeline
  assert.ok(css.includes('.experience-timeline::before'), 'styles.css should draw vertical timeline spine');
  assert.ok(css.includes('.timeline-dot'), 'styles.css should style timeline milestone dots');
  assert.ok(appSource.includes('timeline-marker') && appSource.includes('timeline-dot'), 'app.js should emit timeline milestone nodes');
});

test('theme-engine.js client-device factor resolvers deterministically return valid pastel palettes', async () => {
  const vm = await import('node:vm');
  const engineCode = fs.readFileSync(path.join(publicDir, 'theme-engine.js'), 'utf-8');
  const sandbox: Record<string, unknown> = { module: { exports: {} } };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(engineCode, sandbox);
  const api = (sandbox.module as { exports: Record<string, any> }).exports;
  const validIds = new Set(api.PALETTES.map((p: { id: string }) => p.id));

  assert.equal(validIds.size, 4);

  // Solar clock across all 24 hours
  for (let h = 0; h < 24; h++) {
    const res = api.resolvePaletteFromClock(h);
    assert.ok(validIds.has(res.palette), `Clock hour ${h} returned invalid palette ${res.palette}`);
  }
  assert.equal(api.resolvePaletteFromClock(8).palette, 'matcha');
  assert.equal(api.resolvePaletteFromClock(13).palette, 'glacier');
  assert.equal(api.resolvePaletteFromClock(19).palette, 'jade');
  assert.equal(api.resolvePaletteFromClock(2).palette, 'wisteria');

  // Battery state
  assert.equal(api.resolvePaletteFromBattery(0.45, true).palette, 'jade');
  assert.equal(api.resolvePaletteFromBattery(0.85, false).palette, 'glacier');
  assert.equal(api.resolvePaletteFromBattery(0.5, false).palette, 'matcha');
  assert.equal(api.resolvePaletteFromBattery(0.15, false).palette, 'wisteria');

  // CPU cores
  assert.equal(api.resolvePaletteFromCores(4).palette, 'matcha');
  assert.equal(api.resolvePaletteFromCores(8).palette, 'jade');
  assert.equal(api.resolvePaletteFromCores(12).palette, 'glacier');
  assert.equal(api.resolvePaletteFromCores(16).palette, 'wisteria');

  // Viewport width
  assert.equal(api.resolvePaletteFromViewport(1440).palette, 'jade');
  assert.equal(api.resolvePaletteFromViewport(1200).palette, 'glacier');
  assert.equal(api.resolvePaletteFromViewport(820).palette, 'matcha');
  assert.equal(api.resolvePaletteFromViewport(390).palette, 'wisteria');
});



