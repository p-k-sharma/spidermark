/* ============================================
   SpiderMark — Easter Eggs & Fun Features
   ============================================ */

const EasterEggs = {
  konamiSequence: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
  konamiIndex: 0,
  logoClickCount: 0,
  logoClickTimer: null,

  init() {
    // Konami code listener
    document.addEventListener('keydown', (e) => this.handleKonami(e));

    // Logo click counter (Spider-Verse)
    const logo = document.getElementById('logo-icon');
    if (logo) {
      logo.addEventListener('click', () => this.handleLogoClick());
    }

    // Hash-based trigger (#spidey)
    this.checkHash();
    window.addEventListener('hashchange', () => this.checkHash());

    // Scroll-to-top button
    this.initScrollTop();
  },

  /* ---- 1. Thwip Cursor Trail ---- */
  triggerThwip() {
    const textarea = document.getElementById('editor-textarea');
    if (!textarea) return;

    // Get approximate cursor position (use textarea bounding rect)
    const rect = textarea.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 3;

    // Create web lines shooting out in multiple directions
    const angles = [-30, -15, 0, 15, 30];
    angles.forEach((angle, i) => {
      setTimeout(() => {
        const line = document.createElement('div');
        line.className = 'thwip-line';
        line.style.left = x + 'px';
        line.style.top = y + 'px';
        line.style.width = (80 + Math.random() * 60) + 'px';
        line.style.transform = `rotate(${angle}deg)`;
        document.body.appendChild(line);
        setTimeout(() => line.remove(), 600);
      }, i * 50);
    });

    // Central flash
    const dot = document.createElement('div');
    dot.className = 'thwip-trail';
    dot.style.left = (x - 2) + 'px';
    dot.style.top = (y - 2) + 'px';
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 400);
  },

  /* ---- 2. Spider-Sense (handled in PdfGenerator.triggerSpiderSense) ---- */

  /* ---- 3. Web Spin (barrel roll) ---- */
  triggerWebSpin() {
    if (document.body.classList.contains('web-spinning')) return;
    document.body.classList.add('web-spinning');
    setTimeout(() => document.body.classList.remove('web-spinning'), 1500);
  },

  /* ---- 4. Konami Code — Comic Book Mode ---- */
  handleKonami(e) {
    const expected = this.konamiSequence[this.konamiIndex];
    if (e.key === expected || e.key.toLowerCase() === expected) {
      this.konamiIndex++;
      if (this.konamiIndex === this.konamiSequence.length) {
        this.konamiIndex = 0;
        this.triggerComicMode();
      }
    } else {
      this.konamiIndex = 0;
    }
  },

  triggerComicMode() {
    // Add comic dot pattern
    document.body.classList.add('comic-mode');

    // Swing Spidey across the screen
    this.swingSpidey();

    // Add comic labels to buttons
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    const labels = ['POW!', 'THWIP!', 'ZAP!', 'WHAM!', 'BANG!'];
    const addedLabels = [];

    buttons.forEach((btn, i) => {
      const label = document.createElement('span');
      label.className = 'comic-label';
      label.textContent = labels[i % labels.length];
      label.style.top = '-20px';
      label.style.right = '-10px';
      btn.style.position = 'relative';
      btn.appendChild(label);
      addedLabels.push(label);
    });

    // Revert after 5 seconds
    setTimeout(() => {
      document.body.classList.remove('comic-mode');
      addedLabels.forEach(l => l.remove());
    }, 5000);

    Utils.showToast('Konami Code activated! Comic mode!', { type: 'success', comic: true });
  },

  swingSpidey() {
    const spidey = document.createElement('div');
    spidey.className = 'spidey-swing';
    spidey.innerHTML = `<svg viewBox="0 0 80 120" fill="currentColor">
      <ellipse cx="40" cy="18" rx="12" ry="14"/>
      <path d="M28 30 Q26 50 30 65 L40 68 L50 65 Q54 50 52 30 Z"/>
      <path d="M52 34 Q65 28 78 18 L76 22 Q64 32 52 38 Z"/>
      <path d="M28 34 Q20 45 16 58 L20 58 Q24 46 30 38 Z"/>
      <path d="M44 65 Q50 85 52 105 L48 106 Q46 86 42 68 Z"/>
      <path d="M36 65 Q30 85 28 105 L32 106 Q34 86 38 68 Z"/>
      <line x1="78" y1="18" x2="80" y2="0" stroke="currentColor" stroke-width="1.5"/>
      <ellipse cx="35" cy="15" rx="4" ry="5" fill="white" opacity="0.9" transform="rotate(-8 35 15)"/>
      <ellipse cx="45" cy="15" rx="4" ry="5" fill="white" opacity="0.9" transform="rotate(8 45 15)"/>
    </svg>`;
    document.body.appendChild(spidey);
    setTimeout(() => spidey.remove(), 2500);
  },

  /* ---- 5. "With Great Power..." Toast ---- */
  // Handled in PdfGenerator.onFirstPdf()

  /* ---- 6. Web-Slinger Drag & Drop ---- */
  // Visual effects handled in CSS (drag-over states)

  /* ---- 7. Spider-Verse Glitch Theme ---- */
  handleLogoClick() {
    this.logoClickCount++;
    clearTimeout(this.logoClickTimer);

    this.logoClickTimer = setTimeout(() => {
      this.logoClickCount = 0;
    }, 1500);

    if (this.logoClickCount >= 5) {
      this.logoClickCount = 0;
      this.triggerSpiderVerse();
    }
  },

  triggerSpiderVerse() {
    // Add glitch theme
    document.body.classList.add('spiderverse-active');

    // Add halftone overlay
    const overlay = document.createElement('div');
    overlay.className = 'halftone-overlay';
    document.body.appendChild(overlay);

    Utils.showToast('Welcome to the Spider-Verse!', { type: 'success', comic: true });

    // Revert after 8 seconds
    setTimeout(() => {
      document.body.classList.remove('spiderverse-active');
      overlay.remove();
    }, 8000);
  },

  /* ---- 8. Upside Down Mode ---- */
  triggerUpsideDown() {
    if (document.body.classList.contains('upside-down')) return;
    document.body.classList.add('upside-down');
    setTimeout(() => document.body.classList.remove('upside-down'), 3000);
  },

  checkHash() {
    if (window.location.hash === '#spidey') {
      this.triggerUpsideDown();
      // Clear hash after triggering
      history.replaceState(null, '', window.location.pathname);
    }
  },

  /* ---- Editor Content Triggers ---- */
  checkEditorTriggers(content) {
    const lines = content.split('\n');
    const lastLine = lines[lines.length - 1]?.toLowerCase().trim() || '';

    // Check for "thwip" typed
    if (lastLine.endsWith('thwip')) {
      this.triggerThwip();
    }

    // Check for "web spin"
    if (lastLine.endsWith('web spin')) {
      this.triggerWebSpin();
    }

    // Check for "spidey"
    if (lastLine.endsWith('spidey')) {
      this.triggerUpsideDown();
    }
  },

  /* ---- Scroll to Top Button (Spider descending on web) ---- */
  initScrollTop() {
    const btn = document.getElementById('scroll-top-btn');
    if (!btn) return;

    window.addEventListener('scroll', Utils.debounce(() => {
      if (window.scrollY > 300) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, 100));

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
};

window.EasterEggs = EasterEggs;
