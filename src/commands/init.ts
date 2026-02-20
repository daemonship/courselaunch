import { Command } from 'commander';

export const initCommand = new Command('init')
  .description('Initialize a new course project in the current directory')
  .option('-y, --yes', 'skip prompts and use defaults')
  .action((_options) => {
    console.log('courselaunch init — not yet implemented');
  });
