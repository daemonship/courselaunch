import { Command } from 'commander';

export const buildCommand = new Command('build')
  .description('Build the course into a static site in _site/')
  .option('-o, --out <dir>', 'output directory', '_site')
  .action((_options) => {
    console.log('courselaunch build — not yet implemented');
  });
