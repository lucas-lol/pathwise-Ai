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

export type FxSound = 'click' | 'success' | 'fail' | 'craft' | 'demo';

let muted = false;
export function setMuted(m: boolean) { muted = m; }

export function playSound(kind: FxSound, combo: number = 0) {
  if (muted) return;
  switch (kind) {
    case 'click': tone(620, 0, 0.08, 'triangle', 0.06); break;
    case 'success': {
      // 🌟 连击升调：每增加1个combo，基准音高提升40Hz (约半个音阶)
      const baseFreq = 440 + Math.min(combo, 10) * 40; 
      tone(baseFreq, 0, 0.1, 'sine', 0.12);
      tone(baseFreq * 1.25, 0.08, 0.1, 'sine', 0.12);
      tone(baseFreq * 1.5, 0.16, 0.2, 'sine', 0.12);
      break;
    }    case 'fail': tone(300, 0, 0.2, 'sawtooth', 0.08); tone(180, 0.15, 0.3, 'sawtooth', 0.08); break;
    case 'craft': tone(880, 0, 0.12, 'triangle', 0.1); tone(1174, 0.08, 0.12, 'triangle', 0.1); tone(1568, 0.16, 0.3, 'triangle', 0.1); break;
    case 'demo': {
      const ac = getCtx();
      if (ac) {
        const t0 = ac.currentTime;
        const osc = ac.createOscillator(); const g = ac.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, t0);
        osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.6);
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(0.07, t0 + 0.5);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
        osc.connect(g); g.connect(ac.destination); osc.start(t0); osc.stop(t0 + 0.75);
      }
      tone(523, 0.7, 0.3, 'sine', 0.1); tone(659, 0.78, 0.3, 'sine', 0.1); tone(784, 0.86, 0.4, 'sine', 0.12); tone(1046, 0.94, 0.6, 'sine', 0.1);
      break;
    }
  }
}