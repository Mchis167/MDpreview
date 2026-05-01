import { marked } from 'marked';
import hljs from 'highlight.js';

/**
 * Custom renderer port from MDpreview server
 */
export function render(content) {
  marked.setOptions({
    highlight: function (code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (_) { }
      }
      return hljs.highlightAuto(code).value;
    },
    langPrefix: 'hljs language-'
  });

  return marked.parse(content);
}