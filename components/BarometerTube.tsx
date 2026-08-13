"use client";

import { formatMoneyShort, type Currency } from "@/lib/money";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import TubeBadge from "./TubeBadge";

/**
 * One hall's liquid-fill tube in the barometer array (see
 * BarometerArray.tsx). A literal barometer, not the old speedometer —
 * the Dean's explicit feedback was a fluid column, not a dial+needle.
 *
 * The fill's true height is set once, directly from `percent` — every
 * other motion here (idle float, color flow, bubbles) is a separate,
 * purely cosmetic layer on top, so the liquid level itself never lies
 * about the real number and comparison between halls comes from height
 * alone. When `percent` actually changes (a real donation landing), the
 * true-level layer transitions with a slight overshoot via
 * .barometer-level, distinct from — and never interrupting — the
 * continuous idle motion.
 *
 * Every tube's glass, gradient, and motion render identically
 * regardless of standing — comparison/ranking is communicated only via
 * `badges` (see TubeBadge), never by making a tube itself look
 * different. The SVG scales fluidly with its container (w-full h-auto
 * over a fixed viewBox) so the whole row can shrink to fit available
 * width — see BarometerArray for the responsive column sizing.
 */

const TUBE_X = 8;
const TUBE_Y = 6;
const TUBE_W = 44;
const TUBE_H = 208;
const VIEW_W = 60;
const VIEW_H = 220;
const WAVE_AMP = 4;
const PADDING = 14;
const GRADIENT_CYCLE = 110; // one repeat of the flowing gradient, in local units

function baselineY(percent: number): number {
  const usable = TUBE_H - PADDING * 2;
  return TUBE_Y + PADDING + (1 - percent / 100) * usable;
}

// Same for every tube — deliberately not a per-hall accent. Cool blues
// drifting into gold, seamless loop (first and last stop match).
const GRADIENT_STOPS: [string, string][] = [
  ["0%", "#3B47AD"],
  ["30%", "#8B93D8"],
  ["62%", "#E6C877"],
  ["100%", "#3B47AD"],
];

const BUBBLES = [
  { cx: TUBE_X + 10, r: 1.6, dur: 6.2, begin: -1.1 },
  { cx: TUBE_X + 20, r: 1.2, dur: 7.4, begin: -3.6 },
  { cx: TUBE_X + 30, r: 1.8, dur: 5.6, begin: -0.4 },
  { cx: TUBE_X + 37, r: 1.3, dur: 8.1, begin: -5.2 },
];

// Neutral for every tube — no glow or stroke distinction tied to
// standing. Ranking is communicated only through `badges`.
const SHADOW_FILTER = "drop-shadow(0 2px 6px rgba(8,11,36,0.15))";

export default function BarometerTube({
  hallId,
  hallName,
  percent,
  raised,
  currency,
  badges = [],
  animIndex,
  onClick,
}: {
  hallId: string;
  hallName: string;
  percent: number;
  raised: number;
  currency: Currency;
  badges?: string[];
  animIndex: number;
  onClick: () => void;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const clamped = Math.max(0, Math.min(100, percent));
  const clipId = `tube-clip-${hallId}`;
  const gradId = `tube-flow-${hallId}`;

  // Deterministic per-tube variety for the idle wobble only — so the
  // row's vertical bobbing reads as organic rather than one mechanical
  // wave. The color flow and bubbles stay in sync across tubes on
  // purpose (see module comment).
  const wobbleDuration = 4.4 + ((animIndex * 37) % 22) / 10; // ~4.4s–6.6s
  const wobbleDelay = -((animIndex * 53) % 60) / 10; // negative = starts mid-cycle

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-[64px] max-w-[104px] flex-[1_1_64px] flex-col items-center gap-1.5 rounded-sharp text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-600"
      aria-label={`${hallName}: ${formatMoneyShort(raised, currency)} raised${badges.length ? `. ${badges.join(", ")}` : ""}. Tap to give.`}
    >
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="h-auto w-full transition-transform group-hover:-translate-y-0.5"
          style={{ filter: SHADOW_FILTER }}
        >
          <defs>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="0"
              y2={GRADIENT_CYCLE}
              spreadMethod="repeat"
            >
              {GRADIENT_STOPS.map(([offset, color]) => (
                <stop key={offset} offset={offset} stopColor={color} />
              ))}
              {!reduceMotion && (
                <animateTransform
                  attributeName="gradientTransform"
                  type="translate"
                  from="0 0"
                  to={`0 -${GRADIENT_CYCLE}`}
                  dur="7s"
                  repeatCount="indefinite"
                />
              )}
            </linearGradient>
            <clipPath id={clipId}>
              <rect x={TUBE_X} y={TUBE_Y} width={TUBE_W} height={TUBE_H} rx={TUBE_W / 2} />
            </clipPath>
          </defs>

          {/* Empty tube background */}
          <rect x={TUBE_X} y={TUBE_Y} width={TUBE_W} height={TUBE_H} rx={TUBE_W / 2} fill="#F4F5FC" />

          {/* Liquid fill, clipped to the tube capsule */}
          <g clipPath={`url(#${clipId})`}>
            <g className="barometer-level" style={{ transform: `translateY(${baselineY(clamped)}px)` }}>
              <g
                className="barometer-wobble"
                style={{ animationDuration: `${wobbleDuration}s`, animationDelay: `${wobbleDelay}s` }}
              >
                <path
                  d={`M${TUBE_X},${WAVE_AMP} Q${TUBE_X + TUBE_W / 2},${-WAVE_AMP} ${TUBE_X + TUBE_W},${WAVE_AMP} L${TUBE_X + TUBE_W},600 L${TUBE_X},600 Z`}
                  fill={`url(#${gradId})`}
                />
              </g>

              {!reduceMotion && (
                <g>
                  {BUBBLES.map((b, i) => (
                    <circle key={i} cx={b.cx} r={b.r} fill="#FFFFFF" opacity="0">
                      <animateTransform
                        attributeName="transform"
                        type="translate"
                        from="0 120"
                        to="0 -16"
                        dur={`${b.dur}s`}
                        begin={`${b.begin}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0;0.55;0.5;0"
                        keyTimes="0;0.15;0.75;1"
                        dur={`${b.dur}s`}
                        begin={`${b.begin}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  ))}
                </g>
              )}
            </g>
          </g>

          {/* Glass highlight — a soft static light streak, suggests a
              curved glass tube rather than a flat bar. */}
          <rect x={TUBE_X + 5} y={TUBE_Y + 8} width={7} height={TUBE_H - 16} rx={3.5} fill="#FFFFFF" opacity="0.16" />

          {/* Tube outline on top, capsule stroke — identical on every tube. */}
          <rect
            x={TUBE_X}
            y={TUBE_Y}
            width={TUBE_W}
            height={TUBE_H}
            rx={TUBE_W / 2}
            fill="none"
            stroke="#C2C7EB"
            strokeWidth={1.5}
          />
        </svg>

        {badges.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-1.5 flex flex-col items-center gap-1">
            {badges.map((label) => (
              <TubeBadge key={label} label={label} />
            ))}
          </div>
        )}
      </div>

      <div className="w-full">
        <p className="font-mono text-xs font-bold text-indigo-950">{formatMoneyShort(raised, currency)}</p>
        <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-tight text-ink-700 group-hover:text-indigo-900">
          {hallName}
        </p>
      </div>
    </button>
  );
}
