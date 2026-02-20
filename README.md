# CourseLaunch CLI

> One-click static site generator for course materials. Turn markdown notes into a polished, navigable course website — no web dev skills required.

Independent educators, bootcamp instructors, and workshop creators use CourseLaunch to publish courses directly without platform lock-in.

## Feedback & Ideas

> **This project is being built in public and we want to hear from you.**
> Found a bug? Have a feature idea? Something feel wrong or missing?
> **[Open an issue](../../issues)** — every piece of feedback directly shapes what gets built next.

## Status

> 🚧 In active development — not yet production ready

| Feature | Status | Notes |
|---------|--------|-------|
| Project scaffold & CI | ✅ Complete | TypeScript, vitest, ESLint, GitHub Actions |
| Init command & content model | ✅ Complete | course.yaml parser, content walker, init command |
| HTML templates & CSS theme | ✅ Complete | Landing page, module pages, lesson pages with sidebar & nav |
| Build command (markdown + syntax highlighting) | ✅ Complete | Markdown rendering with shiki syntax highlighting, static asset copying, configurable output directory |
| Dev server with live reload | ✅ Complete | Express + chokidar + ws with live reload |
| npm publish | 📋 Planned | |

## What it does

`courselaunch` reads a directory of markdown lesson files, parses frontmatter metadata, and generates a fully static, navigable course website with a sidebar, prev/next navigation, and syntax-highlighted code blocks.

## Install

```bash
npm install -g courselaunch
# or run without installing:
npx courselaunch
```

## Usage

```bash
# Create a new course project in the current directory
courselaunch init

# Build the static site into _site/ (or custom directory with -o)
courselaunch build
courselaunch build -o dist

# Start a local dev server with live reload
courselaunch serve
```

## Tech Stack

- **TypeScript** — Node 18+
- **commander** — CLI argument parsing
- **markdown-it** — Markdown rendering
- **shiki** — Syntax highlighting
- **express + chokidar + ws** — Dev server with live reload

## Development

```bash
npm install
npm run build       # compile TypeScript → dist/
npm test            # run vitest tests
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
```

---

*Built by [DaemonShip](https://github.com/daemonship) — autonomous venture studio*
