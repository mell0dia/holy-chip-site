// Holy Chip - Shared Navigation Component

(function() {
  const inSubdir = window.location.pathname.includes('/history/') || window.location.pathname.includes('/origins/');
  const pathPrefix = inSubdir ? '../' : '';

  const navItems = [
    { label: 'Stories', href: 'stories.html' },
    { label: 'Origins', href: 'origins/'     },
    { label: 'NFTs',    href: 'nfts.html'    },
    { label: 'Builder', href: 'builder.html', accent: true },
    { label: 'History', href: 'history/'     },
    { label: 'Store',   href: 'store.html'   }
  ];

  const pathname    = window.location.pathname;
  const currentPage = pathname.split('/').pop() || 'index.html';

  const shareIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>`;
  const xIcon  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
  const fbIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.408.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.464.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.408 0 22.675 0z"/></svg>`;
  const igIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;
  const copyIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

  const navHTML = `
    <nav class="site-nav">
      <a href="${pathPrefix}index.html" class="nav-logo">
        Holy Chip !!
      </a>
      <ul class="nav-list" id="nav-list">
        ${navItems.map(item => {
          const isActive = currentPage === item.href ||
                           (item.href === 'history/' && pathname.includes('history')) ||
                           (item.href === 'origins/' && pathname.includes('origins'));
          return `<li class="nav-item">
            <a href="${pathPrefix}${item.href}" class="nav-link${isActive ? ' active' : ''}${item.accent ? ' accent' : ''}">${item.label}</a>
          </li>`;
        }).join('')}
      </ul>
      <div class="nav-right">
        <div class="nav-socials">
          <a href="https://x.com/holychipcomics" target="_blank" rel="noopener noreferrer" class="nav-social" title="@holychipcomics on X" aria-label="X">${xIcon}</a>
          <a href="https://facebook.com/hlchip" target="_blank" rel="noopener noreferrer" class="nav-social" title="Holy Chip on Facebook" aria-label="Facebook">${fbIcon}</a>
          <a href="https://instagram.com/holychipcomics" target="_blank" rel="noopener noreferrer" class="nav-social" title="@holychipcomics on Instagram" aria-label="Instagram">${igIcon}</a>
        </div>
        <div class="nav-share-wrap">
          <button class="nav-share-btn" id="nav-share" title="Share this page" aria-haspopup="true" aria-expanded="false">${shareIcon} Share</button>
          <div class="nav-share-menu" id="nav-share-menu" hidden>
            <button class="nav-share-opt" data-action="copy">${copyIcon}<span>Copy Link</span></button>
            <button class="nav-share-opt" data-action="x">${xIcon}<span>Post on X</span></button>
            <button class="nav-share-opt" data-action="fb">${fbIcon}<span>Share on Facebook</span></button>
          </div>
        </div>
        <button class="nav-toggle" id="nav-toggle" aria-label="Toggle menu" aria-expanded="false">☰</button>
      </div>
    </nav>
  `;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNav);
  } else {
    injectNav();
  }

  function showToast(msg) {
    let toast = document.getElementById('hc-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'hc-toast';
      toast.className = 'hc-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function shareTo(action, url, title) {
    if (action === 'copy') {
      navigator.clipboard.writeText(url).then(
        () => showToast('Link copied!'),
        () => showToast('Copy: ' + url)
      );
    } else if (action === 'x') {
      const tweetURL = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}&via=holychipcomics`;
      window.open(tweetURL, '_blank', 'noopener,noreferrer,width=550,height=420');
    } else if (action === 'fb') {
      const fbURL = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      window.open(fbURL, '_blank', 'noopener,noreferrer,width=600,height=500');
    }
  }

  function injectNav() {
    const container = document.getElementById('nav-container');
    if (!container) return;
    container.innerHTML = navHTML;

    const toggle    = document.getElementById('nav-toggle');
    const navList   = document.getElementById('nav-list');
    const shareBtn  = document.getElementById('nav-share');
    const shareMenu = document.getElementById('nav-share-menu');

    toggle.addEventListener('click', () => {
      const open = navList.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      toggle.textContent = open ? '✕' : '☰';
    });

    navList.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navList.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = '☰';
      });
    });

    function closeShareMenu() {
      shareMenu.hidden = true;
      shareBtn.setAttribute('aria-expanded', 'false');
    }

    shareBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = shareMenu.hidden;
      shareMenu.hidden = !open;
      shareBtn.setAttribute('aria-expanded', open);
    });

    shareMenu.querySelectorAll('.nav-share-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const pageTitle = document.title || 'Holy Chip';
        shareTo(action, window.location.href, pageTitle);
        closeShareMenu();
      });
    });

    document.addEventListener('click', (e) => {
      if (!shareMenu.contains(e.target) && !shareBtn.contains(e.target)) {
        closeShareMenu();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeShareMenu();
    });
  }
})();
