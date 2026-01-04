# www.bloist.com (Static GitHub Pages Site)

This ZIP contains a **fully static** multi-page site (HTML/CSS/JS) designed to be hosted on **GitHub Pages**.

## Structure

- `index.html` — landing page
- `pages/` — content pages (tech deep dives, reports, ROI calculator, gallery, questions and answers)
- `assets/` — CSS, JS, images

## Deploy to GitHub Pages

1. Create a new repo (e.g., `www.bloist.com`).
2. Upload the contents of this ZIP to the repo root.
3. In GitHub: **Settings → Pages**
   - Source: `Deploy from a branch`
   - Branch: `main` (or `master`)
   - Folder: `/ (root)`
4. Save. GitHub will publish the site.

## Customize

- Contact email: `mailto:patrick.proctor@yahoo.com` (in the top-right "Contact" button).
- The right-side menu item is: **"Help us continue to breathe"** (customizable at `nav_html` in each page).
- Replace SVG images in `assets/img/` with licensed photos if desired.

## Notes

- Charts on `pages/reports.html` use Chart.js from a CDN.
- Air-quality values are illustrative placeholders; swap in real datasets for production use.
