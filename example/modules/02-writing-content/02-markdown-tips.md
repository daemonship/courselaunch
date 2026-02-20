---
title: Writing Great Lesson Content
description: Markdown tips and patterns that work well for course lessons
duration: 7 min
---

# Writing Great Lesson Content

CourseLaunch renders standard markdown. This lesson covers the features that work best for course content.

## Headings

Use H1 for the lesson title (it matches your frontmatter `title`), H2 for major sections, and H3 for subsections:

```markdown
# Lesson Title

## Section One

### Subsection
```

## Code Blocks

Fenced code blocks get full syntax highlighting via [Shiki](https://shiki.style). Specify the language:

````markdown
```python
def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("World"))
```
````

Renders as:

```python
def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("World"))
```

Supported languages include `bash`, `javascript`, `typescript`, `python`, `rust`, `go`, `sql`, `yaml`, `json`, and [many more](https://shiki.style/languages).

## Inline Code

Use backticks for file names, command names, and short snippets: `` `npm install` ``, `` `course.yaml` ``.

## Tables

Tables render cleanly and are great for reference material:

```markdown
| Command | Description |
|---------|-------------|
| `courselaunch init` | Create a new course |
| `courselaunch build` | Build the static site |
| `courselaunch serve` | Start dev server |
```

## Blockquotes

Use blockquotes for callouts, tips, and warnings:

```markdown
> **Tip:** Always number your modules and lessons with a two-digit prefix
> (`01-`, `02-`) to ensure correct sort order.
```

> **Tip:** Always number your modules and lessons with a two-digit prefix
> (`01-`, `02-`) to ensure correct sort order.

## Lists

Ordered lists work well for steps. Unordered lists work well for feature overviews:

```markdown
1. Install Node.js
2. Run `npx courselaunch init`
3. Start writing lessons
```

## Images

Put images in the `static/` directory and reference them with a relative path:

```markdown
![Architecture diagram](../../static/images/arch-diagram.png)
```

## Lesson Length

Aim for **5–15 minutes** of reading per lesson. Shorter is usually better — learners appreciate clear stopping points. Break long topics into multiple lessons rather than one giant file.
