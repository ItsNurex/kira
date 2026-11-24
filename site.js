/* Kira · web: nav, frase que se ilumina con el scroll, gestos, reacciones por sección y sonido opcional. */
/* Cuando Kira esté en Play Store, cambia published a true y todos los botones de descarga llevarán allí. */
const PLAY = { published: false, url: 'https://play.google.com/store/apps/details?id=app.kira.ai' };
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const K = () => window.KiraBall || { react() {}, setSound() {} };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (PLAY.published) $$('a[href="kira.apk"]').forEach(a => { a.href = PLAY.url; a.removeAttribute('download'); a.target = '_blank'; a.rel = 'noopener';
    a.lastChild.textContent = a.classList.contains('nav-dl') ? 'Google Play' : 'Descargar en Google Play'; });

  // Barra superior sólida al bajar + menú móvil
  const nav = $('#nav'); const onScroll = () => nav.classList.toggle('solid', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const menu = $('#menuBtn'), links = $('#links');
  menu.addEventListener('click', () => { const o = links.classList.toggle('open'); menu.setAttribute('aria-expanded', o); menu.setAttribute('aria-label', o ? 'Cerrar menú' : 'Abrir menú'); });
  links.addEventListener('click', e => { if (e.target.closest('a')) { links.classList.remove('open'); menu.setAttribute('aria-expanded', false); } });

  // Sonido (apagado por defecto; se recuerda)
  const sb = $('#soundBtn'); let on = false; try { on = localStorage.getItem('kira.web.sound') === 'true'; } catch {}
  const setS = v => { on = v; sb.setAttribute('aria-pressed', v); sb.setAttribute('aria-label', v ? 'Silenciar a Kira' : 'Activar sonidos de Kira'); K().setSound(v); try { localStorage.setItem('kira.web.sound', v); } catch {} };
  sb.addEventListener('click', () => setS(!on)); setTimeout(() => on && K().setSound(true), 50);

  // Momento 1: la frase se ilumina palabra a palabra y la pelota reacciona a las palabras clave
  const said = $('#said'), sec = $('#frase');
  const wrapWords = node => { [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) { const f = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach(t => { if (!t) return; if (/^\s+$/.test(t)) f.append(t); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = t; f.append(s); } }); n.replaceWith(f); }
    else if (n.nodeType === 1) wrapWords(n); }); };
  wrapWords(said);
  const words = [...said.querySelectorAll('.w')], fired = new Set();
  const paint = () => {
    const r = sec.getBoundingClientRect(), span = r.height - innerHeight;
    const p = reduced ? 1 : Math.min(1, Math.max(0, -r.top / (span * .82)));
    const n = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('on', i < n));
    said.querySelectorAll('span[data-r]').forEach(k => {
      const lit = k.querySelector('.w.on') !== null; k.classList.toggle('on', lit);
      if (lit && !fired.has(k)) { fired.add(k); K().react(k.dataset.r); }
      if (!lit) fired.delete(k);
    });
  };
  addEventListener('scroll', paint, { passive: true }); addEventListener('resize', paint); paint();

  // Momento 2: gestos
  $$('.gbtns button').forEach(b => b.addEventListener('click', () => {
    $$('.gbtns button').forEach(x => x.classList.toggle('on', x === b)); K().react(b.dataset.g);
    setTimeout(() => b.classList.remove('on'), 1600);
  }));

  // Cada sección saluda con su reacción cuando entra en pantalla
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) K().react(e.target.dataset.react); }), { threshold: .55 });
  $$('[data-react]').forEach(s => io.observe(s));
})();
