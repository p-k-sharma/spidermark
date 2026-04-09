# SpiderMark

**Your friendly neighborhood Markdown-to-PDF converter.**

A free, open-source, fully client-side web app that converts Markdown into beautifully formatted PDFs. No server, no database, no sign-up — just paste, customize, and download. Themed after everyone's favorite web-slinger.

![SpiderMark Screenshot](https://img.shields.io/badge/SpiderMark-v1.0-E23636?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0id2hpdGUiPjxjaXJjbGUgY3g9IjMyIiBjeT0iMjgiIHI9IjEwIi8+PGNpcmNsZSBjeD0iMzIiIGN5PSI0MiIgcj0iMTQiLz48L3N2Zz4=)

## Features

- **Three Input Methods** — Type Markdown, upload files (.md, .txt, .html), or fetch from URLs
- **Live Preview** — Real-time rendered preview with syntax highlighting
- **PDF Generation** — Single file, bulk (zipped), or merged PDF downloads
- **Customizable Output** — Page size, orientation, margins, fonts, code theme, custom CSS
- **Dark / Light Mode** — Smooth theme switching with persistent preference (the dark theme is symbiote-inspired)
- **Responsive** — Works on desktop, tablet, and mobile
- **Accessible** — Keyboard navigable, ARIA labels, screen reader friendly
- **Auto-Save** — Your editor content is saved to localStorage automatically
- **Zero Dependencies on Server** — 100% client-side, host anywhere static files are served

## Easter Eggs

There are hidden surprises throughout the app. Here are some hints:

- Try typing certain words in the editor...
- The Konami Code still works in 2026
- Click the spider logo rapidly
- Check the URL hash
- Generate your first PDF for a special message

## Tech Stack

All libraries loaded via CDN — no build step required:

- **markdown-it** — Markdown parsing (CommonMark + GFM)
- **highlight.js** — Syntax highlighting for code blocks
- **html2pdf.js** — Client-side PDF generation (html2canvas + jsPDF)
- **JSZip** — Bulk PDF bundling into zip archives
- **DOMPurify** — HTML sanitization
- **Google Fonts** — Bebas Neue, Inter, JetBrains Mono

## Deploy Your Own

1. **Fork** this repository
2. Go to **Settings** > **Pages**
3. Under "Source", select **Deploy from a branch**
4. Choose `main` branch and `/ (root)` folder
5. Click **Save**
6. Your site will be live at `https://yourusername.github.io/spidermark/`

That's it. No build step, no CI/CD, no environment variables.

## Local Development

Just open `index.html` in your browser:

```bash
# Clone the repo
git clone https://github.com/yourusername/spidermark.git
cd spidermark

# Open in browser (macOS)
open index.html

# Or use any local server
npx serve .
```

## Project Structure

```
spidermark/
├── index.html           # Main entry point
├── css/
│   ├── style.css        # Core layout & component styles
│   ├── themes.css       # Light/dark mode CSS variables
│   ├── animations.css   # Easter egg & UI animations
│   └── responsive.css   # Mobile/tablet breakpoints
├── js/
│   ├── utils.js         # Helpers (debounce, storage, formatting)
│   ├── theme-toggle.js  # Dark/light mode switching
│   ├── editor.js        # Markdown editor + toolbar
│   ├── preview.js       # Live preview rendering
│   ├── file-handler.js  # File upload & URL fetching
│   ├── pdf-generator.js # PDF generation & settings
│   ├── easter-eggs.js   # Fun hidden features
│   └── app.js           # Main orchestration
├── assets/
│   ├── spider-icon.svg  # Logo & favicon
│   ├── web-pattern.svg  # Background texture
│   └── spidey-silhouette.svg
├── README.md
├── LICENSE
└── .nojekyll
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT License. See [LICENSE](LICENSE) for details.

---

*"With great power comes great PDFs."*
