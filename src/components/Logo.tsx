/** Brand mark: a corner and a live dot. Same drawing as public/icon.svg. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="18" fill="#0F766E" />
      <path d="M19 45V27a8 8 0 0 1 8-8h18" fill="none" stroke="#F6F5F1" strokeWidth="6" strokeLinecap="round" />
      <circle cx="44" cy="44" r="7.5" fill="#FBBF24" />
    </svg>
  );
}
