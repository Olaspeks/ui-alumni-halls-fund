"use client";

import { formatMoneyShort, type Currency } from "@/lib/money";

/**
 * One hall's liquid-fill tube in the barometer array (see
 * BarometerArray.tsx). A literal barometer, not the old speedometer —
 * the Dean's explicit feedback was a fluid column, not a dial+needle.
 *
 * The fill's true height is set once, directly from `percent` — the
 * idle "floating" motion is a separate, purely cosmetic layer on top
 * (see .barometer-wobble in globals.css), so the liquid level itself
 * never lies about the real number. When `percent` actually changes
 * (a real donation landing), the true-level layer transitions with a
 * slight overshoot via .barometer-level, distinct from the constant
 * idle wobble.
 */

const TUBE_X = 8;
const TUBE_Y = 6;
const TUBE_W = 44;
const TUBE_H = 208;
const VIEW_W = 60;
const VIEW_H = 220;
const WAVE_AMP = 4;
const PADDING = 14;

function baselineY(percent: number): number {
  const usable = TUBE_H - PADDING * 2;
  return TUBE_Y + PADDING + (1 - percent / 100) * usable;
}

export default function BarometerTube({
  hallId,
  hallName,
  percent,
  raised,
  goal,
  currency,
  isLeading,
  animIndex,
  onClick,
}: {
  hallId: string;
  hallName: string;
  percent: number;
  raised: number;
  goal: number;
  currency: Currency;
  isLeading: boolean;
  animIndex: number;
  onClick: () => void;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const clipId = `tube-clip-${hallId}`;
  const gradId = `tube-fill-${hallId}`;

  // Deterministic per-tube variety, not random per-render — so the row
  // reads as organic rather than a single mechanical wave, without
  // hydration mismatches between server and client.
  const wobbleDuration = 4.4 + ((animIndex * 37) % 22) / 10; // ~4.4s–6.6s
  const wobbleDelay = -((animIndex * 53) % 60) / 10; // negative = starts mid-cycle

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-20 shrink-0 flex-col items-center gap-2 rounded-sharp text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-600"
      aria-label={`${hallName}: ${clamped}% of goal raised, ${formatMoneyShort(raised, currency)} of ${formatMoneyShort(goal, currency)}. Tap to give.`}
    >
      <svg
        width={VIEW_W}
        height={VIEW_H}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className={`transition-transform group-hover:-translate-y-0.5 ${
          isLeading ? "drop-shadow-[0_0_8px_rgba(199,154,43,0.55)]" : ""
        }`}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E6C877" />
            <stop offset="55%" stopColor="#C79A2B" />
            <stop offset="100%" stopColor="#8C6813" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect x={TUBE_X} y={TUBE_Y} width={TUBE_W} height={TUBE_H} rx={TUBE_W / 2} />
          </clipPath>
        </defs>

        {/* Empty tube background */}
        <rect
          x={TUBE_X}
          y={TUBE_Y}
          width={TUBE_W}
          height={TUBE_H}
          rx={TUBE_W / 2}
          fill="#F4F5FC"
        />

        {/* Liquid fill, clipped to the tube capsule */}
        <g clipPath={`url(#${clipId})`}>
          <g
            className="barometer-level"
            style={{ transform: `translateY(${baselineY(clamped)}px)` }}
          >
            <g
              className="barometer-wobble"
              style={{ animationDuration: `${wobbleDuration}s`, animationDelay: `${wobbleDelay}s` }}
            >
              <path
                d={`M${TUBE_X},${WAVE_AMP} Q${TUBE_X + TUBE_W / 2},${-WAVE_AMP} ${TUBE_X + TUBE_W},${WAVE_AMP} L${TUBE_X + TUBE_W},600 L${TUBE_X},600 Z`}
                fill={`url(#${gradId})`}
              />
            </g>
          </g>
        </g>

        {/* Tube outline on top, capsule stroke */}
        <rect
          x={TUBE_X}
          y={TUBE_Y}
          width={TUBE_W}
          height={TUBE_H}
          rx={TUBE_W / 2}
          fill="none"
          stroke={isLeading ? "#C79A2B" : "#C2C7EB"}
          strokeWidth={isLeading ? 2 : 1.5}
        />

        <text
          x={VIEW_W / 2}
          y={VIEW_H / 2 + 4}
          textAnchor="middle"
          className="fill-indigo-950 font-mono text-[13px] font-semibold"
          style={{ paintOrder: "stroke", stroke: "#F4F5FC", strokeWidth: 3 }}
        >
          {clamped}%
        </text>
      </svg>

      <div className="w-full">
        <p className="font-mono text-[10px] leading-tight text-ink-500">
          {formatMoneyShort(raised, currency)} / {formatMoneyShort(goal, currency)}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-ink-700 group-hover:text-indigo-900">
          {hallName}
        </p>
      </div>
    </button>
  );
}
