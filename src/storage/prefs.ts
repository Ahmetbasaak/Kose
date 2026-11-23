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
  /** Turkey day numbers with at least one finished Pomodoro focus block. */
  studyDays: number[];
  addStudyDay: (day: number) => void;
  /** User's own coffee price for "kahve parası" cards; null until they type one. */
  coffeePrice: number | null;
  setCoffeePrice: (p: number | null) => void;
  /** Week start (ms) whose weekly summary was already shown or dismissed. */
  weeklySeenWeek: number | null;
  setWeeklySeenWeek: (w: number) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      corner: 'br',
      setCorner: (corner) => set({ corner }),
      lastWork: null,
      setLastWork: (lastWork) => set({ lastWork }),
      studyDays: [],
      // A year is plenty for a consecutive-day streak; keeps the list from growing forever.
      coffeePrice: null,
      setCoffeePrice: (coffeePrice) => set({ coffeePrice }),
      weeklySeenWeek: null,
      setWeeklySeenWeek: (weeklySeenWeek) => set({ weeklySeenWeek }),
      addStudyDay: (day) =>
        set((s) => (s.studyDays.includes(day) ? s : { studyDays: [...s.studyDays, day].slice(-366) })),
    }),
    { name: 'kose.prefs', version: 1 },
  ),
);
