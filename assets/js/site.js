(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  // Language
  const titles = { en: root.dataset.titleEn, tr: root.dataset.titleTr || root.dataset.titleEs, es: root.dataset.titleEs };
  const langBtn = document.getElementById('lang-toggle');
  const paintLang = () => {
    langBtn.textContent = root.lang === 'tr' ? 'EN' : 'TR';
    langBtn.setAttribute('aria-label', root.lang === 'tr' ? 'View in English' : 'Türkçe görüntüle');
    if (titles[root.lang]) document.title = titles[root.lang];
  };
  langBtn.addEventListener('click', () => {
    root.lang = root.lang === 'tr' ? 'en' : 'tr';
    store('site-lang', root.lang);
    paintLang();
    document.dispatchEvent(new Event('langchange'));
  });
  paintLang();

  // Calendly loads only when someone asks for it
  document.querySelectorAll('[data-calendly]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const open = () => window.Calendly ? Calendly.initPopupWidget({ url: a.href }) : window.open(a.href, '_blank', 'noopener');
    if (window.Calendly) return open();
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = 'https://assets.calendly.com/assets/external/widget.css';
    document.head.append(css);
    const s = document.createElement('script');
    s.src = 'https://assets.calendly.com/assets/external/widget.js';
    s.onload = open; s.onerror = open;
    document.head.append(s);
  }));

  // Cinematic Interstellar Starfield (3 Depth Layers & Parallax)
  const bgEl = document.getElementById('bg');
  if (bgEl) {
    let canvas = bgEl.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      bgEl.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars = [];

    let targetMouseX = 0, targetMouseY = 0;
    let curMouseX = 0, curMouseY = 0;
    let targetScrollY = 0, curScrollY = 0;

    const initStars = () => {
      stars = [];
      // Total ~140 stars across 3 distinct depth layers:
      // Layer 0: Distant (70 stars) - Tiny, slow, faint, small parallax
      for (let i = 0; i < 70; i++) {
        stars.push({
          layer: 0,
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 0.35 + 0.35,
          baseAlpha: Math.random() * 0.25 + 0.18,
          vx: (Math.random() - 0.5) * 0.012,
          vy: -(Math.random() * 0.035 + 0.025),
          parallax: 0.012,
          twinkle: false,
          color: '#cbd5e1'
        });
      }

      // Layer 1: Mid (50 stars) - Medium size, subtle sinusoidal twinkle, medium parallax
      for (let i = 0; i < 50; i++) {
        stars.push({
          layer: 1,
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 0.4 + 0.8,
          baseAlpha: Math.random() * 0.25 + 0.4,
          vx: (Math.random() - 0.5) * 0.02,
          vy: -(Math.random() * 0.06 + 0.06),
          parallax: 0.032,
          twinkle: true,
          twinkleSpeed: Math.random() * 0.02 + 0.015,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleAmp: Math.random() * 0.22 + 0.14,
          color: '#f8fafc'
        });
      }

      // Layer 2: Near (20 stars) - Larger, crisp stellar white with faint atmospheric glow, high parallax
      for (let i = 0; i < 20; i++) {
        stars.push({
          layer: 2,
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 0.5 + 1.3,
          baseAlpha: Math.random() * 0.2 + 0.75,
          vx: (Math.random() - 0.5) * 0.03,
          vy: -(Math.random() * 0.12 + 0.14),
          parallax: 0.065,
          twinkle: false,
          halo: true,
          color: '#ffffff'
        });
      }
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initStars();
      if (reduced) drawStatic();
    };

    let animationId = null;
    let isVisible = true;
    let time = 0;

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (star.halo) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(226, 232, 240, 0.12)';
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.baseAlpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const render = () => {
      if (!isVisible || reduced) return;
      time++;
      ctx.clearRect(0, 0, width, height);

      curMouseX += (targetMouseX - curMouseX) * 0.04;
      curMouseY += (targetMouseY - curMouseY) * 0.04;
      curScrollY += (targetScrollY - curScrollY) * 0.06;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        star.x += star.vx;
        star.y += star.vy;
        if (star.y < 0) star.y += height;
        if (star.y > height) star.y -= height;
        if (star.x < 0) star.x += width;
        if (star.x > width) star.x -= width;

        let px = star.x + (curMouseX * star.parallax);
        let py = star.y + (curMouseY * star.parallax) - (curScrollY * star.parallax * 0.35);

        px = ((px % width) + width) % width;
        py = ((py % height) + height) % height;

        let alpha = star.baseAlpha;
        if (star.twinkle) {
          alpha = Math.max(0.1, Math.min(1, star.baseAlpha + Math.sin(time * star.twinkleSpeed + star.twinklePhase) * star.twinkleAmp));
        }

        if (star.halo) {
          ctx.beginPath();
          ctx.arc(px, py, star.radius * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(226, 232, 240, 0.12)';
          ctx.globalAlpha = alpha * 0.5;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(px, py, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(render);
    };

    window.addEventListener('pointermove', e => {
      targetMouseX = e.clientX - width / 2;
      targetMouseY = e.clientY - height / 2;
    }, { passive: true });

    window.addEventListener('scroll', () => {
      targetScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    }, { passive: true });

    window.addEventListener('resize', () => {
      clearTimeout(window._bgResizeTimer);
      window._bgResizeTimer = setTimeout(resize, 120);
    });

    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
      if (isVisible && !reduced) render();
      else if (animationId) cancelAnimationFrame(animationId);
    });

    resize();
    if (!reduced) render();
  }

  // Typed role line
  const typed = document.querySelector('.typed');
  if (typed && !reduced) {
    const out = typed.querySelector('.typed-text');
    let timer;
    const type = () => {
      clearTimeout(timer);
      const text = typed.dataset[root.lang] || typed.dataset.tr || typed.dataset.en || '';
      let i = 0;
      const step = () => {
        out.textContent = text.slice(0, ++i);
        if (i < text.length) timer = setTimeout(step, 28);
      };
      step();
    };
    typed.setAttribute('aria-label', typed.dataset[root.lang] || typed.dataset.tr || typed.dataset.en || '');
    type();
    document.addEventListener('langchange', () => {
      typed.setAttribute('aria-label', typed.dataset[root.lang] || typed.dataset.tr || typed.dataset.en || '');
      type();
    });
  } else if (typed) {
    typed.classList.add('static');
  }

  // Project filters and "show more"
  const grid = document.getElementById('grid');
  if (grid) {
    const cards = [...grid.querySelectorAll('.card')];
    const more = document.getElementById('more');
    const privateHead = document.getElementById('private-head');
    if (reduced) grid.querySelectorAll('video').forEach(v => { v.autoplay = false; v.pause(); });
    const filters = document.querySelectorAll('[data-filter]');
    let filter = 'all', expanded = false;
    const paint = animate => {
      let shown = 0;
      cards.forEach(c => {
        const match = filter === 'all' || c.dataset.tags.split(' ').includes(filter);
        const show = match && (filter !== 'all' || expanded || !('extra' in c.dataset));
        c.hidden = !show;
        if (show && animate && !reduced) c.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 280, delay: shown++ * 35, easing: 'ease-out', fill: 'backwards' });
      });
      more.hidden = filter !== 'all' || expanded;
      privateHead.hidden = !cards.some(c => c.matches('.private:not(.lead)') && !c.hidden);
    };
    filters.forEach(b => b.addEventListener('click', () => {
      filter = b.dataset.filter;
      filters.forEach(x => x.setAttribute('aria-pressed', x === b));
      paint(true);
    }));
    more.addEventListener('click', () => { expanded = true; paint(true); });
    paint(false);

    // Light that follows the pointer inside a card
    grid.addEventListener('pointermove', e => {
      const c = e.target.closest('.card');
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty('--x', e.clientX - r.left + 'px');
      c.style.setProperty('--y', e.clientY - r.top + 'px');
    });
  }

  // The sidebar scrolls away beneath the floating contact card instead of showing above it
  const contact = document.getElementById('contact');
  const rest = document.querySelector('.side-rest');
  if (contact && rest) {
    const wide = matchMedia('(min-width: 1001px)');
    const clip = () => {
      const hidden = contact.getBoundingClientRect().bottom + 16 - rest.getBoundingClientRect().top;
      rest.style.clipPath = wide.matches && hidden > 0 ? `inset(${hidden}px 0 0 0)` : '';
    };
    addEventListener('scroll', clip, { passive: true });
    addEventListener('resize', clip);
    clip();
    // Open jobs balance the two columns; on one column they only add length
    if (!wide.matches) document.querySelectorAll('.job[open]').forEach((j, i) => { if (i) j.open = false; });
  }

  // Stack chips appear in sequence, once
  const groups = document.querySelectorAll('.stack-group');
  if (groups.length && !reduced && 'IntersectionObserver' in window) {
    root.classList.add('anim');
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .2 });
    groups.forEach(g => {
      [...g.querySelectorAll('li')].forEach((li, i) => li.style.setProperty('--i', i));
      io.observe(g);
    });
  }

  // Current section in the nav
  const links = [...document.querySelectorAll('.nav a[href^="#"]')].filter(l => !document.querySelector(l.getAttribute('href'))?.closest('.side'));
  if (links.length) {
    const track = document.querySelector('.nav-track');
    const spy = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) links.forEach(l => {
        const on = l.getAttribute('href') === '#' + e.target.id;
        l.toggleAttribute('data-on', on);
        if (on && track && matchMedia('(max-width: 640px)').matches) {
          l.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        }
      });
    }), { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(l => { const t = document.querySelector(l.getAttribute('href')); if (t) spy.observe(t); });
  }

  // Live GitHub stars; the numbers in the HTML remain if the request fails
  const starEls = document.querySelectorAll('[data-repo] b, [data-total] b');
  if (starEls.length) {
    const user = root.dataset.githubUser || 'sametttclk';
    fetch(`https://api.github.com/users/${user}/repos?per_page=100`)
      .then(r => r.ok ? r.json() : [])
      .then(repos => {
        if (!repos || !repos.length) return;
        const by = Object.fromEntries(repos.map(r => [r.name, r.stargazers_count]));
        document.querySelectorAll('[data-repo]').forEach(a => {
          if (by[a.dataset.repo] != null) a.querySelector('b').textContent = by[a.dataset.repo];
        });
        const total = document.querySelector('[data-total] b');
        if (total) total.textContent = repos.reduce((s, r) => s + r.stargazers_count, 0);
      }).catch(() => {});
  }
})();
