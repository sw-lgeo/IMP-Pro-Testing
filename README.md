# IMP Pro Static Site

This repository contains the marketing website for IMP Pro, featuring pages for homeowners, installers, showroom information, and contact details. The site is fully static and can be served from any generic HTTP host without any platform-specific configuration.

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

## Deployment

The site is deployed as a plain static export. Build output lives directly in the `public/` directory and can be uploaded to any host.

For Hostinger (or any similar provider):

1. Clean the destination folder (e.g., `/public_html/zebra`).
2. Upload the entire contents of `public/` (including HTML, CSS, JS, and assets) into that folder.
3. The site will be reachable at the subdomain you configured (e.g., `https://zebra.hom.lu`) without any extra server settings or `.htaccess` files.
