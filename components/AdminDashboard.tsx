"use client";

import { useMemo, useState } from "react";
import type { Hall, DonorRole, DonationStatus } from "@/types/database";
import { formatMoney, percentRaised, type Currency } from "@/lib/money";
import MiniGauge from "./MiniGauge";
import StatusBadge from "./StatusBadge";
import VerifyOnChainLink from "./VerifyOnChainLink";

export interface DonationRow {
  id: string;
  hall_id: string;
  donor_name: string | null;
  is_anonymous: boolean;
  amount: number;
  currency: Currency;
  status: DonationStatus;
  created_at: string;
  halls: { name: string } | null;
}

export interface FundMovementRow {
  id: string;
  hall_id: string;
  amount: number;
  currency: Currency;
  note: string;
  created_at: string;
  onchain_tx_hash: string | null;
  profiles: { email: string } | null;
  halls: { name: string } | null;
}

type SortKey = "name" | "raised";

export default function AdminDashboard({
  role,
  initialHalls,
  initialDonations,
  initialFundMovements,
}: {
  role: DonorRole;
  initialHalls: Hall[];
  initialDonations: DonationRow[];
  initialFundMovements: FundMovementRow[];
}) {
  const [halls, setHalls] = useState(initialHalls);
  const [donations, setDonations] = useState(initialDonations);
  const [fundMovements, setFundMovements] = useState(initialFundMovements);
  const [sortCurrency, setSortCurrency] = useState<Currency>("NGN");
  const [sortKey, setSortKey] = useState<SortKey>("raised");

  const sortedHalls = useMemo(() => {
    const key = sortCurrency === "NGN" ? "raised_kobo" : "raised_cents";
    return [...halls].sort((a, b) =>
      sortKey === "name" ? a.name.localeCompare(b.name) : b[key] - a[key],
    );
  }, [halls, sortCurrency, sortKey]);

  async function refresh() {
    const res = await fetch("/api/admin/dashboard");
    if (!res.ok) return;
    const json = await res.json();
    setHalls(json.halls);
    setDonations(json.donations);
    setFundMovements(json.fundMovements);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-indigo-950">Dean&apos;s dashboard</h1>
          <p className="text-xs uppercase tracking-wide text-ink-500">
            Signed in as <strong className="text-indigo-900">{role.replace("_", " ")}</strong>
            {role === "staff_admin" && " — read only"}
          </p>
        </div>
      </div>

      <section className="mb-8 border border-indigo-100 bg-white">
        <div className="flex items-center justify-between border-b border-indigo-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-indigo-950">Halls</h2>
          <div className="flex items-center gap-3 text-xs">
            <div className="inline-flex border border-indigo-200">
              {(["NGN", "USD"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setSortCurrency(c)}
                  className={`px-2 py-1 font-mono ${sortCurrency === c ? "bg-indigo-900 text-white" : "text-ink-500"}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <button onClick={() => setSortKey("name")} className={sortKey === "name" ? "font-semibold text-indigo-900" : "text-ink-500"}>
              Sort: Name
            </button>
            <button onClick={() => setSortKey("raised")} className={sortKey === "raised" ? "font-semibold text-indigo-900" : "text-ink-500"}>
              Sort: Amount raised
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-indigo-50 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-2 font-medium">Hall</th>
                <th className="px-4 py-2 font-medium">Raised / Goal ({sortCurrency})</th>
                <th className="px-4 py-2 font-medium">Progress</th>
                <th className="px-4 py-2 font-medium">Verify</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-100">
              {sortedHalls.map((h) => {
                const raised = sortCurrency === "NGN" ? h.raised_kobo : h.raised_cents;
                const goal = sortCurrency === "NGN" ? h.goal_kobo : h.goal_cents;
                const txHash = sortCurrency === "NGN" ? h.onchain_ngn_tx_hash : h.onchain_usd_tx_hash;
                return (
                  <tr key={h.id}>
                    <td className="px-4 py-2.5">
                      {h.name}
                      {h.is_placeholder && <span className="ml-2 text-[10px] uppercase text-gold-700">TBC</span>}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">
                      {formatMoney(raised, sortCurrency)} / {formatMoney(goal, sortCurrency)}
                    </td>
                    <td className="px-4 py-2.5">
                      <MiniGauge percent={percentRaised(raised, goal)} />
                    </td>
                    <td className="px-4 py-2.5">
                      <VerifyOnChainLink txHash={txHash} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="border border-indigo-100 bg-white">
          <h2 className="border-b border-indigo-100 px-4 py-3 text-sm font-semibold text-indigo-950">
            Recent donations
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-indigo-50 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Donor</th>
                  <th className="px-4 py-2 font-medium">Hall</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100">
                {donations.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-2.5">{d.is_anonymous ? "Anonymous" : d.donor_name || "Anonymous"}</td>
                    <td className="px-4 py-2.5">{d.halls?.name ?? "—"}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{formatMoney(d.amount, d.currency)}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-ink-500">
                      {new Date(d.created_at).toLocaleString("en-NG", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                  </tr>
                ))}
                {donations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-ink-300">
                      No donations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border border-indigo-100 bg-white">
          <h2 className="border-b border-indigo-100 px-4 py-3 text-sm font-semibold text-indigo-950">Fund movements</h2>
          <ul className="max-h-72 divide-y divide-indigo-100 overflow-y-auto text-sm">
            {fundMovements.map((m) => (
              <li key={m.id} className="px-4 py-3">
                <p className="text-indigo-950">{m.halls?.name ?? "—"}</p>
                <p className="font-mono text-xs text-ink-500">{formatMoney(m.amount, m.currency)} — {m.note}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[11px] text-ink-300">{m.profiles?.email ?? "unknown"}</span>
                  <VerifyOnChainLink txHash={m.onchain_tx_hash} />
                </div>
              </li>
            ))}
            {fundMovements.length === 0 && <li className="px-4 py-6 text-center text-ink-300">None recorded yet.</li>}
          </ul>

          {role === "finance_admin" && (
            <FundMovementForm halls={halls} onRecorded={refresh} />
          )}
        </section>
      </div>
    </main>
  );
}

function FundMovementForm({ halls, onRecorded }: { halls: Hall[]; onRecorded: () => void }) {
  const [hallId, setHallId] = useState(halls[0]?.id ?? "");
  const [amount, setAmount] = useState<number | "">("");
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/fund-movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hallId, amountMajor: Number(amount), currency, note }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Could not record movement.");
      return;
    }
    setAmount("");
    setNote("");
    onRecorded();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-indigo-100 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Record a fund movement</p>
      <select value={hallId} onChange={(e) => setHallId(e.target.value)} className="w-full border border-indigo-200 px-2 py-2 text-sm">
        {halls.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="border border-indigo-200 px-2 py-2 text-sm">
          <option value="NGN">NGN</option>
          <option value="USD">USD</option>
        </select>
        <input
          type="number"
          step="0.01"
          required
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
          className="flex-1 border border-indigo-200 px-2 py-2 font-mono text-sm"
        />
      </div>
      <textarea
        required
        placeholder="e.g. Moved from Paystack balance to university bank account for renovation"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full border border-indigo-200 px-2 py-2 text-sm"
        rows={2}
      />
      {error && <p className="text-xs text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-900 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-60"
      >
        {loading ? "Recording…" : "Record movement"}
      </button>
    </form>
  );
}
