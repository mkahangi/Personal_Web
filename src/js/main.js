// Early theme flash-buster (if data-early="theme")
if (document.currentScript.dataset.early === 'theme') {
  (function(){
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('theme-dark');
  })();
}

(function () {
    const t = localStorage.getItem('theme') ||
              (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (t === 'dark') document.documentElement.classList.add('theme-dark');
  })();

window.addEventListener('DOMContentLoaded', () => {
  // 1) Include partials
  document.querySelectorAll('[data-include]').forEach(async el => {
    const url = el.getAttribute('data-include');
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);
      el.innerHTML = await res.text();
    } catch (e) {
      console.error('Include failed:', url, e);
    }
  });

  // 2) Theme toggle
  const btn = document.getElementById('themeToggle');
  if (btn) {
    const root = document.documentElement;
    const icon = btn.querySelector('.icon');
    const label = btn.querySelector('.label');
    const DUR = 450;

    function setButton(theme) {
      if (theme === 'dark') {
        icon.textContent = '☀️'; label.textContent = 'Light';
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-label', 'Activate light mode');
      } else {
        icon.textContent = '🌙'; label.textContent = 'Dark';
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', 'Activate dark mode');
      }
    }

    function applyTheme(theme, animate = true) {
      const dark = root.classList.contains('theme-dark');
      if ((theme==='dark' && dark) || (theme==='light' && !dark)) return;
      if (animate) {
        btn.classList.add('animating');
        btn.classList.remove('ready');
      }
      setTimeout(()=>{
        root.classList.toggle('theme-dark', theme==='dark');
        setButton(theme);
        if (animate) {
          void btn.offsetWidth;
          btn.classList.remove('animating');
          btn.classList.add('ready');
        }
      }, animate?DUR*0.55:0);
    }

    const stored = localStorage.getItem('theme');
    if (stored) { applyTheme(stored,false); setButton(stored); }
    else setButton(root.classList.contains('theme-dark')?'dark':'light');

    btn.addEventListener('click', () => {
      const next = root.classList.contains('theme-dark')?'light':'dark';
      localStorage.setItem('theme', next);
      applyTheme(next,true);
    });
  }

  (function () {
  const t = localStorage.getItem('theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (t === 'dark') document.documentElement.classList.add('theme-dark');
})();


  // 3) Copy‑email
  document.querySelectorAll('.email-box').forEach(box => {
    const email = box.dataset.email;
    const btn = box.querySelector('.copy-btn');
    const status = box.querySelector('.copy-status');
    btn.addEventListener('click', async ()=> {
      try {
        await navigator.clipboard.writeText(email);
        const orig = btn.textContent.trim();
        btn.textContent = '✅ Copied';
        status.textContent = 'Email copied.';
        setTimeout(()=>{
          btn.textContent = orig;
          status.textContent = '';
        },2000);
      } catch {
        btn.textContent = '⚠️ Error';
        status.textContent = 'Copy failed.';
        setTimeout(()=>{
          btn.textContent = '📋 Copy';
          status.textContent = '';
        },2500);
      }
    });
  });


  async function include(el) {
  const url = el.getAttribute('data-include');
  const res = await fetch(url);
  const html = await res.text();
  el.innerHTML = html;

  // Fix relative URLs inside this chunk
  const base = url.substring(0, url.lastIndexOf('/') + 1);
  el.querySelectorAll('img[src], a[href], script[src], link[href]').forEach(node => {
    const attr = node.tagName === 'A' || node.tagName === 'LINK' ? 'href' : 'src';
    const val = node.getAttribute(attr);
    if (val && !/^([a-z]+:|\/)/i.test(val)) { // not absolute or root-relative
      node.setAttribute(attr, base + val);
    }
  });
}
document.querySelectorAll('[data-include]').forEach(include);

  // 4) Talk filtering
  const search = document.getElementById('talkSearch');
  const year   = document.getElementById('yearFilter');
  const type   = document.getElementById('typeFilter');
  const reset  = document.getElementById('resetFilters');
  const cards  = [...document.querySelectorAll('#talkCards .card')];

  function filterTalks() {
    const q = (search.value||'').toLowerCase();
    const y = year.value;
    const t = type.value;
    cards.forEach(c=>{
      const title = c.querySelector('h3').textContent.toLowerCase();
      const meta  = c.querySelector('.talk-meta').textContent.toLowerCase();
      const cY = c.dataset.year;
      const cT = c.dataset.type;
      const ok = (!q||title.includes(q)||meta.includes(q))
              && (!y||y===cY)
              && (!t||t===cT);
      c.classList.toggle('hidden', !ok);
    });
  }
  [search,year,type].forEach(el=>el&&el.addEventListener('input',filterTalks));
  reset&&(reset.addEventListener('click', ()=>{
    search.value=''; year.value=''; type.value='';
    filterTalks();
  }));

  // 5) Zenodo stats
  async function loadZenodoStats(doi, elem) {
    try {
      const r1 = await fetch(`https://zenodo.org/api/records/?q=conceptdoi:${doi}`);
      const hits = (await r1.json()).hits.hits;
      if (!hits.length) throw new Error('no record');
      const rec = hits[0].id;
      const r2 = await fetch(`https://zenodo.org/api/records/${rec}`);
      const s  = await r2.json();
      const { unique_views, unique_downloads } = s.stats;
      elem.textContent = `${unique_views.toLocaleString()} views • ${unique_downloads.toLocaleString()} downloads`;
    } catch(e) {
      console.error('Zenodo failed', doi, e);
      elem.textContent = 'Stats unavailable';
    }
  }
  document.querySelectorAll('.zenodo-metrics').forEach(span => {
    loadZenodoStats(span.dataset.doi, span);
  });
});


document.querySelectorAll('nav a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const id = a.getAttribute('href');
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.pushState(null, '', id); // keep URL hash
  });
});
