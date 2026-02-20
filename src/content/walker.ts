/**
 * Content directory walker - reads modules/, parses frontmatter, builds course tree
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Course, Module, Lesson, LessonFrontmatter } from '../config/course.js';

export class ContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentError';
  }
}

/**
 * Check if a filename is a markdown file
 */
function isMarkdownFile(filename: string): boolean {
  return filename.endsWith('.md');
}

/**
 * Extract lesson slug from filename (removes .md extension)
 */
function getLessonSlug(filename: string): string {
  return filename.replace(/\.md$/, '');
}

/**
 * Extract module slug from directory name
 */
function getModuleSlug(dirname: string): string {
  return dirname;
}

/**
 * Read a lesson file and parse its frontmatter
 */
function readLessonFile(lessonPath: string, moduleSlug: string): Lesson {
  const filename = path.basename(lessonPath);
  const slug = getLessonSlug(filename);
  
  const fileContent = fs.readFileSync(lessonPath, 'utf-8');
  const { data, content } = matter(fileContent);

  // Validate required frontmatter fields
  if (!data.title || typeof data.title !== 'string') {
    throw new ContentError(`Lesson ${filename}: "title" is required in frontmatter`);
  }

  const frontmatter: LessonFrontmatter = {
    title: data.title,
    description: data.description,
    duration: data.duration,
    draft: data.draft === true,
  };

  return {
    slug,
    filename,
    path: lessonPath,
    frontmatter,
    content,
  };
}

/**
 * Read all lessons in a module directory
 */
function readModuleLessons(modulePath: string, moduleSlug: string): Lesson[] {
  const files = fs.readdirSync(modulePath);
  const lessonFiles = files.filter(f => isMarkdownFile(f));
  
  // Sort by filename to maintain order
  lessonFiles.sort();

  return lessonFiles.map(filename => {
    const lessonPath = path.join(modulePath, filename);
    return readLessonFile(lessonPath, moduleSlug);
  });
}

/**
 * Validate module structure
 */
function validateModule(modulePath: string, moduleSlug: string): void {
  const files = fs.readdirSync(modulePath);
  const lessonFiles = files.filter(f => isMarkdownFile(f));

  if (lessonFiles.length === 0) {
    throw new ContentError(`Module ${moduleSlug} has no lesson files (.md)`);
  }
}

/**
 * Read a module directory and its lessons
 */
function readModule(modulePath: string): Module {
  const moduleSlug = getModuleSlug(path.basename(modulePath));
  
  if (!fs.statSync(modulePath).isDirectory()) {
    throw new ContentError(`Expected ${modulePath} to be a directory`);
  }

  validateModule(modulePath, moduleSlug);
  const lessons = readModuleLessons(modulePath, moduleSlug);

  return {
    slug: moduleSlug,
    name: moduleSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    path: modulePath,
    lessons,
  };
}

/**
 * Walk the modules directory and build the course tree
 */
export function walkContent(rootDir: string): Course {
  const modulesDir = path.join(rootDir, 'modules');

  if (!fs.existsSync(modulesDir)) {
    throw new ContentError(`modules/ directory not found at ${modulesDir}`);
  }

  if (!fs.statSync(modulesDir).isDirectory()) {
    throw new ContentError(`modules/ at ${modulesDir} is not a directory`);
  }

  // Get all module directories
  const entries = fs.readdirSync(modulesDir, { withFileTypes: true });
  const moduleDirs = entries
    .filter(e => e.isDirectory())
    .map(e => path.join(modulesDir, e.name));

  if (moduleDirs.length === 0) {
    throw new ContentError('No modules found in modules/ directory');
  }

  // Sort by directory name to maintain order
  moduleDirs.sort();

  // Read each module
  const modules = moduleDirs.map(modulePath => readModule(modulePath));

  return {
    config: {
      title: '', // Will be filled by caller
      author: '',
    },
    modules,
    rootDir,
  };
}

/**
 * Build a full course from root directory (reads both config and content)
 */
import { parseCourseConfig } from '../config/parser.js';

export async function buildCourse(rootDir: string): Promise<Course> {
  const config = parseCourseConfig(rootDir);
  const course = walkContent(rootDir);
  
  return {
    ...course,
    config,
  };
}
