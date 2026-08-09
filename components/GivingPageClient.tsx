"use client";

import { useMemo, useState } from "react";
import type { Hall } from "@/types/database";
import type { Currency } from "@/lib/money";
import { formatMoney, percentRaised, convertSubunits } from "@/lib/money";
import type { FxRate } from "@/lib/fx";
import { useHallsRealtime } from "@/hooks/useHallsRealtime";
import Gauge from "./Gauge";
import HallCard from "./HallCard";

export default function GivingPageClient({
  initialHalls,
  live,
  fxRate,
}: {
  initialHalls: Hall[];
  live: boolean;
  fxRate: FxRate;
}) {
  const halls = useHallsRealtime(initialHalls);
  const [heroCurrency, setHeroCurrency] = useState<Currency>("NGN");

  // Combined total: every hall's NGN gifts + every hall's USD gifts,
  // converted live into whichever currency is selected, so switching
  // ₦/$ always shows the same underlying money — just expressed in a
  // different currency, not a separate pool of it.
  const { totalRaised, totalGoal } = useMemo(() => {
    const rawRaisedNgn = halls.reduce((sum, h) => sum + h.raised_kobo, 0);
    const rawRaisedUsd = halls.reduce((sum, h) => sum + h.raised_cents, 0);
    const rawGoalNgn = halls.reduce((sum, h) => sum + h.goal_kobo, 0);
    const rawGoalUsd = halls.reduce((sum, h) => sum + h.goal_cents, 0);

    if (heroCurrency === "NGN") {
      return {
        totalRaised: rawRaisedNgn + convertSubunits(rawRaisedUsd, "USD", "NGN", fxRate.usdToNgn),
        totalGoal: rawGoalNgn + convertSubunits(rawGoalUsd, "USD", "NGN", fxRate.usdToNgn),
      };
    }
    return {
      totalRaised: rawRaisedUsd + convertSubunits(rawRaisedNgn, "NGN", "USD", fxRate.usdToNgn),
      totalGoal: rawGoalUsd + convertSubunits(rawGoalNgn, "NGN", "USD", fxRate.usdToNgn),
    };
  }, [halls, heroCurrency, fxRate]);

  const percent = percentRaised(totalRaised, totalGoal);

  return (
    <>
      <section className="border-b border-indigo-100 bg-indigo-950">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="grid items-center gap-10 sm:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center">
              <Gauge percent={percent} size="lg" centerLabel="grand total raised" />
              <div className="mt-3 inline-flex border border-indigo-700 text-xs">
                {(["NGN", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setHeroCurrency(c)}
                    className={`px-3 py-1.5 font-mono ${
                      heroCurrency === c ? "bg-gold-500 text-indigo-950" : "text-indigo-200 hover:bg-indigo-900"
                    }`}
                  >
                    {c === "NGN" ? "₦ Naira" : "$ USD"}
                  </button>
                ))}
              </div>
              <p className="mt-2 font-mono text-[11px] text-indigo-400">
                $1 ≈ ₦{Math.round(fxRate.usdToNgn).toLocaleString()} · live rate
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gold-300">
                {live ? "Live progress" : "Demo mode — connect Supabase for live totals"}
              </p>
              <h1 className="mt-2 font-serif text-4xl leading-tight text-white sm:text-5xl">
                Renovate the halls that raised us.
              </h1>
              <p className="mt-4 max-w-xl text-indigo-200">
                Alumni across the world are giving toward the restoration of UI&apos;s 15 halls of
                residence. Pick a hall below, give in Naira or Dollars, and get a receipt in
                your inbox instantly.
              </p>
              <p className="mt-6 font-mono text-sm text-indigo-200">
                {formatMoney(totalRaised, heroCurrency)} raised of {formatMoney(totalGoal, heroCurrency)} combined goal
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <h2 className="mb-6 font-serif text-2xl text-indigo-950">All 15 halls</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {halls.map((hall) => (
            <HallCard key={hall.id} hall={hall} fxRate={fxRate} />
          ))}
        </div>
      </section>
    </>
  );
}
