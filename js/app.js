import { EXERCISES, BY_ID, ZONES } from './exercises.js';
import { Figure, drawThumb } from './figure.js';
import { buildWorkout, PRESETS, WEEK, INTENSITY, kcal } from './workouts.js';
import { say, beep, unlockAudio, setVoiceEnabled, vibrate } from './voice.js';

// ───────── estado persistente ─────────
const KEY = 'entrena.v1';
const DEFAULTS = {
  name: '', weight: 65, weekGoal: 150, voice: true, countReps: true, every: 4, model: 'full', facing: 'user',
  noJump: false, pelvic: true, camera: true, history: [], onboarded: false,
};
let S = load();
function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULTS }; }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }
setVoiceEnabled(S.voice);

const $ = (sel, el = document) => el.querySelector(sel);
const app = $('#app');
const h = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (secs) => `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;
const zoneName = (z) => ZONES.find((x) => x.id === z)?.name || z;
const zoneEmoji = (z) => ZONES.find((x) => x.id === z)?.emoji || '✨';

// ───────── router ─────────
let cleanup = [];
function onLeave(fn) { cleanup.push(fn); }
window.addEventListener('hashchange', route);
document.addEventListener('click', () => unlockAudio(), { once: true });
function go(hash) { location.hash = hash; }

function route() {
  cleanup.forEach((f) => { try { f(); } catch {} }); cleanup = [];
  const [, page, arg] = (location.hash || '#/').split('/');
  window.scrollTo(0, 0);
  if (!S.onboarded && page !== 'bienvenida') return go('#/bienvenida');
  const views = { '': home, bienvenida: welcome, crear: create, entreno: workoutView, play: player, ejercicios: library, ejercicio: exerciseView, progreso: progress, ajustes: settings, fin: summary };
  (views[page] || home)(arg ? decodeURIComponent(arg) : undefined);
  const tab = ['', 'ejercicios', 'progreso', 'ajustes'].includes(page) || page === 'crear' || page === 'entreno';
  document.body.classList.toggle('no-tabs', !tab);
  document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.p === (page === 'crear' || page === 'entreno' ? '' : page)));
}

function layout(html) {
  app.innerHTML = html;
  // miniaturas animadas: solo animan cuando se ven
  const figs = [];
  app.querySelectorAll('canvas[data-ex]').forEach((c) => {
    const ex = BY_ID[c.dataset.ex];
    if (c.dataset.anim) { const f = new Figure(c, ex); figs.push(f); f.start(); }
    else requestAnimationFrame(() => drawThumb(c, ex));
  });
  onLeave(() => figs.forEach((f) => f.stop()));
}

const wkKey = (o) => [o.minutes, o.zone, o.intensity, o.noJump ? 1 : 0, o.variant || 0, o.pelvic ? 1 : 0].join('.');
function parseKey(k) {
  const [m, zone, intensity, nj, v, p] = k.split('.');
  return { minutes: +m, zone, intensity, noJump: nj === '1', variant: +v || 0, pelvic: p === '1' };
}

// ───────── utilidades de progreso ─────────
const dayKey = (d) => new Date(d).toLocaleDateString('sv-SE');
function streak() {
  const days = new Set(S.history.map((x) => dayKey(x.date)));
  let n = 0; const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function weekMinutes() {
  const now = new Date(); const monday = new Date(now); monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Math.round(S.history.filter((x) => new Date(x.date) >= monday).reduce((a, b) => a + b.secs, 0) / 60);
}
function hiitThisWeek() {
  const now = new Date(); const monday = new Date(now); monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return S.history.filter((x) => new Date(x.date) >= monday && x.intensity === 'intenso').length;
}

// ───────── pantallas ─────────
function welcome() {
  layout(`
  <section class="welcome">
    <div class="hero-fig"><canvas data-ex="jacks" data-anim="1"></canvas></div>
    <h1>¡Hola! 👋</h1>
    <p class="lead">Tu entrenadora personal en casa: entrenos de 10 a 60 minutos, demostración de cada ejercicio y la cámara te corrige la postura en directo.</p>
    <label class="field"><span>¿Cómo te llamas?</span><input id="nm" autocomplete="given-name" placeholder="Tu nombre" value="${h(S.name)}"></label>
    <label class="field"><span>Peso aproximado (kg) <small>para calcular calorías</small></span><input id="wt" type="number" inputmode="numeric" value="${S.weight}"></label>
    <label class="check"><input type="checkbox" id="nj" ${S.noJump ? 'checked' : ''}> Prefiero ejercicios sin saltos (cuida rodillas y suelo pélvico)</label>
    <p class="privacy">🔒 Todo se queda en este iPhone. La cámara se analiza en el propio móvil y no se graba ni se envía a ningún sitio.</p>
    <button class="btn big" id="go">Empezar</button>
  </section>`);
  $('#go').onclick = () => {
    S.name = $('#nm').value.trim(); S.weight = +$('#wt').value || 65; S.noJump = $('#nj').checked; S.onboarded = true; save();
    go('#/');
  };
}

function home() {
  const today = WEEK[(new Date().getDay() + 6) % 7];
  const hour = new Date().getHours();
  const greet = hour < 13 ? 'Buenos días' : hour < 21 ? 'Buenas tardes' : 'Buenas noches';
  const wm = weekMinutes(), pct = Math.min(100, Math.round((wm / S.weekGoal) * 100));
  let todayKey = null;
  if (today.zone) {
    let intensity = today.intensity;
    if (intensity === 'intenso' && hiitThisWeek() >= 2) intensity = 'moderado';
    todayKey = wkKey({ minutes: 30, zone: today.zone, intensity, noJump: S.noJump, pelvic: S.pelvic });
  }
  const card = (p) => {
    const k = wkKey({ ...p, noJump: p.noJump || S.noJump, pelvic: S.pelvic });
    const w = buildWorkout(parseKey(k));
    const first = w.items.find((i) => i.kind === 'work' && i.phase.startsWith('Bloque'))?.id || w.items[0].id;
    return `<a class="pl" href="#/entreno/${k}">
      <div class="pl-fig"><canvas data-ex="${first}"></canvas><span class="pl-min">${p.minutes}<small>min</small></span></div>
      <div class="pl-txt"><b>${h(p.title)}</b><span>${h(p.desc)}</span>
      <span class="tags"><i class="int ${p.intensity}">${INTENSITY[p.intensity].name}</i><i>${zoneEmoji(p.zone)} ${zoneName(p.zone)}</i></span></div></a>`;
  };
  const groups = [[10, 15], [20], [30], [40, 50, 60]];
  layout(`
  <header class="top"><div><small>${greet}</small><h1>${S.name ? h(S.name) : 'Hola'} 💪</h1></div>
    <div class="streak" title="Días seguidos">🔥 ${streak()}</div></header>
  <section class="week-card">
    <div class="ring" style="--p:${pct}"><span>${wm}<small>/${S.weekGoal} min</small></span></div>
    <div><b>Esta semana</b><p>${pct >= 100 ? '¡Objetivo cumplido! 🎉' : `Te faltan ${Math.max(0, S.weekGoal - wm)} min para tu objetivo semanal.`}</p></div>
  </section>
  <section class="today">
    <small>Hoy, ${today.day.toLowerCase()}, toca</small>
    <h2>${h(today.label)}</h2>
    ${todayKey ? `<a class="btn" href="#/entreno/${todayKey}">Ver entreno de hoy · 30 min</a>` : '<p>Sal a caminar a buen ritmo o haz estiramientos suaves.</p><a class="btn ghost" href="#/entreno/' + wkKey({ minutes: 15, zone: 'estiramiento', intensity: 'suave', pelvic: S.pelvic }) + '">Estiramientos 15 min</a>'}
  </section>
  <a class="create" href="#/crear"><span>✨</span><div><b>Crear mi entreno</b><small>Elige minutos, zona e intensidad</small></div><span class="arrow">›</span></a>
  ${groups.map((g) => `<h3 class="sec">${g.join(', ').replace(/, (\d+)$/, ' y $1')} minutos</h3><div class="pls">${PRESETS.filter((p) => g.includes(p.minutes)).map(card).join('')}</div>`).join('')}
  `);
}

function create() {
  const st = { minutes: 30, zone: 'cuerpo', intensity: 'moderado', noJump: S.noJump, pelvic: S.pelvic };
  const mins = [10, 15, 20, 30, 40, 45, 50, 60];
  const render = () => {
    layout(`
    <header class="bar"><a href="#/" class="back">‹</a><h2>Crear entreno</h2></header>
    <section class="form">
      <h4>Duración</h4><div class="chips">${mins.map((m) => `<button data-m="${m}" class="${st.minutes === m ? 'on' : ''}">${m} min</button>`).join('')}</div>
      <h4>Zona</h4><div class="chips">${ZONES.map((z) => `<button data-z="${z.id}" class="${st.zone === z.id ? 'on' : ''}">${z.emoji} ${z.name}</button>`).join('')}</div>
      <h4>Intensidad</h4><div class="chips int">${Object.entries(INTENSITY).map(([k, v]) => `<button data-i="${k}" class="${st.intensity === k ? 'on' : ''} ${k}">${v.name}</button>`).join('')}</div>
      <p class="hint">${{ suave: 'Ritmo tranquilo, descansos largos, sin saltos. Ideal para empezar o días cansados.', moderado: 'Trabajo 40 s / descanso 20 s. El punto ideal para la mayoría de días.', intenso: 'Tipo HIIT: 45 s a tope / 15 s de descanso. Recomendado como mucho 2 veces por semana.' }[st.intensity]}</p>
      <label class="check"><input type="checkbox" id="nj" ${st.noJump ? 'checked' : ''}> Sin saltos</label>
      <label class="check"><input type="checkbox" id="pv" ${st.pelvic ? 'checked' : ''}> Incluir suelo pélvico al final</label>
      <button class="btn big" id="mk">Ver entreno</button>
    </section>`);
    app.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => { st.minutes = +b.dataset.m; render(); }));
    app.querySelectorAll('[data-z]').forEach((b) => (b.onclick = () => { st.zone = b.dataset.z; render(); }));
    app.querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => { st.intensity = b.dataset.i; render(); }));
    $('#nj').onchange = (e) => (st.noJump = e.target.checked);
    $('#pv').onchange = (e) => (st.pelvic = e.target.checked);
    $('#mk').onclick = () => go('#/entreno/' + wkKey(st));
  };
  render();
}

function workoutView(key) {
  const opts = parseKey(key);
  const preset = PRESETS.find((p) => p.minutes === opts.minutes && p.zone === opts.zone && p.intensity === opts.intensity);
  const w = buildWorkout(opts);
  const title = preset?.title || `${zoneName(opts.zone)} · ${INTENSITY[opts.intensity].name}`;
  let lastPhase = '';
  const rows = w.items.map((it) => {
    let head = '';
    const ph = it.phase.replace(/ · Ronda \d+/, '');
    if (ph !== lastPhase && it.kind === 'work') { head = `<h4 class="phase">${h(it.phase.startsWith('Bloque') ? 'Bloque principal' : ph)}</h4>`; lastPhase = ph; }
    if (it.kind === 'rest') return '';
    const ex = BY_ID[it.id];
    return `${head}<a class="row" href="#/ejercicio/${ex.id}"><canvas data-ex="${ex.id}"></canvas><div><b>${h(ex.name)}</b><small>${it.secs} s${it.round ? ` · ronda ${it.round}` : ''}</small></div><span class="arrow">›</span></a>`;
  }).join('');
  const hiitWarn = opts.intensity === 'intenso' && hiitThisWeek() >= 2;
  layout(`
  <header class="bar"><a href="javascript:history.back()" class="back">‹</a><h2>${h(title)}</h2></header>
  <section class="wk-head">
    <div class="stats"><div><b>${Math.round(w.secs / 60)}</b><small>min</small></div><div><b>${w.unique.length}</b><small>ejercicios</small></div><div><b>~${kcal(w, S.weight)}</b><small>kcal</small></div></div>
    <span class="tags"><i class="int ${opts.intensity}">${INTENSITY[opts.intensity].name}</i><i>${zoneEmoji(opts.zone)} ${zoneName(opts.zone)}</i>${opts.noJump ? '<i>Sin saltos</i>' : ''}</span>
    ${hiitWarn ? '<p class="warn">Ya llevas 2 entrenos intensos esta semana. Para recuperar bien, hoy mejor uno moderado.</p>' : ''}
    <label class="check"><input type="checkbox" id="cam" ${S.camera ? 'checked' : ''}> 📷 Usar la cámara para corregirme</label>
    <button class="btn big" id="start">▶ Empezar</button>
    <button class="btn ghost" id="other">🔀 Otra variante</button>
  </section>
  <section class="list">${rows}</section>`);
  $('#cam').onchange = (e) => { S.camera = e.target.checked; save(); };
  $('#other').onclick = () => go('#/entreno/' + wkKey({ ...opts, variant: (opts.variant || 0) + 1 }));
  $('#start').onclick = () => { unlockAudio(); sessionStorage.setItem('wk', JSON.stringify({ key, title })); go('#/play'); };
}

function library() {
  let filter = 'todos';
  const render = () => {
    const list = EXERCISES.filter((e) => filter === 'todos' || e.zones.includes(filter));
    layout(`
    <header class="top"><h1>Ejercicios</h1></header>
    <div class="chips scroll">${[{ id: 'todos', name: 'Todos', emoji: '' }, ...ZONES].map((z) => `<button data-z="${z.id}" class="${filter === z.id ? 'on' : ''}">${z.emoji} ${z.name}</button>`).join('')}</div>
    <section class="grid">${list.map((e) => `<a class="tile" href="#/ejercicio/${e.id}"><canvas data-ex="${e.id}"></canvas><b>${h(e.name)}</b><small>${'●'.repeat(e.level)}${'○'.repeat(3 - e.level)} ${e.impact === 'alto' ? '· con saltos' : ''}</small></a>`).join('')}</section>`);
    app.querySelectorAll('[data-z]').forEach((b) => (b.onclick = () => { filter = b.dataset.z; render(); }));
  };
  render();
}

function exerciseView(id) {
  const ex = BY_ID[id];
  if (!ex) return go('#/ejercicios');
  const link = (eid, label) => eid ? `<a class="btn ghost small" href="#/ejercicio/${eid}">${label}: ${h(BY_ID[eid].name)}</a>` : '';
  layout(`
  <header class="bar"><a href="javascript:history.back()" class="back">‹</a><h2>${h(ex.name)}</h2></header>
  <div class="demo"><canvas data-ex="${ex.id}" data-anim="1"></canvas>
    <div class="speed"><button data-s="0.5">0.5×</button><button data-s="1" class="on">1×</button></div></div>
  <section class="info">
    <p class="muscles">🎯 ${h(ex.muscles)}</p>
    <span class="tags"><i>Nivel ${'●'.repeat(ex.level)}${'○'.repeat(3 - ex.level)}</i><i>${ex.impact === 'alto' ? 'Con saltos' : 'Sin impacto'}</i>${ex.noCamera ? '' : `<i>📷 ${ex.coach.view === 'side' ? 'Ponte de lado' : 'Ponte de frente'}</i>`}</span>
    <h4>Cómo se hace</h4><ol>${ex.steps.map((s) => `<li>${h(s)}</li>`).join('')}</ol>
    ${ex.tips.length ? `<h4>Consejos</h4><ul class="ok">${ex.tips.map((s) => `<li>${h(s)}</li>`).join('')}</ul>` : ''}
    ${ex.errors.length ? `<h4>Errores típicos</h4><ul class="bad">${ex.errors.map((s) => `<li>${h(s)}</li>`).join('')}</ul>` : ''}
    <div class="alt">${link(ex.easier, 'Más fácil')}${link(ex.harder, 'Más difícil')}</div>
    <button class="btn" id="listen">🔊 Escuchar explicación</button>
    ${ex.noCamera ? '' : '<button class="btn big" id="try">📷 Practicar con cámara</button>'}
  </section>`);
  const fig = new Figure($('.demo canvas'), ex);
  // reemplaza la figura animada creada por layout para poder cambiar la velocidad
  app.querySelectorAll('.speed button').forEach((b) => (b.onclick = () => {
    app.querySelectorAll('.speed button').forEach((x) => x.classList.toggle('on', x === b));
    figSpeed(+b.dataset.s);
  }));
  function figSpeed(s) { window.__figs?.forEach((f) => (f.speed = s)); }
  fig.stop();
  $('#listen').onclick = () => { unlockAudio(); say(`${ex.name}. ${ex.steps.join(' ')} ${ex.tips[0] || ''}`, 3); };
  const t = $('#try');
  if (t) t.onclick = () => { unlockAudio(); sessionStorage.setItem('wk', JSON.stringify({ practice: ex.id, title: ex.name })); go('#/play'); };
}

// ───────── REPRODUCTOR ─────────
async function player() {
  const meta = JSON.parse(sessionStorage.getItem('wk') || 'null');
  if (!meta) return go('#/');
  let w;
  if (meta.practice) {
    w = { items: [{ id: meta.practice, kind: 'work', secs: 120, phase: 'Práctica' }], secs: 120, met: BY_ID[meta.practice].met, intensity: 'moderado', practice: true };
  } else {
    w = buildWorkout(parseKey(meta.key));
  }
  const useCam = (meta.practice || S.camera) && !!navigator.mediaDevices?.getUserMedia;

  layout(`
  <div class="player">
    <div class="p-top">
      <button class="icon" id="close">✕</button>
      <div class="p-phase" id="phase"></div>
      <div class="p-total" id="total"></div>
    </div>
    <div class="p-progress"><div id="prog"></div></div>
    <div class="stage" id="stage">
      <video id="vid" playsinline muted></video>
      <canvas id="skel"></canvas>
      <canvas id="demo" class="demo-big"></canvas>
      <div class="cam-status" id="camst"></div>
      <div class="feedback" id="fb"></div>
      <div class="overlay" id="ov"></div>
    </div>
    <div class="p-info">
      <div class="p-name"><small id="lbl"></small><h2 id="nm"></h2><p id="tip"></p></div>
      <div class="p-timer"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="bg"/><circle cx="50" cy="50" r="44" id="arc" class="fg"/></svg><span id="tm"></span></div>
    </div>
    <div class="p-reps" id="reps" hidden><b id="rc">0</b><small>repeticiones</small><span id="rq"></span></div>
    <div class="p-next" id="next"></div>
    <div class="p-ctrl">
      <button class="icon" id="prev">⏮</button>
      <button class="icon main" id="pp">⏸</button>
      <button class="icon" id="skip">⏭</button>
      <button class="icon" id="camb" ${useCam ? '' : 'hidden'}>📷</button>
      <button class="icon" id="snd">${S.voice ? '🔊' : '🔇'}</button>
    </div>
  </div>`);
  document.body.classList.add('playing');
  onLeave(() => document.body.classList.remove('playing'));

  const demoFig = new Figure($('#demo'), BY_ID[w.items[0].id]);
  demoFig.start();
  onLeave(() => demoFig.stop());

  // Pantalla siempre encendida
  let wake = null;
  const lock = async () => { try { wake = await navigator.wakeLock?.request('screen'); } catch {} };
  lock();
  const vis = () => { if (document.visibilityState === 'visible') lock(); else if (!paused) togglePause(); };
  document.addEventListener('visibilitychange', vis);
  onLeave(() => { document.removeEventListener('visibilitychange', vis); wake?.release?.(); });

  // estado
  let idx = -1, left = 0, paused = false, prep = true, elapsed = 0;
  const stats = {}; // id -> {reps, good}
  let coach = null, camOn = false;

  const stage = $('#stage');
  async function startCam() {
    try {
      const { Coach } = await import('./coach.js');
      coach = new Coach({
        video: $('#vid'), canvas: $('#skel'), settings: S,
        onRep: ({ reps, good }) => {
          (window.__ev ??= []).push({ t: Math.round(performance.now()), rep: reps, good });
          const it = w.items[idx]; if (!it || it.kind !== 'work') return;
          const s = (stats[it.id] ??= { reps: 0, good: 0 });
          s.reps++; if (good) s.good++;
          $('#rc').textContent = coach.reps;
          $('#rq').textContent = coach.reps ? `${Math.round((coach.goodReps / coach.reps) * 100)}% bien hechas` : '';
          $('#reps').classList.toggle('bad', !good);
          vibrate(good ? 25 : 80);
          if (S.countReps && good) setTimeout(() => say(String(coach.reps), 0), 50);
        },
        onFeedback: ({ msg, kind }) => {
          (window.__ev ??= []).push({ t: Math.round(performance.now()), msg, kind });
          const fb = $('#fb');
          fb.textContent = msg; fb.className = 'feedback show ' + kind;
          clearTimeout(fb._t); fb._t = setTimeout(() => (fb.className = 'feedback'), 2600);
          say(msg, kind === 'error' ? 2 : kind === 'frame' ? 2 : 1);
        },
        onStatus: ({ state, msg }) => {
          const el = $('#camst');
          el.className = 'cam-status ' + state;
          el.textContent = state === 'ok' ? '✓ Te veo bien' : msg;
        },
      });
      stage.classList.add('cam');
      await coach.start(S.facing);
      window.__coach = coach;
      camOn = true;
      const it = w.items[idx];
      if (it && it.kind === 'work') coach.setExercise(BY_ID[it.id]);
    } catch (e) {
      console.warn(e);
      stage.classList.remove('cam');
      coach?.stop(); coach = null; camOn = false;
      const msg = e?.name === 'NotAllowedError' ? 'Sin permiso de cámara. Actívalo en Ajustes › Safari › Cámara.' : 'No se pudo abrir la cámara.';
      $('#camst').className = 'cam-status frame'; $('#camst').textContent = msg;
    }
  }
  function stopCam() { coach?.stop(); coach = null; camOn = false; stage.classList.remove('cam'); $('#camst').className = 'cam-status'; $('#reps').hidden = true; }
  onLeave(stopCam);
  if (useCam) startCam();
  $('#camb').onclick = () => (camOn ? stopCam() : startCam());

  function nextWork(from) { for (let i = from; i < w.items.length; i++) if (w.items[i].kind === 'work') return w.items[i]; return null; }

  function show() {
    const it = w.items[idx];
    const ex = BY_ID[(it.kind === 'work' ? it : nextWork(idx) || it).id];
    demoFig.set(ex);
    const rest = it.kind === 'rest';
    stage.classList.toggle('resting', rest);
    $('#lbl').textContent = rest ? 'Descanso · prepárate para' : it.phase;
    $('#nm').textContent = ex.name;
    $('#tip').textContent = rest ? (ex.coach && !ex.noCamera && camOn ? `📷 ${ex.coach.view === 'side' ? 'Ponte de lado al móvil' : 'Ponte de frente al móvil'} · ` : '') + (ex.steps[0] || '') : (ex.tips[0] || ex.steps[0] || '');
    $('#phase').textContent = it.phase.replace('Bloque principal · ', '');
    $('#ov').innerHTML = rest ? `<div class="rest-badge">DESCANSO</div>` : '';
    const nxt = nextWork(idx + 1);
    $('#next').innerHTML = nxt && !rest ? `Siguiente: <b>${h(BY_ID[nxt.id].name)}</b>` : '';
    const hasReps = !rest && camOn && ex.coach?.rep && !ex.noCamera;
    $('#reps').hidden = !hasReps;
    $('#rc').textContent = '0'; $('#rq').textContent = ''; $('#reps').classList.remove('bad');
    if (coach) { if (!rest && !ex.noCamera) coach.setExercise(ex); else coach.setExercise({ ...ex, coach: { checks: [] } }); }
  }

  function begin(i) {
    if (finished) return;
    idx = i;
    if (idx >= w.items.length) return finish();
    const it = w.items[idx];
    left = it.secs;
    show();
    const ex = BY_ID[it.id];
    if (it.kind === 'rest') {
      const nx = nextWork(idx + 1);
      say(`Descansa. Ahora viene: ${BY_ID[nx.id].name}`, 3);
    } else {
      const sideTxt = camOn && !ex.noCamera && ex.coach ? (ex.coach.view === 'side' ? ' Ponte de lado.' : ' Ponte de frente.') : '';
      const prevIt = w.items[idx - 1];
      say(prevIt?.kind === 'rest' ? `¡Vamos! ${ex.name}.` : `${ex.name}.${sideTxt} ${ex.steps[0]}`, 3);
      beep(1046, 180);
    }
  }

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    const done = Math.round(elapsed);
    const entry = {
      date: new Date().toISOString(), secs: done, title: meta.title, key: meta.key, intensity: w.intensity, zone: w.zone,
      kcal: kcal(w, S.weight, done), reps: Object.values(stats).reduce((a, b) => a + b.reps, 0), good: Object.values(stats).reduce((a, b) => a + b.good, 0),
      practice: !!w.practice,
    };
    if (done >= 60) { S.history.push(entry); save(); }
    sessionStorage.setItem('last', JSON.stringify({ ...entry, stats }));
    say(done >= 60 ? `¡Entrenamiento terminado! Muy bien${S.name ? ', ' + S.name : ''}.` : 'Entrenamiento terminado', 3);
    go('#/fin');
  }

  // preparación: 10 s
  let prepLeft = meta.practice ? 5 : 10;
  idx = 0; show();
  $('#lbl').textContent = 'Prepárate';
  $('#ov').innerHTML = `<div class="rest-badge">PREPÁRATE</div>`;
  const firstEx = BY_ID[w.items[0].id];
  say(`Vamos a empezar. Primer ejercicio: ${firstEx.name}.${useCam ? ' Apoya el móvil en el suelo o en una silla, a unos dos o tres metros, y que se te vea entera.' : ''}`, 3);

  const total = w.items.reduce((a, b) => a + b.secs, 0);
  const arc = $('#arc'), C = 2 * Math.PI * 44;
  arc.style.strokeDasharray = C;
  let last = performance.now();
  const timer = setInterval(() => {
    const now = performance.now(); const dt = (now - last) / 1000; last = now;
    if (paused) return;
    if (prep) {
      prepLeft -= dt;
      $('#tm').textContent = Math.ceil(Math.max(0, prepLeft));
      arc.style.strokeDashoffset = C * (1 - Math.max(0, prepLeft) / 10);
      if (prepLeft <= 3 && Math.ceil(prepLeft) !== Math.ceil(prepLeft + dt)) beep(660, 100);
      if (prepLeft <= 0) { prep = false; begin(0); }
      return;
    }
    const it = w.items[idx];
    if (!it || finished) return;
    const before = left;
    left -= dt; elapsed += dt;
    const sec = Math.ceil(left), prevSec = Math.ceil(before);
    if (sec !== prevSec) {
      if (sec <= 3 && sec > 0) beep(it.kind === 'rest' ? 660 : 880, 100);
      if (it.kind === 'work') {
        const ex = BY_ID[it.id];
        if (ex.sides && sec === Math.ceil(it.secs / 2)) say('Cambia de lado', 2);
        else if (sec === 10 && it.secs >= 30) say('Últimos diez segundos', 1);
        else if (ex.voice && (it.secs - sec) % ex.voice.every === 0 && sec > 1) say(((it.secs - sec) / ex.voice.every) % 2 ? ex.voice.b : ex.voice.a, 1);
        else if (!camOn && sec === Math.ceil(it.secs / 2) + 2 && it.secs >= 40 && ex.tips[0]) say(ex.tips[0], 0);
      }
    }
    $('#tm').textContent = fmt(Math.max(0, left)).replace(/^0:/, '');
    arc.style.strokeDashoffset = C * (1 - Math.max(0, left) / it.secs);
    const doneSecs = w.items.slice(0, idx).reduce((a, b) => a + b.secs, 0) + (it.secs - left);
    $('#prog').style.width = (100 * doneSecs) / total + '%';
    $('#total').textContent = fmt(Math.max(0, total - doneSecs));
    if (left <= 0) begin(idx + 1);
  }, 100);
  onLeave(() => clearInterval(timer));

  function togglePause() {
    paused = !paused;
    $('#pp').textContent = paused ? '▶' : '⏸';
    stage.classList.toggle('paused', paused);
    if (paused) { $('#ov').innerHTML = '<div class="rest-badge">PAUSA</div>'; speechSynthesis?.cancel(); }
    else { $('#ov').innerHTML = ''; last = performance.now(); if (w.items[idx]?.kind === 'rest') $('#ov').innerHTML = '<div class="rest-badge">DESCANSO</div>'; }
  }
  $('#pp').onclick = togglePause;
  $('#skip').onclick = () => { if (prep) { prep = false; begin(0); } else begin(idx + 1); };
  $('#prev').onclick = () => { if (prep) return; let i = idx - 1; while (i > 0 && w.items[i].kind === 'rest') i--; begin(Math.max(0, i)); };
  $('#snd').onclick = (e) => { S.voice = !S.voice; save(); setVoiceEnabled(S.voice); e.target.textContent = S.voice ? '🔊' : '🔇'; };
  $('#close').onclick = () => {
    if (elapsed > 60 && !confirmLeave()) return;
    if (elapsed > 60) finish(); else go(meta.practice ? '#/ejercicio/' + meta.practice : '#/entreno/' + meta.key);
  };
  function confirmLeave() { if (!paused) togglePause(); return window.confirm('¿Terminar el entrenamiento ahora? Se guardará lo que llevas.'); }
}

function summary() {
  const last = JSON.parse(sessionStorage.getItem('last') || 'null');
  if (!last) return go('#/');
  const tech = last.reps ? Math.round((last.good / last.reps) * 100) : null;
  const rows = Object.entries(last.stats || {}).map(([id, s]) => `<li><span>${h(BY_ID[id].name)}</span><b>${s.reps} reps · ${Math.round((s.good / Math.max(1, s.reps)) * 100)}%</b></li>`).join('');
  layout(`
  <section class="done">
    <div class="confetti">🎉</div>
    <h1>¡Enhorabuena${S.name ? ', ' + h(S.name) : ''}!</h1>
    <p>${h(last.title || 'Entreno')}</p>
    <div class="stats"><div><b>${Math.round(last.secs / 60)}</b><small>min</small></div><div><b>${last.kcal}</b><small>kcal</small></div><div><b>🔥 ${streak()}</b><small>días seguidos</small></div></div>
    ${tech != null ? `<div class="tech"><b>${tech}%</b><span>técnica correcta (${last.good} de ${last.reps} repeticiones)</span></div><ul class="ex-stats">${rows}</ul>` : ''}
    <h4>¿Qué tal te ha parecido?</h4>
    <div class="chips feel"><button data-f="facil">😌 Fácil</button><button data-f="bien">🙂 Bien</button><button data-f="duro">🥵 Duro</button></div>
    <p class="hint" id="adv"></p>
    <a class="btn big" href="#/">Volver al inicio</a>
  </section>`);
  app.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => {
    app.querySelectorAll('[data-f]').forEach((x) => x.classList.toggle('on', x === b));
    const e = S.history[S.history.length - 1];
    if (e && e.date === last.date) { e.feel = b.dataset.f; save(); }
    const recent = S.history.slice(-3).map((x) => x.feel);
    $('#adv').textContent = b.dataset.f === 'facil'
      ? (recent.filter((f) => f === 'facil').length >= 2 ? 'Llevas varios entrenos fáciles: prueba a subir la intensidad o los minutos. 💪' : '¡Genial! Si sigue siendo fácil, la próxima vez sube un nivel.')
      : b.dataset.f === 'duro' ? 'Normal al principio. La próxima vez puedes bajar a «Suave» o elegir menos minutos. Lo importante es la constancia.' : '¡Perfecto, ese es el punto ideal!';
  }));
}

function progress() {
  const hist = [...S.history].reverse();
  const days = new Set(S.history.map((x) => dayKey(x.date)));
  const cal = [];
  const d = new Date(); d.setDate(d.getDate() - 27);
  for (let i = 0; i < 28; i++) { cal.push({ k: dayKey(d), n: d.getDate(), today: i === 27 }); d.setDate(d.getDate() + 1); }
  const totMin = Math.round(S.history.reduce((a, b) => a + b.secs, 0) / 60);
  const totK = S.history.reduce((a, b) => a + (b.kcal || 0), 0);
  layout(`
  <header class="top"><h1>Mi progreso</h1></header>
  <section class="stats big"><div><b>${S.history.length}</b><small>entrenos</small></div><div><b>${totMin}</b><small>minutos</small></div><div><b>${totK}</b><small>kcal</small></div><div><b>🔥 ${streak()}</b><small>racha</small></div></section>
  <h3 class="sec">Últimas 4 semanas</h3>
  <section class="cal">${cal.map((c) => `<span class="${days.has(c.k) ? 'on' : ''} ${c.today ? 'today' : ''}">${c.n}</span>`).join('')}</section>
  <h3 class="sec">Plan semanal recomendado</h3>
  <section class="weekplan">${WEEK.map((x, i) => `<div class="${i === (new Date().getDay() + 6) % 7 ? 'now' : ''}"><b>${x.day}</b><span>${h(x.label)}</span></div>`).join('')}</section>
  <p class="hint">Basado en las recomendaciones para mujeres adultas: 150 min de actividad a la semana, fuerza 2-3 días, intervalos intensos como mucho 2 días y suelo pélvico a diario.</p>
  <h3 class="sec">Historial</h3>
  <section class="hist">${hist.length ? hist.slice(0, 40).map((x) => `<div><b>${h(x.title || 'Entreno')}</b><small>${new Date(x.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} · ${Math.round(x.secs / 60)} min · ${x.kcal} kcal${x.reps ? ` · técnica ${Math.round((x.good / x.reps) * 100)}%` : ''}${x.feel ? ' · ' + { facil: '😌', bien: '🙂', duro: '🥵' }[x.feel] : ''}</small></div>`).join('') : '<p class="empty">Aquí aparecerán tus entrenos.</p>'}</section>`);
}

function settings() {
  layout(`
  <header class="top"><h1>Ajustes</h1></header>
  <section class="form">
    <label class="field"><span>Nombre</span><input id="nm" value="${h(S.name)}"></label>
    <label class="field"><span>Peso (kg)</span><input id="wt" type="number" inputmode="numeric" value="${S.weight}"></label>
    <label class="field"><span>Objetivo semanal (minutos)</span><input id="wg" type="number" inputmode="numeric" value="${S.weekGoal}"></label>
    <h4>Voz y cámara</h4>
    <label class="check"><input type="checkbox" id="vo" ${S.voice ? 'checked' : ''}> Voz de la entrenadora</label>
    <label class="check"><input type="checkbox" id="cr" ${S.countReps ? 'checked' : ''}> Contar repeticiones en voz alta</label>
    <label class="check"><input type="checkbox" id="ca" ${S.camera ? 'checked' : ''}> Usar cámara en los entrenos</label>
    <label class="field"><span>Corregirme como mucho cada…</span><select id="ev">${[3, 5, 8, 12].map((v) => `<option value="${v}" ${S.every == v ? 'selected' : ''}>${v} segundos</option>`).join('')}</select></label>
    <label class="field"><span>Detector de postura</span><select id="md"><option value="full" ${S.model === 'full' ? 'selected' : ''}>Preciso (recomendado)</option><option value="lite" ${S.model === 'lite' ? 'selected' : ''}>Rápido (para iPhone antiguo)</option></select></label>
    <label class="field"><span>Cámara</span><select id="fc"><option value="user" ${S.facing === 'user' ? 'selected' : ''}>Delantera (te ves en la pantalla)</option><option value="environment" ${S.facing === 'environment' ? 'selected' : ''}>Trasera (mejor calidad)</option></select></label>
    <h4>Entrenos</h4>
    <label class="check"><input type="checkbox" id="nj" ${S.noJump ? 'checked' : ''}> Sin saltos</label>
    <label class="check"><input type="checkbox" id="pv" ${S.pelvic ? 'checked' : ''}> Suelo pélvico al final</label>
    <button class="btn ghost" id="test">🔊 Probar voz</button>
    <button class="btn danger" id="reset">Borrar historial</button>
    <p class="hint">🔒 Todo se guarda solo en este iPhone. La cámara se procesa en el propio móvil.</p>
    <p class="hint">Consejo: si tienes alguna lesión, dolor o problema de salud, consulta con tu médico o fisio antes de hacer los entrenos intensos.</p>
  </section>`);
  const bind = (id, key, fn = (e) => e.target.value) => ($('#' + id).onchange = (e) => { S[key] = fn(e); save(); if (key === 'voice') setVoiceEnabled(S.voice); });
  bind('nm', 'name'); bind('wt', 'weight', (e) => +e.target.value || 65); bind('wg', 'weekGoal', (e) => +e.target.value || 150);
  bind('vo', 'voice', (e) => e.target.checked); bind('cr', 'countReps', (e) => e.target.checked); bind('ca', 'camera', (e) => e.target.checked);
  bind('ev', 'every', (e) => +e.target.value); bind('md', 'model'); bind('fc', 'facing');
  bind('nj', 'noJump', (e) => e.target.checked); bind('pv', 'pelvic', (e) => e.target.checked);
  $('#test').onclick = () => { unlockAudio(); say(`Hola${S.name ? ' ' + S.name : ''}, soy tu entrenadora. ¡Vamos a por ello!`, 3); };
  $('#reset').onclick = () => { if (confirm('¿Borrar todo el historial?')) { S.history = []; save(); progress(); go('#/progreso'); } };
}

// Registro de figuras animadas (para cambiar velocidad)
const origStart = Figure.prototype.start;
Figure.prototype.start = function () { (window.__figs ??= new Set()).add(this); return origStart.call(this); };
const origStop = Figure.prototype.stop;
Figure.prototype.stop = function () { window.__figs?.delete(this); return origStop.call(this); };

// Service worker (funciona sin internet)
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

route();
