import { Command } from 'commander';
import express from 'express';
import chokidar from 'chokidar';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs-extra';
import { buildCourse } from '../content/walker.js';
import { renderLandingPage, renderModulePage, renderLessonPage } from '../templates/renderer.js';
import { renderMarkdown } from '../markdown/renderer.js';
import { Course, Lesson } from '../config/course.js';

interface ServeOptions {
  port?: string;
  out?: string;
}

/**
 * Live reload client script to inject into HTML pages
 */
const LIVE_RELOAD_SCRIPT = `
<script>
(function() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = wsProtocol + '//' + window.location.host + '/__ws';
  let ws = null;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;
  const reconnectDelay = 1000;

  function connect() {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log('[CourseLaunch] Max reconnect attempts reached. Live reload disabled.');
      return;
    }

    ws = new WebSocket(wsUrl);

    ws.onopen = function() {
      console.log('[CourseLaunch] Live reload connected');
      reconnectAttempts = 0;
    };

    ws.onmessage = function(event) {
      if (event.data === 'reload') {
        console.log('[CourseLaunch] Reloading...');
        window.location.reload();
      }
    };

    ws.onclose = function() {
      console.log('[CourseLaunch] Live reload disconnected');
      scheduleReconnect();
    };

    ws.onerror = function(err) {
      console.error('[CourseLaunch] WebSocket error:', err);
      ws.close();
    };
  }

  function scheduleReconnect() {
    reconnectAttempts++;
    const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttempts - 1), 30000);
    console.log('[CourseLaunch] Reconnecting in ' + delay + 'ms (attempt ' + reconnectAttempts + '/' + maxReconnectAttempts + ')');
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, delay);
  }

  // Start connection
  connect();

  // Cleanup on page unload
  window.addEventListener('beforeunload', function() {
    clearTimeout(reconnectTimer);
    if (ws) {
      ws.close();
    }
  });
})();
</script>
`;

/**
 * Inject live reload script into HTML content
 */
function injectLiveReloadScript(html: string): string {
  // Insert before closing </body> tag, or append if no body tag
  if (html.includes('</body>')) {
    return html.replace('</body>', `${LIVE_RELOAD_SCRIPT}</body>`);
  }
  // Fallback: append to end
  return html + LIVE_RELOAD_SCRIPT;
}

/**
 * Build the course site
 */
async function buildSite(rootDir: string, outputDir: string): Promise<Course | null> {
  try {
    console.log(`Building course from ${rootDir}`);

    // Build course tree
    const course = await buildCourse(rootDir);

    // Clean output directory
    if (fs.existsSync(outputDir)) {
      await fs.emptyDir(outputDir);
    }
    await fs.ensureDir(outputDir);

    // Copy static assets if they exist
    const staticDir = path.join(rootDir, 'static');
    if (fs.existsSync(staticDir)) {
      await fs.copy(staticDir, path.join(outputDir, 'static'));
    }

    // Render and write landing page
    const landingHtml = injectLiveReloadScript(renderLandingPage(course));
    await fs.writeFile(path.join(outputDir, 'index.html'), landingHtml);

    // Process each module
    for (const module of course.modules) {
      const moduleOutputDir = path.join(outputDir, module.slug);
      await fs.ensureDir(moduleOutputDir);

      // Render module index page
      const moduleHtml = injectLiveReloadScript(renderModulePage(course, module));
      await fs.writeFile(path.join(moduleOutputDir, 'index.html'), moduleHtml);

      // Process each lesson
      for (const lesson of module.lessons) {
        const renderedMarkdown = await renderMarkdown(lesson.content);
        const lessonHtml = injectLiveReloadScript(renderLessonPage(course, module, lesson, renderedMarkdown));
        const lessonFilename = `${lesson.slug}.html`;
        await fs.writeFile(path.join(moduleOutputDir, lessonFilename), lessonHtml);
      }
    }

    const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    console.log(`✓ Built ${totalLessons} lessons across ${course.modules.length} modules`);

    return course;
  } catch (error) {
    console.error('Build failed:', error);
    return null;
  }
}

/**
 * Broadcast reload message to all connected WebSocket clients
 */
function broadcastReload(wss: WebSocketServer): void {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send('reload');
    }
  });
}

export const serveCommand = new Command('serve')
  .description('Start a local dev server with live reload')
  .option('-p, --port <number>', 'port to listen on', '3000')
  .option('-o, --out <dir>', 'output directory', '_site')
  .action(async (options: ServeOptions) => {
    const port = parseInt(options.port || '3000', 10);
    const outputDir = path.resolve(process.cwd(), options.out || '_site');
    const rootDir = process.cwd();

    console.log(`Starting CourseLaunch dev server...`);
    console.log(`Port: ${port}`);
    console.log(`Output: ${outputDir}`);

    // Run initial build
    console.log('\nRunning initial build...');
    let course = await buildSite(rootDir, outputDir);

    if (!course) {
      console.error('Initial build failed. Starting server anyway...');
      // Continue to allow user to fix issues and trigger rebuild
    }

    // Create Express app
    const app = express();

    // WebSocket upgrade handling
    const server = app.listen(port, () => {
      console.log(`\n🚀 Dev server running at http://localhost:${port}`);
      console.log('Press Ctrl+C to stop\n');
    });

    // Create WebSocket server
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
      
      if (pathname === '/__ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    });

    // Serve static files from output directory
    app.use(express.static(outputDir));

    // Fallback to index.html for routes that don't match static files
    app.use((_req, res) => {
      const indexPath = path.join(outputDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Site not built yet. Waiting for initial build...');
      }
    });

    // Set up file watching
    const watchPaths = [
      'course.yaml',
      'modules/**/*',
      'static/**/*',
    ];

    const watcher = chokidar.watch(watchPaths, {
      cwd: rootDir,
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    });

    let rebuildTimeout: NodeJS.Timeout | null = null;
    const REBOUNCE_DELAY = 300; // ms

    async function triggerRebuild() {
      if (rebuildTimeout) {
        clearTimeout(rebuildTimeout);
      }

      rebuildTimeout = setTimeout(async () => {
        console.log('\n[watch] Files changed, rebuilding...');
        const newCourse = await buildSite(rootDir, outputDir);
        if (newCourse) {
          course = newCourse;
          broadcastReload(wss);
        }
      }, REBOUNCE_DELAY);
    }

    watcher
      .on('change', (filePath) => {
        console.log(`[watch] File changed: ${filePath}`);
        triggerRebuild();
      })
      .on('add', (filePath) => {
        console.log(`[watch] File added: ${filePath}`);
        triggerRebuild();
      })
      .on('unlink', (filePath) => {
        console.log(`[watch] File removed: ${filePath}`);
        triggerRebuild();
      })
      .on('error', (error) => {
        console.error('[watch] Error:', error);
      });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\nShutting down dev server...');
      watcher.close();
      wss.close();
      server.close(() => {
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      console.log('\n\nShutting down dev server...');
      watcher.close();
      wss.close();
      server.close(() => {
        process.exit(0);
      });
    });
  });
