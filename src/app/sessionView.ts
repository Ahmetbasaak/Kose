import { targetState } from '../engine/calendar';
import { cycleState } from '../engine/cycles';
import { sectionState, type SectionLevel } from '../engine/sections';
import { durationParts, formatClock, formatMoney } from '../engine/format';
import { elapsedMs, finishAt, isRunning, remainingMs } from '../engine/timer';
import { equivalents, meetingCost, workState, type WorkConfig } from '../engine/work';
import { usePrefsStore } from '../storage/prefs';
import { LOCALE, t } from '../i18n';
import { canPause, type ActiveSession, type TimerKind } from '../storage/session';

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
  /** Presentation traffic light. */
  level?: SectionLevel;
  /** Background work earnings while another timer runs. */
  extra?: string;
}

/** "≈ 12 kahve · 30 simit" from the user's own prices; null when none apply. */
export function equivalentsLine(amount: number): string | null {
  const { coffeePrice, prices } = usePrefsStore.getState();
  const list = equivalents(amount, { coffee: coffeePrice, ...prices });
  return list.length
    ? t('equiv.line', { list: list.map((e) => t(`equiv.units.${e.key}`, { n: e.n })).join(' · ') })
    : null;
}

/** Today's work earnings when "count in the background" is on and another timer is in front. */
function backgroundWork(now: number): string | undefined {
  const { workBackground, lastWork } = usePrefsStore.getState();
  if (!workBackground || !lastWork) return undefined;
  const w = workState(lastWork, now);
  return w.earned > 0 ? t('work.bgLine', { v: formatMoney(w.earned) }) : undefined;
}

const DAY = 86_400_000;

/** "3 s 30 dk" from an hour up, "12 dk 5 sn" below. */
export function durationWords(ms: number, round: 'floor' | 'ceil' = 'floor'): string {
  const { hours, minutes, seconds } = durationParts(ms, round);
  return hours > 0 ? t('units.hm', { h: hours, m: minutes }) : t('units.ms', { m: minutes, s: seconds });
}

/** "12 g 04:05:06" for long waits, plain clock under a day. Rounded up so 0 only shows on arrival. */
export function daysClock(ms: number): string {
  const total = Math.ceil(ms / 1000) * 1000;
  const days = Math.floor(total / DAY);
  return days > 0 ? t('countdowns.dayClock', { d: days, clock: formatClock(total % DAY) }) : formatClock(total);
}

const dateFmt = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  weekday: 'long',
  timeZone: 'Europe/Istanbul',
});
const timeFmt = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });

/** "9 Mart 2027 Salı", plus the time when it is not midnight. */
export function formatTrDate(ms: number): string {
  const time = timeFmt.format(ms);
  return time === '00:00' ? dateFmt.format(ms) : `${dateFmt.format(ms)} ${time}`;
}

export const finishLabel = (kind: TimerKind) => (kind === 'target' ? t('timer.close') : t('timer.finish'));

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

function cycleCaption(s: ActiveSession, segment: number): string {
  if (s.modeId === 'student') return segment % 2 === 0 ? t('student.focus') : t('student.rest');
  return t('break.until');
}

export function sessionDisplay(s: ActiveSession, now: number): SessionDisplay {
  const d = baseDisplay(s, now);
  return s.kind === 'work' ? d : { ...d, extra: backgroundWork(now) };
}

function baseDisplay(s: ActiveSession, now: number): SessionDisplay {
  const running = isRunning(s.timer);
  const pausable = canPause(s.kind);
  if (s.kind === 'work' && s.work) return workDisplay(s.work, now);

  if (s.kind === 'target' && s.target) {
    const ts = targetState(s.target, now);
    const arrivedText = s.target.type === 'weekend' ? t('countdowns.weekendArrived') : t('countdowns.arrived');
    return ts.arrived || ts.remainingMs === 0
      ? {
          value: arrivedText,
          status: 'done',
          caption: t('countdowns.arrived'),
          sub: formatTrDate(ts.at),
          canPause: false,
        }
      : {
          value: daysClock(ts.remainingMs),
          status: 'running',
          caption: t('timer.remaining'),
          sub: formatTrDate(ts.at),
          canPause: false,
        };
  }

  if (s.kind === 'sections' && s.segments) {
    const st = sectionState(elapsedMs(s.timer, now), s.segments);
    const names = s.sectionNames ?? [];
    const over = st.index >= s.segments.length;
    return {
      value: over
        ? t('presentation.overtimeValue', { clock: formatClock(st.overtimeMs) })
        : formatClock(st.remainingMs, 'ceil'),
      status: running ? 'running' : 'paused',
      caption: !running ? t('timer.paused') : over ? t('presentation.overtime') : (names[st.index] ?? ''),
      sub: over
        ? undefined
        : st.index + 1 < names.length
          ? t('presentation.next', { name: names[st.index + 1]! })
          : t('presentation.last'),
      level: st.level,
      canPause: pausable,
    };
  }

  if (s.kind === 'cycle' && s.segments) {
    const c = cycleState(elapsedMs(s.timer, now), s.segments);
    return {
      value: formatClock(c.remainingMs, 'ceil'),
      status: running ? 'running' : 'paused',
      caption: running ? cycleCaption(s, c.segment) : t('timer.paused'),
      sub: s.modeId === 'student' ? t('student.round', { n: Math.floor(c.boundaries / 2) + 1 }) : undefined,
      canPause: pausable,
    };
  }

  if (s.meeting) {
    const e = elapsedMs(s.timer, now);
    const cost = meetingCost(e, s.meeting.people, s.meeting.hourlyRate);
    return {
      value: formatMoney(cost),
      money: cost,
      status: running ? 'running' : 'paused',
      caption: running ? t('meeting.cost') : t('timer.paused'),
      sub: t('meeting.sub', { n: s.meeting.people, clock: formatClock(e) }),
      canPause: pausable,
    };
  }

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
    canPause: pausable,
  };
}

export interface SessionEvents {
  /** Alert-worthy moments so far; compare with session.alerts to find new ones. */
  count: number;
  /** When the latest one happened, to tell a live alert from one missed while the page was closed. */
  lastAt: number;
  message: string;
  /** Gentle, non-blocking reminders (break, Pomodoro) vs. "time is up". */
  gentle: boolean;
}

/** null for kinds that never alert (stopwatch, meeting, work). */
export function sessionEvents(s: ActiveSession, now: number): SessionEvents | null {
  if (s.kind === 'countdown' && s.durationMs !== null) {
    const end = finishAt(s.timer, s.durationMs);
    const done = remainingMs(s.timer, s.durationMs, now) === 0;
    return { count: done ? 1 : 0, lastAt: end ?? now, message: t('alert.doneBody', { label: s.label }), gentle: false };
  }
  if (s.kind === 'target' && s.target) {
    const ts = targetState(s.target, now);
    const hit = ts.arrived || ts.remainingMs === 0;
    return { count: hit ? 1 : 0, lastAt: ts.at, message: t('alert.arrivedBody', { label: s.label }), gentle: false };
  }
  if (s.kind === 'cycle' && s.segments) {
    const c = cycleState(elapsedMs(s.timer, now), s.segments);
    const message =
      s.modeId === 'student'
        ? c.segment % 2 === 0
          ? t('student.focusMessage')
          : t('student.restMessage')
        : t('break.message');
    return { count: c.boundaries, lastAt: now - c.segmentElapsedMs, message, gentle: true };
  }
  if (s.kind === 'sections' && s.segments) {
    const st = sectionState(elapsedMs(s.timer, now), s.segments);
    const over = st.index >= s.segments.length;
    const intoSection = over ? st.overtimeMs : s.segments[st.index]! - st.remainingMs;
    const message = over
      ? t('presentation.endMessage')
      : t('presentation.sectionMessage', { name: s.sectionNames?.[st.index] ?? '' });
    return { count: st.boundaries, lastAt: now - intoSection, message, gentle: true };
  }
  return null;
}
