---
title: Course Structure & Frontmatter
description: How to organize modules, lessons, and metadata
duration: 6 min
---

# Course Structure & Frontmatter

CourseLaunch uses a simple directory layout to represent your course hierarchy. Understanding it makes writing content fast and predictable.

## Directory Layout

```
my-course/
├── course.yaml
├── modules/
│   ├── 01-introduction/
│   │   ├── 01-welcome.md
│   │   └── 02-setup.md
│   ├── 02-core-concepts/
│   │   ├── 01-basics.md
│   │   ├── 02-advanced.md
│   │   └── 03-exercises.md
│   └── 03-wrap-up/
│       └── 01-next-steps.md
└── static/
    └── images/
        └── diagram.png
```

### Modules

Each subdirectory of `modules/` is a module. Modules are sorted alphabetically by folder name — so using numeric prefixes (`01-`, `02-`, etc.) ensures the correct order.

The display name is derived from the folder name: `01-core-concepts` becomes **Core concepts** (prefix stripped, hyphens replaced with spaces, title-cased).

### Lessons

Each `.md` file in a module directory is a lesson. Same sorting rule applies — number your files.

## course.yaml

The `course.yaml` file at the root contains course-level metadata:

```yaml
title: "Introduction to Rust"
author: "Jane Smith"
description: "A beginner-friendly introduction to systems programming with Rust."
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Course title shown in the header and page titles |
| `author` | Yes | Author name shown in header and footer |
| `description` | No | Short description shown on the landing page |

## Lesson Frontmatter

Each markdown file starts with a YAML frontmatter block:

```markdown
---
title: Your Lesson Title
description: One-line summary shown in module listings
duration: 10 min
draft: false
---

# Your Lesson Title

Lesson content starts here...
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Lesson title shown in the sidebar and page header |
| `description` | No | Short description shown in module page listings |
| `duration` | No | Estimated read/watch time (e.g., `5 min`, `20 min`) |
| `draft` | No | If `true`, lesson is built but excluded from navigation |

## Draft Lessons

Setting `draft: true` is useful while writing — the lesson file is compiled, but it won't appear in the sidebar or module listings:

```markdown
---
title: Advanced Caching (coming soon)
draft: true
---
```

This lets you commit incomplete work without showing it to learners.
