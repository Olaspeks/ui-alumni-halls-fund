"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Hall } from "@/types/database";
import type { Currency } from "@/lib/money";
import { formatMoney, percentRaised, convertSubunits } from "@/lib/money";
import type { FxRate } from "@/lib/fx";
import { useHallsRealtime } from "@/hooks/useHallsRealtime";
import { useAuthUser } from "@/hooks/useAuthUser";
import BarometerArray from "./BarometerArray";

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
  const [currency, setCurrency] = useState<Currency>("NGN");
  const { loading: authLoading, email } = useAuthUser();

  // Combined total: every hall's NGN gifts + every hall's USD gifts,
  // converted live into whichever currency is selected, so switching
  // ₦/$ always shows the same underlying money — just expressed in a
  // different currency, not a separate pool of it. The same `currency`
  // also drives every tube in the barometer array below, so the row
  // stays directly comparable hall-to-hall.
  const { totalRaised, totalGoal } = useMemo(() => {
    const rawRaisedNgn = halls.reduce((sum, h) => sum + h.raised_kobo, 0);
    const rawRaisedUsd = halls.reduce((sum, h) => sum + h.raised_cents, 0);
    const rawGoalNgn = halls.reduce((sum, h) => sum + h.goal_kobo, 0);
    const rawGoalUsd = halls.reduce((sum, h) => sum + h.goal_cents, 0);

    if (currency === "NGN") {
      return {
        totalRaised: rawRaisedNgn + convertSubunits(rawRaisedUsd, "USD", "NGN", fxRate.usdToNgn),
        totalGoal: rawGoalNgn + convertSubunits(rawGoalUsd, "USD", "NGN", fxRate.usdToNgn),
      };
    }
    return {
      totalRaised: rawRaisedUsd + convertSubunits(rawRaisedNgn, "NGN", "USD", fxRate.usdToNgn),
      totalGoal: rawGoalUsd + convertSubunits(rawGoalNgn, "NGN", "USD", fxRate.usdToNgn),
    };
  }, [halls, currency, fxRate]);

  const percent = percentRaised(totalRaised, totalGoal);

  return (
    <>
      <section className="border-b border-indigo-100 bg-indigo-950">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="text-xs font-medium uppercase tracking-wide text-gold-300">
            {live ? "Live progress" : "Demo mode — connect Supabase for live totals"}
          </p>
          <h1 className="mt-2 max-w-2xl font-serif text-4xl leading-tight text-white sm:text-5xl">
            Renovate the halls that raised us.
          </h1>
          <p className="mt-4 max-w-xl text-indigo-200">
            Alumni across the world are giving toward the restoration of UI&apos;s 15 halls of
            residence. Pick a hall below, give in Naira or Dollars, and get a receipt in your
            inbox instantly.
          </p>

          <div className="mt-8 flex flex-wrap items-end gap-6">
            <div>
              <p className="font-mono text-3xl text-white">
                {formatMoney(totalRaised, currency)}{" "}
                <span className="text-lg text-indigo-400">/ {formatMoney(totalGoal, currency)}</span>
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-indigo-400">
                {percent}% of the combined goal, across all 15 halls
              </p>
            </div>

            <div>
              <div className="inline-flex border border-indigo-700 text-xs">
                {(["NGN", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`px-3 py-1.5 font-mono ${
                      currency === c ? "bg-gold-500 text-indigo-950" : "text-indigo-200 hover:bg-indigo-900"
                    }`}
                  >
                    {c === "NGN" ? "₦ Naira" : "$ USD"}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 font-mono text-[11px] text-indigo-500">
                $1 ≈ ₦{Math.round(fxRate.usdToNgn).toLocaleString()} · live rate
              </p>
            </div>
          </div>

          {!authLoading && !email && (
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/login?mode=signup"
                className="bg-gold-500 px-6 py-3 text-sm font-semibold text-indigo-950 shadow-raised transition-colors hover:bg-gold-400"
              >
                Create an account
              </Link>
              <Link
                href="/login?mode=signin"
                className="bg-indigo-100 px-6 py-3 text-sm font-semibold text-indigo-950 transition-colors hover:bg-white"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-1 flex items-baseline justify-between">
            <h2 className="font-serif text-2xl text-indigo-950">All 15 halls</h2>
            <p className="hidden text-xs text-ink-300 sm:block">Scroll to compare · tap a tube to give</p>
          </div>
        </div>
        <BarometerArray halls={halls} currency={currency} fxRate={fxRate} />
      </section>
    </>
  );
}
