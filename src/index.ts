#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { buildCommand } from './commands/build.js';
import { serveCommand } from './commands/serve.js';

const program = new Command();

program
  .name('courselaunch')
  .description('One-click static site generator for course materials')
  .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(buildCommand);
program.addCommand(serveCommand);

program.parse(process.argv);
