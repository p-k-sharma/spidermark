/* ============================================
   SpiderMark — PDF Generator Module
   ============================================ */

const PdfGenerator = {
  SETTINGS_KEY: 'spidermark-pdf-settings',
  FIRST_PDF_KEY: 'spidermark-first-pdf',
  isGenerating: false,

  defaultSettings: {
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 'medium',
    fontFamily: 'sans-serif',
    fontSize: '12px',
    headerFooter: false,
    codeTheme: 'light',
    customCss: ''
  },

  init() {
    this.generateBtn = document.getElementById('generate-pdf-btn');
    this.bulkBtn = document.getElementById('bulk-pdf-btn');
    this.mergeBtn = document.getElementById('merge-pdf-btn');
    this.settingsToggle = document.getElementById('settings-toggle-btn');
    this.settingsPanel = document.getElementById('settings-panel');
    this.progressContainer = document.getElementById('progress-container');
    this.progressFill = document.getElementById('progress-fill');
    this.progressText = document.getElementById('progress-text');
    this.filenameInput = document.getElementById('filename-input');

    // Load saved settings
    this.settings = Utils.storage.get(this.SETTINGS_KEY, { ...this.defaultSettings });

    // Bind buttons
    if (this.generateBtn) {
      this.generateBtn.addEventListener('click', () => this.generateSingle());
    }
    if (this.bulkBtn) {
      this.bulkBtn.addEventListener('click', () => this.generateBulk());
    }
    if (this.mergeBtn) {
      this.mergeBtn.addEventListener('click', () => this.generateMerged());
    }
    if (this.settingsToggle) {
      this.settingsToggle.addEventListener('click', () => this.toggleSettings());
    }

    // Bind setting inputs
    this.bindSettings();
    this.applySettingsToForm();
  },

  /* ---- Settings ---- */

  toggleSettings() {
    if (this.settingsPanel) {
      this.settingsPanel.classList.toggle('open');
    }
  },

  bindSettings() {
    const inputs = {
      'setting-page-size': 'pageSize',
      'setting-orientation': 'orientation',
      'setting-margin': 'margin',
      'setting-font-family': 'fontFamily',
      'setting-font-size': 'fontSize',
      'setting-code-theme': 'codeTheme',
      'setting-custom-css': 'customCss',
    };

    Object.entries(inputs).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          this.settings[key] = el.value;
          Utils.storage.set(this.SETTINGS_KEY, this.settings);
        });
      }
    });

    const headerFooterEl = document.getElementById('setting-header-footer');
    if (headerFooterEl) {
      headerFooterEl.addEventListener('change', () => {
        this.settings.headerFooter = headerFooterEl.checked;
        Utils.storage.set(this.SETTINGS_KEY, this.settings);
      });
    }
  },

  applySettingsToForm() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    setVal('setting-page-size', this.settings.pageSize);
    setVal('setting-orientation', this.settings.orientation);
    setVal('setting-margin', this.settings.margin);
    setVal('setting-font-family', this.settings.fontFamily);
    setVal('setting-font-size', this.settings.fontSize);
    setVal('setting-code-theme', this.settings.codeTheme);
    setVal('setting-custom-css', this.settings.customCss);

    const hf = document.getElementById('setting-header-footer');
    if (hf) hf.checked = this.settings.headerFooter;
  },

  /* ---- PDF Options Builder ---- */

  getMarginMm() {
    const map = { small: 10, medium: 15, large: 25 };
    return map[this.settings.margin] || 15;
  },

  getFontStack() {
    const map = {
      'sans-serif': "'Inter', 'Helvetica Neue', Arial, sans-serif",
      'serif': "'Georgia', 'Times New Roman', serif",
      'monospace': "'JetBrains Mono', 'Fira Code', monospace"
    };
    return map[this.settings.fontFamily] || map['sans-serif'];
  },

  buildPdfStyles() {
    const isDark = this.settings.codeTheme === 'dark';
    return `
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: ${this.getFontStack()};
          font-size: ${this.settings.fontSize};
          line-height: 1.7;
          color: #1a1a2e;
          max-width: 100%;
          word-wrap: break-word;
        }
        h1 { font-size: 2em; margin: 1em 0 0.5em; border-bottom: 2px solid #e0e0e8; padding-bottom: 0.3em; }
        h2 { font-size: 1.5em; margin: 0.8em 0 0.4em; }
        h3 { font-size: 1.25em; margin: 0.6em 0 0.3em; }
        p { margin-bottom: 0.6em; }
        a { color: #2B3784; text-decoration: underline; }
        blockquote { border-left: 4px solid #E23636; margin: 1em 0; padding: 0.5em 1em; background: #f5f5f7; }
        code { font-family: 'Courier New', monospace; background: ${isDark ? '#1a1e3a' : '#f4f4f8'}; color: ${isDark ? '#e8e8f0' : '#e23636'}; padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.9em; }
        pre { background: ${isDark ? '#0e1230' : '#f4f4f8'}; color: ${isDark ? '#e8e8f0' : '#1a1a2e'}; border-radius: 6px; padding: 1em; overflow-x: auto; margin: 1em 0; border: 1px solid #e0e0e8; }
        pre code { background: none; padding: 0; color: inherit; }
        table { width: 100%; border-collapse: collapse; margin: 1em 0; }
        th, td { border: 1px solid #e0e0e8; padding: 0.5em 0.75em; text-align: left; }
        th { background: #f5f5f7; font-weight: 600; }
        img { max-width: 100%; }
        ul, ol { padding-left: 1.5em; margin: 0.5em 0; }
        hr { border: none; height: 2px; background: #e0e0e8; margin: 1.5em 0; }
        .page-break { page-break-before: always; }
        ${this.settings.customCss || ''}
      </style>
    `;
  },

  buildHtml2pdfOptions(filename) {
    const margin = this.getMarginMm();
    return {
      margin: margin,
      filename: filename + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: {
        unit: 'mm',
        format: this.settings.pageSize,
        orientation: this.settings.orientation
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
  },

  /* ---- Generation Methods ---- */

  async generateSingle() {
    const items = FileHandler.getAllContent();
    if (items.length === 0) {
      this.triggerSpiderSense();
      return;
    }

    const item = items[0];
    const filename = this.filenameInput?.value?.trim()
      ? Utils.sanitizeFilename(this.filenameInput.value.replace(/\.pdf$/i, ''))
      : Utils.sanitizeFilename(item.name);

    this.isGenerating = true;
    this.showProgress(0, `Generating ${filename}.pdf...`);

    try {
      const html = Preview.renderToHtml(item.content);
      const wrapper = this.createPdfWrapper(html);
      const options = this.buildHtml2pdfOptions(filename);

      this.showProgress(40, 'Rendering...');

      await html2pdf().set(options).from(wrapper).save();

      this.showProgress(100, 'Done!');
      this.onFirstPdf();
      Utils.showToast(`"${filename}.pdf" downloaded!`, { type: 'success' });
    } catch (err) {
      Utils.showToast(`PDF generation failed: ${err.message}`, { type: 'error' });
    } finally {
      this.isGenerating = false;
      setTimeout(() => this.hideProgress(), 2000);
    }
  },

  async generateBulk() {
    const items = FileHandler.getAllContent();
    if (items.length === 0) {
      this.triggerSpiderSense();
      return;
    }
    if (items.length === 1) {
      return this.generateSingle();
    }

    this.isGenerating = true;
    this.showProgress(0, `Generating ${items.length} PDFs...`);

    try {
      const zip = new JSZip();

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const filename = Utils.sanitizeFilename(item.name) || `document-${i + 1}`;
        const percent = Math.round(((i + 1) / items.length) * 90);
        this.showProgress(percent, `Generating ${filename}.pdf (${i + 1}/${items.length})...`);

        const html = Preview.renderToHtml(item.content);
        const wrapper = this.createPdfWrapper(html);
        const options = this.buildHtml2pdfOptions(filename);

        const pdfBlob = await html2pdf().set(options).from(wrapper).outputPdf('blob');
        zip.file(`${filename}.pdf`, pdfBlob);
      }

      this.showProgress(95, 'Zipping files...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      this.downloadBlob(zipBlob, 'spidermark-bundle.zip');

      this.showProgress(100, 'Done!');
      this.onFirstPdf();
      Utils.showToast(`Downloaded ${items.length} PDFs as zip!`, { type: 'success' });
    } catch (err) {
      Utils.showToast(`Bulk generation failed: ${err.message}`, { type: 'error' });
    } finally {
      this.isGenerating = false;
      setTimeout(() => this.hideProgress(), 2000);
    }
  },

  async generateMerged() {
    const items = FileHandler.getAllContent();
    if (items.length === 0) {
      this.triggerSpiderSense();
      return;
    }

    this.isGenerating = true;
    const filename = this.filenameInput?.value?.trim()
      ? Utils.sanitizeFilename(this.filenameInput.value.replace(/\.pdf$/i, ''))
      : 'spidermark-merged';

    this.showProgress(0, 'Merging documents...');

    try {
      // Combine all markdown with page breaks
      const combinedHtml = items.map((item, i) => {
        const html = Preview.renderToHtml(item.content);
        return (i > 0 ? '<div class="page-break"></div>' : '') + html;
      }).join('\n');

      const wrapper = this.createPdfWrapper(combinedHtml);
      const options = this.buildHtml2pdfOptions(filename);

      this.showProgress(40, 'Rendering merged PDF...');
      await html2pdf().set(options).from(wrapper).save();

      this.showProgress(100, 'Done!');
      this.onFirstPdf();
      Utils.showToast(`"${filename}.pdf" downloaded!`, { type: 'success' });
    } catch (err) {
      Utils.showToast(`Merged generation failed: ${err.message}`, { type: 'error' });
    } finally {
      this.isGenerating = false;
      setTimeout(() => this.hideProgress(), 2000);
    }
  },

  /* ---- Helpers ---- */

  createPdfWrapper(html) {
    const div = document.createElement('div');
    div.innerHTML = this.buildPdfStyles() + html;
    return div;
  },

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  showProgress(percent, text) {
    if (this.progressContainer) {
      this.progressContainer.classList.add('visible');
    }
    if (this.progressFill) {
      this.progressFill.style.width = percent + '%';
    }
    if (this.progressText) {
      this.progressText.innerHTML = `<span>${text || ''}</span><span>${percent}%</span>`;
    }
  },

  hideProgress() {
    if (this.progressContainer) {
      this.progressContainer.classList.remove('visible');
    }
  },

  triggerSpiderSense() {
    // Shake the generate button
    if (this.generateBtn) {
      this.generateBtn.classList.add('spider-sense');
      setTimeout(() => this.generateBtn.classList.remove('spider-sense'), 700);
    }
    Utils.showToast('Spider-sense tingling... your editor is empty!', { type: 'error' });
  },

  onFirstPdf() {
    const hasGenerated = Utils.storage.get(this.FIRST_PDF_KEY, false);
    if (!hasGenerated) {
      Utils.storage.set(this.FIRST_PDF_KEY, true);
      setTimeout(() => {
        Utils.showToast('With great power comes great PDFs.', { comic: true, duration: 4500 });
      }, 800);
    }
  }
};

window.PdfGenerator = PdfGenerator;
