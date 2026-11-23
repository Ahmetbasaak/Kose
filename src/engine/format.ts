export interface DurationParts {
  hours: number;
  minutes: number;
  seconds: number;
}

/** `ceil` suits countdowns (0.4 s left still shows 00:01), `floor` suits stopwatches. */
export function durationParts(ms: number, round: 'floor' | 'ceil' = 'floor'): DurationParts {
  const total = Math[round](Math.max(0, ms) / 1000);
  return { hours: Math.floor(total / 3600), minutes: Math.floor((total % 3600) / 60), seconds: total % 60 };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "05:07" under an hour, "1:05:07" above. */
export function formatClock(ms: number, round: 'floor' | 'ceil' = 'floor'): string {
  const { hours, minutes, seconds } = durationParts(ms, round);
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

const moneyFormat = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "1.150,47 ₺" — symbol after the amount, as Turkish users write it. */
export const formatMoney = (amount: number): string => `${moneyFormat.format(amount)} ₺`;
