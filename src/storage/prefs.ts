import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkConfig } from '../engine/work';

export type Corner = 'tl' | 'tr' | 'br' | 'bl';

interface PrefsState {
  corner: Corner;
  setCorner: (c: Corner) => void;
  /** Last work-mode settings, so the form is prefilled next time. Stays on this device. */
  lastWork: WorkConfig | null;
  setLastWork: (w: WorkConfig) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      corner: 'br',
      setCorner: (corner) => set({ corner }),
      lastWork: null,
      setLastWork: (lastWork) => set({ lastWork }),
    }),
    { name: 'kose.prefs', version: 1 },
  ),
);
