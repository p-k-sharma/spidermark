/* ============================================
   SpiderMark — Markdown Editor Module
   ============================================ */

const Editor = {
  STORAGE_KEY: 'spidermark-editor-content',

  init() {
    this.textarea = document.getElementById('editor-textarea');
    this.wordCountEl = document.getElementById('word-count');
    this.lineCountEl = document.getElementById('line-count');
    this.autoSaveEl = document.getElementById('auto-save-status');

    if (!this.textarea) return;

    // Restore saved content
    const saved = Utils.storage.get(this.STORAGE_KEY, '');
    if (saved) {
      this.textarea.value = saved;
    }

    // Auto-save and stats on input
    this.textarea.addEventListener('input', Utils.debounce(() => {
      this.save();
      this.updateStats();
      Preview.render(this.getContent());
      EasterEggs.checkEditorTriggers(this.getContent());
    }, 300));

    // Immediate stats update for responsiveness
    this.textarea.addEventListener('input', () => {
      this.updateStats();
    });

    // Tab key support in textarea
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        this.textarea.value = this.textarea.value.substring(0, start) + '  ' + this.textarea.value.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + 2;
        this.textarea.dispatchEvent(new Event('input'));
      }
    });

    // Initial render
    this.updateStats();
    if (this.textarea.value) {
      Preview.render(this.getContent());
    }

    // Bind toolbar buttons
    this.initToolbar();
  },

  getContent() {
    return this.textarea ? this.textarea.value : '';
  },

  setContent(text) {
    if (this.textarea) {
      this.textarea.value = text;
      this.save();
      this.updateStats();
      Preview.render(text);
    }
  },

  save() {
    Utils.storage.set(this.STORAGE_KEY, this.getContent());
    if (this.autoSaveEl) {
      this.autoSaveEl.textContent = 'Saved';
      setTimeout(() => {
        if (this.autoSaveEl) this.autoSaveEl.textContent = '';
      }, 2000);
    }
  },

  updateStats() {
    const text = this.getContent();
    if (this.wordCountEl) this.wordCountEl.textContent = Utils.wordCount(text) + ' words';
    if (this.lineCountEl) this.lineCountEl.textContent = Utils.lineCount(text) + ' lines';
  },

  /**
   * Insert markdown syntax around selection or at cursor
   */
  insertMarkdown(before, after = '', placeholder = '') {
    const ta = this.textarea;
    if (!ta) return;

    ta.focus();
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    const text = selected || placeholder;

    const newText = ta.value.substring(0, start) + before + text + after + ta.value.substring(end);
    ta.value = newText;

    // Position cursor
    if (selected) {
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + text.length;
    } else {
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + placeholder.length;
    }

    ta.dispatchEvent(new Event('input'));
  },

  initToolbar() {
    const actions = {
      'tb-bold': () => this.insertMarkdown('**', '**', 'bold text'),
      'tb-italic': () => this.insertMarkdown('*', '*', 'italic text'),
      'tb-heading': () => this.insertMarkdown('\n## ', '\n', 'Heading'),
      'tb-link': () => this.insertMarkdown('[', '](https://)', 'link text'),
      'tb-image': () => this.insertMarkdown('![', '](https://image-url)', 'alt text'),
      'tb-code': () => this.insertMarkdown('`', '`', 'code'),
      'tb-codeblock': () => this.insertMarkdown('\n```\n', '\n```\n', 'code block'),
      'tb-quote': () => this.insertMarkdown('\n> ', '\n', 'blockquote'),
      'tb-ul': () => this.insertMarkdown('\n- ', '\n', 'list item'),
      'tb-ol': () => this.insertMarkdown('\n1. ', '\n', 'list item'),
      'tb-hr': () => this.insertMarkdown('\n---\n', '', ''),
      'tb-table': () => this.insertMarkdown('\n| Header | Header |\n| --- | --- |\n| Cell | Cell |\n', '', ''),
    };

    Object.entries(actions).forEach(([id, fn]) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', fn);
    });
  }
};

window.Editor = Editor;
