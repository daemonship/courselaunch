---
title: Publishing Your Course
description: Deploy your course site to GitHub Pages, Netlify, or any static host
duration: 8 min
---

# Publishing Your Course

`courselaunch build` produces a static site — plain HTML, CSS, and assets. Any static hosting service can serve it.

## GitHub Pages (Free)

The simplest option for most people.

### Manual Deploy

1. Build your site:
   ```bash
   courselaunch build -o docs
   ```

2. Push to GitHub and enable Pages in your repo settings (set source to the `docs/` folder on `main`).

### Automated Deploy with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install CourseLaunch
        run: npm install -g courselaunch

      - name: Build course
        run: courselaunch build -o _site

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./_site
```

Every push to `main` rebuilds and deploys your course automatically.

## Netlify

1. Connect your GitHub repo to Netlify
2. Set build command: `npm install -g courselaunch && courselaunch build`
3. Set publish directory: `_site`

Netlify will build and deploy on every push.

## Vercel

1. Import your repo in Vercel
2. Override build command: `npm install -g courselaunch && courselaunch build`
3. Set output directory: `_site`

## Self-Hosted / VPS

Copy the `_site/` directory to any web server:

```bash
courselaunch build
rsync -avz _site/ user@yourserver.com:/var/www/your-course/
```

Or serve it with any static file server:

```bash
# Python (built-in)
cd _site && python3 -m http.server 8080

# Node (npx serve)
npx serve _site
```

## Custom Domain

On GitHub Pages, Netlify, or Vercel, you can point a custom domain to your course. Follow the DNS setup instructions in your hosting provider's docs — no CourseLaunch-specific steps required.

## That's It!

CourseLaunch gets out of your way. Write markdown → build → deploy. Your learners get a fast, clean course site. You keep full ownership of your content.
