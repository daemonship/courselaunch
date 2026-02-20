import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import http from 'http';
import { WebSocket } from 'ws';

const projectRoot = path.resolve(import.meta.dirname, '..');
const cliPath = path.join(projectRoot, 'dist', 'index.js');

/**
 * Wait for a server to be ready by polling
 */
async function waitForServer(port: number, timeout = 10000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/`, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`Status ${res.statusCode}`));
          }
        });
        req.on('error', reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      return;
    } catch {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  throw new Error(`Server did not start within ${timeout}ms`);
}

/**
 * Wait for WebSocket connection to be ready
 */
async function waitForWebSocket(port: number, timeout = 5000): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}/__ws`);
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket connection timeout'));
    }, timeout);

    ws.on('open', () => {
      clearTimeout(timer);
      resolve(ws);
    });

    ws.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * Wait for a message from WebSocket
 */
async function waitForMessage(ws: WebSocket, timeout = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Message timeout'));
    }, timeout);

    ws.once('message', (data) => {
      clearTimeout(timer);
      resolve(data.toString());
    });

    ws.once('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

describe('courselaunch serve', () => {
  let tempDir: string;
  let serverProcess: ReturnType<typeof spawn> | null = null;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'courselaunch-serve-'));
  });

  afterEach(async () => {
    // Kill server process
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      await new Promise(r => setTimeout(r, 500));
      if (!serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
      serverProcess = null;
    }

    // Cleanup temp dir
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('starts a server on default port 3000', async () => {
    // Initialize a course
    const initProcess = spawn('node', [cliPath, 'init', '-y'], {
      cwd: tempDir,
      stdio: 'pipe',
    });
    await new Promise<void>((resolve, reject) => {
      initProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Init failed with code ${code}`));
      });
    });

    // Start server
    serverProcess = spawn('node', [cliPath, 'serve'], {
      cwd: tempDir,
      stdio: 'pipe',
    });

    // Wait for server to be ready
    await waitForServer(3000);

    // Verify server is serving content
    const response = await new Promise<string>((resolve, reject) => {
      http.get('http://localhost:3000/', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });

    expect(response).toContain('<title>My Course</title>');
    expect(response).toContain('CourseLaunch');
  }, 30000);

  it('injects live reload script into HTML', async () => {
    // Initialize a course
    const initProcess = spawn('node', [cliPath, 'init', '-y'], {
      cwd: tempDir,
      stdio: 'pipe',
    });
    await new Promise<void>((resolve, reject) => {
      initProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Init failed with code ${code}`));
      });
    });

    // Start server
    serverProcess = spawn('node', [cliPath, 'serve'], {
      cwd: tempDir,
      stdio: 'pipe',
    });

    await waitForServer(3000);

    // Verify live reload script is injected
    const response = await new Promise<string>((resolve, reject) => {
      http.get('http://localhost:3000/', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });

    expect(response).toContain('WebSocket');
    expect(response).toContain('/__ws');
    expect(response).toContain('[CourseLaunch]');
  }, 30000);

  it('provides WebSocket endpoint for live reload', async () => {
    // Initialize a course
    const initProcess = spawn('node', [cliPath, 'init', '-y'], {
      cwd: tempDir,
      stdio: 'pipe',
    });
    await new Promise<void>((resolve, reject) => {
      initProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Init failed with code ${code}`));
      });
    });

    // Start server
    serverProcess = spawn('node', [cliPath, 'serve'], {
      cwd: tempDir,
      stdio: 'pipe',
    });

    await waitForServer(3000);

    // Connect to WebSocket
    const ws = await waitForWebSocket(3000);
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  }, 30000);

  it('serves on custom port with -p flag', async () => {
    const customPort = 3456;

    // Initialize a course
    const initProcess = spawn('node', [cliPath, 'init', '-y'], {
      cwd: tempDir,
      stdio: 'pipe',
    });
    await new Promise<void>((resolve, reject) => {
      initProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Init failed with code ${code}`));
      });
    });

    // Start server on custom port
    serverProcess = spawn('node', [cliPath, 'serve', '-p', String(customPort)], {
      cwd: tempDir,
      stdio: 'pipe',
    });

    await waitForServer(customPort);

    // Verify server responds on custom port
    const response = await new Promise<string>((resolve, reject) => {
      http.get(`http://localhost:${customPort}/`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });

    expect(response).toContain('<title>My Course</title>');
  }, 30000);
});
