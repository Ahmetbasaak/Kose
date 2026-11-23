import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkConfig } from '../engine/work';
import type { StartInput } from './session';

export type Corner = 'tl' | 'tr' | 'br' | 'bl';
export type CornerTheme = 'default' | 'lcd' | 'neon' | 'paper' | 'minimal';
export type CornerSize = 's' | 'm' | 'l';
/** 'system' follows the device light/dark setting; 'retro' is Pro. */
export type AppTheme = 'system' | 'light' | 'dark' | 'retro';
export type Tone = 'chime' | 'bell' | 'beep';

/** PiP window sizes (px). */
export const CORNER_SIZES: Record<CornerSize, { width: number; height: number }> = {
  s: { width: 240, height: 120 },
  m: { width: 280, height: 140 },
  l: { width: 360, height: 180 },
};

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
  // Pro: corner window look. Applied only while the user has the matching entitlement.
  cornerTheme: CornerTheme;
  cornerSize: CornerSize;
  /** Floating widget opacity, 40–100 (%). */
  cornerOpacity: number;
  /** Number size, 80–140 (%). */
  cornerScale: number;
  shortcuts: boolean;
  autostart: boolean;
  /** Last session started from a setup screen, for autostart. */
  lastStart: StartInput | null;
  appTheme: AppTheme;
  /** Force reduced motion even when the OS doesn't ask for it. */
  reduceMotion: boolean;
  /** Show the running timer in the browser tab title. */
  titleTimer: boolean;
  sound: boolean;
  /** 0–100 */
  volume: number;
  tone: Tone;
  /** Off: starting a timer opens the full-page view instead of the corner window. */
  openCornerOnStart: boolean;
  /** Keep the screen awake while a timer runs (Wake Lock). */
  keepAwake: boolean;
  /** Plain setting fields only (not the action functions). */
  set: (patch: Partial<Omit<PrefsState, 'set' | `set${string}` | 'addStudyDay'>>) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      corner: 'br',
      setCorner: (corner) => set({ corner }),
      lastWork: null,
      setLastWork: (lastWork) => set({ lastWork }),
      studyDays: [],
      coffeePrice: null,
      setCoffeePrice: (coffeePrice) => set({ coffeePrice }),
      weeklySeenWeek: null,
      cornerTheme: 'default',
      cornerSize: 'm',
      cornerOpacity: 100,
      cornerScale: 100,
      shortcuts: true,
      autostart: false,
      lastStart: null,
      appTheme: 'system',
      reduceMotion: false,
      titleTimer: true,
      sound: true,
      volume: 60,
      tone: 'chime',
      openCornerOnStart: true,
      keepAwake: false,
      set: (patch) => set(patch),
      setWeeklySeenWeek: (weeklySeenWeek) => set({ weeklySeenWeek }),
      // A year is plenty for a consecutive-day streak; keeps the list from growing forever.
      addStudyDay: (day) =>
        set((s) => (s.studyDays.includes(day) ? s : { studyDays: [...s.studyDays, day].slice(-366) })),
    }),
    { name: 'kose.prefs', version: 1 },
  ),
);
