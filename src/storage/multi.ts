import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { pauseTimer, resumeTimer, startTimer, type Timer } from '../engine/timer';

/** Pro "çoklu sayaç": extra in-page timers next to the one corner session. */
export interface MultiTimer {
  id: string;
  label: string;
  timer: Timer;
  /** null = counts up. */
  durationMs: number | null;
  alerted: boolean;
}

interface MultiState {
  items: MultiTimer[];
  add: (label: string, durationMs: number | null) => void;
  toggle: (id: string) => void;
  reset: (id: string) => void;
  remove: (id: string) => void;
  markAlerted: (id: string) => void;
}

const patch = (items: MultiTimer[], id: string, f: (m: MultiTimer) => MultiTimer) =>
  items.map((m) => (m.id === id ? f(m) : m));

export const useMultiStore = create<MultiState>()(
  persist(
    (set) => ({
      items: [],
      add: (label, durationMs) =>
        set((s) => ({
          items: [
            ...s.items,
            { id: crypto.randomUUID(), label, durationMs, timer: startTimer(Date.now()), alerted: false },
          ],
        })),
      toggle: (id) =>
        set((s) => ({
          items: patch(s.items, id, (m) => ({
            ...m,
            timer: m.timer.startedAt === null ? resumeTimer(m.timer, Date.now()) : pauseTimer(m.timer, Date.now()),
          })),
        })),
      reset: (id) =>
        set((s) => ({ items: patch(s.items, id, (m) => ({ ...m, timer: startTimer(Date.now()), alerted: false })) })),
      remove: (id) => set((s) => ({ items: s.items.filter((m) => m.id !== id) })),
      markAlerted: (id) => set((s) => ({ items: patch(s.items, id, (m) => ({ ...m, alerted: true })) })),
    }),
    { name: 'kose.multi', version: 1 },
  ),
);
