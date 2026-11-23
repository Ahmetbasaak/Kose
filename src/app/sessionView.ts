import { durationParts, formatClock, formatMoney } from '../engine/format';
import { elapsedMs, isRunning, remainingMs } from '../engine/timer';
import { workState, type WorkConfig } from '../engine/work';
import { t } from '../i18n';
import type { ActiveSession } from '../storage/session';

export type SessionStatus = 'running' | 'paused' | 'done';

export interface SessionDisplay {
  value: string;
  status: SessionStatus;
  caption: string;
  /** Secondary line under the number. */
  sub?: string;
  /** Set when the value is money, so the kuruş digits can animate. */
  money?: number;
  canPause: boolean;
}

/** "3 s 30 dk" from an hour up, "12 dk 5 sn" below. */
export function durationWords(ms: number, round: 'floor' | 'ceil' = 'floor'): string {
  const { hours, minutes, seconds } = durationParts(ms, round);
  return hours > 0 ? t('units.hm', { h: hours, m: minutes }) : t('units.ms', { m: minutes, s: seconds });
}

/** Work-mode face; shared by the live corner and the setup preview so they never drift. */
export function workDisplay(c: WorkConfig, now: number): SessionDisplay {
  const w = workState(c, now);
  const base = { value: formatMoney(w.earned), money: w.earned, canPause: false };
  switch (w.phase) {
    case 'working':
      return {
        ...base,
        status: 'running',
        caption: t('work.estimate'),
        sub: t('work.untilEnd', { d: durationWords(w.remainingMs, 'ceil') }),
      };
    case 'break':
      return {
        ...base,
        status: 'paused',
        caption: t('work.phase.break'),
        sub: t('work.untilEnd', { d: durationWords(w.remainingMs, 'ceil') }),
      };
    case 'before':
      return {
        ...base,
        status: 'paused',
        caption: t('work.phase.before'),
        sub: t('work.untilStart', { d: durationWords(w.remainingMs, 'ceil') }),
      };
    case 'after':
      return { ...base, status: 'paused', caption: t('work.phase.after'), sub: t('work.afterSub') };
    case 'weekend':
      return { ...base, status: 'paused', caption: t('work.phase.weekend'), sub: t('work.weekendSub') };
  }
}

export function sessionDisplay(s: ActiveSession, now: number): SessionDisplay {
  const running = isRunning(s.timer);
  if (s.kind === 'work' && s.work) return workDisplay(s.work, now);
  if (s.kind === 'countdown') {
    const left = remainingMs(s.timer, s.durationMs ?? 0, now);
    const status: SessionStatus = left === 0 ? 'done' : running ? 'running' : 'paused';
    const caption =
      status === 'done' ? t('timer.done') : status === 'paused' ? t('timer.paused') : t('timer.remaining');
    return { value: formatClock(left, 'ceil'), status, caption, canPause: status !== 'done' };
  }
  return {
    value: formatClock(elapsedMs(s.timer, now)),
    status: running ? 'running' : 'paused',
    caption: running ? t('timer.elapsed') : t('timer.paused'),
    canPause: true,
  };
}
