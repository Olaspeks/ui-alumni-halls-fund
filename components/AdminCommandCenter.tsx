"use client";

import { useEffect, useMemo, useState } from "react";
import { STATIC_HALLS } from "@/lib/halls";
import { formatMoney, percentRaised, type Currency } from "@/lib/money";
import { MOCK_DONATIONS, MOCK_FUND_MOVEMENTS, MOCK_ADMIN_STATS } from "@/lib/mockAdminData";
import type { FundMovementRow } from "./AdminDashboard";
import { useCountUp } from "@/hooks/useCountUp";
import StatusBadge from "./StatusBadge";
import OnChainVerifyPanel from "./OnChainVerifyPanel";

type SortKey = "name" | "raised";

/**
 * The flashy, presentation-ready preview of the admin dashboard — shown
 * at /admin whenever Supabase isn't configured (arrived at via the
 * "Welcome, Dean" entrance at /admin/login). Fabricated data throughout;
 * nothing here is persisted. Once Supabase is connected, app/admin/page.tsx
 * switches to the plainer, denser AdminDashboard.tsx instead — deliberately
 * a different, more "daily tool" look, per the brief's own admin design
 * direction. This one's job is to sell the vision, not to be used daily.
 */
export default function AdminCommandCenter() {
  const [name, setName] = useState("Dean");
  const [sortCurrency, setSortCurrency] = useState<Currency>("NGN");
  const [sortKey, setSortKey] = useState<SortKey>("raised");
  const [fundMovements, setFundMovements] = useState<FundMovementRow[]>(MOCK_FUND_MOVEMENTS);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.sessionStorage.getItem("mockAdminName");
    if (stored) setName(stored.trim().split(" ")[0]);
  }, []);

  const totals = useMemo(() => {
    const raisedNgn = STATIC_HALLS.reduce((s, h) => s + h.raised_kobo, 0);
    const raisedUsd = STATIC_HALLS.reduce((s, h) => s + h.raised_cents, 0);
    const fullyFunded = STATIC_HALLS.filter((h) => h.raised_kobo >= h.goal_kobo).length;
    return { raisedNgn, raisedUsd, fullyFunded };
  }, []);

  const raisedNgnCountUp = useCountUp(totals.raisedNgn / 100);
  const raisedUsdCountUp = useCountUp(totals.raisedUsd / 100);
  const donorsCountUp = useCountUp(MOCK_ADMIN_STATS.totalDonors);

  const sortedHalls = useMemo(() => {
    const key = sortCurrency === "NGN" ? "raised_kobo" : "raised_cents";
    return [...STATIC_HALLS].sort((a, b) =>
      sortKey === "name" ? a.name.localeCompare(b.name) : b[key] - a[key],
    );
  }, [sortCurrency, sortKey]);

  return (
    <main className="min-h-screen bg-indigo-950 pb-20 text-white">
      <div className="border-b border-gold-500/20 bg-indigo-950/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold-400">
              ● Live preview — demo mode
            </p>
            <h1 className="mt-1 font-serif text-2xl text-white">Welcome, {name}</h1>
          </div>
          <a href="/" className="text-xs text-indigo-300 underline decoration-gold-500 underline-offset-2 hover:text-white">
            ← Exit Command Center
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Raised (NGN)" value={formatMoney(raisedNgnCountUp * 100, "NGN")} />
          <StatTile label="Raised (USD)" value={formatMoney(raisedUsdCountUp * 100, "USD")} />
          <StatTile label="Donors" value={donorsCountUp.toLocaleString()} />
          <StatTile label="Halls fully funded" value={`${totals.fullyFunded} / ${STATIC_HALLS.length}`} />
        </div>

        <section className="mt-8 border border-indigo-800 bg-indigo-900/40">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Halls</h2>
            <div className="flex items-center gap-3 text-xs">
              <div className="inline-flex border border-indigo-700">
                {(["NGN", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setSortCurrency(c)}
                    className={`px-2 py-1 font-mono ${sortCurrency === c ? "bg-gold-500 text-indigo-950" : "text-indigo-300"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <button onClick={() => setSortKey("name")} className={sortKey === "name" ? "font-semibold text-gold-300" : "text-indigo-400"}>
                Sort: Name
              </button>
              <button onClick={() => setSortKey("raised")} className={sortKey === "raised" ? "font-semibold text-gold-300" : "text-indigo-400"}>
                Sort: Amount raised
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-indigo-950/60 font-mono text-[10px] uppercase tracking-wide text-indigo-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Hall</th>
                  <th className="px-4 py-2 font-medium">Raised / Goal ({sortCurrency})</th>
                  <th className="px-4 py-2 font-medium">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-800">
                {sortedHalls.map((h) => {
                  const raised = sortCurrency === "NGN" ? h.raised_kobo : h.raised_cents;
                  const goal = sortCurrency === "NGN" ? h.goal_kobo : h.goal_cents;
                  const percent = percentRaised(raised, goal);
                  return (
                    <tr key={h.id}>
                      <td className="px-4 py-2.5">
                        {h.name}
                        {h.is_placeholder && <span className="ml-2 text-[10px] uppercase text-gold-500">TBC</span>}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-indigo-200">
                        {formatMoney(raised, sortCurrency)} / {formatMoney(goal, sortCurrency)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-28 overflow-hidden bg-indigo-800">
                            <div className="h-full bg-gold-500" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="font-mono text-xs text-indigo-300">{percent}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
          <section className="border border-indigo-800 bg-indigo-900/40">
            <h2 className="border-b border-indigo-800 px-4 py-3 text-sm font-semibold text-white">Recent donations</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-indigo-950/60 font-mono text-[10px] uppercase tracking-wide text-indigo-400">
                  <tr>
                    <th className="px-4 py-2 font-medium">Donor</th>
                    <th className="px-4 py-2 font-medium">Hall</th>
                    <th className="px-4 py-2 font-medium">Amount</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-800">
                  {MOCK_DONATIONS.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-2.5 text-indigo-100">{d.is_anonymous ? "Anonymous" : d.donor_name || "Anonymous"}</td>
                      <td className="px-4 py-2.5 text-indigo-300">{d.halls?.name ?? "—"}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-indigo-200">{formatMoney(d.amount, d.currency)}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-indigo-400">
                        {new Date(d.created_at).toLocaleString("en-NG", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="border border-indigo-800 bg-indigo-900/40">
            <h2 className="border-b border-indigo-800 px-4 py-3 text-sm font-semibold text-white">Fund movements</h2>
            <ul className="max-h-96 divide-y divide-indigo-800 overflow-y-auto text-sm">
              {fundMovements.map((m) => (
                <li key={m.id} className={`px-4 py-3 transition-colors ${justAdded === m.id ? "bg-gold-500/10" : ""}`}>
                  <p className="text-indigo-100">{m.halls?.name ?? "—"}</p>
                  <p className="font-mono text-xs text-indigo-300">
                    {formatMoney(m.amount, m.currency)} — {m.note}
                  </p>
                  <p className="mt-1 text-[11px] text-indigo-500">{m.profiles?.email ?? "unknown"}</p>
                  {m.onchain_tx_hash && (
                    <div className="mt-2">
                      <OnChainVerifyPanel txHash={m.onchain_tx_hash} />
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <FundMovementSimulator
              onAdd={(row) => {
                setFundMovements((prev) => [row, ...prev]);
                setJustAdded(row.id);
                window.setTimeout(() => setJustAdded(null), 2000);
              }}
            />
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-indigo-500">
          Everything above is fabricated for preview purposes. Connect Supabase (see the README) to
          replace this with the real, working dashboard — same layout, real numbers.
        </p>
      </div>
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-indigo-800 bg-indigo-900/40 px-4 py-4">
      <p className="font-mono text-xl text-gold-300">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-indigo-400">{label}</p>
    </div>
  );
}

function FundMovementSimulator({ onAdd }: { onAdd: (row: FundMovementRow) => void }) {
  const [hallId, setHallId] = useState(STATIC_HALLS[0]?.id ?? "");
  const [amount, setAmount] = useState<number | "">("");
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [note, setNote] = useState("");
  const [stage, setStage] = useState<"idle" | "stamping">("idle");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !note.trim()) return;
    setStage("stamping");
    window.setTimeout(() => {
      const hall = STATIC_HALLS.find((h) => h.id === hallId);
      onAdd({
        id: `sim-${Date.now()}`,
        hall_id: hallId,
        amount: Math.round(Number(amount) * 100),
        currency,
        note: note.trim(),
        created_at: new Date().toISOString(),
        onchain_tx_hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
        profiles: { email: "you@ui.edu.ng (demo)" },
        halls: { name: hall?.name ?? "—" },
      });
      setAmount("");
      setNote("");
      setStage("idle");
    }, 900);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-indigo-800 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">
        Record a fund movement (demo — finance admin only)
      </p>
      <select
        value={hallId}
        onChange={(e) => setHallId(e.target.value)}
        className="w-full border border-indigo-700 bg-indigo-950 px-2 py-2 text-sm text-indigo-100"
      >
        {STATIC_HALLS.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          className="border border-indigo-700 bg-indigo-950 px-2 py-2 text-sm text-indigo-100"
        >
          <option value="NGN">NGN</option>
          <option value="USD">USD</option>
        </select>
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
          className="flex-1 border border-indigo-700 bg-indigo-950 px-2 py-2 font-mono text-sm text-indigo-100"
        />
      </div>
      <textarea
        placeholder="e.g. Moved from Paystack balance to university bank account"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full border border-indigo-700 bg-indigo-950 px-2 py-2 text-sm text-indigo-100"
        rows={2}
      />
      <button
        type="submit"
        disabled={stage === "stamping"}
        className="w-full bg-gold-500 py-2 text-sm font-semibold text-indigo-950 hover:bg-gold-400 disabled:opacity-60"
      >
        {stage === "stamping" ? "Stamping on-chain…" : "Record movement"}
      </button>
    </form>
  );
}
