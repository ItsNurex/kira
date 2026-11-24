/* Kira · la pelota narradora de la web. Motor extraído de la app (~/kira-app/preview/index.html). */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const screen = document.getElementById('ballStage'), cv = document.getElementById('ball'), ctx = cv.getContext('2d'), hit = document.getElementById('ballHit');
let micLevel = null; function updateStatus() {}
let soundOn = false;
let AC; const ac = () => AC || (AC = new (window.AudioContext || window.webkitAudioContext)());
function note(f, t, d, o = {}) { const a = ac(), os = a.createOscillator(), v = a.createGain(); os.type = o.type || 'sine'; os.frequency.setValueAtTime(f, t);
  if (o.slide) os.frequency.exponentialRampToValueAtTime(f * o.slide, t + d * .8); v.gain.setValueAtTime(.0001, t); v.gain.exponentialRampToValueAtTime(o.g || .06, t + (o.a || .006)); v.gain.exponentialRampToValueAtTime(.0001, t + d);
  os.connect(v).connect(a.destination); os.start(t); os.stop(t + d + .03); }
function noise(t, d, o = {}) { const a = ac(), b = a.createBuffer(1, a.sampleRate * d, a.sampleRate), x = b.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1;
  const n = a.createBufferSource(), f = a.createBiquadFilter(), v = a.createGain(); n.buffer = b; f.type = 'bandpass'; f.frequency.setValueAtTime(o.f || 1200, t); if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + d); f.Q.value = o.q || 1.2;
  v.gain.setValueAtTime(.0001, t); v.gain.exponentialRampToValueAtTime(o.g || .05, t + d * .3); v.gain.exponentialRampToValueAtTime(.0001, t + d); n.connect(f).connect(v).connect(a.destination); n.start(t); }
const SND = {
  pop: (t, r) => note(420 * r, t, .12, { slide: 2.1, g: .07 }),
  chime: (t, r) => { note(784 * r, t, .5, { type: 'triangle', g: .035 }); note(1175 * r, t + .09, .6, { type: 'triangle', g: .03 }); },
  open: (t, r) => { noise(t, .22, { f: 500, f2: 2200, g: .025 }); note(330 * r, t + .02, .15, { slide: 1.5, g: .03 }); },
  close: (t, r) => { noise(t, .2, { f: 2000, f2: 500, g: .02 }); note(440 * r, t, .14, { slide: .66, g: .025 }); },
  drop: (t, r) => { note(170 * r, t, .18, { slide: .6, g: .09 }); noise(t, .05, { f: 3000, g: .04 }); },
  click: (t, r) => { noise(t, .04, { f: 4200 * r, q: 4, g: .06 }); note(1900 * r, t + .045, .06, { g: .03 }); },
  rustle: (t) => { for (let i = 0; i < 4; i++) noise(t + i * .07, .09, { f: 3500 + Math.random() * 2500, q: 2, g: .025 }); },
  zap: (t, r) => { note(1400 * r, t, .16, { type: 'sawtooth', slide: .25, g: .025 }); noise(t, .08, { f: 6000, g: .03 }); },
  grow: (t, r) => [262, 330, 392, 523].forEach((f, i) => note(f * r, t + i * .06, .3, { type: 'triangle', g: .035 })),
  hearts: (t, r) => [523, 659, 784].forEach((f, i) => note(f * r, t + i * .09, .28, { g: .04 })),
  sad: (t, r) => { note(392 * r, t, .3, { type: 'triangle', slide: .9, g: .04 }); note(330 * r, t + .22, .45, { type: 'triangle', slide: .85, g: .035 }); },
  bell: (t, r) => [0, .18].forEach(d => { note(1320 * r, t + d, .7, { g: .03 }); note(1980 * r, t + d, .5, { g: .015 }); }),
  twinkle: (t) => { for (let i = 0; i < 4; i++) note(1400 + Math.random() * 1400, t + i * .07, .18, { g: .02 }); },
  whoosh: (t) => noise(t, .5, { f: 300, f2: 2600, q: .8, g: .035 }),
  boing: (t, r) => note(180 * r, t, .35, { slide: 2.6, g: .05 }),
  hmm: (t, r) => { note(300 * r, t, .18, { slide: 1.3, g: .04 }); note(260 * r, t + .2, .22, { slide: .8, g: .035 }); },
};

const snd = n => { if (!soundOn) return; try { const a = ac(); if (a.state === 'suspended') a.resume(); (SND[n] || SND.pop)(a.currentTime + .01, .94 + Math.random() * .12); } catch {} };
class Spring { constructor(x, k = 170, d = 18) { this.x = x; this.v = 0; this.to = x; this.k = k; this.d = d; }
  step(dt) { const a = this.k * (this.to - this.x) - this.d * this.v; this.v += a * dt; this.x += this.v * dt; return this.x; }
  kick(v) { this.v += v; } }
const B = {
  mood: 'idle', face: null, prop: null, propT: 0, energy: 0,
  x: new Spring(0, 90, 16), y: new Spring(0, 90, 16), size: new Spring(150, 90, 16),
  sx: new Spring(1, 260, 13), sy: new Spring(1, 260, 13), hop: new Spring(0, 140, 11), tilt: new Spring(0, 120, 14),
  lx: new Spring(0, 140, 17), ly: new Spring(0, 140, 17), eh: new Spring(1, 300, 22), ea: new Spring(0, 160, 15), eb: new Spring(0, 160, 15),
  squeeze: new Spring(0, 160, 16),
  blinkAt: 0, blinkT: -1, happyUntil: 0, faceUntil: 0, tmpFace: null, lastActive: performance.now(),
  pointer: null, lookUntil: 0, glanceAt: 0, placed: false, appear: 1,
};
const IDLE_SLEEP_MS = 45000;
function wake() { if (B.mood === 'sleepy') { flash('wide', 700); B.hop.kick(-260); setMood('idle'); } B.lastActive = performance.now(); }
function hopBall(v = -320) { B.hop.kick(v); B.sy.kick(-3); B.sx.kick(2); }
function happy(ms = 1400) { B.happyUntil = performance.now() + ms; hopBall(-380); }
function flash(face, ms = 900) { B.tmpFace = face; B.faceUntil = performance.now() + ms; }
function setProp(p) { if (B.prop !== p) { B.prop = p; B.propT = performance.now(); } }
function setMood(m) { B.mood = m; updateStatus(); }
// Reacciones: cada opción tiene su propia animación (objetos + cuerpo + cara).
const REACT_MS = { lock: 1800, leaf: 1900, free: 1600, offline: 2000, inf: 1800, spark: 1600, plane: 1900, hike: 1800, power: 2200, globe: 2000, burst: 1100, roll: 1000, hop2: 900, zap: 1300, grow: 1700, hearts: 1900, question: 1800, bubbles: 1800, bell: 1800, rain: 2100, search: 1800 };
const RSND = { lock: 'click', leaf: 'rustle', free: 'boing', offline: 'hmm', inf: 'whoosh', spark: 'twinkle', plane: 'whoosh', hike: 'boing', power: 'drop', globe: 'whoosh', burst: 'pop', roll: 'whoosh', hop2: 'boing', zap: 'zap', grow: 'grow', hearts: 'hearts', question: 'hmm', bubbles: 'pop', bell: 'bell', rain: 'sad', search: 'twinkle' };
function react(type) {
  B.re = { type, t0: performance.now() }; B.lastActive = performance.now();
  const f = { lock: () => { flash('closed', 700); B.sy.kick(-4); }, leaf: () => happy(1300), free: () => { flash('wide', 400); setTimeout(() => happy(900), 500); },
    offline: () => setTimeout(() => happy(1000), 900), inf: () => flash('joy', 1500), spark: () => flash('wide', 1300), plane: () => { hopBall(-520); B.lookUntil = 0; },
    hike: () => { hopBall(-380); setTimeout(() => hopBall(-300), 420); }, power: () => flash('wide', 2000), globe: () => flash('joy', 1700), burst: () => { hopBall(-300); flash('joy', 800); },
    zap: () => { flash('wide', 900); B.sx.kick(5); }, grow: () => { flash('joy', 1500); }, hearts: () => happy(1700), question: () => {}, bubbles: () => hopBall(-240), bell: () => flash('wide', 600), rain: () => flash('closed', 1900), search: () => {},
    roll: () => {}, hop2: () => { hopBall(-260); setTimeout(() => hopBall(-220), 380); } }[type];
  f ? f() : hopBall(); snd(RSND[type] || 'pop');
}
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const outBack = x => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2);
function reState(now) {
  if (!B.re) return { rot: 0, dx: 0, p: 0, type: null };
  const p = (now - B.re.t0) / (REACT_MS[B.re.type] || 1500);
  if (p >= 1) { B.re = null; return { rot: 0, dx: 0, p: 0, type: null }; }
  const t = B.re.type;
  return { p, type: t, sc: t === 'grow' ? 1 + Math.sin(Math.min(1, p * 1.15) * Math.PI) * .26 : 1, rot: t === 'question' ? Math.sin(p * 14) * 14 * (1 - p) : t === 'zap' ? Math.sin(p * 90) * 5 * (1 - p) : t === 'inf' || t === 'globe' || t === 'roll' ? 360 * ease(Math.min(1, p * 1.25)) : t === 'plane' ? Math.sin(p * Math.PI) * -12 : 0,
           dx: t === 'free' && p < .35 ? Math.sin(p * 90) * (1 - p / .35) : 0 };
}
function drawReact(cx, by, R, t, re, W, H) {
  const { p, type } = re; if (!type) return;
  const L = '#c3f02f', fade = p > .8 ? (1 - p) / .2 : 1;
  ctx.save(); ctx.globalAlpha = Math.max(0, fade); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (type === 'lock') {   // candado cae y se cierra
    const d = Math.min(1, p / .35), y = by - R * (2.1 - outBack(d) * .85), w = R * .55, h = R * .42, shut = Math.min(1, Math.max(0, (p - .42) / .12));
    ctx.strokeStyle = L; ctx.lineWidth = R * .09; ctx.beginPath(); ctx.arc(cx, y - h * .1 - (1 - shut) * R * .16, w * .32, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = L; ctx.beginPath(); ctx.roundRect(cx - w / 2, y - h * .1, w, h, R * .08); ctx.fill();
    ctx.fillStyle = '#141807'; ctx.beginPath(); ctx.arc(cx, y + h * .3, R * .05, 0, 7); ctx.fill();
    if (shut > 0 && p < .8) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, k = (p - .54) * 3, r1 = R * (.5 + k * .4), r2 = r1 + R * .15;
      if (k > 0 && k < 1) { ctx.strokeStyle = L; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, y + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, y + Math.sin(a) * r2); ctx.stroke(); } }
  }
  if (type === 'leaf') {   // hojas que brotan y vuelan
    for (let i = 0; i < 7; i++) { const q = Math.min(1, Math.max(0, p * 1.4 - i * .06)); if (!q) continue;
      const a = -Math.PI / 2 + (i - 3) * .42, dist = R * (1 + q * 1.3), x = cx + Math.cos(a) * dist + Math.sin(t * 3 + i) * R * .12, y = by + Math.sin(a) * dist - q * R * .4;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a + q * 3 + i); ctx.fillStyle = i % 2 ? L : '#8fbf1f';
      ctx.beginPath(); ctx.ellipse(0, 0, R * .16 * (1 - q * .3), R * .07, 0, 0, 7); ctx.fill(); ctx.restore(); }
  }
  if (type === 'free') {   // jaula de barras que se rompe
    const burst = Math.max(0, (p - .3) / .7);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, x = cx + Math.cos(a) * R * (1.35 + burst * 1.4), y = by + Math.sin(a) * R * .25 * (1 + burst * 3);
      ctx.save(); ctx.translate(x, y); ctx.rotate(burst * (i % 2 ? 2 : -2)); ctx.strokeStyle = '#8b8f96'; ctx.lineWidth = R * .07;
      ctx.beginPath(); ctx.moveTo(0, -R * .9); ctx.lineTo(0, R * .9); ctx.stroke(); ctx.restore(); }
    if (p < .3) { ctx.strokeStyle = '#8b8f96'; ctx.lineWidth = R * .06; [-1, 1].forEach(k => { ctx.beginPath(); ctx.ellipse(cx, by + k * R * .9, R * 1.35, R * .2, 0, 0, 7); ctx.stroke(); }); }
  }
  if (type === 'offline') {   // ondas wifi que se tachan
    const y = by - R * 1.5, appear = Math.min(1, p / .3);
    ctx.strokeStyle = '#8b8f96'; ctx.lineWidth = R * .08;
    [.25, .5, .75].forEach((r, i) => { if (appear > i / 3) { ctx.beginPath(); ctx.arc(cx, y + R * .35, R * r, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke(); } });
    ctx.fillStyle = '#8b8f96'; ctx.beginPath(); ctx.arc(cx, y + R * .35, R * .06, 0, 7); ctx.fill();
    const sl = Math.min(1, Math.max(0, (p - .35) / .2));
    if (sl) { ctx.strokeStyle = L; ctx.lineWidth = R * .1; ctx.beginPath(); ctx.moveTo(cx - R * .55, y - R * .35); ctx.lineTo(cx - R * .55 + R * 1.1 * sl, y - R * .35 + R * .9 * sl); ctx.stroke(); }
  }
  if (type === 'inf') {   // símbolo infinito que se dibuja alrededor
    const n = Math.floor(120 * Math.min(1, p * 1.4)); ctx.strokeStyle = L; ctx.lineWidth = R * .07; ctx.beginPath();
    for (let i = 0; i <= n; i++) { const a = i / 120 * Math.PI * 2, d = 1 + Math.sin(a) ** 2; const x = cx + R * 1.7 * Math.cos(a) / d, y = by + R * 1.7 * Math.sin(a) * Math.cos(a) / d; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
  }
  if (type === 'spark' || type === 'burst') {   // destellos / confeti
    const n = type === 'spark' ? 7 : 14;
    for (let i = 0; i < n; i++) { const a = i * 2.39996, q = type === 'burst' ? ease(Math.min(1, p * 1.6)) : .6 + .4 * Math.sin(t * 8 + i), r = R * (type === 'burst' ? 1 + q * 1.4 : 1.3 + (i % 3) * .25);
      const x = cx + Math.cos(a) * r, y = by + Math.sin(a) * r * .9 + (type === 'burst' ? p * p * R * .8 : 0), z = R * (type === 'spark' ? .14 : .07) * (type === 'spark' ? Math.abs(Math.sin(t * 6 + i)) : 1);
      ctx.fillStyle = i % 3 ? L : '#fdfdfd'; ctx.beginPath();
      if (type === 'spark') { ctx.moveTo(x, y - z); ctx.quadraticCurveTo(x, y, x + z, y); ctx.quadraticCurveTo(x, y, x, y + z); ctx.quadraticCurveTo(x, y, x - z, y); ctx.quadraticCurveTo(x, y, x, y - z); }
      else ctx.rect(x - z / 2, y - z / 2, z, z * 1.6);
      ctx.fill(); }
  }
  if (type === 'plane') {   // avioncito de papel cruza con estela
    const x = cx - R * 2.6 + R * 5.2 * ease(p), y = by - R * 1.2 - Math.sin(p * Math.PI) * R * .6;
    ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(195,240,47,.5)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 20; i++) { const q = p * i / 20, xx = cx - R * 2.6 + R * 5.2 * ease(q), yy = by - R * 1.2 - Math.sin(q * Math.PI) * R * .6; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); ctx.setLineDash([]);
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.cos(p * Math.PI) * -.5); ctx.fillStyle = '#fdfdfd';
    ctx.beginPath(); ctx.moveTo(R * .35, 0); ctx.lineTo(-R * .3, -R * .2); ctx.lineTo(-R * .15, 0); ctx.lineTo(-R * .3, R * .2); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  if (type === 'hike') {   // montañas que suben detrás y banderita
    const up = outBack(Math.min(1, p / .4));
    ctx.globalCompositeOperation = 'destination-over';
    [[-1.3, 1.3, '#2a2e35'], [1.1, 1.0, '#33373e']].forEach(([ox, hh, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(cx + ox * R - R * 1.1, by + R); ctx.lineTo(cx + ox * R, by + R - R * 2 * hh * up); ctx.lineTo(cx + ox * R + R * 1.1, by + R); ctx.closePath(); ctx.fill(); });
    ctx.globalCompositeOperation = 'source-over';
    const fx = cx - R * 1.3, fy = by + R - R * 2.6 * up; ctx.strokeStyle = '#fdfdfd'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - R * .5); ctx.stroke();
    ctx.fillStyle = L; ctx.beginPath(); ctx.moveTo(fx, fy - R * .5); ctx.lineTo(fx + R * .3 + Math.sin(t * 10) * 2, fy - R * .4); ctx.lineTo(fx, fy - R * .3); ctx.fill();
  }
  if (type === 'globe') {   // órbita con un puntito viajero
    ctx.strokeStyle = 'rgba(195,240,47,.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, by, R * 1.6, R * .45, -.3, 0, 7); ctx.stroke();
    const a = p * Math.PI * 4; ctx.fillStyle = L; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R * 1.6 * Math.cos(-.3) - Math.sin(a) * R * .45 * Math.sin(-.3), by + Math.cos(a) * R * 1.6 * Math.sin(-.3) + Math.sin(a) * R * .45 * Math.cos(-.3), R * .1, 0, 7); ctx.fill();
  }
  if (type === 'power') {   // apagón: todo se oscurece y solo brillan sus ojos
    const dark = Math.sin(Math.min(1, p / .85) * Math.PI) * .82; ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(3,4,5,${dark})`; ctx.fillRect(0, 0, W, H);
    const ox = cx + R * .1, oy = by - R * .16, gap = R * .46;
    [-1, 1].forEach(k => { const g = ctx.createRadialGradient(ox + k * gap / 2, oy, 0, ox + k * gap / 2, oy, R * .5); g.addColorStop(0, `rgba(195,240,47,${dark})`); g.addColorStop(1, 'rgba(195,240,47,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox + k * gap / 2, oy, R * .5, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(230,255,160,${dark})`; ctx.beginPath(); ctx.roundRect(ox + k * gap / 2 - R * .14, oy - R * .25, R * .28, R * .5, R * .14); ctx.fill(); });
  }
  const heart = (x, y, z) => { ctx.beginPath(); ctx.moveTo(x, y + z * .3); ctx.bezierCurveTo(x - z, y - z * .5, x - z * .5, y - z * 1.1, x, y - z * .45); ctx.bezierCurveTo(x + z * .5, y - z * 1.1, x + z, y - z * .5, x, y + z * .3); ctx.fill(); };
  if (type === 'zap') {   // rayos de velocidad
    for (let i = 0; i < 3; i++) { const on = Math.sin(t * 30 + i * 2) > -.2; if (!on) continue; const a = -Math.PI / 2 + (i - 1) * .9, x = cx + Math.cos(a) * R * 1.45, y = by + Math.sin(a) * R * 1.3, z = R * .32;
      ctx.fillStyle = L; ctx.beginPath(); ctx.moveTo(x + z * .2, y - z); ctx.lineTo(x - z * .35, y + z * .1); ctx.lineTo(x, y + z * .1); ctx.lineTo(x - z * .2, y + z); ctx.lineTo(x + z * .35, y - z * .1); ctx.lineTo(x, y - z * .1); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = 'rgba(195,240,47,.5)'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { const y = by - R * .6 + i * R * .4, k = (p * 3 + i * .3) % 1; ctx.beginPath(); ctx.moveTo(cx - R * (1.3 + k * 1.2), y); ctx.lineTo(cx - R * (1.6 + k * 1.2), y); ctx.stroke(); }
  }
  if (type === 'grow') {   // se infla con rayos de poder
    ctx.save(); ctx.translate(cx, by); ctx.rotate(t * .8); ctx.strokeStyle = 'rgba(195,240,47,.55)'; ctx.lineWidth = R * .06;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, k = Math.sin(Math.min(1, p * 1.15) * Math.PI); ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * 1.45, Math.sin(a) * R * 1.45); ctx.lineTo(Math.cos(a) * R * (1.45 + k * .5), Math.sin(a) * R * (1.45 + k * .5)); ctx.stroke(); }
    ctx.restore();
  }
  if (type === 'hearts') { for (let i = 0; i < 5; i++) { const q = Math.min(1, Math.max(0, p * 1.5 - i * .12)); if (!q) continue; ctx.globalAlpha = Math.max(0, fade * (1 - q * .6)); ctx.fillStyle = i % 2 ? L : '#ff8fa8';
      heart(cx + (i - 2) * R * .45 + Math.sin(t * 4 + i) * R * .15, by - R * (1 + q * 1.4), R * .22 * (.6 + q * .5)); } }
  if (type === 'question') { const y = by - R * 1.55 + Math.sin(t * 6) * R * .06; ctx.fillStyle = L; ctx.font = `800 ${R * .85}px Inter, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('?', cx + R * .55, y); ctx.globalAlpha *= .5; ctx.font = `800 ${R * .5}px Inter, sans-serif`; ctx.fillText('?', cx - R * .6, y + R * .25); }
  if (type === 'bubbles') { [[-1, .1], [1, .35]].forEach(([k, d]) => { const q = outBack(Math.min(1, Math.max(0, (p - d) / .3))); if (q <= 0) return; const w = R * 1.0 * q, h = R * .6 * q, x = cx + k * R * 1.35 - w / 2, y = by - R * 1.3 - h / 2 + (k > 0 ? R * .3 : 0);
      ctx.fillStyle = k < 0 ? '#e8e8e3' : L; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill(); ctx.fillStyle = '#141807'; for (let i = 0; i < 3; i++) { ctx.globalAlpha = fade * (.4 + .6 * Math.abs(Math.sin(t * 6 + i))); ctx.beginPath(); ctx.arc(x + w * (.3 + i * .2), y + h / 2, R * .05 * q, 0, 7); ctx.fill(); } ctx.globalAlpha = fade; }); }
  if (type === 'bell') { const sw = Math.sin(p * 30) * .5 * (1 - p), x = cx + R * .1, y = by - R * 1.5; ctx.save(); ctx.translate(x, y - R * .3); ctx.rotate(sw); ctx.fillStyle = L;
      ctx.beginPath(); ctx.moveTo(-R * .32, R * .45); ctx.quadraticCurveTo(-R * .3, -R * .05, 0, -R * .05); ctx.quadraticCurveTo(R * .3, -R * .05, R * .32, R * .45); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(0, R * .52, R * .08, 0, 7); ctx.fill(); ctx.restore();
      ctx.strokeStyle = L; ctx.lineWidth = 2; [-1, 1].forEach(k => { for (let i = 1; i < 3; i++) { ctx.globalAlpha = fade * Math.abs(Math.sin(p * 20)); ctx.beginPath(); ctx.arc(x, y, R * (.45 + i * .18), k < 0 ? Math.PI * .85 : -Math.PI * .15, k < 0 ? Math.PI * 1.15 : Math.PI * .15); ctx.stroke(); } }); }
  if (type === 'rain') { const x = cx, y = by - R * 1.55, q = outBack(Math.min(1, p / .3)); ctx.fillStyle = '#5d6168';
      [[-.35, 0, .32], [0, -.15, .42], [.38, 0, .3]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx * R * q, y + dy * R * q, r * R * q, 0, 7); ctx.fill(); });
      ctx.strokeStyle = '#7ec8ff'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const k = (t * 1.6 + i * .37) % 1; ctx.globalAlpha = fade * (1 - k); ctx.beginPath(); ctx.moveTo(x + (i - 2.5) * R * .2, y + R * .3 + k * R * .9); ctx.lineTo(x + (i - 2.5) * R * .2 - 2, y + R * .45 + k * R * .9); ctx.stroke(); } }
  if (type === 'search') { const a = p * Math.PI * 2.5, mx = cx + Math.cos(a) * R * 1.2, my = by + Math.sin(a) * R * .6 - R * .2, mr = R * .34;
      ctx.strokeStyle = L; ctx.lineWidth = R * .09; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(195,240,47,.12)'; ctx.fill(); ctx.lineWidth = R * .12; ctx.beginPath(); ctx.moveTo(mx + mr * .72, my + mr * .72); ctx.lineTo(mx + mr * 1.45, my + mr * 1.45); ctx.stroke(); }
  ctx.restore();
}


let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000); last = now;
  const onTop = !!document.getElementById('coffeeSlot'); cv.style.zIndex = onTop ? 80 : 30; hit.style.zIndex = onTop ? 81 : 31;
  const sr = screen.getBoundingClientRect(), a = anchor(), ar = a.getBoundingClientRect();
  const tx = ar.left - sr.left + ar.width / 2, ty = ar.top - sr.top + ar.height / 2, ts = Math.max(ar.width, 30);
  if (!B.placed && ar.width) { B.x.x = tx; B.y.x = ty; B.size.x = ts; B.placed = true; }
  B.x.to = tx; B.y.to = ty; B.size.to = ts;
  const cx = B.x.step(dt), cy = B.y.step(dt), size = B.size.step(dt);

  let mood = B.mood;
  if (mood === 'idle' && now - B.lastActive > IDLE_SLEEP_MS && !$('#app').hidden) setMood(mood = 'sleepy');
  const isHappy = now < B.happyUntil;
  const tmpFace = now < B.faceUntil ? B.tmpFace : null;

  if (mood === 'listening' && micLevel != null) B.energy += (Math.min(1, micLevel * 7) - B.energy) * .25;
  else B.energy *= Math.pow(mood === 'speaking' ? .2 : .05, dt);

  // mirada
  let gx = 0, gy = 0;
  if (B.prop === 'search') { gx = .7 + Math.sin(now / 500) * .25; gy = -.1; }
  else if (mood === 'thinking') { gx = .55 + Math.sin(now / 600) * .35; gy = -.75; }
  else if (mood === 'reading') { gx = -.05; gy = .85; }
  else if (mood === 'sleepy' || B.face === 'closed') { gx = 0; gy = .2; }
  else if (B.pointer && now < B.lookUntil) {
    const dx = B.pointer.x - cx, dy = B.pointer.y - cy, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 160);
    gx = dx / d * k; gy = dy / d * k;
  } else {
    if (now > B.glanceAt) { B.glanceAt = now + 1500 + Math.random() * 3000; B.gx = Math.random() < .55 ? Math.random() * 1.6 - .8 : 0; B.gy = Math.random() < .55 ? Math.random() - .5 : 0; }
    gx = B.gx || 0; gy = B.gy || 0;
  }
  B.lx.to = gx; B.ly.to = gy;

  // expresión
  let open = 1, ea = 0, eb = 0, tilt = 0;
  if (mood === 'thinking') { open = .42; ea = eb = -14; tilt = -6 + Math.sin(now / 700) * 4; }
  else if (mood === 'reading') { open = .9; ea = eb = 6; tilt = 5; }
  else if (mood === 'speaking') { open = .78 + B.energy * .3; tilt = Math.sin(now / 420) * 3; }
  else if (mood === 'listening') { open = 1.08 + B.energy * .15; ea = -8; eb = 8; tilt = Math.sin(now / 900) * 4; }
  else if (mood === 'sleepy') { open = .12; tilt = 9; }
  if (B.prop === 'laurel') tilt = -4;
  if (tmpFace === 'wide') { open = 1.3; ea = eb = 0; }
  B.eh.to = open; B.ea.to = ea; B.eb.to = eb; B.tilt.to = tilt;
  const face = isHappy ? 'joy' : (B.prop === 'apps' && B.squeeze.x < .5) ? 'joy' : tmpFace && tmpFace !== 'wide' ? tmpFace : B.face || (mood === 'sleepy' ? 'closed' : 'slit');
  B.squeeze.to = B.prop === 'apps' ? (Math.sin(now / 520) > -.25 ? 1 : .1) : 0;
  if (B.prop === 'apps') { const ph = Math.sin(now / 520) > -.25; if (ph !== B.apph) { B.apph = ph; if (!ph) { hopBall(-240); snd('boing'); } } }

  if (B.blinkT < 0 && now > B.blinkAt && face === 'slit') B.blinkT = 0;
  let blink = 1;
  if (B.blinkT >= 0) { B.blinkT += dt; const p = B.blinkT / .17; blink = p < .4 ? 1 - p / .4 * .92 : .08 + Math.min(1, (p - .4) / .6) * .92; if (p >= 1) { B.blinkT = -1; B.blinkAt = now + (Math.random() < .18 ? 160 : 2200 + Math.random() * 3800); } }

  const breathe = Math.sin(now / (mood === 'sleepy' || face === 'closed' ? 900 : 560)) * (mood === 'sleepy' ? .02 : .012);
  const sq = B.squeeze.step(dt);
  B.sy.to = 1 + breathe + (mood === 'speaking' ? Math.sin(now / 95) * B.energy * .035 : 0) + sq * .12;
  B.sx.to = 1 - breathe * .6 - sq * .16;
  const sx = B.sx.step(dt), sy = B.sy.step(dt), hop = B.hop.step(dt);
  B.tilt.step(dt); B.lx.step(dt); B.ly.step(dt); B.eh.step(dt); B.ea.step(dt); B.eb.step(dt);
  const re = reState(now);
  if (!B.re && mood === 'idle' && !$('#app').hidden && now - B.lastActive > 9000 && now > (B.fidgetAt || 0)) { B.fidgetAt = now + 9000 + Math.random() * 8000; react(['roll', 'hop2', 'spark'][Math.floor(Math.random() * 3)]); }
  try { draw(cx + re.dx * size * .05, cy, size, { sx, sy, hop, blink, mood, now, face, sq, re }); } catch (err) { console.error('dibujo', err); }
  hit.style.cssText = `z-index:${onTop ? 81 : 31};left:${cx - size / 2}px;top:${cy - size / 2}px;width:${size}px;height:${size}px`;
  requestAnimationFrame(frame);
}

function draw(cx, cy, size, s) {
  const dpr = devicePixelRatio || 1, W = screen.clientWidth, H = screen.clientHeight;
  if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  const R = size * .4, E = B.energy, t = s.now / 1000, pt = (s.now - B.propT) / 1000;
  const lift = -s.hop * size / 190 * .08, by = cy - lift;
  const LIME = '#c3f02f';

  // constelación (preparando): puntos que se conectan alrededor
  if (B.prop === 'net') {
    const pts = [];
    for (let i = 0; i < 11; i++) { const a = i * 2.39996 + t * .12, rr = R * (1.35 + .45 * Math.sin(i * 1.7 + t * .6)); pts.push([cx + Math.cos(a) * rr, by + Math.sin(a) * rr * .85]); }
    ctx.strokeStyle = 'rgba(195,240,47,.18)'; ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]); if (d < R * 1.25) { ctx.globalAlpha = 1 - d / (R * 1.25); ctx.beginPath(); ctx.moveTo(...pts[i]); ctx.lineTo(...pts[j]); ctx.stroke(); } }
    ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(195,240,47,.55)';
    pts.forEach(p => { ctx.beginPath(); ctx.arc(p[0], p[1], 1.8, 0, 7); ctx.fill(); });
  }
  // halo cuando habla o escucha
  if ((s.mood === 'speaking' || s.mood === 'listening') && E > .02) {
    const hg = ctx.createRadialGradient(cx, by, R * .9, cx, by, R * (1.7 + E * .5));
    hg.addColorStop(0, `rgba(195,240,47,${.16 * E})`); hg.addColorStop(1, 'rgba(195,240,47,0)');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(cx, by, R * 2.3, 0, 7); ctx.fill();
  }
  // tarjetas de apps que la aprietan
  if (B.prop === 'apps' || s.sq > .02) {
    const k = s.sq, w = R * .95, h = R * 1.5;
    [-1, 1].forEach(side => {
      const x = cx + side * (R * (2.1 - k * .75)) - w / 2;
      ctx.fillStyle = '#23272d'; ctx.strokeStyle = '#353a42'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(x, by - h / 2, w, h, R * .16); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3a3f47'; ctx.beginPath(); ctx.roundRect(x + w * .2, by - h * .3, w * .6, w * .45, 4); ctx.fill();
      ctx.fillRect(x + w * .2, by + h * .12, w * .6, 3); ctx.fillRect(x + w * .2, by + h * .22, w * .4, 3);
    });
  }
  const up = Math.max(0, lift) / R;
  ctx.fillStyle = `rgba(0,0,0,${.42 - up * .25})`;
  ctx.beginPath(); ctx.ellipse(cx, cy + R * 1.08, R * (.78 - up * .25), R * .11, 0, 0, 7); ctx.fill();

  const dots = [];
  if (s.mood === 'thinking') for (let i = 0; i < 3; i++) { const a = t * 2.2 + i * 2.094; dots.push({ x: cx + Math.cos(a) * R * 1.45, y: by + Math.sin(a) * R * .38 - R * .15, front: Math.sin(a) > 0, r: R * (.07 + .025 * Math.sin(a)) }); }
  const drawDots = f => dots.filter(d => d.front === f).forEach(d => { ctx.fillStyle = LIME; ctx.beginPath(); ctx.arc(d.x, d.y, Math.max(1.5, d.r), 0, 7); ctx.fill(); });
  drawDots(false);

  ctx.save();
  ctx.translate(cx, by); ctx.rotate((s.re?.rot || 0) * Math.PI / 180); ctx.scale(s.re?.sc || 1, s.re?.sc || 1); ctx.translate(0, R); ctx.rotate(B.tilt.x * Math.PI / 180); ctx.scale(s.sx, s.sy); ctx.translate(0, -R);
  const wob = .004 + E * .028, N = 72;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) { const th = i / N * Math.PI * 2;
    const r = R * (1 + wob * (Math.sin(3 * th + t * 3.1) * .6 + Math.sin(5 * th - t * 4.3) * .4 + Math.sin(2 * th + t * 1.7) * .5));
    i ? ctx.lineTo(Math.cos(th) * r, Math.sin(th) * r) : ctx.moveTo(Math.cos(th) * r, Math.sin(th) * r); }
  ctx.closePath();
  const g = ctx.createRadialGradient(-R * .42, -R * .5, R * .05, -R * .1, -R * .1, R * 1.25);
  g.addColorStop(0, '#4a4950'); g.addColorStop(.28, '#24232a'); g.addColorStop(.62, '#111015'); g.addColorStop(1, '#050507');
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); ctx.clip();
  const rg = ctx.createRadialGradient(R * .7, R * .8, 0, R * .7, R * .8, R * 1.1);
  rg.addColorStop(0, `rgba(195,240,47,${.07 + E * .16})`); rg.addColorStop(1, 'rgba(195,240,47,0)');
  ctx.fillStyle = rg; ctx.fillRect(-R * 1.5, -R * 1.5, R * 3, R * 3);
  const sg = ctx.createRadialGradient(-R * .4, -R * .52, 0, -R * .4, -R * .52, R * .42);
  sg.addColorStop(0, 'rgba(255,255,255,.22)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sg; ctx.fillRect(-R * 1.5, -R * 1.5, R * 3, R * 3);
  ctx.restore();

  // ojos
  const ew = R * .28, gap = R * .46, ox = R * .1 + B.lx.x * R * .26, oy = -R * .16 + B.ly.x * R * .2;
  const eh = Math.max(ew * .34, R * .5 * Math.max(.05, B.eh.x) * s.blink);
  ctx.fillStyle = ctx.strokeStyle = '#fdfdfd'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  [[-1, B.ea.x], [1, B.eb.x]].forEach(([side, ang]) => {
    ctx.save(); ctx.translate(side * gap / 2 + ox, oy); ctx.rotate(ang * Math.PI / 180);
    ctx.lineWidth = ew * .62;
    if (s.face === 'joy') { ctx.beginPath(); ctx.arc(0, ew * .35, ew * .72, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); }
    else if (s.face === 'closed') { ctx.beginPath(); ctx.arc(0, -ew * .35, ew * .72, Math.PI * .12, Math.PI * .88); ctx.stroke(); }
    else if (s.face === 'squeeze') { ctx.beginPath(); const d = ew * .55; ctx.moveTo(side * d, -d); ctx.lineTo(-side * d * .6, 0); ctx.lineTo(side * d, d); ctx.stroke(); }
    else { ctx.beginPath(); ctx.roundRect(-ew / 2, -eh / 2, ew, eh, ew / 2); ctx.fill(); }
    ctx.restore();
  });
  ctx.restore();
  drawDots(true);
  if (s.re?.type) drawReact(cx, by, R, t, s.re, W, H);

  // accesorios
  const pin = Math.min(1, pt * 3), popS = Math.max(.01, pin < 1 ? 1 - Math.pow(1 - pin, 3) * (1 + Math.sin(pin * 8) * .2) : 1);
  if (B.prop === 'search') {
    const mx = cx + R * .48 + Math.sin(t * 2) * R * .08, my = by - R * .15 + Math.cos(t * 2.4) * R * .05, mr = R * .34 * popS;
    ctx.strokeStyle = LIME; ctx.lineWidth = R * .1; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(195,240,47,.12)'; ctx.fill();
    ctx.lineWidth = R * .13; ctx.beginPath(); ctx.moveTo(mx + mr * .72, my + mr * .72); ctx.lineTo(mx + mr * 1.5, my + mr * 1.5); ctx.stroke();
  }
  if (B.prop === 'sprout') {
    const bx = cx, top = by - R * .98, h = R * .45 * popS, sway = Math.sin(t * 2) * .12;
    ctx.save(); ctx.translate(bx, top); ctx.rotate(sway);
    ctx.strokeStyle = LIME; ctx.lineWidth = R * .07; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(R * .03, -h * .6, 0, -h); ctx.stroke();
    ctx.fillStyle = LIME;
    [[-1, .9], [1, 1]].forEach(([d, k]) => { ctx.save(); ctx.translate(0, -h * .85); ctx.rotate(d * .6); ctx.beginPath(); ctx.ellipse(d * R * .2 * k * popS, 0, R * .22 * k * popS, R * .1 * popS, 0, 0, 7); ctx.fill(); ctx.restore(); });
    ctx.restore();
  }
  if (B.prop === 'laurel') {
    ctx.save(); ctx.translate(cx - R * 1.25, by - R * 1.05); ctx.scale(popS, popS);
    ctx.fillStyle = LIME; ctx.strokeStyle = LIME; ctx.lineWidth = R * .05;
    ctx.beginPath(); ctx.arc(R * .55, R * .55, R * .5, Math.PI * .55, Math.PI * 1.3); ctx.stroke();
    for (let i = 0; i < 5; i++) { const a = Math.PI * (.6 + i * .16), px = R * .55 + Math.cos(a) * R * .5, py = R * .55 + Math.sin(a) * R * .5;
      ctx.save(); ctx.translate(px, py); ctx.rotate(a + Math.PI * .75); ctx.beginPath(); ctx.ellipse(0, -R * .1, R * .06, R * .13, 0, 0, 7); ctx.fill(); ctx.restore(); }
    const st = R * .16, sx0 = R * .95, sy0 = R * .1, rot = t * 1.2;
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5, rr = i % 2 ? st * .45 : st; ctx.lineTo(sx0 + Math.cos(a) * rr, sy0 + Math.sin(a) * rr); } ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  if (B.prop === 'dots') {
    for (let i = 0; i < 3; i++) { const p = ((t * .9) + i * .33) % 1;
      ctx.fillStyle = `rgba(253,253,253,${Math.sin(p * Math.PI)})`;
      ctx.beginPath(); ctx.arc(cx + R * (.75 + i * .22), by - R * (.95 + i * .25) - p * R * .1, R * (.05 + i * .025), 0, 7); ctx.fill(); }
  }
  if (s.mood === 'sleepy') {
    ctx.font = `600 ${Math.max(9, R * .3)}px ${getComputedStyle(document.body).getPropertyValue('--mono')}`;
    for (let i = 0; i < 3; i++) { const p = (t * .35 + i / 3) % 1; ctx.fillStyle = `rgba(195,240,47,${(1 - p) * .8})`; ctx.fillText('z', cx + R * (.8 + p * .6), by - R * (.7 + p * 1.1)); }
  }
}

/* ---------- adaptación a la web: la pelota viaja entre los huecos [data-ball] y se queda en la esquina ---------- */
const slots = [...document.querySelectorAll('[data-ball]')], dock = document.getElementById('ballDock');
function anchor() {
  const vh = innerHeight;
  for (const s of slots) { const r = s.getBoundingClientRect(); if (r.width && r.top < vh * .78 && r.bottom > vh * .18) return s; }
  return dock;
}
addEventListener('pointermove', e => { B.pointer = { x: e.clientX, y: e.clientY }; B.lookUntil = performance.now() + 2500; wake(); }, { passive: true });
addEventListener('scroll', () => { wake(); }, { passive: true });
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
window.KiraBall = { react: t => { if (!reduced) react(t); }, happy, setMood, setSound: v => { soundOn = v; if (v) snd('pop'); } };
requestAnimationFrame(frame);
setTimeout(() => happy(1300), 900);
})();
