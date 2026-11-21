// Voz (español) y pitidos. En iPhone hay que "desbloquear" ambos con un toque del usuario.
let voice = null;
let enabled = true;
let actx = null;

function pickVoice() {
  const vs = speechSynthesis.getVoices();
  const es = vs.filter((v) => v.lang?.toLowerCase().startsWith('es'));
  const pref = ['Mónica', 'Monica', 'Marisol', 'Paulina', 'Helena', 'Lucía', 'Lucia', 'Elvira', 'Google español'];
  voice = es.find((v) => v.lang === 'es-ES' && pref.some((p) => v.name.includes(p)))
    || es.find((v) => v.lang === 'es-ES')
    || es.find((v) => pref.some((p) => v.name.includes(p)))
    || es[0] || null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

export function setVoiceEnabled(v) { enabled = v; if (!v) speechSynthesis?.cancel(); }

export function unlockAudio() {
  try {
    actx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0; speechSynthesis.speak(u);
  } catch {}
}

let lastPriority = 0, busyUntil = 0;
export function say(text, priority = 1) {
  if (!enabled || !('speechSynthesis' in window) || !text) return;
  const now = performance.now();
  // Mensajes importantes interrumpen; los menores no pisan a los mayores
  if (speechSynthesis.speaking) {
    if (priority < lastPriority && now < busyUntil) return;
    speechSynthesis.cancel();
  }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'es-ES';
  if (voice) u.voice = voice;
  u.rate = 1.03; u.pitch = 1.05;
  lastPriority = priority;
  busyUntil = now + 400 + text.length * 70;
  speechSynthesis.speak(u);
}

export function beep(freq = 880, ms = 120, vol = 0.25) {
  if (!actx) return;
  try {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + ms / 1000);
    o.connect(g).connect(actx.destination);
    o.start(); o.stop(actx.currentTime + ms / 1000 + 0.02);
  } catch {}
}

export function vibrate(ms = 40) { try { navigator.vibrate?.(ms); } catch {} }
