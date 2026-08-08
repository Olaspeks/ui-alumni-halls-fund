"use client";

/**
 * The signature visual: a barometer-style circular dial with tick marks
 * and a filling arc. Public donor page only — the admin dashboard uses
 * the flat MiniGauge instead (see components/MiniGauge.tsx).
 *
 * The fill uses the pathLength=100 + stroke-dasharray/dashoffset trick,
 * so "percent" maps directly to dash length regardless of actual pixel
 * geometry, and the fill animates via the .gauge-arc CSS class (globals.css),
 * which itself is disabled under prefers-reduced-motion.
 */

const START_ANGLE = 225; // bottom-left, clockwise-from-top convention
const SWEEP = 270; // degrees; leaves a 90° gap at the bottom
const END_ANGLE = START_ANGLE + SWEEP;
const TICK_COUNT = 10;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export default function Gauge({
  percent,
  size = "lg",
  centerLabel,
  centerSubLabel,
}: {
  percent: number;
  size?: "lg" | "sm";
  centerLabel: string;
  centerSubLabel?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const dim = size === "lg" ? 220 : 140;
  const cx = dim / 2;
  const cy = dim / 2;
  const r = dim / 2 - (size === "lg" ? 20 : 14);
  const strokeWidth = size === "lg" ? 10 : 7;

  const trackPath = describeArc(cx, cy, r, START_ANGLE, END_ANGLE);

  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => {
    const angle = START_ANGLE + (i / TICK_COUNT) * SWEEP;
    const outer = polarToCartesian(cx, cy, r + strokeWidth / 2 + 3, angle);
    const inner = polarToCartesian(cx, cy, r + strokeWidth / 2 + (i % 5 === 0 ? 9 : 6), angle);
    return { x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y, major: i % 5 === 0 };
  });

  return (
    <div className="inline-flex flex-col items-center" role="img" aria-label={`${clamped}% of goal raised`}>
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.major ? "#8B93D8" : "#C2C7EB"}
            strokeWidth={t.major ? 2 : 1}
            strokeLinecap="round"
          />
        ))}
        <path d={trackPath} fill="none" stroke="#E4E6F7" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path
          className="gauge-arc"
          d={trackPath}
          fill="none"
          stroke="#C79A2B"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={100 - clamped}
        />
        <text
          x={cx}
          y={cy - (size === "lg" ? 2 : 0)}
          textAnchor="middle"
          className={size === "lg" ? "fill-indigo-950 font-mono text-2xl" : "fill-indigo-950 font-mono text-base"}
          fontWeight={600}
        >
          {clamped}%
        </text>
        {centerLabel && size === "lg" && (
          <text x={cx} y={cy + 22} textAnchor="middle" className="fill-ink-500 font-sans text-[10px] uppercase tracking-wide">
            {centerLabel}
          </text>
        )}
      </svg>
      {centerSubLabel && <p className="mt-1 text-center font-mono text-xs text-ink-500">{centerSubLabel}</p>}
    </div>
  );
}
