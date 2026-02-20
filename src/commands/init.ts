import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { serializeCourseConfig } from '../config/parser.js';
import { CourseConfig } from '../config/course.js';

/**
 * Prompt for course information using readline
 */
function promptCourseInfo(): Promise<CourseConfig> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const questions = [
      { key: 'title', prompt: 'Course title: ' },
      { key: 'author', prompt: 'Author name: ' },
      { key: 'description', prompt: 'Course description (optional): ' },
    ];

    const answers: Record<string, string> = {};
    let currentIndex = 0;

    function askNext() {
      if (currentIndex >= questions.length) {
        rl.close();
        resolve({
          title: answers.title,
          author: answers.author,
          description: answers.description || undefined,
        });
        return;
      }

      const q = questions[currentIndex];
      rl.question(q.prompt, (answer: string) => {
        answers[q.key] = answer.trim();
        currentIndex++;
        askNext();
      });
    }

    askNext();
  });
}

/**
 * Create default course config
 */
function getDefaultConfig(): CourseConfig {
  return {
    title: 'My Course',
    author: 'Anonymous',
    description: 'A new course',
  };
}

/**
 * Create the course directory structure
 */
function createCourseStructure(courseDir: string, config: CourseConfig): void {
  // Create directories
  const dirs = [
    courseDir,
    path.join(courseDir, 'modules'),
    path.join(courseDir, 'static'),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created: ${path.relative(courseDir, dir)}/`);
    }
  }

  // Write course.yaml
  const configPath = path.join(courseDir, 'course.yaml');
  fs.writeFileSync(configPath, serializeCourseConfig(config));
  console.log(`Created: course.yaml`);

  // Create example module with two lessons
  const exampleModuleDir = path.join(courseDir, 'modules', '01-introduction');
  fs.mkdirSync(exampleModuleDir, { recursive: true });
  console.log(`Created: modules/01-introduction/`);

  // Create first lesson
  const lesson1Content = `---
title: Welcome to the Course
description: An introduction to what you'll learn
duration: 5 min
---

# Welcome to ${config.title}

Welcome to this course! In this lesson, you'll learn the basics.

## What You'll Learn

- Introduction to the topic
- Setting up your environment
- Your first steps

## Let's Get Started

This is the beginning of your learning journey.
`;

  fs.writeFileSync(path.join(exampleModuleDir, '01-hello-world.md'), lesson1Content);
  console.log(`Created: modules/01-introduction/01-hello-world.md`);

  // Create second lesson
  const lesson2Content = `---
title: Core Concepts
description: The fundamental concepts you need to know
duration: 10 min
---

# Core Concepts

Now that you understand the basics, let's dive deeper.

## Key Concepts

Here are the main ideas you'll need to understand:

1. **First Concept** - Explanation of the first idea
2. **Second Concept** - Explanation of the second idea
3. **Third Concept** - Explanation of the third idea

## Practice Time

Try applying what you've learned in your own project.
`;

  fs.writeFileSync(path.join(exampleModuleDir, '02-core-concepts.md'), lesson2Content);
  console.log(`Created: modules/01-introduction/02-core-concepts.md`);
}

export const initCommand = new Command('init')
  .description('Initialize a new course project in the current directory')
  .option('-y, --yes', 'skip prompts and use defaults')
  .option('-d, --dir <directory>', 'directory to create course in', '.')
  .action(async (options) => {
    try {
      let config: CourseConfig;

      if (options.yes) {
        config = getDefaultConfig();
        console.log('Using default configuration...');
      } else {
        console.log('Creating a new course...\n');
        config = await promptCourseInfo();
        
        // Validate required fields
        if (!config.title || !config.author) {
          console.error('Error: Title and Author are required.');
          process.exit(1);
        }
      }

      // Check if directory is empty (except for .git maybe)
      const courseDir = path.resolve(options.dir);
      const existingFiles = fs.readdirSync(courseDir).filter(
        f => !f.startsWith('.') && f !== 'node_modules'
      );

      if (existingFiles.length > 0 && !options.yes) {
        console.log(`\nWarning: Directory ${courseDir} is not empty.`);
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        
        await new Promise<void>((resolve) => {
          rl.question('Continue? (y/N) ', (answer: string) => {
            rl.close();
            if (answer.toLowerCase() !== 'y') {
              console.log('Aborted.');
              process.exit(0);
            }
            resolve();
          });
        });
      }

      console.log(`\nInitializing course in: ${courseDir}\n`);
      createCourseStructure(courseDir, config);

      console.log('\n✅ Course initialized successfully!');
      console.log('\nNext steps:');
      console.log('  courselaunch build    # Build the static site');
      console.log('  courselaunch serve   # Start dev server');
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
