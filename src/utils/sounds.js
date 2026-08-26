let ctx = null;
function getCtx() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    ctx = null;
  }
  return ctx;
}

export function playTone(freq, duration = 0.2, type = "sine", gain = 0.15) {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g).connect(c.destination);
  osc.start();
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.stop(c.currentTime + duration);
}

export function playSuccess() {
  playTone(523.25, 0.15, "sine", 0.18);
  setTimeout(() => playTone(659.25, 0.15, "sine", 0.18), 120);
  setTimeout(() => playTone(783.99, 0.3, "sine", 0.2), 240);
}

export function playGood() {
  playTone(523.25, 0.12, "sine", 0.15);
  setTimeout(() => playTone(659.25, 0.25, "sine", 0.16), 130);
}

export function playTryAgain() {
  playTone(400, 0.2, "triangle", 0.12);
  setTimeout(() => playTone(350, 0.3, "triangle", 0.1), 150);
}

export function playFlight() {
  // engine whoosh
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(120, c.currentTime);
  osc.frequency.linearRampToValueAtTime(400, c.currentTime + 1.2);
  osc.frequency.linearRampToValueAtTime(220, c.currentTime + 2.0);
  g.gain.setValueAtTime(0.12, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 2.0);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 2.0);
}

export function speak(text, enabled = true) {
  if (!enabled) return;
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9;
  u.pitch = 1.0;
  u.lang = "en-US";
  window.speechSynthesis.speak(u);
}
