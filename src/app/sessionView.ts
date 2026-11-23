import { formatClock } from '../engine/format';
import { elapsedMs, isRunning, remainingMs } from '../engine/timer';
import { t } from '../i18n';
import type { ActiveSession } from '../storage/session';

export type SessionStatus = 'running' | 'paused' | 'done';

export interface SessionDisplay {
  value: string;
  status: SessionStatus;
  caption: string;
}

export function sessionDisplay(s: ActiveSession, now: number): SessionDisplay {
  const running = isRunning(s.timer);
  if (s.kind === 'countdown') {
    const left = remainingMs(s.timer, s.durationMs ?? 0, now);
    const status: SessionStatus = left === 0 ? 'done' : running ? 'running' : 'paused';
    const caption =
      status === 'done' ? t('timer.done') : status === 'paused' ? t('timer.paused') : t('timer.remaining');
    return { value: formatClock(left, 'ceil'), status, caption };
  }
  return {
    value: formatClock(elapsedMs(s.timer, now)),
    status: running ? 'running' : 'paused',
    caption: running ? t('timer.elapsed') : t('timer.paused'),
  };
}
