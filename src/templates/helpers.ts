/**
 * Template helper functions
 */

import { Course, Lesson } from '../config/course.js';
import { SidebarItem } from './types.js';

/**
 * Generate URL for a module
 */
export function moduleUrl(moduleSlug: string): string {
  return `./${moduleSlug}/`;
}

/**
 * Generate URL for a lesson
 */
export function lessonUrl(moduleSlug: string, lessonSlug: string): string {
  return `./${moduleSlug}/${lessonSlug}.html`;
}

/**
 * Generate sidebar items from course structure
 */
export function generateSidebarItems(
  course: Course,
  currentModuleSlug?: string,
  currentLessonSlug?: string
): SidebarItem[] {
  const items: SidebarItem[] = [];

  for (const module of course.modules) {
    // Module header
    items.push({
      type: 'module',
      title: module.name,
      url: moduleUrl(module.slug),
      active: currentModuleSlug === module.slug && !currentLessonSlug,
    });

    // Lessons under this module
    for (const lesson of module.lessons) {
      items.push({
        type: 'lesson',
        title: lesson.frontmatter.title,
        url: lessonUrl(module.slug, lesson.slug),
        active: currentModuleSlug === module.slug && currentLessonSlug === lesson.slug,
        draft: lesson.frontmatter.draft,
      });
    }
  }

  return items;
}

/**
 * Find previous lesson (excluding drafts)
 */
export function findPreviousLesson(
  course: Course,
  currentModuleSlug: string,
  currentLessonSlug: string
): Lesson | undefined {
  // Build flat list of non-draft lessons
  const lessons: Lesson[] = [];
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      if (!lesson.frontmatter.draft) {
        lessons.push(lesson);
      }
    }
  }

  // Find current lesson index
  const currentIndex = lessons.findIndex(
    l => l.slug === currentLessonSlug && l.path.includes(`/${currentModuleSlug}/`)
  );

  if (currentIndex <= 0) return undefined;
  return lessons[currentIndex - 1];
}

/**
 * Find next lesson (excluding drafts)
 */
export function findNextLesson(
  course: Course,
  currentModuleSlug: string,
  currentLessonSlug: string
): Lesson | undefined {
  // Build flat list of non-draft lessons
  const lessons: Lesson[] = [];
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      if (!lesson.frontmatter.draft) {
        lessons.push(lesson);
      }
    }
  }

  // Find current lesson index
  const currentIndex = lessons.findIndex(
    l => l.slug === currentLessonSlug && l.path.includes(`/${currentModuleSlug}/`)
  );

  if (currentIndex === -1 || currentIndex >= lessons.length - 1) return undefined;
  return lessons[currentIndex + 1];
}

/**
 * Format duration for display
 */
export function formatDuration(duration?: string): string {
  if (!duration) return '';
  return duration.trim();
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
