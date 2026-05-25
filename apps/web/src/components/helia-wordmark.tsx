export function HeliaMark({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M 4 22 A 12 12 0 0 1 28 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="M 9 22 A 7 7 0 0 1 23 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        opacity={0.55}
      />
      <path
        d="M 13.5 22 A 2.5 2.5 0 0 1 18.5 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        opacity={0.28}
      />
    </svg>
  );
}

export function HeliaWordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-primary ${className}`}
      aria-label="Helia"
    >
      <HeliaMark className="h-4 w-4" />
      <span className="text-sm font-semibold tracking-tight">helia</span>
    </span>
  );
}
