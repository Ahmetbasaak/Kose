import type { ModeId } from '../modes/registry';

// 24px stroke icons in one style (2px, round caps). Decorative: the card title names the mode.
const PATHS: Record<ModeId, string[]> = {
  simple: ['M12 8v5l3 2', 'M9 2h6', 'M12 2v2', 'M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z'],
  work: ['M12 2v20', 'M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  countdowns: [
    'M8 2v4',
    'M16 2v4',
    'M3 9h18',
    'M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    'M12 13v3l2 1',
  ],
  meeting: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'M22 21v-2a4 4 0 0 0-3-3.9',
    'M16 3.1a4 4 0 0 1 0 7.8',
  ],
  break: ['M17 8h1a4 4 0 1 1 0 8h-1', 'M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z', 'M6 2v2', 'M10 2v2', 'M14 2v2'],
  student: ['M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z', 'M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z'],
  freelance: [
    'M10 6V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2',
    'M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z',
    'M2 13h20',
  ],
  presentation: ['M2 3h20', 'M3 3v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3', 'M12 16v5', 'M8 21h8', 'M8 11l3-3 2 2 3-3'],
  multi: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
  overlay: [
    'M4.9 19.1a10 10 0 0 1 0-14.2',
    'M7.8 16.2a6 6 0 0 1 0-8.4',
    'M16.2 7.8a6 6 0 0 1 0 8.4',
    'M19.1 4.9a10 10 0 0 1 0 14.2',
    'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  ],
};

export function ModeIcon({ id, size = 22 }: { id: ModeId; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[id].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
