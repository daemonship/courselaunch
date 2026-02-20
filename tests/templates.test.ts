/**
 * Tests for template rendering
 */

import { describe, it, expect } from 'vitest';
import {
  renderLandingPage,
  renderModulePage,
  renderLessonPage,
} from '../src/templates/renderer.js';
import {
  moduleUrl,
  lessonUrl,
  generateSidebarItems,
  findPreviousLesson,
  findNextLesson,
  formatDuration,
  escapeHtml,
} from '../src/templates/helpers.js';
import type { Course, Module, Lesson } from '../src/config/course.js';

describe('Template Helpers', () => {
  describe('moduleUrl', () => {
    it('should generate correct module URL', () => {
      expect(moduleUrl('intro')).toBe('./intro/');
      expect(moduleUrl('advanced-topics')).toBe('./advanced-topics/');
    });
  });

  describe('lessonUrl', () => {
    it('should generate correct lesson URL', () => {
      expect(lessonUrl('intro', 'lesson-1')).toBe('./intro/lesson-1.html');
      expect(lessonUrl('advanced', 'async-await')).toBe('./advanced/async-await.html');
    });
  });

  describe('formatDuration', () => {
    it('should format duration string', () => {
      expect(formatDuration('30 min')).toBe('30 min');
      expect(formatDuration('1 hour')).toBe('1 hour');
      expect(formatDuration('')).toBe('');
      expect(formatDuration(undefined)).toBe('');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML entities', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(escapeHtml('&')).toBe('&amp;');
      expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
      expect(escapeHtml("'test'")).toBe('&#039;test&#039;');
    });
  });
});

describe('Sidebar Generation', () => {
  const mockCourse: Course = {
    config: {
      title: 'Test Course',
      author: 'Test Author',
    },
    modules: [
      {
        slug: 'module-1',
        name: 'Module 1',
        path: '/test/modules/module-1',
        lessons: [
          {
            slug: 'lesson-1',
            filename: 'lesson-1.md',
            path: '/test/modules/module-1/lesson-1.md',
            frontmatter: {
              title: 'Lesson 1',
              draft: false,
            },
            content: 'Content',
          },
          {
            slug: 'lesson-2',
            filename: 'lesson-2.md',
            path: '/test/modules/module-1/lesson-2.md',
            frontmatter: {
              title: 'Lesson 2',
              draft: true,
            },
            content: 'Content',
          },
        ],
      },
      {
        slug: 'module-2',
        name: 'Module 2',
        path: '/test/modules/module-2',
        lessons: [
          {
            slug: 'lesson-3',
            filename: 'lesson-3.md',
            path: '/test/modules/module-2/lesson-3.md',
            frontmatter: {
              title: 'Lesson 3',
              draft: false,
            },
            content: 'Content',
          },
        ],
      },
    ],
    rootDir: '/test',
  };

  describe('generateSidebarItems', () => {
    it('should generate sidebar items for all modules and lessons', () => {
      const items = generateSidebarItems(mockCourse);
      expect(items).toHaveLength(5); // 2 module headers + 3 lessons
    });

    it('should mark active lesson correctly', () => {
      const items = generateSidebarItems(mockCourse, 'module-1', 'lesson-1');
      const activeLesson = items.find(i => i.type === 'lesson' && i.active);
      expect(activeLesson?.title).toBe('Lesson 1');
    });

    it('should mark active module correctly', () => {
      const items = generateSidebarItems(mockCourse, 'module-2');
      const activeModule = items.find(i => i.type === 'module' && i.active);
      expect(activeModule?.title).toBe('Module 2');
    });

    it('should mark draft lessons', () => {
      const items = generateSidebarItems(mockCourse);
      const draftLesson = items.find(i => i.type === 'lesson' && i.draft);
      expect(draftLesson?.title).toBe('Lesson 2');
      expect(draftLesson?.draft).toBe(true);
    });
  });

  describe('findPreviousLesson', () => {
    it('should find previous published lesson', () => {
      const prev = findPreviousLesson(mockCourse, 'module-2', 'lesson-3');
      expect(prev?.slug).toBe('lesson-1');
    });

    it('should return undefined for first lesson', () => {
      const prev = findPreviousLesson(mockCourse, 'module-1', 'lesson-1');
      expect(prev).toBeUndefined();
    });

    it('should skip draft lessons', () => {
      const prev = findPreviousLesson(mockCourse, 'module-2', 'lesson-3');
      expect(prev?.slug).toBe('lesson-1'); // Skips lesson-2 which is draft
    });
  });

  describe('findNextLesson', () => {
    it('should find next published lesson', () => {
      const next = findNextLesson(mockCourse, 'module-1', 'lesson-1');
      expect(next?.slug).toBe('lesson-3'); // Skips lesson-2 which is draft
    });

    it('should return undefined for last lesson', () => {
      const next = findNextLesson(mockCourse, 'module-2', 'lesson-3');
      expect(next).toBeUndefined();
    });
  });
});

describe('Template Rendering', () => {
  const mockCourse: Course = {
    config: {
      title: 'Test Course',
      author: 'Test Author',
      description: 'A test course for learning',
    },
    modules: [
      {
        slug: 'basics',
        name: 'Basics',
        path: '/test/modules/basics',
        lessons: [
          {
            slug: 'intro',
            filename: 'intro.md',
            path: '/test/modules/basics/intro.md',
            frontmatter: {
              title: 'Introduction',
              description: 'Course introduction',
              duration: '10 min',
              draft: false,
            },
            content: '# Welcome\n\nThis is the intro.',
          },
        ],
      },
    ],
    rootDir: '/test',
  };

  describe('renderLandingPage', () => {
    it('should render landing page HTML', () => {
      const html = renderLandingPage(mockCourse);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Test Course');
      expect(html).toContain('Test Author');
      expect(html).toContain('A test course for learning');
      expect(html).toContain('Basics');
      expect(html).toContain('Introduction');
    });

    it('should include sidebar', () => {
      const html = renderLandingPage(mockCourse);
      expect(html).toContain('class="sidebar"');
      expect(html).toContain('class="sidebar-nav"');
    });

    it('should include CSS styles', () => {
      const html = renderLandingPage(mockCourse);
      expect(html).toContain('<style>');
      expect(html).toContain('--color-primary');
    });
  });

  describe('renderModulePage', () => {
    it('should render module page HTML', () => {
      const html = renderModulePage(mockCourse, mockCourse.modules[0]);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Basics');
      expect(html).toContain('Introduction');
    });

    it('should list lessons in module', () => {
      const html = renderModulePage(mockCourse, mockCourse.modules[0]);
      expect(html).toContain('intro.html');
      expect(html).toContain('10 min');
    });
  });

  describe('renderLessonPage', () => {
    it('should render lesson page HTML', () => {
      const html = renderLessonPage(
        mockCourse,
        mockCourse.modules[0],
        mockCourse.modules[0].lessons[0],
        '<h1>Welcome</h1>\n<p>This is the intro.</p>'
      );
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Introduction');
      expect(html).toContain('10 min');
      expect(html).toContain('<h1>Welcome</h1>');
    });

    it('should include lesson navigation', () => {
      const html = renderLessonPage(
        mockCourse,
        mockCourse.modules[0],
        mockCourse.modules[0].lessons[0],
        '<p>Content</p>'
      );
      expect(html).toContain('class="lesson-nav"');
    });

    it('should show draft badge for draft lessons', () => {
      const draftLesson: Lesson = {
        ...mockCourse.modules[0].lessons[0],
        frontmatter: {
          ...mockCourse.modules[0].lessons[0].frontmatter,
          draft: true,
        },
      };
      const html = renderLessonPage(
        mockCourse,
        mockCourse.modules[0],
        draftLesson,
        '<p>Content</p>'
      );
      expect(html).toContain('class="lesson-draft-badge"');
      expect(html).toContain('Draft');
    });
  });
});
