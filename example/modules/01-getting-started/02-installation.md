---
title: Installation & First Run
description: Install CourseLaunch and scaffold your first course project
duration: 5 min
---

# Installation & First Run

CourseLaunch requires Node.js 18 or newer. If you don't have it, install it from [nodejs.org](https://nodejs.org).

## Install

You can use CourseLaunch without installing it permanently:

```bash
npx courselaunch
```

Or install it globally so `courselaunch` is always available:

```bash
npm install -g courselaunch
```

## Create Your First Course

Navigate to an empty directory and run:

```bash
mkdir my-course && cd my-course
courselaunch init
```

You'll be prompted for a title, author, and optional description:

```
Creating a new course...

Course title: Introduction to Rust
Author name: Jane Smith
Course description (optional): A beginner-friendly intro to systems programming
```

This creates the following structure:

```
my-course/
├── course.yaml            # Course metadata
├── modules/
│   └── 01-introduction/
│       ├── 01-hello-world.md
│       └── 02-core-concepts.md
└── static/                # Static assets (images, etc.)
```

## Skip the Prompts

If you want to use defaults and start writing immediately:

```bash
courselaunch init -y
```

## Build It

```bash
courselaunch build
```

This generates a `_site/` directory with your full static site. Open `_site/index.html` in a browser to preview it.

## Next Steps

In the next lesson, we'll look at how to structure your content with modules and lessons.
