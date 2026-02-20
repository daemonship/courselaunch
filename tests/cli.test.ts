import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');

describe('courselaunch CLI skeleton', () => {
  it('shows help without error', () => {
    const result = execSync('node dist/index.js --help', {
      cwd: root,
      encoding: 'utf8',
    });
    expect(result).toContain('courselaunch');
    expect(result).toContain('init');
    expect(result).toContain('build');
    expect(result).toContain('serve');
  });

  it('shows version', () => {
    const result = execSync('node dist/index.js --version', {
      cwd: root,
      encoding: 'utf8',
    });
    expect(result.trim()).toBe('0.1.0');
  });

  it('init subcommand runs without error', () => {
    const result = execSync('node dist/index.js init --help', {
      cwd: root,
      encoding: 'utf8',
    });
    expect(result).toContain('Initialize');
  });

  it('build subcommand runs without error', () => {
    const result = execSync('node dist/index.js build --help', {
      cwd: root,
      encoding: 'utf8',
    });
    expect(result).toContain('Build');
  });

  it('serve subcommand runs without error', () => {
    const result = execSync('node dist/index.js serve --help', {
      cwd: root,
      encoding: 'utf8',
    });
    expect(result).toContain('dev server');
  });
});
