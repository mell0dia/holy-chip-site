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
  const xIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;

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
        <a href="https://x.com/holychipcomics" target="_blank" rel="noopener noreferrer" class="nav-x-btn" title="Follow @holychipcomics on X">${xIcon} Follow</a>
        <button class="nav-share-btn" id="nav-share" title="Share this page">${shareIcon} Share</button>
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

  function sharePage(url, title) {
    if (navigator.share) {
      navigator.share({ url, title }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => showToast('Link copied!')).catch(() => showToast('Copy: ' + url));
    }
  }

  function injectNav() {
    const container = document.getElementById('nav-container');
    if (!container) return;
    container.innerHTML = navHTML;

    const toggle  = document.getElementById('nav-toggle');
    const navList = document.getElementById('nav-list');
    const shareBtn = document.getElementById('nav-share');

    toggle.addEventListener('click', () => {
      const open = navList.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      toggle.textContent = open ? '✕' : '☰';
    });

    // Close menu when a link is tapped
    navList.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navList.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = '☰';
      });
    });

    shareBtn.addEventListener('click', () => {
      const pageTitle = document.title || 'Holy Chip';
      sharePage(window.location.href, pageTitle);
    });
  }
})();
