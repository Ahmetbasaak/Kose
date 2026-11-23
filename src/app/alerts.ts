import { usePrefsStore, type Tone } from '../storage/prefs';

const TONES: Record<Tone, { wave: OscillatorType; notes: number[]; length: number; gap: number }> = {
  chime: { wave: 'sine', notes: [660, 880, 990], length: 0.4, gap: 0.22 },
  bell: { wave: 'triangle', notes: [523, 659, 784], length: 0.9, gap: 0.28 },
  beep: { wave: 'square', notes: [880, 880, 880], length: 0.12, gap: 0.2 },
};

/** Alert sound via Web Audio (1–3 notes), using the user's tone and volume; no audio files to ship. */
export function playChime(notes = 3, force = false): void {
  const { sound, volume, tone } = usePrefsStore.getState();
  if ((!sound && !force) || volume === 0) return;
  const spec = TONES[tone];
  const peak = 0.4 * (volume / 100) * (spec.wave === 'square' ? 0.35 : 1); // square waves are much louder
  try {
    const ctx = new AudioContext();
    spec.notes.slice(0, notes).forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = spec.wave;
      osc.frequency.value = freq;
      const at = ctx.currentTime + i * spec.gap;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + spec.length);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + spec.length + 0.02);
    });
    setTimeout(() => void ctx.close(), 2000);
  } catch {
    // Audio unavailable: the in-page alert still shows.
  }
}

export function requestNotificationPermission(): void {
  if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission();
}

export function notify(title: string, body: string): void {
  if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body });
}
