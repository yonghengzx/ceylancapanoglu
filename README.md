# CeYlanCapanoLu — Studio Website

Public site source for **CeYlanCapanoLu**, an English-only studio site for European and
American visitors, published with GitHub Pages.

- Live URL: <https://yonghengzx.github.io/ceylancapanoglu/>
- Repository: <https://github.com/yonghengzx/ceylancapanoglu>
- Contact: ceylancapanoglu215516@gmail.com

## Layout

```
.
├── index.html          Home
├── services.html       Business Services
├── contact.html        Contact Us
├── privacy.html        Privacy Policy
├── terms.html          Terms of Service
├── robots.txt          crawler directives
├── sitemap.xml         the 5 public pages
├── app-ads.txt         app advertising sellers (0 bytes by design)
├── .nojekyll           disables Jekyll processing on Pages
├── css/                design tokens, layout, components, animations, pages
├── js/                 main.js, animations.js, legal.js
└── images/             SVG icons, logos, mascots + generated PNG artwork
```

No build step. Open `index.html` in a browser and the site runs.

## Deploy

Push to `main`. The GitHub Actions workflow in `.github/workflows/pages.yml` stages the
repository root as the site root (keeping hidden files such as `.nojekyll`) and publishes it
to GitHub Pages.

Release tooling lives outside this directory in `../ops/` and is never committed.

## Notes

- English only, one `<h1>` per page, canonical + OpenGraph + JSON-LD on every page.
- `app-ads.txt` is intentionally 0 bytes.
- The home page is served at `/` — never link to `index.html` directly.
