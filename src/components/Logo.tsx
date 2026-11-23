/** Brand mark: a framed dial with two bold corners, minute hand up, hour hand in amber. Same drawing as public/icon.svg. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="16" fill="#0F766E" />
      <rect
        x="11"
        y="11"
        width="42"
        height="42"
        rx="11"
        fill="none"
        stroke="#F6F5F1"
        strokeOpacity=".35"
        strokeWidth="3"
      />
      <g fill="none" stroke="#F6F5F1" strokeWidth="5" strokeLinecap="round">
        <path d="M11 25v-3a11 11 0 0 1 11-11h3" />
        <path d="M53 39v3a11 11 0 0 1-11 11h-3" />
        <path d="M32 32V19" />
      </g>
      <path d="M32 32l8 8" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
      <circle cx="32" cy="32" r="3.8" fill="#FBBF24" />
    </svg>
  );
}
