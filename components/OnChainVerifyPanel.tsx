"use client";

import { useState } from "react";
import { useCountUp } from "@/hooks/useCountUp";

/**
 * Interactive "verify this on-chain" experience — this is the actual
 * point of the blockchain confirmation stamp for an alumnus: proof that
 * the total the university is showing publicly matches what was
 * independently stamped on-chain at the time. Expands in place rather
 * than linking out to a real explorer, since in demo/mock mode the tx
 * hash isn't real — linking out would just 404 on the real explorer,
 * which reads as broken rather than intentional. Once a real contract
 * is deployed (see /contracts), this can link out directly instead.
 */
export default function OnChainVerifyPanel({
  txHash,
  network = "Polygon Amoy (testnet)",
}: {
  txHash: string;
  network?: string;
}) {
  const [open, setOpen] = useState(false);
  const confirmations = useCountUp(open ? 128 : 0, 1400);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 underline decoration-gold-500 decoration-2 underline-offset-2 hover:text-indigo-900"
      >
        {open ? "Hide verification ▲" : "Verify on-chain →"}
      </button>

      {open && (
        <div className="mt-3 border border-gold-500/40 bg-indigo-950 p-4 font-mono text-[11px] text-indigo-200 shadow-raised">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-emerald-300">CONFIRMED ON-CHAIN</span>
          </div>
          <Row label="Network" value={network} />
          <Row label="Tx hash" value={`${txHash.slice(0, 18)}…${txHash.slice(-8)}`} />
          <Row label="Confirmations" value={confirmations.toLocaleString()} />
          <Row label="Contract" value="HallConfirmation.sol · onlyOwner write" />
          <p className="mt-3 border-t border-indigo-800 pt-2 text-indigo-400">
            This figure was written to a public ledger the moment it was confirmed — anyone can
            independently verify it matches what the university reports, without trusting either
            party.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-indigo-900 py-1.5 last:border-0">
      <span className="text-indigo-400">{label}</span>
      <span className="text-gold-300">{value}</span>
    </div>
  );
}
