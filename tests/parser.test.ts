import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseCourseConfig, serializeCourseConfig, CourseConfigError } from '../src/config/parser.js';

describe('CourseConfig', () => {
  const testDir = path.join(import.meta.dirname, 'test-tmp');

  beforeEach(() => {
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('parseCourseConfig', () => {
    it('parses valid course.yaml', () => {
      const config = {
        title: 'Test Course',
        author: 'Test Author',
        description: 'A test course description',
      };
      fs.writeFileSync(path.join(testDir, 'course.yaml'), serializeCourseConfig(config));

      const result = parseCourseConfig(testDir);

      expect(result.title).toBe('Test Course');
      expect(result.author).toBe('Test Author');
      expect(result.description).toBe('A test course description');
    });

    it('parses minimal course.yaml with only required fields', () => {
      const config = {
        title: 'Minimal Course',
        author: 'Anonymous',
      };
      fs.writeFileSync(path.join(testDir, 'course.yaml'), serializeCourseConfig(config));

      const result = parseCourseConfig(testDir);

      expect(result.title).toBe('Minimal Course');
      expect(result.author).toBe('Anonymous');
      expect(result.description).toBeUndefined();
      expect(result.base_url).toBeUndefined();
    });

    it('parses course.yaml with optional base_url', () => {
      const config = {
        title: 'Course With Base URL',
        author: 'Author',
        base_url: '/my-course',
      };
      fs.writeFileSync(path.join(testDir, 'course.yaml'), serializeCourseConfig(config));

      const result = parseCourseConfig(testDir);

      expect(result.base_url).toBe('/my-course');
    });

    it('throws error when course.yaml is missing', () => {
      expect(() => parseCourseConfig(testDir)).toThrow(CourseConfigError);
    });

    it('throws error when title is missing', () => {
      fs.writeFileSync(path.join(testDir, 'course.yaml'), 'author: Test Author');
      expect(() => parseCourseConfig(testDir)).toThrow('title');
    });

    it('throws error when author is missing', () => {
      fs.writeFileSync(path.join(testDir, 'course.yaml'), 'title: Test Course');
      expect(() => parseCourseConfig(testDir)).toThrow('author');
    });

    it('throws error when title is empty', () => {
      fs.writeFileSync(path.join(testDir, 'course.yaml'), 'title: ""\nauthor: Author');
      expect(() => parseCourseConfig(testDir)).toThrow('non-empty');
    });

    it('throws error when title is whitespace only', () => {
      fs.writeFileSync(path.join(testDir, 'course.yaml'), 'title: "   "\nauthor: Author');
      expect(() => parseCourseConfig(testDir)).toThrow('non-empty');
    });

    it('throws error when description is not a string', () => {
      fs.writeFileSync(path.join(testDir, 'course.yaml'), 'title: Title\nauthor: Author\ndescription: 123');
      expect(() => parseCourseConfig(testDir)).toThrow('must be a string');
    });

    it('throws error when base_url is not a string', () => {
      fs.writeFileSync(path.join(testDir, 'course.yaml'), 'title: Title\nauthor: Author\nbase_url: 123');
      expect(() => parseCourseConfig(testDir)).toThrow('must be a string');
    });

    it('throws error when course.yaml is not an object', () => {
      fs.writeFileSync(path.join(testDir, 'course.yaml'), '- item1\n- item2');
      expect(() => parseCourseConfig(testDir)).toThrow('valid YAML object');
    });
  });

  describe('serializeCourseConfig', () => {
    it('serializes full config to YAML', () => {
      const config: CourseConfig = {
        title: 'Test Course',
        author: 'Test Author',
        description: 'Description',
        base_url: '/course',
      };

      const result = serializeCourseConfig(config);

      expect(result).toContain('title: Test Course');
      expect(result).toContain('author: Test Author');
      expect(result).toContain('description: Description');
      expect(result).toContain('base_url: /course');
    });

    it('serializes minimal config to YAML', () => {
      const config: CourseConfig = {
        title: 'Minimal',
        author: 'Anon',
      };

      const result = serializeCourseConfig(config);

      expect(result).toContain('title: Minimal');
      expect(result).toContain('author: Anon');
      expect(result).not.toContain('description');
    });
  });
});
