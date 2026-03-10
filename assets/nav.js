// Holy Chip - Shared Navigation Component

(function() {
  const inSubdir = window.location.pathname.includes('/history/');
  const pathPrefix = inSubdir ? '../' : '';

  const navItems = [
    { label: 'Store',   href: 'store.html'  },
    { label: 'NFTs',    href: 'nfts.html'   },
    { label: 'Stories', href: 'stories.html'},
    { label: 'History', href: 'history/'    }
  ];

  const pathname    = window.location.pathname;
  const currentPage = pathname.split('/').pop() || 'index.html';

  const navHTML = `
    <nav class="site-nav">
      <a href="${pathPrefix}index.html" class="nav-logo">
        <img src="${pathPrefix}assets/logo.jpg" alt="Holy Chip"
             style="height:36px;vertical-align:middle;margin-right:.5rem;border-radius:4px;"/>
        Holy Chip
      </a>
      <button class="nav-toggle" id="nav-toggle" aria-label="Toggle menu" aria-expanded="false">☰</button>
      <ul class="nav-list" id="nav-list">
        ${navItems.map(item => {
          const isActive = currentPage === item.href ||
                           (item.href === 'history/' && pathname.includes('history'));
          return `<li class="nav-item">
            <a href="${pathPrefix}${item.href}" class="nav-link${isActive ? ' active' : ''}">${item.label}</a>
          </li>`;
        }).join('')}
      </ul>
    </nav>
  `;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNav);
  } else {
    injectNav();
  }

  function injectNav() {
    const container = document.getElementById('nav-container');
    if (!container) return;
    container.innerHTML = navHTML;

    const toggle  = document.getElementById('nav-toggle');
    const navList = document.getElementById('nav-list');

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
  }
})();
