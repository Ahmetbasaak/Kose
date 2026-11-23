/** Brand mark: a frame with clear corners and clock hands (minute up, hour in amber). Same drawing as public/icon.svg. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="16" fill="#0F766E" />
      <g fill="none" stroke="#F6F5F1" strokeWidth="4.5" strokeLinecap="round">
        <path d="M12 22V15a3 3 0 0 1 3-3h7" />
        <path d="M42 12h7a3 3 0 0 1 3 3v7" />
        <path d="M52 42v7a3 3 0 0 1-3 3h-7" />
        <path d="M22 52h-7a3 3 0 0 1-3-3v-7" />
        <path d="M32 32V21" />
      </g>
      <path d="M32 32l9 6" stroke="#FBBF24" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="32" cy="32" r="3.5" fill="#F6F5F1" />
    </svg>
  );
}
