/* ============================================
   SpiderMark — Live Preview Module
   ============================================ */

const Preview = {
  init() {
    this.container = document.getElementById('preview-content');
    this.emptyState = document.getElementById('preview-empty');
  },

  /**
   * Render markdown string to the preview panel
   */
  render(markdown) {
    if (!this.container) return;

    if (!markdown || !markdown.trim()) {
      this.container.innerHTML = '';
      if (this.emptyState) this.emptyState.style.display = 'flex';
      return;
    }

    if (this.emptyState) this.emptyState.style.display = 'none';

    // Parse markdown using markdown-it
    if (window.markdownit) {
      const md = window.markdownit({
        html: false,
        linkify: true,
        typographer: true,
        breaks: true,
        highlight: function (str, lang) {
          if (lang && window.hljs && hljs.getLanguage(lang)) {
            try {
              return '<pre class="hljs"><code>' +
                hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                '</code></pre>';
            } catch (__) {}
          }
          return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
        }
      });

      // Enable strikethrough, task lists
      md.enable(['strikethrough']);

      let html = md.render(markdown);

      // Task lists: convert [ ] and [x] patterns
      html = html.replace(/<li>\[x\]/gi, '<li><input type="checkbox" checked disabled>');
      html = html.replace(/<li>\[ \]/gi, '<li><input type="checkbox" disabled>');

      // Sanitize with DOMPurify
      if (window.DOMPurify) {
        html = DOMPurify.sanitize(html, {
          ADD_ATTR: ['target', 'checked', 'disabled'],
          ADD_TAGS: ['input']
        });
      }

      this.container.innerHTML = html;
    } else {
      // Fallback: just show escaped text
      this.container.innerHTML = '<pre>' + Utils.escapeHtml(markdown) + '</pre>';
    }

    // Apply syntax highlighting to any unprocessed code blocks
    if (window.hljs) {
      this.container.querySelectorAll('pre code:not(.hljs)').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  },

  /**
   * Get the rendered HTML (for PDF generation)
   */
  getHtml() {
    return this.container ? this.container.innerHTML : '';
  },

  /**
   * Render a specific markdown string and return the HTML
   * without affecting the preview panel
   */
  renderToHtml(markdown) {
    if (!window.markdownit) return Utils.escapeHtml(markdown);

    const md = window.markdownit({
      html: false,
      linkify: true,
      typographer: true,
      breaks: true,
      highlight: function (str, lang) {
        if (lang && window.hljs && hljs.getLanguage(lang)) {
          try {
            return '<pre class="hljs"><code>' +
              hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
              '</code></pre>';
          } catch (__) {}
        }
        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
      }
    });

    md.enable(['strikethrough']);
    let html = md.render(markdown);
    html = html.replace(/<li>\[x\]/gi, '<li><input type="checkbox" checked disabled>');
    html = html.replace(/<li>\[ \]/gi, '<li><input type="checkbox" disabled>');

    if (window.DOMPurify) {
      html = DOMPurify.sanitize(html, {
        ADD_ATTR: ['target', 'checked', 'disabled'],
        ADD_TAGS: ['input']
      });
    }

    return html;
  }
};

window.Preview = Preview;
