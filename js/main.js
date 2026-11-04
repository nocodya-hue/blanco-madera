/* Blanco Madera Studio — interacción propia, sin librerías */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ancho = matchMedia('(min-width: 1101px)');

  /* Cabecera: transparente sobre la portada; se esconde al bajar y vuelve al subir */
  const cab = $('.cab'), portada = $('.portada');
  let yPrev = 0;
  const cabecera = (y) => {
    cab.classList.toggle('solida', y > 30);
    const ocultar = y > yPrev && y > innerHeight * 0.9 && !document.body.classList.contains('menu-abierto');
    cab.classList.toggle('oculta', ocultar);
    yPrev = y;
  };

  /* Menú */
  $('.menu-btn').addEventListener('click', () => { const a = document.body.classList.toggle('menu-abierto'); $('.menu-btn').setAttribute('aria-expanded', a); if (a) cab.classList.add('solida'); });
  $$('.nav a').forEach((a) => a.addEventListener('click', () => document.body.classList.remove('menu-abierto')));

  /* Paralaje: data-velocidad = fracción del desplazamiento (0,15 = va un 15 % más lento) */
  const capas = $$('[data-velocidad]').map((el) => ({ el, v: parseFloat(el.dataset.velocidad), padre: el.closest('[data-paralaje]') || el.parentElement }));
  const paralaje = () => {
    if (reducido) return;
    for (const c of capas) {
      const r = c.padre.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      const centro = r.top + r.height / 2 - innerHeight / 2;
      const f = innerWidth < 721 ? 0.45 : 1; // en el móvil, paralaje más suave
      c.el.style.transform = `translate3d(0, ${(-centro * c.v * f).toFixed(1)}px, 0)`;
    }
  };

  let tic = false;
  const pintar = () => { tic = false; cabecera(scrollY); paralaje(); };
  addEventListener('scroll', () => { if (!tic) { tic = true; requestAnimationFrame(pintar); } }, { passive: true });
  addEventListener('resize', pintar);
  pintar();

  /* Apariciones */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  $$('.rv, .lineas, .revelar').forEach((el) => io.observe(el));

  /* Método TAKSU: los cinco elementos se abren al pasar (o al tocar en el móvil) */
  const elems = $$('.elem');
  const abrir = (el) => elems.forEach((x) => { x.classList.toggle('abierto', x === el); x.setAttribute('aria-expanded', x === el); });
  elems.forEach((el) => {
    el.addEventListener('mouseenter', () => { if (ancho.matches) abrir(el); });
    el.addEventListener('click', () => abrir(el));
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(el); } });
  });

  /* Antes / después: el deslizador mueve la línea (ratón, dedo y teclado) */
  $$('.comparar').forEach((c) => {
    const r = $('input', c);
    const fijar = () => c.style.setProperty('--pos', r.value + '%');
    r.addEventListener('input', fijar); fijar();
    // pista: al aparecer, la línea se mueve sola un poco para invitar a deslizar
    new IntersectionObserver(([e], ob) => {
      if (!e.isIntersecting || reducido) return; ob.disconnect();
      const t0 = performance.now();
      const anim = (t) => { const k = Math.min(1, (t - t0) / 1800); r.value = 50 + Math.sin(k * Math.PI * 2) * 14 * (1 - k); fijar(); if (k < 1) requestAnimationFrame(anim); };
      requestAnimationFrame(anim);
    }, { threshold: .6 }).observe(c);
  });

  /* Proyectos: vista previa que sigue al cursor y ficha a pantalla completa */
  const vista = $('.vista'), vimg = vista && $('img', vista);
  let vx = 0, vy = 0, tx = 0, ty = 0;
  const seguir = () => { vx += (tx - vx) * 0.14; vy += (ty - vy) * 0.14; if (vista) vista.style.left = vx + 'px', vista.style.top = vy + 'px'; requestAnimationFrame(seguir); };
  if (vista) requestAnimationFrame(seguir);
  $$('.proy').forEach((b) => b.addEventListener('click', () => abrirFicha(b.dataset.ficha)));
  const fichas = $$('.ficha');
  let ultimo = null;
  const abrirFicha = (id) => {
    const f = $('#' + id); if (!f) return;
    ultimo = document.activeElement;
    $$('img[data-src]', f).forEach((i) => { i.src = i.dataset.src; i.removeAttribute('data-src'); });
    f.classList.add('abierta'); f.setAttribute('aria-hidden', 'false'); f.scrollTop = 0;
    document.documentElement.style.overflow = 'hidden';
    vista && vista.classList.remove('on');
    $('.ficha__cerrar', f).focus();
  };
  const cerrarFicha = () => {
    fichas.forEach((f) => { f.classList.remove('abierta'); f.setAttribute('aria-hidden', 'true'); });
    document.documentElement.style.overflow = '';
    ultimo && ultimo.focus();
  };
  $$('.ficha__cerrar').forEach((b) => b.addEventListener('click', cerrarFicha));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarFicha(); });

  /* Tira de detalles: se arrastra con el ratón */
  const tira = $('.tira');
  if (tira) {
    let x0 = 0, s0 = 0, arrastrando = false;
    tira.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; arrastrando = true; x0 = e.clientX; s0 = tira.scrollLeft; tira.style.scrollSnapType = 'none'; tira.style.cursor = 'grabbing'; });
    addEventListener('pointermove', (e) => { if (arrastrando) tira.scrollLeft = s0 - (e.clientX - x0); });
    addEventListener('pointerup', () => { if (!arrastrando) return; arrastrando = false; tira.style.scrollSnapType = ''; tira.style.cursor = ''; });
  }

  /* Formulario → WhatsApp del estudio, con el mensaje ya escrito */
  const form = $('.form');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const t = [
      'Hola, Sesi. Os escribo desde la web de Blanco Madera Studio.',
      f.get('nombre') && `Me llamo ${f.get('nombre')}.`,
      f.getAll('espacio').length && `Espacio: ${f.getAll('espacio').join(', ')}.`,
      f.get('modo') && `Me interesa una sesión ${f.get('modo')}.`,
      f.get('mensaje') && `\n${f.get('mensaje')}`,
    ].filter(Boolean).join('\n');
    open('https://wa.me/34675352366?text=' + encodeURIComponent(t), '_blank', 'noopener');
  });

  $$('.anio').forEach((s) => (s.textContent = new Date().getFullYear()));
})();
