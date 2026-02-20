import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const projectRoot = path.resolve(import.meta.dirname, '..');
const cliPath = path.join(projectRoot, 'dist', 'index.js');

describe('courselaunch build integration', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'courselaunch-'));
    console.log(`Test directory: ${tempDir}`);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      // ignore
    }
  });

  it('builds a default course with correct structure', async () => {
    process.chdir(tempDir);

    // Run init with defaults
    execSync(`node ${cliPath} init -y`, { stdio: 'pipe' });

    // Verify course.yaml exists
    const configPath = path.join(tempDir, 'course.yaml');
    expect(fs.existsSync(configPath)).toBe(true);

    // Run build with default output
    execSync(`node ${cliPath} build`, { stdio: 'pipe' });

    // Check output directory exists
    const outputDir = path.join(tempDir, '_site');
    expect(fs.existsSync(outputDir)).toBe(true);

    // Check expected files
    expect(fs.existsSync(path.join(outputDir, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, '01-introduction', 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, '01-introduction', '01-hello-world.html'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, '01-introduction', '02-core-concepts.html'))).toBe(true);

    // Verify HTML contains expected content
    const indexHtml = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf-8');
    expect(indexHtml).toContain('<title>My Course</title>');
    expect(indexHtml).toContain('Course Modules');

    // Verify module page contains lesson links
    const moduleHtml = fs.readFileSync(path.join(outputDir, '01-introduction', 'index.html'), 'utf-8');
    expect(moduleHtml).toContain('01-introduction');

    // Verify lesson pages have rendered markdown
    const lesson1Html = fs.readFileSync(path.join(outputDir, '01-introduction', '01-hello-world.html'), 'utf-8');
    expect(lesson1Html).toContain('Welcome to the Course');
    expect(lesson1Html).toContain('<div class="markdown-content">');
  });

  it('builds with custom output directory', () => {
    process.chdir(tempDir);
    execSync(`node ${cliPath} init -y`, { stdio: 'pipe' });
    execSync(`node ${cliPath} build -o dist`, { stdio: 'pipe' });

    expect(fs.existsSync(path.join(tempDir, 'dist', 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, '_site'))).toBe(false); // default not created
  });

  it('copies static assets', () => {
    process.chdir(tempDir);
    execSync(`node ${cliPath} init -y`, { stdio: 'pipe' });

    // Create a static file
    const staticDir = path.join(tempDir, 'static');
    fs.mkdirSync(staticDir, { recursive: true });
    fs.writeFileSync(path.join(staticDir, 'test.txt'), 'hello static');

    execSync(`node ${cliPath} build`, { stdio: 'pipe' });

    const copiedFile = path.join(tempDir, '_site', 'static', 'test.txt');
    expect(fs.existsSync(copiedFile)).toBe(true);
    expect(fs.readFileSync(copiedFile, 'utf-8')).toBe('hello static');
  });

  it('handles draft lessons correctly', () => {
    process.chdir(tempDir);
    execSync(`node ${cliPath} init -y`, { stdio: 'pipe' });

    // Add a draft lesson
    const draftLessonPath = path.join(tempDir, 'modules', '01-introduction', '03-draft.md');
    fs.writeFileSync(draftLessonPath, `---
title: Draft Lesson
draft: true
---

This is a draft lesson.
`);

    execSync(`node ${cliPath} build`, { stdio: 'pipe' });

    // Draft lesson should still be generated (but marked as draft)
    const draftHtmlPath = path.join(tempDir, '_site', '01-introduction', '03-draft.html');
    expect(fs.existsSync(draftHtmlPath)).toBe(true);
    const draftHtml = fs.readFileSync(draftHtmlPath, 'utf-8');
    expect(draftHtml).toContain('Draft');
    expect(draftHtml).toContain('lesson-draft-badge');
  });

  it('applies syntax highlighting to code blocks', async () => {
    process.chdir(tempDir);
    execSync(`node ${cliPath} init -y`, { stdio: 'pipe' });

    // Modify first lesson to include a code block
    const lessonPath = path.join(tempDir, 'modules', '01-introduction', '01-hello-world.md');
    const originalContent = fs.readFileSync(lessonPath, 'utf-8');
    const withCode = originalContent + `

\`\`\`javascript
const x = 1;
console.log(x);
\`\`\`
`;
    fs.writeFileSync(lessonPath, withCode);

    execSync(`node ${cliPath} build`, { stdio: 'pipe' });

    const lessonHtml = fs.readFileSync(
      path.join(tempDir, '_site', '01-introduction', '01-hello-world.html'),
      'utf-8'
    );
    // Should contain shiki container
    expect(lessonHtml).toContain('shiki-container');
    // Should contain both light and dark themes
    expect(lessonHtml).toContain('shiki-light');
    expect(lessonHtml).toContain('shiki-dark');
    // Should contain the code (may be split across HTML tags)
    expect(lessonHtml).toMatch(/const/);
    // Check for console and log separately since HTML tags may split them
    expect(lessonHtml).toMatch(/console/);
    expect(lessonHtml).toMatch(/log/);
  });
});