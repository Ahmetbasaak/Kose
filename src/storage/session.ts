import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TargetRule } from '../engine/calendar';
import { timeInSegment } from '../engine/cycles';
import { elapsedMs, pauseTimer, resumeTimer, startTimer, type Timer } from '../engine/timer';
import { meetingCost, netDailyHours, workState, type WorkConfig } from '../engine/work';
import type { ModeId } from '../modes/registry';

/**
 * stopwatch: counts up (meeting cost is a stopwatch with `meeting` set)
 * countdown: fixed length; work: shift clock; cycle: repeating `segments`; target: a calendar moment;
 * sections: presentation `segments` in order, then overtime.
 */
export type TimerKind = 'stopwatch' | 'countdown' | 'work' | 'cycle' | 'target' | 'sections';

export interface MeetingConfig {
  people: number;
  hourlyRate: number;
}

export interface ActiveSession {
  id: string;
  modeId: ModeId;
  kind: TimerKind;
  label: string;
  timer: Timer;
  /** Countdown length; null otherwise. */
  durationMs: number | null;
  /** Shift settings for kind 'work'; earnings come from the clock, not from the timer. */
  work?: WorkConfig | null;
  meeting?: MeetingConfig | null;
  /** Segment lengths (ms) for kinds 'cycle' and 'sections'. */
  segments?: number[] | null;
  sectionNames?: string[] | null;
  /** Freelance project being timed. */
  projectId?: string | null;
  target?: TargetRule | null;
  createdAt: number;
  /** Alerts already fired (one per boundary), so a reload never repeats one. */
  alerts: number;
  alertDismissed: boolean;
}

export interface SessionSummary {
  modeId: ModeId;
  kind: TimerKind;
  label: string;
  elapsedMs: number;
  /** Estimated earnings (work mode only). */
  earned?: number | null;
  /** Total meeting cost. */
  cost?: number | null;
  meeting?: MeetingConfig | null;
  /** Pomodoro focus time. */
  focusMs?: number | null;
  /** The natural whole for a percentage: countdown length or net work day. */
  totalMs?: number | null;
  projectId?: string | null;
  startedAt: number;
  endedAt: number;
}

export type StartInput = Pick<ActiveSession, 'modeId' | 'kind' | 'label' | 'durationMs'> &
  Partial<Pick<ActiveSession, 'work' | 'meeting' | 'segments' | 'sectionNames' | 'target' | 'projectId'>>;

interface SessionState {
  active: ActiveSession | null;
  lastSummary: SessionSummary | null;
  start: (input: StartInput, now?: number) => void;
  togglePause: (now?: number) => void;
  markAlerted: (count: number) => void;
  dismissAlert: () => void;
  finish: (now?: number) => SessionSummary | null;
}

export const canPause = (kind: TimerKind) => kind !== 'work' && kind !== 'target';

export function summarize(a: ActiveSession, now: number): SessionSummary {
  const elapsed = elapsedMs(a.timer, now);
  const ws = a.work ? workState(a.work, now) : null;
  return {
    modeId: a.modeId,
    kind: a.kind,
    label: a.label,
    elapsedMs: ws ? ws.workedMs : a.durationMs === null ? elapsed : Math.min(elapsed, a.durationMs),
    earned: ws?.earned ?? null,
    cost: a.meeting ? meetingCost(elapsed, a.meeting.people, a.meeting.hourlyRate) : null,
    meeting: a.meeting ?? null,
    focusMs: a.modeId === 'student' && a.segments ? timeInSegment(elapsed, a.segments, 0) : null,
    totalMs: a.work ? netDailyHours(a.work) * 3_600_000 : a.durationMs,
    projectId: a.projectId ?? null,
    startedAt: a.createdAt,
    endedAt: now,
  };
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
            alerts: 0,
            alertDismissed: false,
          },
        }),
      togglePause: (now = Date.now()) => {
        const a = get().active;
        if (!a || !canPause(a.kind)) return;
        const timer = a.timer.startedAt === null ? resumeTimer(a.timer, now) : pauseTimer(a.timer, now);
        set({ active: { ...a, timer } });
      },
      markAlerted: (count) => {
        const a = get().active;
        if (a) set({ active: { ...a, alerts: count, alertDismissed: false } });
      },
      dismissAlert: () => {
        const a = get().active;
        if (a) set({ active: { ...a, alertDismissed: true } });
      },
      finish: (now = Date.now()) => {
        const a = get().active;
        if (!a) return null;
        const summary = summarize(a, now);
        set({ active: null, lastSummary: summary });
        return summary;
      },
    }),
    {
      name: 'kose.session',
      version: 2,
      // v1 stored `alertedAt` (one alert per session) instead of an alert count.
      migrate: (old, version) => {
        const s = old as { active: (ActiveSession & { alertedAt?: number | null }) | null };
        if (version < 2 && s.active) s.active = { ...s.active, alerts: s.active.alertedAt ? 1 : 0 };
        return s as SessionState;
      },
    },
  ),
);
