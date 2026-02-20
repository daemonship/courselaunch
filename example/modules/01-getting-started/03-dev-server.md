---
title: Live Preview with the Dev Server
description: Use courselaunch serve for instant feedback while writing
duration: 4 min
---

# Live Preview with the Dev Server

Writing a lesson and checking your work shouldn't require a manual rebuild. CourseLaunch includes a built-in dev server with live reload.

## Start the Dev Server

```bash
courselaunch serve
```

By default it starts on port 3000:

```
CourseLaunch dev server running at http://localhost:3000
Watching for changes...
```

Open `http://localhost:3000` in your browser. Any time you save a markdown file or edit `course.yaml`, the page reloads automatically.

## Custom Port

```bash
courselaunch serve -p 8080
```

## What Gets Watched

The dev server watches:

- All `*.md` files in `modules/`
- `course.yaml`
- Any files in `static/`

Changes to any of these trigger a rebuild and reload.

## Custom Output Directory

Both `build` and `serve` accept an `-o` flag to change the output directory:

```bash
courselaunch build -o dist
courselaunch serve -o dist
```

## Pro Tip: Write and Preview Together

Open your editor on the left half of the screen, browser on the right. Every time you save, the preview refreshes instantly. This tight feedback loop makes course writing much faster.

## Next Steps

You're set up and can preview your work. In the next module, we'll dive into writing great course content with markdown.
