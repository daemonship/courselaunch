/**
 * Course configuration parser with strict validation
 */

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { CourseConfig } from './course.js';

export class CourseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CourseConfigError';
  }
}

/**
 * Validate that required fields are present and well-formed
 */
function validateConfig(config: Record<string, unknown>): void {
  // Required: title
  if (typeof config.title !== 'string' || config.title.trim() === '') {
    throw new CourseConfigError('course.yaml: "title" is required and must be a non-empty string');
  }

  // Required: author
  if (typeof config.author !== 'string' || config.author.trim() === '') {
    throw new CourseConfigError('course.yaml: "author" is required and must be a non-empty string');
  }

  // Optional: description (string or undefined)
  if (config.description !== undefined && typeof config.description !== 'string') {
    throw new CourseConfigError('course.yaml: "description" must be a string if provided');
  }

  // Optional: base_url (string or undefined)
  if (config.base_url !== undefined && typeof config.base_url !== 'string') {
    throw new CourseConfigError('course.yaml: "base_url" must be a string if provided');
  }
}

/**
 * Parse course.yaml from a given directory
 */
export function parseCourseConfig(courseDir: string): CourseConfig {
  const configPath = path.join(courseDir, 'course.yaml');

  if (!fs.existsSync(configPath)) {
    throw new CourseConfigError(`course.yaml not found at ${configPath}`);
  }

  const fileContent = fs.readFileSync(configPath, 'utf-8');
  const parsed = YAML.parse(fileContent);

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new CourseConfigError('course.yaml must contain a valid YAML object');
  }

  validateConfig(parsed);

  return {
    title: parsed.title as string,
    author: parsed.author as string,
    description: parsed.description as string | undefined,
    base_url: parsed.base_url as string | undefined,
  };
}

/**
 * Serialize course config to YAML string
 */
export function serializeCourseConfig(config: CourseConfig): string {
  return YAML.stringify(config, { lineWidth: 0 });
}
