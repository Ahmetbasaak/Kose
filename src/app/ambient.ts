import { create } from 'zustand';

export type AmbientKind = 'off' | 'white' | 'brown' | 'rain';

/** What is playing now. Not persisted: browsers only allow starting sound from a click. */
export const useAmbientStore = create<{ kind: AmbientKind; volume: number }>(() => ({ kind: 'off', volume: 40 }));

let ctx: AudioContext | null = null;
let source: AudioBufferSourceNode | null = null;
let gain: GainNode | null = null;

/** Two seconds of generated noise, looped. No audio files, works offline. */
function noise(c: AudioContext, kind: Exclude<AmbientKind, 'off'>): AudioBuffer {
  const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'brown') {
      // Integrated white noise: deep, soft rumble.
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else d[i] = w;
  }
  return buf;
}

const LEVEL = { white: 0.12, brown: 0.5, rain: 0.35 };

export function playAmbient(kind: AmbientKind, volume: number): void {
  stopAmbient();
  useAmbientStore.setState({ kind, volume });
  if (kind === 'off') return;
  try {
    ctx ??= new AudioContext();
    source = ctx.createBufferSource();
    source.buffer = noise(ctx, kind);
    source.loop = true;
    gain = ctx.createGain();
    gain.gain.value = (volume / 100) * LEVEL[kind];
    let tail: AudioNode = source;
    if (kind === 'rain') {
      // Band-limited white noise reads as steady rain.
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 500;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 5000;
      tail = tail.connect(hp).connect(lp);
    }
    tail.connect(gain).connect(ctx.destination);
    source.start();
  } catch {
    useAmbientStore.setState({ kind: 'off' });
  }
}

export function setAmbientVolume(volume: number): void {
  const { kind } = useAmbientStore.getState();
  useAmbientStore.setState({ volume });
  if (gain && kind !== 'off') gain.gain.value = (volume / 100) * LEVEL[kind];
}

export function stopAmbient(): void {
  source?.stop();
  source?.disconnect();
  source = null;
  gain = null;
}
