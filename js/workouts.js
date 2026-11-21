// Generador de entrenamientos y playlists.
import { EXERCISES, BY_ID } from './exercises.js';

export const INTENSITY = {
  suave: { name: 'Suave', work: 30, rest: 25, roundRest: 45, met: 0.8, color: '#3bb98a' },
  moderado: { name: 'Moderado', work: 40, rest: 20, roundRest: 40, met: 1, color: '#f5a524' },
  intenso: { name: 'Intenso', work: 45, rest: 15, roundRest: 30, met: 1.15, color: '#f0436a' },
};

export const PRESETS = [
  { id: 'p10a', title: 'Activación exprés', minutes: 10, zone: 'cuerpo', intensity: 'suave', desc: 'Para empezar el día con energía' },
  { id: 'p10b', title: 'Abdomen exprés', minutes: 10, zone: 'core', intensity: 'moderado', desc: 'Vientre plano y espalda fuerte' },
  { id: 'p10c', title: 'Estiramientos y relax', minutes: 10, zone: 'estiramiento', intensity: 'suave', desc: 'Para soltar tensiones' },
  { id: 'p15', title: 'Glúteos firmes', minutes: 15, zone: 'gluteos', intensity: 'moderado', desc: 'Puente, patadas, sentadillas' },
  { id: 'p20a', title: 'Cardio quema grasa', minutes: 20, zone: 'cardio', intensity: 'intenso', desc: 'Intervalos tipo HIIT' },
  { id: 'p20b', title: 'Brazos y postura', minutes: 20, zone: 'brazos', intensity: 'moderado', desc: 'Hombros, brazos y abdomen' },
  { id: 'p30a', title: 'Cuerpo completo', minutes: 30, zone: 'cuerpo', intensity: 'moderado', desc: 'El entreno más equilibrado' },
  { id: 'p30b', title: 'HIIT sin saltos', minutes: 30, zone: 'cardio', intensity: 'intenso', desc: 'Sube pulsaciones cuidando articulaciones', noJump: true },
  { id: 'p40a', title: 'Piernas y glúteos', minutes: 40, zone: 'gluteos', intensity: 'moderado', desc: 'Sesión completa de tren inferior' },
  { id: 'p40b', title: 'Cuerpo completo intenso', minutes: 40, zone: 'cuerpo', intensity: 'intenso', desc: 'Para días con muchas ganas' },
  { id: 'p50', title: 'Sesión completa', minutes: 50, zone: 'cuerpo', intensity: 'moderado', desc: 'Fuerza + cardio + estiramientos' },
  { id: 'p60', title: 'Gran sesión', minutes: 60, zone: 'cuerpo', intensity: 'moderado', desc: 'Una hora para ti' },
];

// Plan semanal basado en recomendaciones para mujeres adultas: fuerza 2-3 días, HIIT máx. 2, movilidad y descanso.
export const WEEK = [
  { day: 'Lunes', zone: 'cuerpo', intensity: 'moderado', label: 'Fuerza cuerpo completo' },
  { day: 'Martes', zone: 'cardio', intensity: 'suave', label: 'Cardio suave' },
  { day: 'Miércoles', zone: 'gluteos', intensity: 'moderado', label: 'Glúteos y piernas' },
  { day: 'Jueves', zone: 'estiramiento', intensity: 'suave', label: 'Movilidad y estiramientos' },
  { day: 'Viernes', zone: 'cardio', intensity: 'intenso', label: 'HIIT' },
  { day: 'Sábado', zone: 'core', intensity: 'moderado', label: 'Abdomen y brazos' },
  { day: 'Domingo', zone: null, intensity: 'suave', label: 'Descanso activo: paseo de 30 min' },
];

function rng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
function shuffle(arr, r) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function allowed(ex, intensity, noJump) {
  if (noJump && ex.impact === 'alto') return false;
  if (intensity === 'suave') return ex.level <= 2 && ex.impact !== 'alto';
  if (intensity === 'moderado') return ex.level <= 2 || (ex.level === 3 && ex.impact !== 'alto' && ex.id !== 'flexiones');
  return true;
}

const GROUPS = {
  inferior: (e) => e.zones.includes('piernas') || e.zones.includes('gluteos'),
  superior: (e) => e.zones.includes('brazos'),
  core: (e) => e.zones.includes('core'),
  cardio: (e) => e.cat === 'cardio',
};

export function buildWorkout({ minutes, zone, intensity, noJump = false, pelvic = false, variant = 0, title }) {
  const I = INTENSITY[intensity];
  const r = rng(`${minutes}-${zone}-${intensity}-${noJump}-${variant}`);
  const total = minutes * 60;
  const items = [];
  const push = (id, secs, phase, extra = {}) => items.push({ id, kind: 'work', secs, phase, ...extra });
  const rest = (secs, phase) => items.push({ kind: 'rest', secs, phase });

  // Solo estiramientos
  if (zone === 'estiramiento') {
    const pool = EXERCISES.filter((e) => e.cat === 'estiramiento' && (pelvic || e.id !== 'suelopelvico'));
    const warm = ['marcha', 'circulos'];
    warm.forEach((id) => push(id, 40, 'Calentamiento'));
    let t = 80, i = 0;
    const order = shuffle(pool, r);
    while (t + 45 <= total) { push(order[i % order.length].id, 45, 'Movilidad'); t += 45; i++; if (i % order.length === 0) order.push(...shuffle(pool, r)); }
    return finalize(items, { minutes, zone, intensity, title });
  }

  const warmT = Math.min(300, Math.max(120, Math.round(total * 0.12 / 30) * 30));
  const coolT = Math.min(300, Math.max(90, Math.round(total * 0.1 / 30) * 30));
  // Calentamiento
  const warmPool = shuffle(EXERCISES.filter((e) => (e.cat === 'calentamiento' || (e.cat === 'cardio' && e.impact === 'bajo' && e.level === 1))), r);
  let wt = 0, wi = 0;
  while (wt < warmT) { push(warmPool[wi % warmPool.length].id, 30, 'Calentamiento'); wt += 30; wi++; }

  // Bloque principal
  const mainT = total - wt - coolT;
  const zonePool = EXERCISES.filter((e) => e.cat !== 'estiramiento' && e.cat !== 'calentamiento' && allowed(e, intensity, noJump));
  let pool;
  if (zone === 'cuerpo') {
    const pick = (g) => shuffle(zonePool.filter(GROUPS[g]), r);
    const lists = ['inferior', 'superior', 'core', 'cardio', 'inferior', 'core'].map(pick);
    const seen = new Set(); pool = [];
    for (let k = 0; pool.length < 9 && k < 20; k++) {
      const l = lists[k % lists.length];
      const e = l.find((x) => !seen.has(x.id));
      if (e) { seen.add(e.id); pool.push(e); }
    }
  } else if (zone === 'cardio') {
    pool = shuffle(zonePool.filter((e) => e.cat === 'cardio' || e.zones.includes('cardio')), r);
    if (pool.length < 5) pool.push(...shuffle(zonePool.filter((e) => e.zones.includes('cuerpo')), r));
  } else {
    pool = shuffle(zonePool.filter((e) => e.zones.includes(zone)), r);
    // En días de brazos, añadimos algo de abdomen; en piernas/glúteos se mezclan entre sí
    if (zone === 'brazos') pool.push(...shuffle(zonePool.filter((e) => e.zones.includes('core')), r).slice(0, 3));
    if (zone === 'gluteos') pool.push(...shuffle(zonePool.filter((e) => e.zones.includes('piernas') && !pool.includes(e)), r));
  }
  pool = [...new Map(pool.map((e) => [e.id, e])).values()];
  const slot = I.work + I.rest;
  const circuitSize = Math.max(4, Math.min(pool.length, minutes <= 10 ? 4 : minutes <= 20 ? 5 : minutes <= 30 ? 6 : 8));
  const circuit = pool.slice(0, circuitSize);
  let mt = 0, round = 1, ci = 0;
  while (mt + I.work <= mainT) {
    const ex = circuit[ci];
    push(ex.id, I.work, `Bloque principal · Ronda ${round}`, { round });
    mt += I.work;
    ci++;
    const endRound = ci >= circuit.length;
    const rs = endRound ? I.roundRest : I.rest;
    if (mt + rs + I.work <= mainT) { rest(rs, endRound ? 'Descanso entre rondas' : `Bloque principal · Ronda ${round}`); mt += rs; }
    else break;
    if (endRound) { ci = 0; round++; }
  }
  // Rellena con descanso extra si sobra (no se nota) → se suma a la vuelta a la calma
  const left = mainT - mt;

  // Vuelta a la calma
  const coolPool = shuffle(EXERCISES.filter((e) => e.cat === 'estiramiento' && e.id !== 'suelopelvico'), r);
  let ct = 0, cj = 0;
  const coolTotal = coolT + left;
  if (pelvic && coolTotal >= 120) { push('suelopelvico', 60, 'Vuelta a la calma'); ct += 60; }
  while (ct + 30 <= coolTotal) {
    const secs = coolTotal - ct >= 80 ? 40 : coolTotal - ct >= 60 ? 30 : coolTotal - ct;
    push(coolPool[cj % coolPool.length].id, secs, 'Vuelta a la calma'); ct += secs; cj++;
  }
  return finalize(items, { minutes, zone, intensity, title, noJump });
}

function finalize(items, meta) {
  const secs = items.reduce((a, b) => a + b.secs, 0);
  const work = items.filter((i) => i.kind === 'work');
  const unique = [...new Set(work.map((i) => i.id))];
  const met = work.reduce((a, it) => a + (BY_ID[it.id].met * INTENSITY[meta.intensity].met) * it.secs, 0) / Math.max(1, work.reduce((a, b) => a + b.secs, 0));
  return { ...meta, items, secs, unique, met };
}

export function kcal(workout, weightKg = 65, secsDone = workout.secs) {
  return Math.round(workout.met * weightKg * (secsDone / 3600));
}
