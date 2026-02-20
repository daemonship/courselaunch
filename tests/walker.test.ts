import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { walkContent, buildCourse, ContentError } from '../src/content/walker.js';

describe('ContentWalker', () => {
  const testDir = path.join(import.meta.dirname, 'content-test-tmp');

  beforeEach(() => {
    // Create test structure
    fs.mkdirSync(path.join(testDir, 'modules', '01-first-module'), { recursive: true });
    fs.mkdirSync(path.join(testDir, 'modules', '02-second-module'), { recursive: true });
    fs.mkdirSync(path.join(testDir, 'static'), { recursive: true });

    // Create course.yaml
    fs.writeFileSync(path.join(testDir, 'course.yaml'), `title: Test Course
author: Test Author
`);

    // Create first module lessons
    fs.writeFileSync(
      path.join(testDir, 'modules', '01-first-module', '01-first-lesson.md'),
      `---
title: First Lesson
description: The first lesson
duration: 5 min
---

# First Lesson Content

This is the content.
`
    );

    fs.writeFileSync(
      path.join(testDir, 'modules', '01-first-module', '02-second-lesson.md'),
      `---
title: Second Lesson
duration: 10 min
draft: true
---

# Second Lesson Content

Draft content.
`
    );

    // Create second module lessons
    fs.writeFileSync(
      path.join(testDir, 'modules', '02-second-module', '01-another-lesson.md'),
      `---
title: Third Lesson
description: Another lesson
---

# Third Lesson Content
`
    );
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('walkContent', () => {
    it('walks modules directory and builds course tree', () => {
      const course = walkContent(testDir);

      expect(course.modules).toHaveLength(2);
      expect(course.rootDir).toBe(testDir);
    });

    it('parses module names from directory names', () => {
      const course = walkContent(testDir);

      expect(course.modules[0].name).toBe('01 First Module');
      expect(course.modules[1].name).toBe('02 Second Module');
    });

    it('extracts lesson slugs from filenames', () => {
      const course = walkContent(testDir);

      expect(course.modules[0].lessons[0].slug).toBe('01-first-lesson');
      expect(course.modules[0].lessons[1].slug).toBe('02-second-lesson');
    });

    it('parses lesson frontmatter correctly', () => {
      const course = walkContent(testDir);
      const lesson = course.modules[0].lessons[0];

      expect(lesson.frontmatter.title).toBe('First Lesson');
      expect(lesson.frontmatter.description).toBe('The first lesson');
      expect(lesson.frontmatter.duration).toBe('5 min');
      expect(lesson.frontmatter.draft).toBe(false);
    });

    it('parses draft flag correctly', () => {
      const course = walkContent(testDir);
      const draftLesson = course.modules[0].lessons[1];

      expect(draftLesson.frontmatter.draft).toBe(true);
    });

    it('extracts lesson content without frontmatter', () => {
      const course = walkContent(testDir);
      const lesson = course.modules[0].lessons[0];

      expect(lesson.content).toContain('# First Lesson Content');
      expect(lesson.content).not.toContain('title: First Lesson');
    });

    it('sorts lessons by filename', () => {
      const course = walkContent(testDir);
      const lessons = course.modules[0].lessons;

      expect(lessons[0].slug).toBe('01-first-lesson');
      expect(lessons[1].slug).toBe('02-second-lesson');
    });

    it('sorts modules by directory name', () => {
      const course = walkContent(testDir);

      expect(course.modules[0].slug).toBe('01-first-module');
      expect(course.modules[1].slug).toBe('02-second-module');
    });

    it('throws error when modules directory is missing', () => {
      fs.rmSync(path.join(testDir, 'modules'), { recursive: true });
      expect(() => walkContent(testDir)).toThrow(ContentError);
    });

    it('throws error when module has no lessons', () => {
      fs.mkdirSync(path.join(testDir, 'modules', 'empty-module'));
      expect(() => walkContent(testDir)).toThrow(ContentError);
    });

    it('throws error when lesson has no title in frontmatter', () => {
      fs.writeFileSync(
        path.join(testDir, 'modules', '01-first-module', 'bad-lesson.md'),
        `---
description: No title here
---

# Content
`
      );
      expect(() => walkContent(testDir)).toThrow('title');
    });
  });

  describe('buildCourse', () => {
    it('combines config and content into full course', async () => {
      const course = await buildCourse(testDir);

      expect(course.config.title).toBe('Test Course');
      expect(course.config.author).toBe('Test Author');
      expect(course.modules).toHaveLength(2);
    });
  });
});
