/** Soft chime via Web Audio (1–3 notes); no audio files to ship. */
export function playChime(notes = 3): void {
  try {
    const ctx = new AudioContext();
    [0, 0.22, 0.44].slice(0, notes).forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = [660, 880, 990][i]!;
      const at = ctx.currentTime + offset;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.42);
    });
    setTimeout(() => void ctx.close(), 1500);
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
