import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useGameStore } from './store';

// ============================================================
// Música ambiente — tracks curtas (~6-7s) sintetizadas uma vez
// e tocadas em loop nativo. Crossfade ~400ms entre tracks.
// ============================================================

export type Track = 'ambient' | 'tense';

const SAMPLE_RATE = 22050; // 22kHz é suficiente para bg music; metade do tamanho do arquivo
const FINAL_VOLUME = 0.32;
const MUSIC_VER = 'v3';

type Voice = {
  freq: number;
  freqEnd?: number;
  dur: number;
  delay: number;
  type: 'sine' | 'triangle' | 'saw' | 'square';
  gain: number;
  attack: number;
  release: number;
  harmonics?: number[];
};

// =========================================================
// AMBIENT — Am-F-C-G a 80 BPM, ~6s (2 ciclos do progresso → loop)
// =========================================================
function buildAmbientVoices(): { voices: Voice[]; total: number } {
  const BPM = 80;
  const BEAT = 60 / BPM;
  const MEASURE = BEAT * 4;
  const TOTAL = MEASURE * 2; // 2 compassos → 6s

  const CHORDS = [
    { root: 110.0, tones: [220.0, 261.63, 329.63] }, // Am
    { root: 87.31, tones: [174.61, 220.0, 261.63] }, // F
  ];

  const voices: Voice[] = [];
  for (let m = 0; m < CHORDS.length; m++) {
    const c = CHORDS[m]!;
    const mTime = m * MEASURE;
    // Bass: 2 plucks por compasso (beats 1 e 3)
    for (let b = 0; b < 2; b++) {
      voices.push({
        freq: c.root,
        dur: 0.5,
        delay: mTime + b * BEAT * 2,
        type: 'sine',
        gain: 0.16,
        attack: 0.006,
        release: 0.4,
      });
    }
    // Pad: acorde sustentado
    for (const t of c.tones) {
      voices.push({
        freq: t,
        dur: MEASURE - 0.05,
        delay: mTime,
        type: 'sine',
        gain: 0.06,
        attack: 0.3,
        release: 0.4,
      });
    }
  }
  return { voices, total: TOTAL };
}

// =========================================================
// TENSE — Am-Dm a 100 BPM, ~5s (2 compassos)
// =========================================================
function buildTenseVoices(): { voices: Voice[]; total: number } {
  const BPM = 100;
  const BEAT = 60 / BPM;
  const MEASURE = BEAT * 4;
  const TOTAL = MEASURE * 2;

  const CHORDS = [
    { root: 110.0, tones: [220.0, 261.63, 329.63] }, // Am
    { root: 73.42, tones: [146.83, 220.0, 293.66] }, // Dm
  ];

  const voices: Voice[] = [];
  for (let m = 0; m < CHORDS.length; m++) {
    const c = CHORDS[m]!;
    const mTime = m * MEASURE;
    for (let b = 0; b < 4; b++) {
      voices.push({
        freq: c.root,
        dur: 0.3,
        delay: mTime + b * BEAT,
        type: 'saw',
        gain: 0.1,
        attack: 0.004,
        release: 0.25,
      });
    }
    for (const t of c.tones) {
      voices.push({
        freq: t,
        dur: MEASURE - 0.05,
        delay: mTime,
        type: 'sine',
        gain: 0.045,
        attack: 0.3,
        release: 0.4,
      });
    }
  }
  return { voices, total: TOTAL };
}

function synthTrack(track: Track): Float32Array {
  const { voices, total } =
    track === 'ambient' ? buildAmbientVoices() : buildTenseVoices();
  const n = Math.ceil(total * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (const v of voices) {
    const start = Math.floor(v.delay * SAMPLE_RATE);
    const end = Math.min(n, start + Math.floor(v.dur * SAMPLE_RATE));
    const fStart = v.freq;
    const fEnd = v.freqEnd ?? v.freq;
    const harmonics = v.harmonics ?? [];

    let phase = 0;
    const harmonicPhases = harmonics.map(() => 0);

    for (let i = start; i < end; i++) {
      const t = (i - start) / SAMPLE_RATE;
      const tRel = (i - start) / Math.max(1, end - start);
      const f = fStart + (fEnd - fStart) * tRel;
      const dPhase = (2 * Math.PI * f) / SAMPLE_RATE;
      phase += dPhase;

      let s = 0;
      if (v.type === 'square') s = Math.sign(Math.sin(phase));
      else if (v.type === 'saw') s = ((phase / (2 * Math.PI)) % 1) * 2 - 1;
      else if (v.type === 'triangle')
        s = (2 / Math.PI) * Math.asin(Math.sin(phase));
      else s = Math.sin(phase);

      for (let h = 0; h < harmonics.length; h++) {
        harmonicPhases[h] += dPhase * harmonics[h]!;
        s += Math.sin(harmonicPhases[h]!) * (1 / (h + 2));
      }
      s /= 1 + harmonics.length * 0.4;

      let env = 1;
      if (t < v.attack) env = t / v.attack;
      else if (t > v.dur - v.release)
        env = Math.max(0, (v.dur - t) / v.release);

      out[i] = (out[i] ?? 0) + s * v.gain * env;
    }
  }

  // Crossfade primeiros/últimos 20ms pra loop limpo
  const fadeSamples = Math.floor(0.02 * SAMPLE_RATE);
  for (let i = 0; i < fadeSamples; i++) {
    const a = i / fadeSamples;
    const head = out[i] ?? 0;
    const tail = out[n - fadeSamples + i] ?? 0;
    out[i] = head * a + tail * (1 - a) * 0.5;
  }
  for (let i = 0; i < n; i++) out[i] = Math.tanh((out[i] ?? 0) * 1.3) * 0.7;
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

// Base64 otimizado com array+join (string concat em loop é O(n²) em alguns engines)
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

// =========================================================
// Track manager
// =========================================================
const fileCache: Map<Track, string> = new Map();
let activeTrack: Track | null = null;
let activeSound: Audio.Sound | null = null;
let configured = false;
let loadingToken = 0; // guard contra setTrack concorrente

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

async function ensureFile(track: Track): Promise<string | null> {
  const cached = fileCache.get(track);
  if (cached) return cached;
  const dir = FileSystem.cacheDirectory ?? '';
  if (!dir) return null;
  const filePath = `${dir}bgm-${MUSIC_VER}-${track}.wav`;
  try {
    const info = await FileSystem.getInfoAsync(filePath);
    if (!info.exists) {
      // Yield ao event loop antes da síntese pesada — UI segue responsiva
      await new Promise((r) => setTimeout(r, 0));
      const samples = synthTrack(track);
      const bytes = buildWavBytes(samples);
      const b64 = bytesToBase64(bytes);
      await FileSystem.writeAsStringAsync(filePath, b64, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
    fileCache.set(track, filePath);
    return filePath;
  } catch {
    return null;
  }
}

async function fade(
  sound: Audio.Sound,
  from: number,
  to: number,
  ms: number,
) {
  const steps = 12;
  const stepMs = Math.max(20, ms / steps);
  for (let i = 1; i <= steps; i++) {
    const v = from + (to - from) * (i / steps);
    try {
      await sound.setVolumeAsync(Math.max(0, Math.min(1, v)));
    } catch {
      return;
    }
    await new Promise((r) => setTimeout(r, stepMs));
  }
}

export async function setTrack(track: Track | null) {
  if (track === activeTrack) return;

  const token = ++loadingToken;
  const { mode, musicOn } = useGameStore.getState();
  const wantsPlay = !!track && mode !== 'silent' && musicOn;
  const oldSound = activeSound;
  activeTrack = track;
  activeSound = null;

  // Fade-out + unload do som antigo sempre
  if (oldSound) {
    fade(oldSound, FINAL_VOLUME, 0, 350).finally(() => {
      oldSound.unloadAsync().catch(() => {});
    });
  }

  if (!wantsPlay) return;

  try {
    await configure();
    const uri = await ensureFile(track!);
    if (!uri) return;
    // Se outro setTrack foi chamado durante o await, abandona
    if (token !== loadingToken) return;
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, isLooping: true, volume: 0 },
    );
    if (token !== loadingToken) {
      // Outro track tomou o controle no meio do load — descarta este
      newSound.unloadAsync().catch(() => {});
      return;
    }
    activeSound = newSound;
    fade(newSound, 0, FINAL_VOLUME, 400);
  } catch {
    // Falha silenciosa — música não bloqueia gameplay
    activeSound = null;
  }
}

export async function stopAllMusic() {
  ++loadingToken;
  const s = activeSound;
  activeTrack = null;
  activeSound = null;
  if (!s) return;
  try {
    await s.stopAsync();
    await s.unloadAsync();
  } catch {
    // ignore
  }
}

export async function applyCurrentTrackState() {
  const { mode, musicOn } = useGameStore.getState();
  const shouldPlay = activeTrack && mode !== 'silent' && musicOn;
  if (shouldPlay && !activeSound) {
    const track = activeTrack;
    activeTrack = null;
    await setTrack(track);
  } else if (!shouldPlay && activeSound) {
    const s = activeSound;
    activeSound = null;
    fade(s, FINAL_VOLUME, 0, 250).finally(() => s.unloadAsync().catch(() => {}));
  }
}

export function isMusicPlaying() {
  return activeSound !== null;
}
