import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useGameStore, type SoundPack } from './store';

export type { SoundPack };
export type SoundType =
  | 'reveal'
  | 'impostor'
  | 'click'
  | 'ui'
  | 'alarm'
  | 'ding'
  | 'pop'
  | 'whoosh'
  | 'correct'
  | 'wrong'
  | 'tick'
  | 'coin'
  | 'boot'
  | 'confetti';

type Voice = {
  freq: number;
  freqEnd?: number;
  dur: number;
  delay?: number;
  type?: 'sine' | 'square' | 'saw' | 'triangle';
  gain?: number;
  attack?: number;
  release?: number;
  harmonics?: number[];
  detune?: number; // copia da voz com pitch offset (em cents) — sintetizado inline
};

const SAMPLE_RATE = 44100;

function synth(voices: Voice[]): Float32Array {
  // Expande vozes com detune em vozes adicionais
  const expanded: Voice[] = [];
  for (const v of voices) {
    expanded.push(v);
    if (v.detune && v.detune > 0) {
      const cents = v.detune;
      const ratioUp = Math.pow(2, cents / 1200);
      const ratioDown = Math.pow(2, -cents / 1200);
      expanded.push({
        ...v,
        freq: v.freq * ratioUp,
        freqEnd: v.freqEnd ? v.freqEnd * ratioUp : undefined,
        gain: (v.gain ?? 0.18) * 0.6,
      });
      expanded.push({
        ...v,
        freq: v.freq * ratioDown,
        freqEnd: v.freqEnd ? v.freqEnd * ratioDown : undefined,
        gain: (v.gain ?? 0.18) * 0.6,
      });
    }
  }

  const totalDur =
    Math.max(...expanded.map((v) => (v.delay ?? 0) + v.dur)) + 0.1;
  const n = Math.ceil(totalDur * SAMPLE_RATE);
  const out = new Float32Array(n);

  for (const v of expanded) {
    const start = Math.floor((v.delay ?? 0) * SAMPLE_RATE);
    const end = Math.min(n, start + Math.floor(v.dur * SAMPLE_RATE));
    const gain = v.gain ?? 0.2;
    const attack = Math.max(0.001, v.attack ?? 0.008);
    const release = Math.max(0.02, v.release ?? Math.min(0.3, v.dur * 0.6));
    const fStart = v.freq;
    const fEnd = v.freqEnd ?? v.freq;
    const harmonics = v.harmonics ?? [];
    const type = v.type ?? 'sine';

    let phase = 0;
    const harmonicPhases = harmonics.map(() => 0);

    for (let i = start; i < end; i++) {
      const t = (i - start) / SAMPLE_RATE;
      const tRel = (i - start) / Math.max(1, end - start);
      const f = fStart + (fEnd - fStart) * tRel;
      const dPhase = (2 * Math.PI * f) / SAMPLE_RATE;
      phase += dPhase;

      let s = 0;
      if (type === 'square') s = Math.sign(Math.sin(phase));
      else if (type === 'saw') s = (((phase / (2 * Math.PI)) % 1) * 2) - 1;
      else if (type === 'triangle')
        s = (2 / Math.PI) * Math.asin(Math.sin(phase));
      else s = Math.sin(phase);

      for (let h = 0; h < harmonics.length; h++) {
        const ratio = harmonics[h]!;
        harmonicPhases[h] += dPhase * ratio;
        s += Math.sin(harmonicPhases[h]!) * (1 / (h + 2));
      }
      s /= 1 + harmonics.length * 0.4;

      let env = 1;
      if (t < attack) env = t / attack;
      else if (t > v.dur - release) env = Math.max(0, (v.dur - t) / release);

      out[i] = (out[i] ?? 0) + s * gain * env;
    }
  }

  for (let i = 0; i < n; i++) {
    out[i] = Math.tanh((out[i] ?? 0) * 1.4) * 0.78;
  }
  return out;
}

function buildWavBytes(samples: Float32Array): Uint8Array {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buffer);
}

const B64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function bytesToBase64(bytes: Uint8Array): string {
  const out: string[] = [];
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const a = bytes[i]!;
    const b = bytes[i + 1]!;
    const c = bytes[i + 2]!;
    out.push(B64[a >> 2]!);
    out.push(B64[((a & 3) << 4) | (b >> 4)]!);
    out.push(B64[((b & 15) << 2) | (c >> 6)]!);
    out.push(B64[c & 63]!);
  }
  if (i < bytes.length) {
    const a = bytes[i]!;
    out.push(B64[a >> 2]!);
    if (i + 1 < bytes.length) {
      const b = bytes[i + 1]!;
      out.push(B64[((a & 3) << 4) | (b >> 4)]!);
      out.push(B64[(b & 15) << 2]!);
      out.push('=');
    } else {
      out.push(B64[(a & 3) << 4]!);
      out.push('==');
    }
  }
  return out.join('');
}

// =============================================================
// Sound Pack Recipes
// =============================================================

const CLASSIC: Record<SoundType, Voice[]> = {
  reveal: [
    { freq: 880, freqEnd: 280, dur: 0.45, type: 'sine', gain: 0.22, attack: 0.015, release: 0.32, harmonics: [2, 3] },
    { freq: 440, freqEnd: 140, dur: 0.45, type: 'triangle', gain: 0.12, attack: 0.015, release: 0.32 },
  ],
  impostor: [
    { freq: 55, dur: 0.85, type: 'sine', gain: 0.28, attack: 0.02, release: 0.55 },
    { freq: 110, dur: 0.75, type: 'saw', gain: 0.16, attack: 0.025, release: 0.5, harmonics: [2] },
    { freq: 165, dur: 0.7, delay: 0.05, type: 'saw', gain: 0.13, attack: 0.03, release: 0.45 },
    { freq: 220, dur: 0.65, delay: 0.1, type: 'sine', gain: 0.14, attack: 0.03, release: 0.4, harmonics: [2, 3] },
  ],
  click: [{ freq: 1600, freqEnd: 1100, dur: 0.05, type: 'square', gain: 0.14, attack: 0.001, release: 0.04 }],
  ui: [{ freq: 880, freqEnd: 1100, dur: 0.07, type: 'sine', gain: 0.11, attack: 0.003, release: 0.06, harmonics: [2] }],
  alarm: [
    { freq: 1000, dur: 0.1, type: 'square', gain: 0.18, attack: 0.005, release: 0.07 },
    { freq: 1000, dur: 0.1, delay: 0.16, type: 'square', gain: 0.18, attack: 0.005, release: 0.07 },
    { freq: 1000, dur: 0.1, delay: 0.32, type: 'square', gain: 0.18, attack: 0.005, release: 0.07 },
    { freq: 800, freqEnd: 500, dur: 0.25, delay: 0.48, type: 'square', gain: 0.2, attack: 0.005, release: 0.18 },
  ],
  ding: [
    { freq: 523.25, dur: 0.75, type: 'sine', gain: 0.14, attack: 0.004, release: 0.65, harmonics: [2, 3] },
    { freq: 659.25, dur: 0.7, delay: 0.08, type: 'sine', gain: 0.13, attack: 0.004, release: 0.6, harmonics: [2] },
    { freq: 783.99, dur: 0.65, delay: 0.16, type: 'sine', gain: 0.12, attack: 0.004, release: 0.55, harmonics: [2] },
    { freq: 1046.5, dur: 0.6, delay: 0.24, type: 'sine', gain: 0.11, attack: 0.004, release: 0.5 },
  ],
  pop: [{ freq: 380, freqEnd: 900, dur: 0.12, type: 'sine', gain: 0.16, attack: 0.003, release: 0.1, harmonics: [2] }],
  whoosh: [
    { freq: 1100, freqEnd: 280, dur: 0.28, type: 'sine', gain: 0.12, attack: 0.04, release: 0.18 },
    { freq: 550, freqEnd: 140, dur: 0.28, type: 'triangle', gain: 0.08, attack: 0.04, release: 0.18 },
  ],
  correct: [
    { freq: 523.25, dur: 0.6, type: 'sine', gain: 0.14, attack: 0.003, release: 0.5, harmonics: [2, 3, 4] },
    { freq: 659.25, dur: 0.6, delay: 0.08, type: 'sine', gain: 0.13, attack: 0.003, release: 0.5, harmonics: [2, 3] },
    { freq: 783.99, dur: 0.6, delay: 0.16, type: 'sine', gain: 0.13, attack: 0.003, release: 0.5, harmonics: [2, 3] },
    { freq: 1046.5, dur: 0.7, delay: 0.24, type: 'sine', gain: 0.15, attack: 0.003, release: 0.6, harmonics: [2, 3, 4] },
  ],
  wrong: [
    { freq: 392, freqEnd: 350, dur: 0.22, type: 'saw', gain: 0.18, attack: 0.01, release: 0.12, harmonics: [2] },
    { freq: 349, freqEnd: 311, dur: 0.22, delay: 0.22, type: 'saw', gain: 0.18, attack: 0.01, release: 0.12, harmonics: [2] },
    { freq: 311, freqEnd: 277, dur: 0.32, delay: 0.44, type: 'saw', gain: 0.2, attack: 0.01, release: 0.22, harmonics: [2] },
    { freq: 220, freqEnd: 175, dur: 0.5, delay: 0.76, type: 'saw', gain: 0.22, attack: 0.01, release: 0.4, harmonics: [2, 3] },
  ],
  tick: [{ freq: 1900, dur: 0.03, type: 'square', gain: 0.1, attack: 0.001, release: 0.025 }],
  coin: [
    { freq: 988, dur: 0.07, type: 'square', gain: 0.14, attack: 0.002, release: 0.06 },
    { freq: 1318, dur: 0.22, delay: 0.07, type: 'square', gain: 0.14, attack: 0.002, release: 0.18 },
  ],
  boot: [
    { freq: 523, dur: 0.18, type: 'sine', gain: 0.16, attack: 0.004, release: 0.14, harmonics: [2, 3] },
    { freq: 659, dur: 0.18, delay: 0.1, type: 'sine', gain: 0.16, attack: 0.004, release: 0.14, harmonics: [2, 3] },
    { freq: 783, dur: 0.22, delay: 0.2, type: 'sine', gain: 0.18, attack: 0.004, release: 0.18, harmonics: [2, 3] },
    { freq: 1046, dur: 0.5, delay: 0.3, type: 'sine', gain: 0.2, attack: 0.004, release: 0.42, harmonics: [2, 3, 4] },
  ],
  confetti: [
    { freq: 1568, dur: 0.18, delay: 0.0, type: 'sine', gain: 0.1, attack: 0.002, release: 0.15, harmonics: [2] },
    { freq: 1760, dur: 0.18, delay: 0.08, type: 'sine', gain: 0.1, attack: 0.002, release: 0.15, harmonics: [2] },
    { freq: 2093, dur: 0.18, delay: 0.16, type: 'sine', gain: 0.1, attack: 0.002, release: 0.15, harmonics: [2] },
    { freq: 1318, dur: 0.18, delay: 0.24, type: 'sine', gain: 0.1, attack: 0.002, release: 0.15, harmonics: [2] },
    { freq: 1976, dur: 0.18, delay: 0.32, type: 'sine', gain: 0.1, attack: 0.002, release: 0.15, harmonics: [2] },
    { freq: 1568, dur: 0.18, delay: 0.4, type: 'sine', gain: 0.1, attack: 0.002, release: 0.15, harmonics: [2] },
    { freq: 2349, dur: 0.25, delay: 0.48, type: 'sine', gain: 0.11, attack: 0.002, release: 0.22, harmonics: [2, 3] },
    { freq: 2637, dur: 0.4, delay: 0.6, type: 'sine', gain: 0.13, attack: 0.002, release: 0.36, harmonics: [2, 3] },
  ],
};

// 8-bit NES style — square waves, short envelopes, high pitches
const RETRO: Record<SoundType, Voice[]> = {
  reveal: [
    { freq: 523, dur: 0.05, type: 'square', gain: 0.18, attack: 0.001, release: 0.04 },
    { freq: 659, dur: 0.05, delay: 0.05, type: 'square', gain: 0.18, attack: 0.001, release: 0.04 },
    { freq: 783, dur: 0.05, delay: 0.1, type: 'square', gain: 0.18, attack: 0.001, release: 0.04 },
    { freq: 1046, dur: 0.18, delay: 0.15, type: 'square', gain: 0.2, attack: 0.001, release: 0.16 },
  ],
  impostor: [
    { freq: 392, dur: 0.1, type: 'square', gain: 0.18, attack: 0.002, release: 0.08 },
    { freq: 330, dur: 0.1, delay: 0.1, type: 'square', gain: 0.18, attack: 0.002, release: 0.08 },
    { freq: 277, dur: 0.1, delay: 0.2, type: 'square', gain: 0.18, attack: 0.002, release: 0.08 },
    { freq: 220, dur: 0.4, delay: 0.3, type: 'square', gain: 0.22, attack: 0.002, release: 0.35 },
  ],
  click: [{ freq: 1800, dur: 0.025, type: 'square', gain: 0.16, attack: 0.001, release: 0.02 }],
  ui: [{ freq: 1200, dur: 0.03, type: 'square', gain: 0.12, attack: 0.001, release: 0.025 }],
  alarm: [
    { freq: 1500, dur: 0.08, type: 'square', gain: 0.2, attack: 0.001, release: 0.06 },
    { freq: 1500, dur: 0.08, delay: 0.12, type: 'square', gain: 0.2, attack: 0.001, release: 0.06 },
    { freq: 1500, dur: 0.08, delay: 0.24, type: 'square', gain: 0.2, attack: 0.001, release: 0.06 },
    { freq: 1500, dur: 0.08, delay: 0.36, type: 'square', gain: 0.2, attack: 0.001, release: 0.06 },
  ],
  ding: [
    { freq: 1046, dur: 0.06, type: 'square', gain: 0.18, attack: 0.001, release: 0.05 },
    { freq: 1318, dur: 0.06, delay: 0.06, type: 'square', gain: 0.18, attack: 0.001, release: 0.05 },
    { freq: 1568, dur: 0.16, delay: 0.12, type: 'square', gain: 0.2, attack: 0.001, release: 0.14 },
  ],
  pop: [
    { freq: 600, freqEnd: 1400, dur: 0.06, type: 'square', gain: 0.18, attack: 0.001, release: 0.05 },
  ],
  whoosh: [
    { freq: 1400, freqEnd: 400, dur: 0.15, type: 'square', gain: 0.14, attack: 0.01, release: 0.12 },
  ],
  correct: [
    { freq: 523, dur: 0.06, type: 'square', gain: 0.18, attack: 0.001, release: 0.05 },
    { freq: 659, dur: 0.06, delay: 0.06, type: 'square', gain: 0.18, attack: 0.001, release: 0.05 },
    { freq: 783, dur: 0.06, delay: 0.12, type: 'square', gain: 0.18, attack: 0.001, release: 0.05 },
    { freq: 1046, dur: 0.24, delay: 0.18, type: 'square', gain: 0.22, attack: 0.001, release: 0.2 },
  ],
  wrong: [
    { freq: 392, dur: 0.1, type: 'square', gain: 0.2, attack: 0.001, release: 0.08 },
    { freq: 330, dur: 0.1, delay: 0.1, type: 'square', gain: 0.2, attack: 0.001, release: 0.08 },
    { freq: 261, dur: 0.3, delay: 0.2, type: 'square', gain: 0.22, attack: 0.001, release: 0.25 },
  ],
  tick: [{ freq: 2200, dur: 0.02, type: 'square', gain: 0.12, attack: 0.001, release: 0.015 }],
  coin: [
    { freq: 988, dur: 0.05, type: 'square', gain: 0.18, attack: 0.001, release: 0.04 },
    { freq: 1318, dur: 0.2, delay: 0.05, type: 'square', gain: 0.2, attack: 0.001, release: 0.18 },
  ],
  boot: [
    { freq: 261, dur: 0.08, type: 'square', gain: 0.18, attack: 0.001, release: 0.06 },
    { freq: 523, dur: 0.08, delay: 0.08, type: 'square', gain: 0.18, attack: 0.001, release: 0.06 },
    { freq: 1046, dur: 0.08, delay: 0.16, type: 'square', gain: 0.18, attack: 0.001, release: 0.06 },
    { freq: 1568, dur: 0.3, delay: 0.24, type: 'square', gain: 0.22, attack: 0.001, release: 0.26 },
  ],
  confetti: [
    { freq: 1568, dur: 0.05, type: 'square', gain: 0.14, attack: 0.001, release: 0.04 },
    { freq: 1760, dur: 0.05, delay: 0.06, type: 'square', gain: 0.14, attack: 0.001, release: 0.04 },
    { freq: 2093, dur: 0.05, delay: 0.12, type: 'square', gain: 0.14, attack: 0.001, release: 0.04 },
    { freq: 2349, dur: 0.05, delay: 0.18, type: 'square', gain: 0.14, attack: 0.001, release: 0.04 },
    { freq: 2637, dur: 0.05, delay: 0.24, type: 'square', gain: 0.14, attack: 0.001, release: 0.04 },
    { freq: 1976, dur: 0.05, delay: 0.3, type: 'square', gain: 0.14, attack: 0.001, release: 0.04 },
    { freq: 2349, dur: 0.16, delay: 0.36, type: 'square', gain: 0.18, attack: 0.001, release: 0.14 },
  ],
};

// Orchestral / dramatic — sine + lots of harmonics, long attacks/releases, sub bass
const CINEMA: Record<SoundType, Voice[]> = {
  reveal: [
    { freq: 220, dur: 0.9, type: 'sine', gain: 0.22, attack: 0.12, release: 0.7, harmonics: [2, 3, 4, 5] },
    { freq: 110, dur: 0.9, type: 'sine', gain: 0.18, attack: 0.12, release: 0.7, harmonics: [2, 3] },
  ],
  impostor: [
    { freq: 41, dur: 1.5, type: 'sine', gain: 0.3, attack: 0.05, release: 1.2, harmonics: [2, 3, 5] }, // sub
    { freq: 82, dur: 1.3, type: 'sine', gain: 0.22, attack: 0.08, release: 1.0, harmonics: [2, 3] },
    { freq: 110, dur: 1.2, delay: 0.1, type: 'sine', gain: 0.18, attack: 0.1, release: 0.95, harmonics: [2, 3, 4] },
    { freq: 138.59, dur: 1.1, delay: 0.2, type: 'sine', gain: 0.16, attack: 0.12, release: 0.9, harmonics: [2, 3] },
  ],
  click: [{ freq: 200, dur: 0.08, type: 'sine', gain: 0.18, attack: 0.004, release: 0.07, harmonics: [2, 4] }], // timpani-ish
  ui: [{ freq: 440, dur: 0.1, type: 'sine', gain: 0.1, attack: 0.01, release: 0.08, harmonics: [2, 3] }],
  alarm: [
    { freq: 660, dur: 0.3, type: 'sine', gain: 0.2, attack: 0.04, release: 0.24, harmonics: [2, 3] },
    { freq: 660, dur: 0.3, delay: 0.4, type: 'sine', gain: 0.2, attack: 0.04, release: 0.24, harmonics: [2, 3] },
    { freq: 523, dur: 0.5, delay: 0.8, type: 'sine', gain: 0.22, attack: 0.05, release: 0.42, harmonics: [2, 3, 4] },
  ],
  ding: [
    { freq: 523, dur: 1.5, type: 'sine', gain: 0.16, attack: 0.008, release: 1.4, harmonics: [2, 3, 4, 5] },
    { freq: 659, dur: 1.4, delay: 0.1, type: 'sine', gain: 0.15, attack: 0.008, release: 1.3, harmonics: [2, 3, 4] },
    { freq: 783, dur: 1.3, delay: 0.2, type: 'sine', gain: 0.14, attack: 0.008, release: 1.2, harmonics: [2, 3] },
    { freq: 1046, dur: 1.2, delay: 0.3, type: 'sine', gain: 0.13, attack: 0.008, release: 1.1, harmonics: [2, 3] },
  ],
  pop: [
    { freq: 261, freqEnd: 440, dur: 0.25, type: 'sine', gain: 0.16, attack: 0.02, release: 0.2, harmonics: [2, 3] },
  ],
  whoosh: [
    { freq: 1500, freqEnd: 200, dur: 0.55, type: 'sine', gain: 0.14, attack: 0.08, release: 0.42, harmonics: [2] },
    { freq: 750, freqEnd: 100, dur: 0.55, type: 'sine', gain: 0.1, attack: 0.08, release: 0.42, harmonics: [2] },
  ],
  correct: [
    { freq: 523, dur: 1.2, type: 'sine', gain: 0.16, attack: 0.01, release: 1.1, harmonics: [2, 3, 4, 5] },
    { freq: 659, dur: 1.2, delay: 0.15, type: 'sine', gain: 0.15, attack: 0.01, release: 1.1, harmonics: [2, 3, 4] },
    { freq: 783, dur: 1.2, delay: 0.3, type: 'sine', gain: 0.15, attack: 0.01, release: 1.1, harmonics: [2, 3, 4] },
    { freq: 1046, dur: 1.4, delay: 0.45, type: 'sine', gain: 0.17, attack: 0.01, release: 1.3, harmonics: [2, 3, 4, 5] },
  ],
  wrong: [
    { freq: 220, freqEnd: 180, dur: 0.4, type: 'sine', gain: 0.2, attack: 0.04, release: 0.3, harmonics: [2, 3] },
    { freq: 175, freqEnd: 130, dur: 0.5, delay: 0.4, type: 'sine', gain: 0.22, attack: 0.04, release: 0.4, harmonics: [2, 3] },
    { freq: 110, freqEnd: 80, dur: 0.8, delay: 0.9, type: 'sine', gain: 0.24, attack: 0.05, release: 0.7, harmonics: [2, 3, 4] },
  ],
  tick: [{ freq: 1200, dur: 0.04, type: 'sine', gain: 0.1, attack: 0.002, release: 0.035, harmonics: [2] }],
  coin: [
    { freq: 783, dur: 0.15, type: 'sine', gain: 0.16, attack: 0.005, release: 0.13, harmonics: [2, 3] },
    { freq: 1046, dur: 0.35, delay: 0.1, type: 'sine', gain: 0.18, attack: 0.005, release: 0.3, harmonics: [2, 3, 4] },
  ],
  boot: [
    { freq: 261, dur: 0.3, type: 'sine', gain: 0.18, attack: 0.04, release: 0.25, harmonics: [2, 3, 4] },
    { freq: 392, dur: 0.3, delay: 0.15, type: 'sine', gain: 0.18, attack: 0.04, release: 0.25, harmonics: [2, 3, 4] },
    { freq: 523, dur: 0.3, delay: 0.3, type: 'sine', gain: 0.2, attack: 0.04, release: 0.25, harmonics: [2, 3, 4, 5] },
    { freq: 1046, dur: 0.8, delay: 0.45, type: 'sine', gain: 0.22, attack: 0.04, release: 0.72, harmonics: [2, 3, 4, 5] },
  ],
  confetti: [
    { freq: 1568, dur: 0.6, type: 'sine', gain: 0.12, attack: 0.005, release: 0.55, harmonics: [2, 3] },
    { freq: 1760, dur: 0.6, delay: 0.1, type: 'sine', gain: 0.12, attack: 0.005, release: 0.55, harmonics: [2, 3] },
    { freq: 2093, dur: 0.7, delay: 0.2, type: 'sine', gain: 0.14, attack: 0.005, release: 0.65, harmonics: [2, 3] },
    { freq: 2637, dur: 0.8, delay: 0.3, type: 'sine', gain: 0.15, attack: 0.005, release: 0.75, harmonics: [2, 3, 4] },
  ],
};

// Synthwave / 80s — saw waves, detuned unison, mid-range emphasis
const CYBER: Record<SoundType, Voice[]> = {
  reveal: [
    { freq: 880, freqEnd: 220, dur: 0.5, type: 'saw', gain: 0.16, attack: 0.01, release: 0.4, detune: 12 },
    { freq: 440, freqEnd: 110, dur: 0.5, type: 'saw', gain: 0.12, attack: 0.01, release: 0.4, detune: 8 },
  ],
  impostor: [
    { freq: 65, dur: 1.0, type: 'saw', gain: 0.22, attack: 0.02, release: 0.85, harmonics: [2] },
    { freq: 130, dur: 0.9, type: 'saw', gain: 0.18, attack: 0.04, release: 0.75, detune: 15 },
    { freq: 195, dur: 0.85, delay: 0.1, type: 'saw', gain: 0.15, attack: 0.04, release: 0.7, detune: 12 },
    { freq: 260, dur: 0.8, delay: 0.2, type: 'saw', gain: 0.13, attack: 0.04, release: 0.65, detune: 10 },
  ],
  click: [{ freq: 2200, freqEnd: 1500, dur: 0.04, type: 'saw', gain: 0.14, attack: 0.001, release: 0.035, detune: 20 }],
  ui: [{ freq: 1200, freqEnd: 1500, dur: 0.06, type: 'saw', gain: 0.1, attack: 0.002, release: 0.05, detune: 15 }],
  alarm: [
    { freq: 880, dur: 0.12, type: 'saw', gain: 0.18, attack: 0.005, release: 0.1, detune: 20 },
    { freq: 880, dur: 0.12, delay: 0.18, type: 'saw', gain: 0.18, attack: 0.005, release: 0.1, detune: 20 },
    { freq: 880, dur: 0.12, delay: 0.36, type: 'saw', gain: 0.18, attack: 0.005, release: 0.1, detune: 20 },
    { freq: 660, freqEnd: 440, dur: 0.4, delay: 0.54, type: 'saw', gain: 0.2, attack: 0.005, release: 0.34, detune: 25 },
  ],
  ding: [
    { freq: 523, dur: 0.7, type: 'saw', gain: 0.13, attack: 0.004, release: 0.65, detune: 10 },
    { freq: 659, dur: 0.7, delay: 0.1, type: 'saw', gain: 0.12, attack: 0.004, release: 0.65, detune: 10 },
    { freq: 880, dur: 0.7, delay: 0.2, type: 'saw', gain: 0.12, attack: 0.004, release: 0.65, detune: 12 },
    { freq: 1046, dur: 0.8, delay: 0.3, type: 'saw', gain: 0.14, attack: 0.004, release: 0.75, detune: 15 },
  ],
  pop: [
    { freq: 400, freqEnd: 900, dur: 0.1, type: 'saw', gain: 0.16, attack: 0.002, release: 0.09, detune: 15 },
  ],
  whoosh: [
    { freq: 1400, freqEnd: 300, dur: 0.35, type: 'saw', gain: 0.13, attack: 0.05, release: 0.28, detune: 20 },
    { freq: 700, freqEnd: 150, dur: 0.35, type: 'saw', gain: 0.1, attack: 0.05, release: 0.28, detune: 15 },
  ],
  correct: [
    { freq: 523, dur: 0.5, type: 'saw', gain: 0.14, attack: 0.005, release: 0.45, detune: 10 },
    { freq: 659, dur: 0.5, delay: 0.1, type: 'saw', gain: 0.14, attack: 0.005, release: 0.45, detune: 10 },
    { freq: 880, dur: 0.5, delay: 0.2, type: 'saw', gain: 0.14, attack: 0.005, release: 0.45, detune: 12 },
    { freq: 1318, dur: 0.7, delay: 0.3, type: 'saw', gain: 0.17, attack: 0.005, release: 0.65, detune: 15 },
  ],
  wrong: [
    { freq: 392, freqEnd: 300, dur: 0.3, type: 'saw', gain: 0.18, attack: 0.01, release: 0.25, detune: 20 },
    { freq: 261, freqEnd: 180, dur: 0.4, delay: 0.3, type: 'saw', gain: 0.2, attack: 0.01, release: 0.34, detune: 25 },
    { freq: 130, freqEnd: 80, dur: 0.6, delay: 0.7, type: 'saw', gain: 0.22, attack: 0.01, release: 0.52, detune: 30 },
  ],
  tick: [{ freq: 2000, dur: 0.025, type: 'saw', gain: 0.1, attack: 0.001, release: 0.022, detune: 15 }],
  coin: [
    { freq: 988, dur: 0.06, type: 'saw', gain: 0.14, attack: 0.002, release: 0.05, detune: 12 },
    { freq: 1318, dur: 0.22, delay: 0.06, type: 'saw', gain: 0.16, attack: 0.002, release: 0.2, detune: 15 },
  ],
  boot: [
    { freq: 261, dur: 0.16, type: 'saw', gain: 0.16, attack: 0.005, release: 0.14, detune: 12 },
    { freq: 392, dur: 0.16, delay: 0.1, type: 'saw', gain: 0.16, attack: 0.005, release: 0.14, detune: 12 },
    { freq: 523, dur: 0.18, delay: 0.2, type: 'saw', gain: 0.18, attack: 0.005, release: 0.16, detune: 15 },
    { freq: 1046, dur: 0.5, delay: 0.3, type: 'saw', gain: 0.2, attack: 0.005, release: 0.45, detune: 18 },
  ],
  confetti: [
    { freq: 1568, dur: 0.2, type: 'saw', gain: 0.11, attack: 0.002, release: 0.18, detune: 15 },
    { freq: 1760, dur: 0.2, delay: 0.1, type: 'saw', gain: 0.11, attack: 0.002, release: 0.18, detune: 15 },
    { freq: 2093, dur: 0.2, delay: 0.2, type: 'saw', gain: 0.11, attack: 0.002, release: 0.18, detune: 15 },
    { freq: 2637, dur: 0.3, delay: 0.3, type: 'saw', gain: 0.13, attack: 0.002, release: 0.27, detune: 18 },
    { freq: 1976, dur: 0.4, delay: 0.4, type: 'saw', gain: 0.14, attack: 0.002, release: 0.36, detune: 20 },
  ],
};

const PACKS: Record<SoundPack, Record<SoundType, Voice[]>> = {
  classic: CLASSIC,
  retro: RETRO,
  cinema: CINEMA,
  cyber: CYBER,
};

// =============================================================
// Cache + playback
// =============================================================

// Bump CACHE_VER quando recipes ou estrutura mudam
const CACHE_VER = 'v4';

const fileCache: Map<string, string> = new Map();
const playing: Audio.Sound[] = [];
let configured = false;

async function configure() {
  if (configured) return;
  configured = true;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch {
    // ignore
  }
}

async function ensureFile(pack: SoundPack, type: SoundType): Promise<string> {
  const key = `${pack}-${type}`;
  const cached = fileCache.get(key);
  if (cached) return cached;
  const dir = FileSystem.cacheDirectory ?? '';
  const filePath = `${dir}sfx-${CACHE_VER}-${pack}-${type}.wav`;
  try {
    const info = await FileSystem.getInfoAsync(filePath);
    if (!info.exists) {
      const recipes = PACKS[pack][type];
      const bytes = buildWavBytes(synth(recipes));
      const b64 = bytesToBase64(bytes);
      await FileSystem.writeAsStringAsync(filePath, b64, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
  } catch {
    // ignore
  }
  fileCache.set(key, filePath);
  return filePath;
}

export async function playSound(type: SoundType) {
  const { mode, soundPack } = useGameStore.getState();
  if (mode === 'silent') return;
  await configure();
  try {
    const uri = await ensureFile(soundPack, type);
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 0.85 },
    );
    playing.push(sound);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        const i = playing.indexOf(sound);
        if (i >= 0) playing.splice(i, 1);
      }
    });
  } catch {
    // swallow
  }
}
