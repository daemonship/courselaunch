/**
 * Template rendering types
 */

import { Course, Module, Lesson } from '../config/course.js';

export interface TemplateContext {
  course: Course;
  currentModule?: Module;
  currentLesson?: Lesson;
  previousLesson?: Lesson;
  nextLesson?: Lesson;
  content?: string;
}

export interface SidebarItem {
  type: 'module' | 'lesson';
  title: string;
  url: string;
  active: boolean;
  draft?: boolean;
}
