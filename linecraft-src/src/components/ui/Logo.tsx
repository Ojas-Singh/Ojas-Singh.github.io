type Props = {
  size?: number;
};

export function Logo({ size = 28 }: Props) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="url(#lc-grad)" />
        <path
          d="M10 9.5h2.5v11.5h6v2H10v-13.5z"
          fill="white"
          fillOpacity="0.95"
        />
        <path
          d="M20 9.5h2.2l1.6 4.2 1.6-4.2H27.6l-2.7 6.3 2.8 6.7h-2.2l-1.7-4.5-1.7 4.5H21.9l2.8-6.7L20 9.5z"
          fill="white"
          fillOpacity="0.7"
        />
        <defs>
          <linearGradient id="lc-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="1" stopColor="#4338ca" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className="font-semibold tracking-tight text-ink"
        style={{ fontSize: size * 0.72 }}
      >
        LineCraft
      </span>
    </div>
  );
}
