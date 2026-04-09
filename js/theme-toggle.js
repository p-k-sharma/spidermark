/* ============================================
   SpiderMark — Theme Toggle (Dark/Light)
   ============================================ */

const ThemeToggle = {
  STORAGE_KEY: 'spidermark-theme',

  init() {
    this.toggle = document.getElementById('theme-toggle');
    if (!this.toggle) return;

    // Determine initial theme
    const saved = Utils.storage.get(this.STORAGE_KEY);
    if (saved) {
      this.setTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.setTheme('dark');
    } else {
      this.setTheme('light');
    }

    // Bind click
    this.toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      this.setTheme(next);
      Utils.storage.set(this.STORAGE_KEY, next);
    });

    this.toggle.setAttribute('role', 'switch');
    this.toggle.setAttribute('tabindex', '0');
    this.toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle.click();
      }
    });

    // Listen for OS preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!Utils.storage.get(this.STORAGE_KEY)) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  },

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    if (this.toggle) {
      this.toggle.setAttribute('aria-label', label);
      this.toggle.setAttribute('aria-checked', theme === 'dark');
    }
  },

  getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }
};

window.ThemeToggle = ThemeToggle;
