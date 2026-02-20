/**
 * Markdown rendering with syntax highlighting via shiki
 */

import MarkdownIt from 'markdown-it';
import { createHighlighter, Highlighter } from 'shiki';

let highlighterPromise: Promise<Highlighter> | null = null;

/**
 * Get or create a shiki highlighter with a curated set of languages
 */
async function getHighlighter(): Promise<Highlighter> {
  if (highlighterPromise) {
    return highlighterPromise;
  }

  highlighterPromise = createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: [
      'javascript',
      'typescript',
      'python',
      'java',
      'c',
      'cpp',
      'csharp',
      'go',
      'rust',
      'html',
      'css',
      'json',
      'yaml',
      'bash',
      'shell',
      'sql',
      'markdown',
    ],
  });

  return highlighterPromise;
}

/**
 * Add class to a shiki-generated HTML string
 */
function addClassToShikiHtml(html: string, className: string): string {
  // Shiki returns <pre style="..."><code>...</code></pre>
  // We want to add a class to the pre element
  return html.replace('<pre style="', `<pre class="${className}" style="`);
}

/**
 * Render markdown content to HTML with syntax highlighting
 */
export async function renderMarkdown(
  content: string,
  options: { highlightCodeBlocks?: boolean } = {}
): Promise<string> {
  const { highlightCodeBlocks = true } = options;
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  });

  if (highlightCodeBlocks) {
    const highlighter = await getHighlighter();
    md.options.highlight = (code: string, lang: string) => {
      console.log(`Highlighting code block lang="${lang}" length=${code.length}`);
      // If language is not supported, treat as plain text
      if (!lang || !highlighter.getLoadedLanguages().includes(lang as any)) {
        // Escape HTML entities to avoid XSS
        return `<pre><code>${md.utils.escapeHtml(code)}</code></pre>`;
      }

      // Highlight with both light and dark themes
      const light = highlighter.codeToHtml(code, {
        lang,
        theme: 'github-light',
      });
      const dark = highlighter.codeToHtml(code, {
        lang,
        theme: 'github-dark',
      });

      // Add theme-specific classes
      const lightWithClass = addClassToShikiHtml(light, 'shiki shiki-light');
      const darkWithClass = addClassToShikiHtml(dark, 'shiki shiki-dark');

      // Wrap in a container with theme switching support
      return `<div class="shiki-container">${lightWithClass}${darkWithClass}</div>`;
    };
  }

  return md.render(content);
}