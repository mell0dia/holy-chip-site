// Holy Chip - site languages (one script for every page).
//
// THE RULE: the menu stays English. Produced content (comics, blogs, transcripts,
// story titles, page headings) follows the chosen language, piece by piece, and
// any piece that does not exist in that language falls back to English.
//
// Choosing: ?lang=xx in the link > saved choice ('hc-lang') > browser language > en.
// Adding a language later = one line in LANGS + its files (name.<code>.ext).
//
// Pages mark what is translatable; this script does the rest:
//   <h1 data-i18n data-pt="Tirinhas">Stories</h1>        text per language (fallback: the element's own text)
//   <div class="lang-content" data-lang="pt">…</div>      one block per language among siblings (fallback: en)
//   <img data-i18n-src="../stories/HC023.png">            image: HC023.pt.png if it exists (see lang-files.js)
// Pages that build content in JS use HCLang.current / HCLang.text() / HCLang.src()
// and listen for the 'hc:lang' event.
(function () {
  const LANGS = [
    { code: 'en', name: 'English',   flag: 'us' },
    { code: 'pt', name: 'Português', flag: 'br' },
    { code: 'es', name: 'Español',   flag: 'es' },
    { code: 'fr', name: 'Français',  flag: 'fr' },
  ];
  const CODES = LANGS.map(l => l.code);
  const KEY = 'hc-lang';
  const FILES = window.HC_LANG_FILES || {};          // {pt: ['stories/HC001.pt.png', …]} - from tools/lang_files.py
  const HAS = {}; for (const c in FILES) HAS[c] = new Set(FILES[c]);

  const FLAGS = {
    us: '<svg viewBox="0 0 30 20" width="20" height="14"><rect width="30" height="20" fill="#b22234"/><g fill="#fff"><rect y="1.54" width="30" height="1.54"/><rect y="4.62" width="30" height="1.54"/><rect y="7.69" width="30" height="1.54"/><rect y="10.77" width="30" height="1.54"/><rect y="13.85" width="30" height="1.54"/><rect y="16.92" width="30" height="1.54"/></g><rect width="13" height="10.77" fill="#3c3b6e"/></svg>',
    br: '<svg viewBox="0 0 30 20" width="20" height="14"><rect width="30" height="20" fill="#009c3b"/><path d="M15 2.5 27 10 15 17.5 3 10z" fill="#ffdf00"/><circle cx="15" cy="10" r="4.4" fill="#002776"/></svg>',
    es: '<svg viewBox="0 0 30 20" width="20" height="14"><rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/></svg>',
    it: '<svg viewBox="0 0 30 20" width="20" height="14"><rect width="10" height="20" fill="#009246"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ce2b37"/></svg>',
    fr: '<svg viewBox="0 0 30 20" width="20" height="14"><rect width="10" height="20" fill="#002395"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ed2939"/></svg>',
  };

  function fromBrowser() {
    const list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
    for (const l of list) { const c = String(l).toLowerCase().split('-')[0]; if (CODES.includes(c)) return c; }
    return 'en';
  }
  function decide() {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && CODES.includes(q)) { try { localStorage.setItem(KEY, q); } catch (e) {} return q; }   // a shared link's language sticks while browsing on
    try { const s = localStorage.getItem(KEY); if (s && CODES.includes(s)) return s; } catch (e) {}
    return fromBrowser();
  }

  // site-root-relative path of an URL attribute ("../stories/HC001.png" -> "stories/HC001.png")
  function rootPath(p) { try { return decodeURIComponent(new URL(p, location.href).pathname.replace(/^\//, '')); } catch (e) { return p; } }
  function variantOf(p, code) {                        // keeps a ?v= cache-buster: HC015.png?v=1 -> HC015.pt.png?v=1
    const m = p.match(/^([^?#]*?)(\.[a-z0-9]+)([?#].*)?$/i);
    return m ? m[1] + '.' + code + m[2] + (m[3] || '') : p;
  }

  const HCLang = {
    LANGS, CODES, current: decide(),
    // the language version of a file if it exists, else the file itself (English)
    src(path, code) {
      code = code || this.current;
      if (code === 'en') return path;
      const v = variantOf(path, code);
      return HAS[code] && HAS[code].has(rootPath(v)) ? v : path;
    },
    has(path, code) { return code === 'en' || !!(HAS[code] && HAS[code].has(rootPath(variantOf(path, code)))); },
    // pick from {en:…, pt:…} or from an element's data-<code> attributes
    text(map, code) {
      code = code || this.current;
      if (map instanceof Element) { const v = map.getAttribute('data-' + code); return v != null ? v : null; }
      return map && map[code] != null && map[code] !== '' ? map[code] : (map ? map.en : '');
    },
    set(code, save) {
      if (!CODES.includes(code)) code = 'en';
      this.current = code;
      if (save !== false) { try { localStorage.setItem(KEY, code); } catch (e) {} }
      const u = new URL(location.href);                 // a ?lang= in the address must follow the choice
      if (u.searchParams.has('lang')) {
        if (code === 'en') u.searchParams.delete('lang'); else u.searchParams.set('lang', code);
        history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      }
      this.apply();
      document.dispatchEvent(new CustomEvent('hc:lang', { detail: { lang: code } }));
    },
    // ?lang= for links that should open in the current language
    param(prefix) { return this.current === 'en' ? '' : (prefix || '?') + 'lang=' + this.current; },
    apply(root) {
      root = root || document;
      const c = this.current;
      document.documentElement.lang = c === 'pt' ? 'pt-BR' : c;
      root.querySelectorAll('[data-i18n]').forEach(el => {
        if (!el.hasAttribute('data-en')) el.setAttribute('data-en', el.innerHTML);
        const v = el.getAttribute('data-' + c);
        el.innerHTML = v != null && v !== '' ? v : el.getAttribute('data-en');
      });
      // language blocks: among siblings, show the chosen language, else English
      const groups = new Set();
      root.querySelectorAll('.lang-content[data-lang], [data-lang-block]').forEach(el => groups.add(el.parentElement));
      groups.forEach(parent => {
        const blocks = [...parent.children].filter(el => el.matches('.lang-content[data-lang], [data-lang-block]'));
        const langOf = el => el.getAttribute('data-lang') || el.getAttribute('data-lang-block');
        const pick = blocks.some(el => langOf(el) === c && el.textContent.trim()) ? c : 'en';
        blocks.forEach(el => el.classList.toggle('active', langOf(el) === pick));   // pages show .active (their CSS)
      });
      root.querySelectorAll('[data-i18n-src]').forEach(el => {
        const s = this.src(el.getAttribute('data-i18n-src'));
        const attr = el.tagName === 'IMG' || el.tagName === 'SOURCE' || el.tagName === 'VIDEO' ? 'src' : null;
        if (attr) { if (el.getAttribute('src') !== s) el.setAttribute('src', s); }
        else el.style.backgroundImage = `url("${s}")`;
      });
      const btn = document.getElementById('hc-lang-btn');
      if (btn) { const L = LANGS.find(l => l.code === c); btn.innerHTML = `${FLAGS[L.flag]}<span>${L.name}</span><b>▾</b>`; btn.title = L.name; }   // flag + language name (user, 2026-10-21)
      document.querySelectorAll('.hc-lang-opt').forEach(o => o.classList.toggle('active', o.dataset.lang === c));
    },
    // the selector, put in the header by nav.js
    selectorHTML() {
      return `<div class="hc-lang"><button class="hc-lang-btn" id="hc-lang-btn" aria-haspopup="listbox" aria-expanded="false" title="Language"></button>
        <ul class="hc-lang-menu" id="hc-lang-menu" role="listbox" hidden>${LANGS.map(l =>
          `<li><button class="hc-lang-opt" data-lang="${l.code}" role="option">${FLAGS[l.flag]}<span>${l.name}</span></button></li>`).join('')}</ul></div>`;
    },
    wireSelector() {
      const btn = document.getElementById('hc-lang-btn'), menu = document.getElementById('hc-lang-menu');
      if (!btn) return;
      const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
      btn.addEventListener('click', e => { e.stopPropagation(); menu.hidden = !menu.hidden; btn.setAttribute('aria-expanded', String(!menu.hidden)); });
      menu.querySelectorAll('.hc-lang-opt').forEach(o => o.addEventListener('click', () => { close(); this.set(o.dataset.lang); }));
      document.addEventListener('click', e => { if (!menu.contains(e.target) && e.target !== btn) close(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
      this.apply();
    },
  };

  window.HCLang = HCLang;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => HCLang.apply());
  else HCLang.apply();
})();
