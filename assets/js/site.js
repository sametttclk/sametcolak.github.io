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

  // Interactive Neural Constellation & Particle Network Background
  const bgEl = document.getElementById('bg');
  if (bgEl && !reduced) {
    const canvas = document.createElement('canvas');
    bgEl.prepend(canvas);
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    const mouse = { x: null, y: null, maxDist: 140 };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      initParticles();
    };

    const initParticles = () => {
      const count = Math.floor((width * height) / 16000);
      particles = [];
      const colors = ['#6cc4b4', '#38bdf8', '#10b981', '#a78bfa'];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 1.8 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.45 + 0.25
        });
      }
    };

    let animationId = null;
    let isVisible = true;

    const draw = () => {
      if (!isVisible) return;
      ctx.clearRect(0, 0, width, height);

      const maxDist = 120;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        p1.x += p1.vx;
        p1.y += p1.vy;
        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.globalAlpha = p1.alpha;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = '#6cc4b4';
            ctx.globalAlpha = (1 - dist / maxDist) * 0.18;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        if (mouse.x !== null && mouse.y !== null) {
          const mdx = p1.x - mouse.x;
          const mdy = p1.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < mouse.maxDist) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = '#38bdf8';
            ctx.globalAlpha = (1 - mdist / mouse.maxDist) * 0.35;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', () => {
      clearTimeout(window._bgResizeTimer);
      window._bgResizeTimer = setTimeout(resize, 150);
    });

    window.addEventListener('pointermove', e => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
      if (isVisible) draw();
      else cancelAnimationFrame(animationId);
    });

    resize();
    draw();
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
    const spy = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) links.forEach(l => l.toggleAttribute('data-on', l.getAttribute('href') === '#' + e.target.id));
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
