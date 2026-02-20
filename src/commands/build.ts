import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { buildCourse } from '../content/walker.js';
import { renderLandingPage, renderModulePage, renderLessonPage } from '../templates/renderer.js';
import { renderMarkdown } from '../markdown/renderer.js';
import { Lesson } from '../config/course.js';

export const buildCommand = new Command('build')
  .description('Build the course into a static site')
  .option('-o, --out <dir>', 'output directory', '_site')
  .action(async (options) => {
    const outputDir = path.resolve(process.cwd(), options.out);
    const rootDir = process.cwd();

    console.log(`Building course from ${rootDir}`);
    console.log(`Output directory: ${outputDir}`);

    try {
      // Build course tree
      const course = await buildCourse(rootDir);
      console.log(`Loaded course: ${course.config.title}`);
      console.log(`Found ${course.modules.length} modules`);

      // Clean output directory
      if (fs.existsSync(outputDir)) {
        await fs.emptyDir(outputDir);
      }
      await fs.ensureDir(outputDir);

      // Copy static assets if they exist
      const staticDir = path.join(rootDir, 'static');
      if (fs.existsSync(staticDir)) {
        await fs.copy(staticDir, path.join(outputDir, 'static'));
        console.log('Copied static assets');
      }

      // Render and write landing page
      const landingHtml = renderLandingPage(course);
      await fs.writeFile(path.join(outputDir, 'index.html'), landingHtml);
      console.log('Generated landing page');

      // Process each module
      for (const module of course.modules) {
        const moduleOutputDir = path.join(outputDir, module.slug);
        await fs.ensureDir(moduleOutputDir);

        // Render module index page
        const moduleHtml = renderModulePage(course, module);
        await fs.writeFile(path.join(moduleOutputDir, 'index.html'), moduleHtml);

        // Process each lesson
        for (const lesson of module.lessons) {
          // Skip draft lessons? For now, we'll generate them but they won't appear in navigation
          // (the template already handles draft badge and exclusion from sidebar)
          const renderedMarkdown = await renderMarkdown(lesson.content);
          const lessonHtml = renderLessonPage(course, module, lesson, renderedMarkdown);
          const lessonFilename = `${lesson.slug}.html`;
          await fs.writeFile(path.join(moduleOutputDir, lessonFilename), lessonHtml);
        }

        console.log(`  Module ${module.slug}: ${module.lessons.length} lessons`);
      }

      // Count total lessons
      const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
      console.log(`Successfully built ${totalLessons} lessons across ${course.modules.length} modules`);
      console.log(`Site ready at ${outputDir}`);
    } catch (error) {
      console.error('Build failed:', error);
      process.exit(1);
    }
  });
