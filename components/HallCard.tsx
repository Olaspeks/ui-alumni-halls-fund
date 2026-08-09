"use client";

import { useMemo, useState } from "react";
import type { Hall } from "@/types/database";
import type { Currency } from "@/lib/money";
import { formatMoney, percentRaised, convertSubunits } from "@/lib/money";
import type { FxRate } from "@/lib/fx";
import Gauge from "./Gauge";
import VerifyOnChainLink from "./VerifyOnChainLink";
import DonationDialog from "./DonationDialog";

export default function HallCard({ hall, fxRate }: { hall: Hall; fxRate: FxRate }) {
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [open, setOpen] = useState(false);
  const txHash = currency === "NGN" ? hall.onchain_ngn_tx_hash : hall.onchain_usd_tx_hash;

  // Combined, currency-equivalent figures: this hall's NGN gifts + its
  // USD gifts, converted live into whichever currency is selected — the
  // toggle switches how you're viewing the same total, not which pool
  // of money you're looking at.
  const { raised, goal } = useMemo(() => {
    if (currency === "NGN") {
      return {
        raised: hall.raised_kobo + convertSubunits(hall.raised_cents, "USD", "NGN", fxRate.usdToNgn),
        goal: hall.goal_kobo + convertSubunits(hall.goal_cents, "USD", "NGN", fxRate.usdToNgn),
      };
    }
    return {
      raised: hall.raised_cents + convertSubunits(hall.raised_kobo, "NGN", "USD", fxRate.usdToNgn),
      goal: hall.goal_cents + convertSubunits(hall.goal_kobo, "NGN", "USD", fxRate.usdToNgn),
    };
  }, [hall, currency, fxRate]);

  const percent = percentRaised(raised, goal);

  return (
    <div id={hall.slug} className="flex flex-col border border-indigo-100 bg-white p-5 shadow-card scroll-mt-24">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-serif text-lg leading-snug text-indigo-950">{hall.name}</h3>
          {hall.is_placeholder && (
            <span className="mt-1 inline-block bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-500">
              Name pending confirmation
            </span>
          )}
        </div>
        <div className="inline-flex shrink-0 border border-indigo-200 text-xs">
          {(["NGN", "USD"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-2 py-1 font-mono ${currency === c ? "bg-indigo-900 text-white" : "text-ink-500 hover:bg-indigo-50"}`}
            >
              {c === "NGN" ? "₦" : "$"}
            </button>
          ))}
        </div>
      </div>

      {hall.blurb && <p className="mb-4 text-sm text-ink-500">{hall.blurb}</p>}

      <div className="mt-auto flex items-center gap-4">
        <Gauge percent={percent} size="sm" centerLabel="" />
        <div className="flex-1">
          <p className="font-mono text-sm text-indigo-950">{formatMoney(raised, currency)}</p>
          <p className="font-mono text-xs text-ink-300">of {formatMoney(goal, currency)} goal</p>
          <div className="mt-1">
            <VerifyOnChainLink txHash={txHash} />
          </div>
        </div>
      </div>

      <button
        onClick={() => setOpen(true)}
        className="mt-4 w-full bg-indigo-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-800"
      >
        Give to {hall.name.split(" — ")[0]}
      </button>

      {open && <DonationDialog hall={hall} onClose={() => setOpen(false)} />}
    </div>
  );
}
