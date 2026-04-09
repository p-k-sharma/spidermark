/* ============================================
   SpiderMark — Main Application Module
   ============================================ */

const App = {
  activeTab: 'text',

  init() {
    // Initialize all modules
    ThemeToggle.init();
    Preview.init();
    Editor.init();
    FileHandler.init();
    PdfGenerator.init();
    EasterEggs.init();

    // Tab switching
    this.initTabs();

    // Mobile preview toggle
    this.initMobileToggle();

    // Load default content if editor is empty
    if (!Editor.getContent()) {
      this.loadDefaultContent();
    }

    console.log('%c🕷️ SpiderMark loaded! %cTry the Konami Code...',
      'color: #E23636; font-size: 14px; font-weight: bold;',
      'color: #2B3784; font-size: 12px;');
  },

  /* ---- Tab Switching ---- */

  initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        this.switchTab(target);
      });
    });
  },

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.dataset.panel === tabName);
    });

    // Show/hide bulk buttons
    const bulkBtn = document.getElementById('bulk-pdf-btn');
    const mergeBtn = document.getElementById('merge-pdf-btn');
    if (bulkBtn && mergeBtn) {
      const showBulk = tabName === 'file' || tabName === 'url';
      bulkBtn.style.display = showBulk ? 'inline-flex' : 'none';
      mergeBtn.style.display = showBulk ? 'inline-flex' : 'none';
    }

    // Update preview for current tab content
    if (tabName === 'text') {
      Preview.render(Editor.getContent());
    } else if (tabName === 'file' && FileHandler.files.length > 0) {
      Preview.render(FileHandler.files[0].content);
    } else if (tabName === 'url' && FileHandler.urls.length > 0) {
      Preview.render(FileHandler.urls[0].content);
    }
  },

  getActiveTab() {
    return this.activeTab;
  },

  /* ---- Mobile Preview Toggle ---- */

  initMobileToggle() {
    const editorBtn = document.getElementById('mobile-editor-btn');
    const previewBtn = document.getElementById('mobile-preview-btn');
    const editorPanel = document.querySelector('.editor-panel');
    const previewPanel = document.querySelector('.preview-panel');

    if (!editorBtn || !previewBtn) return;

    editorBtn.addEventListener('click', () => {
      editorBtn.classList.add('active');
      previewBtn.classList.remove('active');
      if (editorPanel) editorPanel.classList.remove('mobile-hidden');
      if (previewPanel) previewPanel.classList.remove('mobile-visible');
    });

    previewBtn.addEventListener('click', () => {
      previewBtn.classList.add('active');
      editorBtn.classList.remove('active');
      if (editorPanel) editorPanel.classList.add('mobile-hidden');
      if (previewPanel) previewPanel.classList.add('mobile-visible');
      // Re-render preview with latest content
      Preview.render(Editor.getContent());
    });
  },

  /* ---- Default Sample Content ---- */

  loadDefaultContent() {
    const sample = `# Welcome to SpiderMark 🕷️

Your friendly neighborhood **Markdown-to-PDF** converter.

## Features

- **Live Preview** — See your Markdown rendered in real-time
- **Multiple Inputs** — Type, upload files, or paste URLs
- **Bulk Export** — Generate multiple PDFs at once
- **Customizable** — Page size, fonts, margins, and more

## Getting Started

1. Type or paste your Markdown in the editor
2. Customize your PDF settings (click the gear icon)
3. Hit **Generate PDF** and download!

## Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}! Welcome to SpiderMark.\`;
}

console.log(greet('Web-Head'));
\`\`\`

## A Quick Table

| Feature | Status |
| --- | --- |
| Markdown Parsing | ✅ Ready |
| PDF Generation | ✅ Ready |
| Bulk Export | ✅ Ready |
| Dark Mode | ✅ Ready |
| Easter Eggs | 🕷️ Hidden |

> *"With great power comes great PDFs."*

---

**Tip:** Try typing \`thwip\` or \`web spin\` in the editor for a surprise!
`;
    Editor.setContent(sample);
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
