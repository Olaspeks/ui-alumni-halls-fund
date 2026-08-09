"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { MOCK_BOWIE_DONATIONS } from "@/lib/mockAdminData";
import StatusBadge from "./StatusBadge";
import OnChainVerifyPanel from "./OnChainVerifyPanel";

/**
 * The alumni POV demo — reached by signing in at /login (mock mode).
 * Fabricated, not persisted; exists to preview what a real donor's
 * /account will look and feel like once Supabase is connected, with a
 * particular focus on the on-chain verification experience, which is
 * otherwise easy to overlook.
 */
export default function MockAccountView() {
  const [name, setName] = useState("Bowie");

  useEffect(() => {
    const stored = window.sessionStorage.getItem("mockDonorName");
    if (stored) setName(stored.trim().split(" ")[0]);
  }, []);

  const totalGiven = MOCK_BOWIE_DONATIONS.filter((d) => d.status === "success").length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-xs font-medium uppercase tracking-wide text-gold-700">Demo mode · not a real account</p>
      <h1 className="mt-1 font-serif text-3xl text-indigo-950">Welcome back, {name} 👋</h1>
      <p className="mt-2 text-sm text-ink-500">
        This is a preview of an alumnus&apos;s own account — {totalGiven} confirmed gifts across{" "}
        {new Set(MOCK_BOWIE_DONATIONS.map((d) => d.hallSlug)).size} halls. Connect Supabase to make
        this real for every alumnus.
      </p>

      <div className="mt-8 divide-y divide-indigo-100 border border-indigo-100 bg-white">
        {MOCK_BOWIE_DONATIONS.map((d) => (
          <div key={d.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-indigo-950">{d.hallName}</p>
                <p className="font-mono text-xs text-ink-500">
                  {new Date(d.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })} ·
                  ref {d.reference}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={d.status} />
                <span className="font-mono text-sm text-indigo-950">{formatMoney(d.amount, d.currency)}</span>
              </div>
            </div>

            {d.status === "success" && d.txHash && (
              <div className="mt-3">
                <OnChainVerifyPanel txHash={d.txHash} />
              </div>
            )}
            {d.status === "pending" && (
              <p className="mt-2 text-xs text-gold-700">Payment provider is confirming this — usually under a minute.</p>
            )}
            {d.status === "failed" && (
              <p className="mt-2 text-xs text-red-700">
                This payment wasn&apos;t completed — no charge was made.{" "}
                <Link href={`/#${d.hallSlug}`} className="underline decoration-gold-500 underline-offset-2">
                  Try again
                </Link>
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-ink-300">
        Signed in via the demo flow — nothing here is stored. Real accounts, real receipts, and real
        on-chain links go live once Supabase and the deployed contract are connected.
      </p>
    </main>
  );
}
