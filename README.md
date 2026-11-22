# [uzair777-dev.github.io](http://uzairshaikh.pages.dev)

<sub><sup>Click on the above heading to visit the site</sup></sub>

---------------------

This is my portfolio website source code.

You can use it for your own website under the licence GPLv3 (if you what that means)

I'll explain everything below if I don't get distracte- *Ooo a butterfly* 🦋 ✨

---------------------

## Running Locally (Zero Build Step, Zero npm, Zero API Keys)

This site keeps its flat static structure (`index.html`, `app.js`, `styles.css`, `theme-engine.js`, `data/`, `res/`, and `devlogs/` directly in the project root) — no `npm`, no bundler, no `.env` file, and no API keys are required.

Unzip and serve the root folder with **any static file server** (needed only so browser `fetch()` can read `data/*.json` and `devlogs/logs.xml`):

```bash
# Python 3 (built into macOS/Linux/Windows)
python3 -m http.server 8000
# Then open http://localhost:8000
```

Or open the folder in VS Code and click **Go Live** (Live Server), or push directly to **GitHub Pages** / **Cloudflare Pages** with no build command and output directory `/`.

---------------------

## Disclaimer

I am not particularly a good web-dev. So the styling is very 💩.

If you are gonna fork it. Please add some of your own styling.

---------------------

## How stuff works

These are the following roles for the files

1. `./index.html` : It has the structure that has to be loaded before the stuff loads

2. `./app.js` : This is the brains of the website (I'll explain it later).

3. `./styles.css` : This is the styling. The ✨ Make it Look Good ✨ sauce

4. `./data/global.json` : This contains the global setting that is default for the whole website.

5. `./data/pages/page_name.json`: This contains page specific data to be loaded on the runtime

6. `./res/` : This contains the resources stuff etc idk idc 🫠

How shi works:

Basically when the page loads it runs the `app.js` and it dynamically places content from the various jsons and dynamically adjust the content. It basically does the heavy lifting of procedurally adding code and removing in response to user interaction and resouces (.jons) updateing in source

Truthfully, I am too lazy to update stuff everytime it is done, so i made it this way so it won't be a pain in the a*@h°le everytime

---------------------

## devLOGS (Blog)

The blog section lives in `./devlogs/` and follows the same "nothing is hard-coded" philosophy as the rest of the site, except it uses **XML** instead of JSON.

### Files

| File | Role |
|---|---|
| `devlogs/index.html` | Page skeleton — loads styles and boots the module |
| `devlogs/index.js` | Page renderer (like `app.js` for the main site) — theme toggle, nav, cards, pagination, content processing |
| `devlogs/parser.js` | XML parser — runs in a Web Worker when possible, falls back to main thread |
| `devlogs/styles.css` | Dedicated stylesheet for the blog page |
| `devlogs/logs.xml` | **The data source** — all blog posts live here |

### XML Format

The feed uses a custom XML syntax (inspired by RSS but different):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <channel>
    <item>
      <title>Post title</title>
      <id>1</id>                          <!-- unique identifier -->
      <type></type>                       <!-- optional category for filtering -->
      <heading>Card heading</heading>     <!-- displayed on the card -->
      <description><![CDATA[Short preview text.]]></description>
      <content>
        Full content shown on expand. Supports HTML tags.
      </content>
      <pubDate>
        <date>1770976574</date>           <!-- Unix timestamp,Why? cuz i like torturing myself -->
        <timezone>IST</timezone>           <!-- Timezone-->
      </pubDate>
    </item>
  </channel>
</feed>
```

### Custom Tags (inside `<content>`)

| Tag | What it does |
| --- | --- |
| `<censor>text</censor>` | Replaces every character with `█` (U+2588) |
| `<PCensor>text</PCensor>` | Partial censor — first and second-to-last char visible, rest is `*` |
| `<glitch intensity="N">text</glitch>` | Random font + random letter per character. Intensity (2-10) = animation speed. Empty tag → 3-7 random chars |

### Supported HTML Tags

Standard HTML works inside `<content>`. Use XML self-closing syntax for void elements (`<br/>`, `<hr/>`, `<img src="x"/>`).

Styled tags: `a`, `img`, `br`, `hr`, `h1`–`h6`, `p`, `ul`/`ol`/`li`, `blockquote`, `code`, `pre`, `table`, `kbd`, `mark`, `sub`, `sup`, `s`, `u`, `details`/`summary`.

### Full-Screen Overlay & Deep-Linking

Clicking **Read More** opens a full-screen overlay. Direct link via hash: `/devlogs/#1` auto-opens the post with `<id>1</id>`. Closes with `×`, backdrop click, or `Esc`.

### How to add a new post

1. Open `devlogs/logs.xml`
2. Add a new `<item>` inside `<channel>`
3. Fill in `title`, `id` (unique), `heading`, `description`, `content`, and `pubDate`
4. Done — the page renders it automatically

## TODO

- [x] Make a repository
- [x] Make shi look presentable (hopefully)
- [x] Do styling
- [x] Make styling better
- [x] Unf\*ck styling
- [x] Add resume
- [x] Make it so that I can download resume
- [x] Link my socials
- [x] Add Notes for the subjects
- [ ] Make stuff Look good
- [ ] Optimise it
- [ ] Optimise it again
- [x] Document everything properly
- [x] Add a Cloudflare proxy
- [x] Add a blog

## Mirrors and backup

[Main and original](https://uzairshaikh.pages.dev)
[Github pages mirror](https://uzair777-dev.github.io)
[Google AI studio ](https://uzair777-dev.github.io)

## Credits

### Fonts used

- 4-Sided
- Black clouds white sky
- Nazox-nAr0Y
- VahyoneLight-ZpXYl
- Vaticanus
- XCRobot
- zalgo

Credits to their own author
