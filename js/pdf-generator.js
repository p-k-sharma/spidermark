/* ============================================
   SpiderMark — PDF Generator Module
   ============================================
   Uses iframe isolation + forced repaint to prevent
   html2canvas from corrupting the main page during
   large-content PDF rendering.

   Root cause: html2canvas creates a massive canvas
   (scale:2) that exhausts Chrome's GPU compositor
   memory, causing the main page to stop painting.
   The DOM stays intact but nothing renders visually.

   Fix: (1) Run html2pdf entirely inside a sandboxed
   iframe via an inline <script> + postMessage, so the
   main page DOM is never touched. (2) After generation,
   force a display-toggle repaint and restore scroll.
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

    this.settings = Utils.storage.get(this.SETTINGS_KEY, { ...this.defaultSettings });

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
        body { margin: 0; padding: 0; background: white; }
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

  /* ---- Core: Iframe-isolated PDF Generation ---- */

  /**
   * Force Chrome to repaint the main page after html2canvas
   * exhausts the GPU compositor's memory budget.
   *
   * html2canvas creates a canvas at 2x scale which, for large
   * documents, can be thousands of pixels tall. Chrome's compositor
   * drops the main page's paint layers to free GPU memory. The DOM
   * is intact but nothing renders (appears as a blank white page).
   *
   * The display:none → reflow → display:'' cycle forces Chrome to
   * re-create all compositor layers, restoring the visual output.
   */
  forceRepaint() {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    document.body.style.display = 'none';
    void document.body.offsetHeight;         // force synchronous reflow
    document.body.style.display = '';
    void document.body.offsetHeight;         // second reflow to re-composite

    // Restore scroll position (html2canvas may have moved it)
    window.scrollTo(scrollX, scrollY);
  },

  /**
   * Generate a PDF blob from rendered HTML using a fully sandboxed iframe.
   *
   * Strategy:
   *   1. Create a same-origin iframe with real dimensions (opacity:0).
   *   2. Write the styled HTML + an inline <script> that loads html2pdf.js
   *      and runs the conversion entirely inside the iframe.
   *   3. The iframe posts the PDF as a base64 string back via postMessage.
   *   4. Parent converts base64 → Blob and cleans up the iframe.
   *
   * Because html2pdf (and html2canvas) run inside the iframe's document,
   * the main page's DOM is never cloned and scroll/paint state is preserved.
   *
   * @param {string} html  – Rendered HTML content (from Preview.renderToHtml)
   * @param {string} filename – Base filename (without .pdf extension)
   * @returns {Promise<Blob>} – The generated PDF as a Blob
   */
  generatePdfBlob(html, filename) {
    const margin   = this.getMarginMm();
    const styles   = this.buildPdfStyles();
    const font     = this.getFontStack();
    const fontSize = this.settings.fontSize;
    const pageSize = this.settings.pageSize;
    const orient   = this.settings.orientation;

    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      // Real dimensions so html2canvas has a visible render target.
      // opacity:0 hides it from the user; pointer-events:none makes it inert.
      iframe.style.cssText =
        'position:fixed;left:0;top:0;width:794px;height:1123px;' +
        'opacity:0;pointer-events:none;z-index:-9999;border:none;';

      /* -- message listener (receives PDF data from iframe) -- */
      const onMessage = (event) => {
        if (!event.data || event.data.type !== 'spidermark-pdf-result') return;
        window.removeEventListener('message', onMessage);
        cleanup();

        if (event.data.error) {
          return reject(new Error(event.data.error));
        }

        // base64 → Uint8Array → Blob
        const raw   = atob(event.data.pdfBase64);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        resolve(new Blob([bytes], { type: 'application/pdf' }));
      };
      window.addEventListener('message', onMessage);

      /* -- safety timeout -- */
      const timer = setTimeout(() => {
        window.removeEventListener('message', onMessage);
        cleanup();
        reject(new Error('PDF generation timed out (30 s)'));
      }, 30000);

      function cleanup() {
        clearTimeout(timer);
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }

      /* -- build the iframe document -- */
      document.body.appendChild(iframe);
      const iDoc = iframe.contentDocument || iframe.contentWindow.document;

      // We escape </script> inside the template to avoid prematurely closing the outer tag.
      iDoc.open();
      iDoc.write(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
${styles}
<style>
html, body {
  margin: 0; padding: 0;
  background: white; color: #1a1a2e;
  font-family: ${font};
  font-size: ${fontSize};
  line-height: 1.7;
}
#pdf-content { padding: 20px; }
</style>
</head>
<body>
<div id="pdf-content">${html}</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
<script>
window.addEventListener('load', function () {
  setTimeout(function () {
    var target = document.getElementById('pdf-content');
    if (!target || typeof html2pdf === 'undefined') {
      parent.postMessage({ type: 'spidermark-pdf-result', error: 'iframe setup failed' }, '*');
      return;
    }
    html2pdf().set({
      margin: ${margin},
      filename: '${filename}.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: '${pageSize}', orientation: '${orient}' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    })
    .from(target)
    .outputPdf('datauristring')
    .then(function (dataUri) {
      var b64 = dataUri.split(',')[1];
      parent.postMessage({ type: 'spidermark-pdf-result', pdfBase64: b64 }, '*');
    })
    .catch(function (err) {
      parent.postMessage({ type: 'spidermark-pdf-result', error: err.message || 'render failed' }, '*');
    });
  }, 400);   // allow fonts & images to settle
});
<\/script>
</body>
</html>`);
      iDoc.close();
    });
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
      this.showProgress(20, 'Rendering in isolated frame...');

      const blob = await this.generatePdfBlob(html, filename);

      // Force repaint — html2canvas may have corrupted Chrome's compositor
      this.forceRepaint();

      this.showProgress(90, 'Downloading...');
      this.downloadBlob(blob, filename + '.pdf');

      this.showProgress(100, 'Done!');
      this.onFirstPdf();
      Utils.showToast(`"${filename}.pdf" downloaded!`, { type: 'success' });
    } catch (err) {
      this.forceRepaint();
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
        const pdfBlob = await this.generatePdfBlob(html, filename);

        // Repaint between each PDF to keep the page responsive
        this.forceRepaint();

        zip.file(`${filename}.pdf`, pdfBlob);
      }

      this.showProgress(95, 'Zipping files...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      this.downloadBlob(zipBlob, 'spidermark-bundle.zip');

      this.showProgress(100, 'Done!');
      this.onFirstPdf();
      Utils.showToast(`Downloaded ${items.length} PDFs as zip!`, { type: 'success' });
    } catch (err) {
      this.forceRepaint();
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
      const combinedHtml = items.map((item, i) => {
        const html = Preview.renderToHtml(item.content);
        return (i > 0 ? '<div class="page-break"></div>' : '') + html;
      }).join('\n');

      this.showProgress(20, 'Rendering merged PDF...');

      const blob = await this.generatePdfBlob(combinedHtml, filename);
      this.forceRepaint();

      this.showProgress(90, 'Downloading...');
      this.downloadBlob(blob, filename + '.pdf');

      this.showProgress(100, 'Done!');
      this.onFirstPdf();
      Utils.showToast(`"${filename}.pdf" downloaded!`, { type: 'success' });
    } catch (err) {
      this.forceRepaint();
      Utils.showToast(`Merged generation failed: ${err.message}`, { type: 'error' });
    } finally {
      this.isGenerating = false;
      setTimeout(() => this.hideProgress(), 2000);
    }
  },

  /* ---- Helpers ---- */

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
