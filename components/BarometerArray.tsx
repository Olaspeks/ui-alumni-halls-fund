"use client";

import { useMemo, useState } from "react";
import type { Hall } from "@/types/database";
import { percentRaised, convertSubunits, type Currency } from "@/lib/money";
import type { FxRate } from "@/lib/fx";
import BarometerTube from "./BarometerTube";
import DonationDialog from "./DonationDialog";

/**
 * The instrument-panel-style barometer row — all 15 halls side by side
 * as liquid-fill tubes, reading as one connected instrument rather than
 * a grid of separate cards. Deliberately never wraps to a new line
 * (that breaks the at-a-glance comparison the Dean specifically asked
 * for) — it scrolls horizontally instead, on every screen size.
 *
 * One shared currency toggle drives every tube at once (see
 * GivingPageClient), rather than each hall toggling independently —
 * otherwise tubes wouldn't be comparable to each other.
 */
export default function BarometerArray({
  halls,
  currency,
  fxRate,
}: {
  halls: Hall[];
  currency: Currency;
  fxRate: FxRate;
}) {
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);

  const computed = useMemo(() => {
    const rows = halls.map((hall) => {
      const { raised, goal } =
        currency === "NGN"
          ? {
              raised: hall.raised_kobo + convertSubunits(hall.raised_cents, "USD", "NGN", fxRate.usdToNgn),
              goal: hall.goal_kobo + convertSubunits(hall.goal_cents, "USD", "NGN", fxRate.usdToNgn),
            }
          : {
              raised: hall.raised_cents + convertSubunits(hall.raised_kobo, "NGN", "USD", fxRate.usdToNgn),
              goal: hall.goal_cents + convertSubunits(hall.goal_kobo, "NGN", "USD", fxRate.usdToNgn),
            };
      return { hall, raised, goal, percent: percentRaised(raised, goal) };
    });
    const maxPercent = Math.max(0, ...rows.map((r) => r.percent));
    return { rows, maxPercent };
  }, [halls, currency, fxRate]);

  return (
    <div>
      <div className="flex gap-4 overflow-x-auto px-4 pb-4 pt-2 sm:px-0" style={{ scrollbarWidth: "thin" }}>
        {computed.rows.map(({ hall, raised, goal, percent }, i) => (
          <BarometerTube
            key={hall.id}
            hallId={hall.id}
            hallName={hall.name}
            percent={percent}
            raised={raised}
            goal={goal}
            currency={currency}
            isLeading={percent > 0 && percent === computed.maxPercent}
            animIndex={i}
            onClick={() => setSelectedHall(hall)}
          />
        ))}
      </div>

      {selectedHall && <DonationDialog hall={selectedHall} onClose={() => setSelectedHall(null)} />}
    </div>
  );
}
