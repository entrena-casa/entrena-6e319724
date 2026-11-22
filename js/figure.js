// Figura minimalista (trazo único) que demuestra cada ejercicio (dibujada en canvas, sin vídeos externos).
// Pose = ángulos absolutos en grados. Extremidades: 0 = hacia abajo, +90 = hacia delante (+x).
// Tronco: 0 = vertical hacia arriba, + = inclinado hacia delante.
// Vista 'side': mira hacia +x; 'r' = extremidades cercanas, 'l' = lejanas.
// Vista 'front': mira a la cámara; ángulo + = hacia fuera del cuerpo.

const L = { torso: 0.52, neck: 0.07, head: 0.105, ua: 0.29, fa: 0.27, th: 0.44, sh: 0.42, foot: 0.13 };

const rad = (d) => (d * Math.PI) / 180;
const limb = (p, a, len) => ({ x: p.x + Math.sin(rad(a)) * len, y: p.y - Math.cos(rad(a)) * len });
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const DEF = { t: 0, h: 0, la: [6, 4], ra: [6, 4], ll: [0, 0], rl: [0, 0], lift: 0, ft: 0 };

function lerpPose(a, b, k) {
  const out = {};
  for (const key of Object.keys(DEF)) {
    const va = a[key] ?? DEF[key];
    const vb = b[key] ?? DEF[key];
    out[key] = Array.isArray(va) ? va.map((v, i) => v + (vb[i] - v) * k) : va + (vb - va) * k;
  }
  return out;
}

// Calcula posiciones de articulaciones (y hacia arriba, cadera en 0,0)
function joints(pose, view) {
  const p = { ...DEF, ...pose };
  const hip = { x: 0, y: 0 };
  const sh = { x: Math.sin(rad(p.t)) * L.torso, y: Math.cos(rad(p.t)) * L.torso };
  const hd = { x: sh.x + Math.sin(rad(p.t + p.h)) * (L.neck + L.head), y: sh.y + Math.cos(rad(p.t + p.h)) * (L.neck + L.head) };
  const J = { hip, sh, head: hd, view, pose: p };
  if (view === 'front') {
    const sw = 0.17, hw = 0.1;
    for (const [side, s] of [['r', -1], ['l', 1]]) {
      const S = { x: sh.x + s * sw, y: sh.y - 0.02 };
      const H = { x: s * hw, y: 0 };
      const arm = p[side + 'a'], leg = p[side + 'l'];
      const E = limb(S, s * arm[0], L.ua);
      const W = limb(E, s * arm[1], L.fa);
      const K = limb(H, s * leg[0], L.th);
      const A = limb(K, s * leg[1], L.sh);
      J[side] = { S, H, E, W, K, A };
    }
  } else {
    for (const side of ['l', 'r']) {
      const arm = p[side + 'a'], leg = p[side + 'l'];
      const E = limb(sh, arm[0], L.ua);
      const W = limb(E, arm[1], L.fa);
      const K = limb(hip, leg[0], L.th);
      const A = limb(K, leg[1], L.sh);
      // pie: perpendicular a la espinilla hacia delante, con flexión ft (punta)
      const fa = leg[1] + 90 - (p.ft || 0);
      const T = limb(A, fa, L.foot);
      J[side] = { S: sh, H: hip, E, W, K, A, T };
    }
  }
  return J;
}

function lowestY(J) {
  const pts = [
    J.head.y - L.head, J.sh.y - 0.075, J.hip.y - 0.085,
  ];
  for (const s of ['l', 'r']) {
    const j = J[s];
    pts.push(j.K.y - 0.055, j.A.y - 0.05, j.W.y - 0.035, j.E.y - 0.04);
    if (j.T) pts.push(j.T.y - 0.025);
  }
  return Math.min(...pts);
}

export class Figure {
  constructor(canvas, exercise) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.set(exercise);
    this.t0 = performance.now();
    this.running = false;
    this.speed = 1;
  }
  set(ex) {
    this.ex = ex;
    this.t0 = performance.now();
    // pre-calcula encuadre usando todas las poses
    const frames = ex.anim.frames;
    let minX = 1e9, maxX = -1e9, maxY = -1e9;
    const an = ex.anim.anchor;
    const J0 = joints(frames[0], ex.view);
    this.ax0 = an ? J0.r[an].x : 0;
    this.cache = frames.map((f) => {
      const J = joints(f, ex.view);
      const g = lowestY(J);
      return { J, g };
    });
    for (let i = 0; i < frames.length; i++) {
      for (let k = 0; k <= 4; k++) {
        const nxt = frames[(i + 1) % frames.length];
        const pose = lerpPose(frames[i], nxt, k / 4);
        const J = joints(pose, ex.view);
        const g = lowestY(J) - (pose.lift || 0);
        const dx = this.dx(J);
        for (const pt of this.points(J)) {
          minX = Math.min(minX, pt.x + dx); maxX = Math.max(maxX, pt.x + dx);
          maxY = Math.max(maxY, pt.y - g);
        }
      }
    }
    this.box = { minX: minX - 0.15, maxX: maxX + 0.15, maxY: maxY + 0.12 };
  }
  dx(J) { const an = this.ex.anim.anchor; return an ? this.ax0 - J.r[an].x : 0; }
  points(J) {
    const out = [J.head, J.sh, J.hip];
    for (const s of ['l', 'r']) {
      const j = J[s];
      out.push(j.S, j.E, j.W, j.K, j.A);
      if (j.T) out.push(j.T);
    }
    return out;
  }
  start() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.draw(performance.now());
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }

  poseAt(now) {
    const { frames, dur } = this.ex.anim;
    const holds = this.ex.anim.hold || [];
    const n = frames.length;
    if (n === 1) {
      // respiración suave en posturas estáticas
      const b = Math.sin(now / 900) * 1.2;
      const f = frames[0];
      return { ...f, t: (f.t ?? 0) + b * 0.4 };
    }
    // cada segmento dura dur/n; 'hold' añade pausa en ciertos frames
    const seg = (dur * 1000) / n;
    const segs = frames.map((_, i) => seg * (holds[i] ? 1 + holds[i] : 1));
    const total = segs.reduce((a, b) => a + b, 0);
    let t = ((now - this.t0) * this.speed) % total;
    let i = 0;
    while (t > segs[i]) { t -= segs[i]; i++; }
    const holdPart = holds[i] ? (segs[i] - seg) : 0;
    const k = t < holdPart ? 0 : (t - holdPart) / seg;
    return lerpPose(frames[i], frames[(i + 1) % n], ease(Math.min(1, k)));
  }

  draw(now) {
    const { c, ctx } = this;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const pose = this.poseAt(now);
    const J = joints(pose, this.ex.view);
    const ground = lowestY(J) - (pose.lift || 0);

    // escala para que quepa
    const bw = this.box.maxX - this.box.minX, bh = this.box.maxY;
    const scale = Math.min((w * 0.86) / bw, (h * 0.8) / bh);
    const floorY = h * 0.9;
    const cx = w / 2 - ((this.box.minX + this.box.maxX) / 2) * scale;
    const ox = this.dx(J);
    const P = (pt) => ({ x: cx + (pt.x + ox) * scale, y: floorY - (pt.y - ground) * scale });

    // colores del tema (heredados del CSS)
    const cs = getComputedStyle(c);
    const ink = cs.getPropertyValue('--ink').trim() || '#141414';
    const accent = cs.getPropertyValue('--accent').trim() || '#e8486f';
    const lineCol = cs.getPropertyValue('--line').trim() || '#e5e5e5';

    // suelo: una sola línea fina
    ctx.strokeStyle = lineCol; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(w * 0.12, floorY + 3); ctx.lineTo(w * 0.88, floorY + 3); ctx.stroke();

    const W = Math.min(10, Math.max(2.2, 0.055 * scale)); // grosor único
    const line = (pts, alpha = 1, width = W) => {
      ctx.globalAlpha = alpha; ctx.strokeStyle = ink; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      pts.forEach((pt, i) => { const A = P(pt); i ? ctx.lineTo(A.x, A.y) : ctx.moveTo(A.x, A.y); });
      ctx.stroke(); ctx.globalAlpha = 1;
    };
    const leg = (j, a) => line(j.T ? [j.H, j.K, j.A, j.T] : [j.H, j.K, j.A], a);
    const arm = (j, a) => line([j.S, j.E, j.W], a);
    const head = () => {
      const H = P(J.head);
      ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(H.x, H.y, L.head * scale, 0, Math.PI * 2); ctx.fill();
    };

    if (this.ex.view === 'front') {
      const midH = { x: (J.l.H.x + J.r.H.x) / 2, y: 0 };
      line([J.l.H, J.r.H]);
      leg(J.l, 1); leg(J.r, 1);
      line([midH, J.sh]);
      line([J.l.S, J.r.S]);
      arm(J.l, 1); arm(J.r, 1);
      head();
    } else {
      // extremidades lejanas más suaves para dar profundidad
      arm(J.l, 0.28); leg(J.l, 0.28);
      line([J.hip, J.sh]);
      leg(J.r, 1);
      head();
      arm(J.r, 1);
    }
  }
}

// Dibuja un fotograma estático (miniaturas)
export function drawThumb(canvas, ex) {
  const f = new Figure(canvas, ex);
  const frames = ex.anim.frames;
  const idx = ex.anim.thumb ?? (frames.length > 1 ? 1 : 0);
  f.poseAt = () => frames[idx];
  f.draw(0);
}
