/* ============================================
   SpiderMark — Utility Functions
   ============================================ */

const Utils = {
  /**
   * Debounce a function call
   */
  debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Format file size in human-readable form
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
  },

  /**
   * Count words in a string
   */
  wordCount(text) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  },

  /**
   * Count lines in a string
   */
  lineCount(text) {
    return text ? text.split('\n').length : 0;
  },

  /**
   * Generate a clean filename from text
   */
  sanitizeFilename(name) {
    return name
      .replace(/[^a-z0-9_\-. ]/gi, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 100);
  },

  /**
   * Get file extension
   */
  getExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  },

  /**
   * Generate unique ID
   */
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  /**
   * Show a toast notification
   */
  showToast(message, options = {}) {
    const { duration = 3500, type = 'default', comic = false } = options;
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast fade-in${comic ? ' comic' : ''}`;

    const icon = type === 'success' ? '&#x1F578;' :
                 type === 'error' ? '&#x26A0;' :
                 type === 'info' ? '&#x1F577;' : '&#x1F578;';

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * LocalStorage helpers
   */
  storage: {
    get(key, fallback = null) {
      try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn('LocalStorage write failed:', e);
      }
    },
    remove(key) {
      localStorage.removeItem(key);
    }
  },

  /**
   * Simple HTML escaping
   */
  escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, c => map[c]);
  },

  /**
   * Validate URL
   */
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }
};

// Make globally available
window.Utils = Utils;
