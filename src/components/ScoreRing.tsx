export function ScoreRing({
  value,
  size = 72,
  stroke = 7,
  label,
  tone = "emerald",
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  tone?: "emerald" | "cyan" | "amber";
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  const color =
    tone === "cyan" ? "var(--cyan)" : tone === "amber" ? "var(--amber)" : "var(--emerald)";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-semibold tabular-nums">{value}%</span>
        {label ? (
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
