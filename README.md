# IMP Pro Static Site

This repository contains the marketing website for IMP Pro, featuring pages for homeowners, installers, showroom information, and contact details. The site is fully static and can be served from any HTTP server or a GitHub Pages deployment.

## Project structure

```
public/
├── assets/
│   ├── css/
│   │   └── styles.css        # Global styles
│   └── js/
│       └── script.js         # Navigation toggle and form handlers
├── index.html                # Landing page
├── particuliers.html         # Homeowners offer
├── installateurs.html        # Installers offer
├── showroom.html             # Showroom information
└── contact.html              # Contact form
```

## Local development

Open `public/index.html` directly in your browser, or serve the `public` directory with any static server:

```bash
python -m http.server 8000 --directory public
```

Then browse to http://localhost:8000/.

## Continuous integration

A GitHub Actions workflow (`.github/workflows/site-quality.yml`) lint checks all HTML files with [HTMLHint](https://htmlhint.com/) to ensure the pages stay valid. The workflow runs on pushes and pull requests.
