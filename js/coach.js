// Entrenador por cámara: MediaPipe Pose (en el propio iPhone) + máquina de estados por ángulos.
import { FilesetResolver, PoseLandmarker } from '../vendor/mediapipe/vision_bundle.mjs';

const LM = { nose: 0, lSh: 11, rSh: 12, lEl: 13, rEl: 14, lWr: 15, rWr: 16, lHip: 23, rHip: 24, lKn: 25, rKn: 26, lAn: 27, rAn: 28, lHeel: 29, rHeel: 30, lToe: 31, rToe: 32 };
const SIDES = {
  l: { sh: 11, el: 13, wr: 15, hip: 23, kn: 25, an: 27, heel: 29, toe: 31 },
  r: { sh: 12, el: 14, wr: 16, hip: 24, kn: 26, an: 28, heel: 30, toe: 32 },
};
const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 29], [29, 31], [27, 31], [28, 30], [30, 32], [28, 32]];

const deg = (r) => (r * 180) / Math.PI;
function angle3(a, b, c) {
  const v1 = [a.x - b.x, a.y - b.y, a.z - b.z], v2 = [c.x - b.x, c.y - b.y, c.z - b.z];
  const d = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
  const n = Math.hypot(...v1) * Math.hypot(...v2) || 1;
  return deg(Math.acos(Math.max(-1, Math.min(1, d / n))));
}
const vis = (p) => (p ? (p.visibility ?? 1) : 0);
const inFrame = (p) => p && p.x > -0.02 && p.x < 1.02 && p.y > -0.02 && p.y < 1.03;

let landmarkerPromise = null;
async function getLandmarker(model) {
  if (landmarkerPromise) return landmarkerPromise;
  landmarkerPromise = (async () => {
    const fs = await FilesetResolver.forVisionTasks(new URL('../vendor/mediapipe', import.meta.url).href);
    const opts = (delegate) => ({
      baseOptions: { modelAssetPath: new URL(`../vendor/mediapipe/pose_landmarker_${model}.task`, import.meta.url).href, delegate },
      runningMode: 'VIDEO', numPoses: 1,
      minPoseDetectionConfidence: 0.55, minPosePresenceConfidence: 0.55, minTrackingConfidence: 0.6,
      // En iOS es más fiable pasar un canvas propio para el contexto WebGL
      canvas: delegate === 'GPU' ? document.createElement('canvas') : undefined,
    });
    try {
      return await PoseLandmarker.createFromOptions(fs, opts('GPU'));
    } catch (e) {
      console.warn('GPU no disponible, uso CPU', e);
      return await PoseLandmarker.createFromOptions(fs, opts('CPU'));
    }
  })();
  landmarkerPromise.catch(() => { landmarkerPromise = null; });
  return landmarkerPromise;
}
export function preloadPose(model = 'full') { return getLandmarker(model).catch(() => null); }

export class Coach {
  constructor({ video, canvas, settings, onRep, onFeedback, onStatus }) {
    Object.assign(this, { video, canvas, settings, onRep, onFeedback, onStatus });
    this.ctx = canvas.getContext('2d');
    this.ex = null;
    this.stream = null;
    this.running = false;
    this.smooth = {};
    this.lastFeedbackAt = 0;
    this.lastErrAt = 0;
    this.fps = 0;
  }

  async start(facing = 'user') {
    this.facing = facing;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
    });
    this.video.srcObject = this.stream;
    this.video.setAttribute('playsinline', '');
    this.video.muted = true;
    await this.video.play();
    this.mirror = facing === 'user';
    this.video.style.transform = this.mirror ? 'scaleX(-1)' : 'none';
    this.canvas.style.transform = this.mirror ? 'scaleX(-1)' : 'none';
    this.onStatus?.({ state: 'loading', msg: 'Preparando el detector…' });
    this.lm = await getLandmarker(this.settings.model || 'full');
    this.running = true;
    this.lastSeen = performance.now();
    this.loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setExercise(ex) {
    this.ex = ex;
    this.reps = 0; this.goodReps = 0;
    this.phase = 'rest'; this.cycle = null; this.cycleStart = 0;
    this.holdErr = {};
    this.smooth = {};
    this.goodStreak = 0;
    this.statusSince = {};
    this.lastStatus = null;
  }

  loop() {
    if (!this.running) return;
    this.raf = requestAnimationFrame(() => this.loop());
    const now = performance.now();
    if (this.video.readyState < 2 || now - (this.lastDetect || 0) < 45) return; // ~20 fps
    const dt = now - (this.lastDetect || now);
    this.lastDetect = now;
    if (dt > 0) this.fps = this.fps * 0.9 + (1000 / dt) * 0.1;
    let res;
    try { res = this.lm.detectForVideo(this.video, now); } catch (e) { console.warn(e); return; }
    const lm = res.landmarks?.[0], wl = res.worldLandmarks?.[0];
    this.draw(lm);
    if (!lm || !wl) {
      if (now - this.lastSeen > 1500) this.status('noperson', 'No te veo. Ponte delante del móvil con buena luz');
      return;
    }
    this.lastSeen = now;
    this.process(lm, wl, now);
  }

  status(state, msg) {
    if (this.lastStatus !== state) { this.lastStatus = state; this.statusAt = performance.now(); }
    this.onStatus?.({ state, msg });
    // Avisos de encuadre hablados (cada 6 s como mucho)
    if (state !== 'ok' && state !== 'loading' && performance.now() - this.statusAt > 1200) this.feedback(msg, 'frame', 6000);
  }

  feedback(msg, kind, minGap) {
    const now = performance.now();
    const gap = minGap ?? (this.settings.every || 4) * 1000;
    if (now - this.lastFeedbackAt < gap) return false;
    this.lastFeedbackAt = now;
    if (kind === 'error') this.lastErrAt = now;
    this.onFeedback?.({ msg, kind });
    return true;
  }

  // ───────── métricas ─────────
  metrics(lm, wl) {
    const W = this.video.videoWidth || 640, H = this.video.videoHeight || 480;
    const P = (i) => ({ x: lm[i].x * W, y: lm[i].y * H });
    const sideVis = (s) => ['sh', 'el', 'wr', 'hip', 'kn', 'an'].reduce((a, k) => a + vis(lm[SIDES[s][k]]), 0);
    const best = sideVis('l') >= sideVis('r') ? 'l' : 'r';
    const okSide = (s, keys) => keys.every((k) => vis(lm[SIDES[s][k]]) > 0.45);
    const per = {};
    for (const s of ['l', 'r']) {
      const I = SIDES[s];
      per[s] = {
        knee: angle3(wl[I.hip], wl[I.kn], wl[I.an]),
        hip: angle3(wl[I.sh], wl[I.hip], wl[I.kn]),
        elbow: angle3(wl[I.sh], wl[I.el], wl[I.wr]),
        arm: angle3(wl[I.hip], wl[I.sh], wl[I.el]),
        legOk: okSide(s, ['hip', 'kn', 'an']),
        armOk: okSide(s, ['sh', 'el', 'wr']),
      };
    }
    const pick = (key, okKey, fn) => {
      const vals = ['l', 'r'].filter((s) => per[s][okKey]).map((s) => per[s][key]);
      if (!vals.length) return per[best][key];
      return fn(...vals);
    };
    const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const shM = mid(P(11), P(12)), hipM = mid(P(23), P(24));
    const I = SIDES[best];
    const m = {
      knee: pick('knee', 'legOk', Math.min),
      kneeMin: pick('knee', 'legOk', Math.min),
      hip: pick('hip', 'legOk', Math.min),
      hipMax: pick('hip', 'legOk', Math.max),
      kneeLift: Math.min(per.l.hip, per.r.hip),
      elbow: pick('elbow', 'armOk', Math.min),
      elbowMax: pick('elbow', 'armOk', Math.max),
      armRaise: (per.l.arm + per.r.arm) / 2,
    };
    // inclinación del tronco respecto a la vertical (2D)
    const tx = shM.x - hipM.x, ty = shM.y - hipM.y;
    m.lean = deg(Math.atan2(Math.abs(tx), -ty));
    // hundimiento de cadera respecto a la línea hombro-tobillo / hombro-rodilla (positivo = cadera baja)
    const sagOf = (endIdx) => {
      const S = P(I.sh), Hh = P(I.hip), A = P(endIdx);
      const len = Math.hypot(A.x - S.x, A.y - S.y) || 1;
      if (Math.abs(A.x - S.x) < len * 0.5) return 0; // no está horizontal
      const k = (Hh.x - S.x) / (A.x - S.x);
      const yLine = S.y + (A.y - S.y) * k;
      return (Hh.y - yLine) / len;
    };
    m.sag = sagOf(I.an);
    m.sagK = sagOf(I.kn);
    const hipW = Math.abs(P(23).x - P(24).x) || 1;
    m.legSpread = Math.abs(P(27).x - P(28).x) / hipW;
    m.valgus = Math.abs(P(25).x - P(26).x) / (Math.abs(P(27).x - P(28).x) || 1);
    const shin = Math.hypot(P(I.kn).x - P(I.an).x, P(I.kn).y - P(I.an).y) || 1;
    m.heel = (P(I.toe).y - P(I.heel).y) / shin;
    // orientación: hombros anchos = de frente
    const shW = Math.hypot(P(11).x - P(12).x, P(11).y - P(12).y);
    const torso = Math.hypot(tx, ty) || 1;
    m._orient = shW / torso;
    m._best = best;
    return m;
  }

  framing(lm, best) {
    const need = this.ex?.coach?.need || 'full';
    const side = this.ex?.coach?.view === 'side';
    const sets = { full: ['sh', 'hip', 'kn', 'an'], upper: ['sh', 'el', 'wr', 'hip'], lower: ['hip', 'kn', 'an'] }[need];
    const sides = side ? [best] : ['l', 'r'];
    const missing = [];
    for (const s of sides) for (const k of sets) {
      const p = lm[SIDES[s][k]];
      if (vis(p) < 0.5 || !inFrame(p)) missing.push(k);
    }
    if (!missing.length) return null;
    if (missing.includes('an') || missing.includes('kn')) return 'Aléjate un poco: necesito verte los pies';
    if (missing.includes('sh') || missing.includes('wr')) return 'Aléjate un poco: necesito verte los brazos y la cabeza';
    return 'Colócate en el centro de la imagen';
  }

  process(lm, wl, now) {
    const raw = this.metrics(lm, wl);
    // suavizado exponencial
    const a = 0.45;
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v !== 'number' || !isFinite(v)) continue;
      this.smooth[k] = this.smooth[k] == null ? v : this.smooth[k] * (1 - a) + v * a;
    }
    const m = this.smooth;
    this.current = m;
    if (!this.ex) return;
    const cc = this.ex.coach || {};

    const frameMsg = this.framing(lm, raw._best);
    if (frameMsg) { this.status('frame', frameMsg); return; }
    // orientación solo para ejercicios de pie
    // solo se comprueba de pie y erguida (en cuclillas el tronco se acorta y engaña)
    const upright = m.lean < 25 && m.knee > 145;
    let orient = null;
    if (upright && cc.view === 'side' && m._orient > 0.45) orient = 'Ponte de lado al móvil';
    if (upright && cc.view === 'front' && m._orient < 0.28) orient = 'Ponte de frente al móvil';
    if (orient) { this.orientBad ??= now; } else if (upright) this.orientBad = null;
    if (orient && now - this.orientBad > 1500) this.status('orient', orient);
    else if (!this.orientBad) this.status('ok', '');

    // posturas mantenidas
    for (const c of cc.checks || []) {
      if (!c.hold) continue;
      const bad = c.op === '>' ? m[c.m] > c.v : m[c.m] < c.v;
      const key = c.m + c.op + c.v;
      if (bad) {
        this.holdErr[key] ??= now;
        if (now - this.holdErr[key] > 1000) this.feedback(c.msg, 'error');
      } else delete this.holdErr[key];
    }
    if ((cc.checks || []).some((c) => c.hold) && !Object.keys(this.holdErr).length && now - this.lastErrAt > 9000 && now - this.lastFeedbackAt > 12000) {
      this.feedback(pick(['¡Muy bien, aguanta así!', 'Postura perfecta, respira', '¡Genial, sigue así!']), 'good', 12000);
    }

    // repeticiones
    const r = cc.rep;
    if (!r) return;
    const v = m[r.m];
    const down = r.active < r.rest;
    const inActive = down ? v < r.active : v > r.active;
    const inRest = down ? v > r.rest : v < r.rest;
    const span = Math.abs(r.rest - r.active);
    if (this.phase === 'rest') {
      const away = down ? r.rest - v : v - r.rest;
      if (away > span * 0.25 && !this.cycle) { this.cycle = { min: {}, max: {}, peak: false }; this.cycleStart = now; }
      if (this.cycle && inActive) { this.phase = 'active'; this.cycle.peak = true; }
      if (this.cycle && inRest && !this.cycle.peak) {
        // medio movimiento que no llegó
        if (now - this.cycleStart > 400 && away <= 0) this.partial();
        this.cycle = null;
      }
    } else if (inRest) {
      this.phase = 'rest';
      if (now - this.cycleStart > 350) this.completeRep();
      this.cycle = null;
    }
    if (this.cycle) {
      for (const [k, val] of Object.entries(m)) {
        if (typeof val !== 'number') continue;
        this.cycle.min[k] = Math.min(this.cycle.min[k] ?? val, val);
        this.cycle.max[k] = Math.max(this.cycle.max[k] ?? val, val);
      }
    }
  }

  partial() {
    const first = (this.ex.coach.checks || []).find((c) => !c.hold && c.m === this.ex.coach.rep.m);
    this.feedback(first ? first.msg : 'Haz el movimiento completo', 'error');
  }

  completeRep() {
    this.reps++;
    const errs = [];
    for (const c of this.ex.coach.checks || []) {
      if (c.hold) continue;
      const val = c.stat === 'min' ? this.cycle.min[c.m] : this.cycle.max[c.m];
      if (val == null) continue;
      if (c.op === '>' ? val > c.v : val < c.v) errs.push(c.msg);
    }
    const good = errs.length === 0;
    if (good) { this.goodReps++; this.goodStreak++; } else this.goodStreak = 0;
    this.onRep?.({ reps: this.reps, good, goodReps: this.goodReps });
    if (!good) this.feedback(errs[0], 'error');
    else if (this.goodStreak % 5 === 0) this.feedback(pick(['¡Perfecto!', '¡Muy bien hecho!', '¡Así se hace!', '¡Técnica genial!']), 'good', 2500);
  }

  // ───────── dibujo del esqueleto ─────────
  draw(lm) {
    const c = this.canvas, ctx = this.ctx;
    const w = c.clientWidth, h = c.clientHeight, dpr = window.devicePixelRatio || 1;
    if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!lm) return;
    // object-fit: cover
    const vw = this.video.videoWidth, vh = this.video.videoHeight;
    const s = Math.max(w / vw, h / vh);
    const ox = (w - vw * s) / 2, oy = (h - vh * s) / 2;
    const X = (p) => ox + p.x * vw * s, Y = (p) => oy + p.y * vh * s;
    const err = performance.now() - this.lastErrAt < 1800;
    ctx.lineCap = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = err ? 'rgba(255,92,92,0.9)' : 'rgba(80,230,160,0.9)';
    for (const [a, b] of BONES) {
      if (vis(lm[a]) < 0.4 || vis(lm[b]) < 0.4) continue;
      ctx.beginPath(); ctx.moveTo(X(lm[a]), Y(lm[a])); ctx.lineTo(X(lm[b]), Y(lm[b])); ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    for (const i of [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
      if (vis(lm[i]) < 0.4) continue;
      ctx.beginPath(); ctx.arc(X(lm[i]), Y(lm[i]), 5, 0, 7); ctx.fill();
    }
  }
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
