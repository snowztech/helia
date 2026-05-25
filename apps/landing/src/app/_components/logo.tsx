export function HeliaMark({
  className = "h-5 w-5",
  fullBox = false,
}: {
  className?: string;
  /** When true, render the full 32×32 viewBox (use for the standalone mark
   *  inside circular launcher buttons). Default crops empty top space so it
   *  baselines with text in lockups. */
  fullBox?: boolean;
}) {
  const viewBox = fullBox ? "0 0 32 32" : "2 8 28 16";
  return (
    <svg viewBox={viewBox} className={className} aria-hidden="true">
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
      aria-label="helia"
    >
      <HeliaMark className="h-3.5 w-6" />
      <span className="text-base font-semibold tracking-tight">helia</span>
    </span>
  );
}
