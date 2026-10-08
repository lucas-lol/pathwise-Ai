// src/utils/gameFx.ts
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, peak: number) {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export type FxSound = 'click' | 'success' | 'fail' | 'craft';

export function playSound(kind: FxSound) {
  switch (kind) {
    case 'click': tone(620, 0, 0.08, 'triangle', 0.06); break;
    case 'success': tone(523, 0, 0.15, 'sine', 0.12); tone(659, 0.09, 0.15, 'sine', 0.12); tone(784, 0.18, 0.25, 'sine', 0.12); break;
    case 'fail': tone(300, 0, 0.2, 'sawtooth', 0.08); tone(180, 0.15, 0.3, 'sawtooth', 0.08); break;
    case 'craft': tone(880, 0, 0.12, 'triangle', 0.1); tone(1174, 0.08, 0.12, 'triangle', 0.1); tone(1568, 0.16, 0.3, 'triangle', 0.1); break;
  }
}