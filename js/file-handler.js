/* ============================================
   SpiderMark — File Upload & URL Handler
   ============================================ */

const FileHandler = {
  files: [],      // Array of { id, name, size, content }
  urls: [],       // Array of { id, url, content, name }

  init() {
    this.dropZone = document.getElementById('file-drop-zone');
    this.fileInput = document.getElementById('file-input');
    this.fileList = document.getElementById('file-list');
    this.urlList = document.getElementById('url-list');
    this.urlInput = document.getElementById('url-input-field');
    this.addUrlBtn = document.getElementById('add-url-btn');


    if (this.dropZone) this.initDropZone();
    if (this.addUrlBtn) this.initUrlInput();
  },

  /* ---- File Upload ---- */

  initDropZone() {
    const zone = this.dropZone;

    // Click to browse
    zone.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
      this.fileInput.value = '';
    });

    // Drag events
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      this.handleFiles(e.dataTransfer.files);
    });
  },

  async handleFiles(fileList) {
    const allowed = ['md', 'markdown', 'txt', 'html', 'htm'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    let totalSize = this.files.reduce((s, f) => s + f.size, 0);

    for (const file of fileList) {
      const ext = Utils.getExtension(file.name);
      if (!allowed.includes(ext)) {
        Utils.showToast(`Skipped "${file.name}" — unsupported format. Use .md, .txt, or .html`, { type: 'error' });
        continue;
      }
      if (file.size > maxSize) {
        Utils.showToast(`Skipped "${file.name}" — exceeds 5MB limit`, { type: 'error' });
        continue;
      }
      totalSize += file.size;
      if (totalSize > 20 * 1024 * 1024) {
        Utils.showToast('Total batch size exceeds 20MB limit', { type: 'error' });
        break;
      }

      const content = await this.readFile(file);
      this.files.push({
        id: Utils.uid(),
        name: file.name,
        size: file.size,
        content: content
      });
    }

    this.renderFileList();

    // Preview the first file if only one
    if (this.files.length === 1) {
      Preview.render(this.files[0].content);
    }
  },

  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  },

  removeFile(id) {
    this.files = this.files.filter(f => f.id !== id);
    this.renderFileList();
  },

  renderFileList() {
    if (!this.fileList) return;

    if (this.files.length === 0) {
      this.fileList.innerHTML = '';
      return;
    }

    this.fileList.innerHTML = this.files.map(f => `
      <div class="file-item fade-in" data-id="${f.id}">
        <div class="file-item-info">
          <svg class="file-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span class="file-item-name">${Utils.escapeHtml(f.name)}</span>
          <span class="file-item-size">${Utils.formatFileSize(f.size)}</span>
        </div>
        <button class="file-item-remove" aria-label="Remove ${Utils.escapeHtml(f.name)}" onclick="FileHandler.removeFile('${f.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `).join('');
  },

  /* ---- URL Fetching ---- */

  initUrlInput() {
    this.addUrlBtn.addEventListener('click', () => this.fetchUrl());
    this.urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.fetchUrl();
    });
  },

  async fetchUrl() {
    const url = this.urlInput.value.trim();
    if (!url) return;

    if (!Utils.isValidUrl(url)) {
      Utils.showToast('Please enter a valid URL', { type: 'error' });
      return;
    }

    this.addUrlBtn.disabled = true;
    this.addUrlBtn.innerHTML = '<span class="spinner"></span>';

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const content = await response.text();

      // Derive name from URL
      const urlParts = url.split('/');
      const name = urlParts[urlParts.length - 1] || 'untitled.md';

      this.urls.push({
        id: Utils.uid(),
        url: url,
        content: content,
        name: name
      });

      this.urlInput.value = '';
      this.renderUrlList();
      Preview.render(content);
      Utils.showToast(`Fetched "${name}" successfully`, { type: 'success' });
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        Utils.showToast('CORS error: Try using a raw file URL (e.g., raw.githubusercontent.com) or download the file instead.', { type: 'error', duration: 5000 });
      } else {
        Utils.showToast(`Failed to fetch: ${err.message}`, { type: 'error' });
      }
    } finally {
      this.addUrlBtn.disabled = false;
      this.addUrlBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Fetch';
    }
  },

  removeUrl(id) {
    this.urls = this.urls.filter(u => u.id !== id);
    this.renderUrlList();
  },

  renderUrlList() {
    if (!this.urlList) return;

    if (this.urls.length === 0) {
      this.urlList.innerHTML = '';
      return;
    }

    this.urlList.innerHTML = this.urls.map(u => `
      <div class="file-item fade-in" data-id="${u.id}">
        <div class="file-item-info">
          <svg class="file-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          <span class="file-item-name">${Utils.escapeHtml(u.name)}</span>
        </div>
        <button class="file-item-remove" aria-label="Remove URL" onclick="FileHandler.removeUrl('${u.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `).join('');
  },

  /**
   * Get all loaded content for PDF generation
   * Returns array of { name, content }
   */
  getAllContent() {
    const items = [];
    const activeTab = App.getActiveTab();

    if (activeTab === 'text') {
      const content = Editor.getContent();
      if (content.trim()) {
        items.push({ name: 'spidermark-output', content });
      }
    } else if (activeTab === 'file') {
      this.files.forEach(f => {
        items.push({ name: f.name.replace(/\.[^.]+$/, ''), content: f.content });
      });
    } else if (activeTab === 'url') {
      this.urls.forEach(u => {
        items.push({ name: u.name.replace(/\.[^.]+$/, ''), content: u.content });
      });
    }

    return items;
  }
};

window.FileHandler = FileHandler;
