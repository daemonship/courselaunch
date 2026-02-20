/**
 * Course configuration types and validation
 */

export interface CourseConfig {
  title: string;
  author: string;
  description?: string;
  base_url?: string;
}

export interface LessonFrontmatter {
  title: string;
  description?: string;
  duration?: string;
  draft?: boolean;
}

export interface Lesson {
  slug: string;
  filename: string;
  path: string;
  frontmatter: LessonFrontmatter;
  content: string;
}

export interface Module {
  slug: string;
  name: string;
  path: string;
  lessons: Lesson[];
}

export interface Course {
  config: CourseConfig;
  modules: Module[];
  rootDir: string;
}
