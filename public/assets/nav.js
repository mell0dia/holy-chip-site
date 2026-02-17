// Holy Chip - Shared Navigation Component
// This file generates the site navigation and injects it into all pages

(function() {
  // Detect if we're in a subdirectory (like history/)
  const inSubdir = window.location.pathname.includes('/history/');
  const pathPrefix = inSubdir ? '../' : '';

  // Navigation structure - UPDATE HERE to change menu across all pages
  const navItems = [
    { label: 'Store', href: 'store.html' },
    { label: 'NFTs', href: 'nfts.html' },
    { label: 'Stories', href: 'stories.html' },
    { label: 'History', href: 'history/' }
  ];

  // Determine current page for active state
  const pathname = window.location.pathname;
  const currentPage = pathname.split('/').pop() || 'index.html';

  // Build navigation HTML
  const navHTML = `
    <nav class="site-nav">
      <a href="${pathPrefix}index.html" class="nav-logo">
        <img src="${pathPrefix}assets/logo.jpg" alt="Holy Chip" style="height:40px;vertical-align:middle;margin-right:.5rem;border-radius:4px;"/>
        Holy Chip
      </a>
      <ul class="nav-list">
        ${navItems.map(item => {
          const isActive = currentPage === item.href ||
                          (item.href === 'history/' && pathname.includes('history'));
          return `
            <li class="nav-item">
              <a href="${pathPrefix}${item.href}" class="nav-link ${isActive ? 'active' : ''}">${item.label}</a>
            </li>
          `;
        }).join('')}
      </ul>
    </nav>
  `;

  // Inject navigation when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNav);
  } else {
    injectNav();
  }

  function injectNav() {
    const container = document.getElementById('nav-container');
    if (container) {
      container.innerHTML = navHTML;
    }
  }
})();
