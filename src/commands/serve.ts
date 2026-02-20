import { Command } from 'commander';

export const serveCommand = new Command('serve')
  .description('Start a local dev server with live reload')
  .option('-p, --port <number>', 'port to listen on', '3000')
  .action((_options) => {
    console.log('courselaunch serve — not yet implemented');
  });
