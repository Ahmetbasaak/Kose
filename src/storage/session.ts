import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { elapsedMs, pauseTimer, resumeTimer, startTimer, type Timer } from '../engine/timer';
import { workState, type WorkConfig } from '../engine/work';
import type { ModeId } from '../modes/registry';

export type TimerKind = 'stopwatch' | 'countdown' | 'work';

export interface ActiveSession {
  id: string;
  modeId: ModeId;
  kind: TimerKind;
  label: string;
  timer: Timer;
  /** Countdown length; null for stopwatches. */
  durationMs: number | null;
  /** Shift settings for kind 'work'; earnings come from the clock, not from the timer. */
  work?: WorkConfig | null;
  createdAt: number;
  /** Set once the end alert has fired, so a reload never alerts twice. */
  alertedAt: number | null;
  alertDismissed: boolean;
}

export interface SessionSummary {
  modeId: ModeId;
  kind: TimerKind;
  label: string;
  elapsedMs: number;
  /** Estimated earnings (work mode only). */
  earned?: number | null;
  startedAt: number;
  endedAt: number;
}

export interface StartInput {
  modeId: ModeId;
  kind: TimerKind;
  label: string;
  durationMs: number | null;
  work?: WorkConfig | null;
}

interface SessionState {
  active: ActiveSession | null;
  lastSummary: SessionSummary | null;
  start: (input: StartInput, now?: number) => void;
  togglePause: (now?: number) => void;
  markAlerted: (now?: number) => void;
  dismissAlert: () => void;
  finish: (now?: number) => SessionSummary | null;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      active: null,
      lastSummary: null,
      start: (input, now = Date.now()) =>
        set({
          active: {
            ...input,
            id: crypto.randomUUID(),
            timer: startTimer(now),
            createdAt: now,
            alertedAt: null,
            alertDismissed: false,
          },
        }),
      togglePause: (now = Date.now()) => {
        const a = get().active;
        if (!a || a.kind === 'work') return;
        const timer = a.timer.startedAt === null ? resumeTimer(a.timer, now) : pauseTimer(a.timer, now);
        set({ active: { ...a, timer } });
      },
      markAlerted: (now = Date.now()) => {
        const a = get().active;
        if (a) set({ active: { ...a, alertedAt: now } });
      },
      dismissAlert: () => {
        const a = get().active;
        if (a) set({ active: { ...a, alertDismissed: true } });
      },
      finish: (now = Date.now()) => {
        const a = get().active;
        if (!a) return null;
        const elapsed = elapsedMs(a.timer, now);
        const ws = a.work ? workState(a.work, now) : null;
        const summary: SessionSummary = {
          modeId: a.modeId,
          kind: a.kind,
          label: a.label,
          elapsedMs: ws ? ws.workedMs : a.durationMs === null ? elapsed : Math.min(elapsed, a.durationMs),
          earned: ws?.earned ?? null,
          startedAt: a.createdAt,
          endedAt: now,
        };
        set({ active: null, lastSummary: summary });
        return summary;
      },
    }),
    { name: 'kose.session', version: 1 },
  ),
);
