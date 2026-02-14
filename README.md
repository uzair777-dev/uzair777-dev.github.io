# [uzair777-dev.github.io](http://uzairshaikh.pages.dev)

<sub><sup>Click on the above heading to visit the site</sup></sub>

---------------------

This is my portfolio website source code.

You can use it for your own website under the licence GPLv3 (if you what that means)

I'll explain everything below if I don't get distracte- *Ooo a butterfly* 🦋 ✨

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
        <date>1770976574</date>           <!-- Unix timestamp -->
        <timezone>GMT</timezone>
      </pubDate>
    </item>
  </channel>
</feed>
```

### Custom Tags (inside `<content>`)

| Tag | What it does |
|---|---|
| `<censor>text</censor>` | Replaces every character with `█` (U+2588) |
| `<PCensor>text</PCensor>` | Partial censor — shows ~30% of each word, rest is `*` |
| `<glitch intensity="N">text</glitch>` | Replaces every letter with a random letter using a random font from `data/fonts/`. Intensity (2-10) controls animation speed. If no text given, generates 3-7 random characters |

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
- [ ] Unf\*ck styling
- [x] Add resume
- [ ] Make it so that I can download resume
- [ ] Link my socials
- [x] Add Notes for the subjects
- [ ] Make stuff Look good
- [ ] Optimise it
- [ ] Optimise it again
- [x] Document everything properly
- [x] Add a Cloudflare proxy
- [x] Add a blog

[Backup link](https://uzair777-dev.github.io)

## Fonts used

- 4-Sided
- Black clouds white sky
- Nazox-nAr0Y
- VahyoneLight-ZpXYl
- Vaticanus
- XCRobot
- zalgo

Credits to their own author
