/**
 * HTML Template renderer for CourseLaunch
 */

import { Course, Module, Lesson } from '../config/course.js';
import { SidebarItem } from './types.js';
import {
  generateSidebarItems,
  findPreviousLesson,
  findNextLesson,
  formatDuration,
  escapeHtml,
} from './helpers.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const styles = readFileSync(join(__dirname, 'styles.css'), 'utf-8');

/**
 * Render sidebar HTML
 */
function renderSidebar(items: SidebarItem[]): string {
  const itemsHtml = items.map(item => {
    if (item.type === 'module') {
      return `
        <li class="sidebar-module">
          <h3 class="sidebar-module-title">
            <a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a>
          </h3>
        </li>
      `;
    } else {
      const draftClass = item.draft ? ' draft' : '';
      const activeClass = item.active ? ' active' : '';
      return `
        <li class="sidebar-lesson${draftClass}${activeClass}">
          <a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a>
        </li>
      `;
    }
  }).join('\n');

  return `
    <aside class="sidebar" id="sidebar">
      <nav>
        <ul class="sidebar-nav">
          ${itemsHtml}
        </ul>
      </nav>
    </aside>
    <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle sidebar">☰</button>
  `;
}

/**
 * Render header HTML
 */
function renderHeader(course: Course): string {
  return `
    <header class="site-header">
      <div class="site-header-inner">
        <a href="./" class="site-title">${escapeHtml(course.config.title)}</a>
        <span class="site-author">by ${escapeHtml(course.config.author)}</span>
      </div>
    </header>
  `;
}

/**
 * Render footer HTML
 */
function renderFooter(course: Course): string {
  const year = new Date().getFullYear();
  return `
    <footer class="site-footer">
      <p>© ${year} ${escapeHtml(course.config.author)}. Built with <a href="https://github.com/daemonship/courselaunch" target="_blank" rel="noopener">CourseLaunch</a>.</p>
    </footer>
  `;
}

/**
 * Render lesson navigation
 */
function renderLessonNav(
  course: Course,
  previousLesson?: Lesson,
  nextLesson?: Lesson,
  currentModule?: Module
): string {
  let prevHtml = '';
  let nextHtml = '';

  if (previousLesson) {
    const prevModule = currentModule?.lessons.includes(previousLesson)
      ? currentModule
      : courseModuleContainingLesson(course, previousLesson);
    prevHtml = `
      <a href="./${prevModule?.slug}/${previousLesson.slug}.html" class="lesson-nav-link lesson-nav-prev">
        <span class="lesson-nav-label">← Previous</span>
        <span class="lesson-nav-title">${escapeHtml(previousLesson.frontmatter.title)}</span>
      </a>
    `;
  } else {
    prevHtml = '<span class="lesson-nav-link lesson-nav-prev" disabled></span>';
  }

  if (nextLesson) {
    const nextModule = currentModule?.lessons.includes(nextLesson)
      ? currentModule
      : courseModuleContainingLesson(course, nextLesson);
    nextHtml = `
      <a href="./${nextModule?.slug}/${nextLesson.slug}.html" class="lesson-nav-link lesson-nav-next">
        <span class="lesson-nav-label">Next →</span>
        <span class="lesson-nav-title">${escapeHtml(nextLesson.frontmatter.title)}</span>
      </a>
    `;
  } else {
    nextHtml = '<span class="lesson-nav-link lesson-nav-next" disabled></span>';
  }

  return `
    <nav class="lesson-nav" aria-label="Lesson navigation">
      ${prevHtml}
      ${nextHtml}
    </nav>
  `;
}

/**
 * Helper to find which module contains a lesson
 */
function courseModuleContainingLesson(course: Course, lesson: Lesson): Module | undefined {
  return course.modules.find(m => m.lessons.some(l => l.slug === lesson.slug));
}

/**
 * Render base layout
 */
function renderLayout(
  course: Course,
  sidebarHtml: string,
  headerHtml: string,
  contentHtml: string,
  footerHtml: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(course.config.title)}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="app-container">
    ${headerHtml}
    ${sidebarHtml}
    <main class="main-content">
      <div class="content-wrapper">
        ${contentHtml}
        ${footerHtml}
      </div>
    </main>
  </div>
  <script>
    // Sidebar toggle for mobile
    (function() {
      const toggle = document.getElementById('sidebarToggle');
      const sidebar = document.getElementById('sidebar');
      if (!toggle || !sidebar) return;

      toggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
      });

      // Close sidebar when clicking outside on mobile
      document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
          if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
            sidebar.classList.remove('open');
          }
        }
      });
    })();
  </script>
</body>
</html>
`;
}

/**
 * Render landing page (course index)
 */
export function renderLandingPage(course: Course): string {
  const sidebarItems = generateSidebarItems(course);
  const sidebarHtml = renderSidebar(sidebarItems);
  const headerHtml = renderHeader(course);
  const footerHtml = renderFooter(course);

  // Build module list
  const moduleListHtml = course.modules.map(module => {
    const lessonCount = module.lessons.length;
    const publishedCount = module.lessons.filter(l => !l.frontmatter.draft).length;

    const lessonsHtml = module.lessons
      .filter(l => !l.frontmatter.draft)
      .map(lesson => `
        <li class="lesson-list-item">
          <a href="./${module.slug}/${lesson.slug}.html" class="lesson-list-link">
            ${escapeHtml(lesson.frontmatter.title)}
          </a>
          ${lesson.frontmatter.duration ? `<span class="lesson-duration">${escapeHtml(formatDuration(lesson.frontmatter.duration))}</span>` : ''}
        </li>
      `).join('');

    return `
      <li class="module-list-item">
        <h2 class="module-list-title">
          <a href="./${module.slug}/">${escapeHtml(module.name)}</a>
        </h2>
        ${module.lessons[0]?.frontmatter.description ? `
          <p class="module-list-description">${escapeHtml(module.lessons[0].frontmatter.description)}</p>
        ` : ''}
        <ul class="lesson-list">
          ${lessonsHtml}
        </ul>
        ${publishedCount < lessonCount ? `
          <p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--color-text-muted);">
            + ${lessonCount - publishedCount} draft lesson${lessonCount - publishedCount > 1 ? 's' : ''}
          </p>
        ` : ''}
      </li>
    `;
  }).join('');

  const contentHtml = `
    <article>
      <div class="landing-hero">
        <h1 class="landing-title">${escapeHtml(course.config.title)}</h1>
        <p class="landing-author">by ${escapeHtml(course.config.author)}</p>
        ${course.config.description ? `
          <p class="landing-description">${escapeHtml(course.config.description)}</p>
        ` : ''}
      </div>
      <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: var(--spacing-lg);">Course Modules</h2>
      <ul class="module-list">
        ${moduleListHtml}
      </ul>
    </article>
  `;

  return renderLayout(course, sidebarHtml, headerHtml, contentHtml, footerHtml);
}

/**
 * Render module page (lesson listing)
 */
export function renderModulePage(course: Course, module: Module): string {
  const sidebarItems = generateSidebarItems(course, module.slug);
  const sidebarHtml = renderSidebar(sidebarItems);
  const headerHtml = renderHeader(course);
  const footerHtml = renderFooter(course);

  const lessonsHtml = module.lessons
    .filter(l => !l.frontmatter.draft)
    .map(lesson => `
      <li class="lesson-list-item">
        <a href="./${lesson.slug}.html" class="lesson-list-link">
          ${escapeHtml(lesson.frontmatter.title)}
        </a>
        ${lesson.frontmatter.description ? `
          <span style="color: var(--color-text-muted); font-size: 0.9375rem;">${escapeHtml(lesson.frontmatter.description)}</span>
        ` : ''}
        ${lesson.frontmatter.duration ? `
          <span class="lesson-duration">${escapeHtml(formatDuration(lesson.frontmatter.duration))}</span>
        ` : ''}
      </li>
    `).join('');

  const contentHtml = `
    <article>
      <div class="lesson-header">
        <h1 class="lesson-title">${escapeHtml(module.name)}</h1>
      </div>
      <ul class="lesson-list" style="margin-top: var(--spacing-lg);">
        ${lessonsHtml}
      </ul>
      ${module.lessons.some(l => l.frontmatter.draft) ? `
        <p style="margin-top: var(--spacing-lg); font-size: 0.875rem; color: var(--color-text-muted);">
          ${module.lessons.filter(l => l.frontmatter.draft).length} draft lesson(s) not shown
        </p>
      ` : ''}
    </article>
  `;

  return renderLayout(course, sidebarHtml, headerHtml, contentHtml, footerHtml);
}

/**
 * Render lesson page
 */
export function renderLessonPage(
  course: Course,
  module: Module,
  lesson: Lesson,
  renderedContent: string
): string {
  const sidebarItems = generateSidebarItems(course, module.slug, lesson.slug);
  const sidebarHtml = renderSidebar(sidebarItems);
  const headerHtml = renderHeader(course);
  const footerHtml = renderFooter(course);

  const previousLesson = findPreviousLesson(course, module.slug, lesson.slug);
  const nextLesson = findNextLesson(course, module.slug, lesson.slug);
  const lessonNavHtml = renderLessonNav(course, previousLesson, nextLesson, module);

  const metaHtml = [
    lesson.frontmatter.duration ? `
      <span class="lesson-duration">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        ${escapeHtml(formatDuration(lesson.frontmatter.duration))}
      </span>
    ` : '',
    lesson.frontmatter.draft ? '<span class="lesson-draft-badge">Draft</span>' : '',
  ].filter(Boolean).join('');

  const contentHtml = `
    <article>
      <div class="lesson-header">
        <h1 class="lesson-title">${escapeHtml(lesson.frontmatter.title)}</h1>
        ${metaHtml ? `<div class="lesson-meta">${metaHtml}</div>` : ''}
      </div>
      <div class="markdown-content">
        ${renderedContent}
      </div>
      ${lessonNavHtml}
    </article>
  `;

  return renderLayout(course, sidebarHtml, headerHtml, contentHtml, footerHtml);
}
