"use client";

import { formatMoney, type Currency } from "@/lib/money";

export interface ReceiptCardData {
  hallName: string;
  hallSlug: string;
  amount: number;
  currency: Currency;
  reference: string;
  createdAt: string;
  donorDisplayName: string;
  isAnonymous: boolean;
  onchainTxHash?: string | null;
}

/** Shared receipt view — used by /receipt/[token] (guest link) and
 * /account (logged-in donor history). Carries the same calm,
 * institutional design language as the email, since alumni may keep
 * this document. */
export default function ReceiptCard({ data }: { data: ReceiptCardData }) {
  const when = new Date(data.createdAt).toLocaleString("en-NG", { dateStyle: "long", timeStyle: "short" });

  return (
    <div className="receipt-print-area mx-auto max-w-lg border border-indigo-100 bg-white shadow-card">
      <div className="border-b-[3px] border-gold-500 bg-indigo-950 px-8 py-6">
        <p className="text-[11px] uppercase tracking-widest text-gold-300">University of Ibadan</p>
        <h1 className="mt-1 font-serif text-xl text-white">Alumni Halls Fund — Donation Receipt</h1>
      </div>

      <div className="px-8 py-7">
        <p className="text-sm text-ink-700">Dear {data.donorDisplayName},</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-700">
          Thank you for your generous gift toward the renovation of <strong>{data.hallName}</strong>.
        </p>

        <dl className="mt-6 divide-y divide-indigo-100 border-y border-indigo-100 font-mono text-sm">
          <Row label="Reference" value={data.reference} />
          <Row label="Hall" value={data.hallName} />
          <Row label="Amount" value={formatMoney(data.amount, data.currency)} strong />
          <Row label="Date" value={when} />
        </dl>

        {data.isAnonymous && (
          <p className="mt-4 text-xs text-ink-500">
            Recorded publicly as <strong>Anonymous</strong> — this receipt is for your records only.
          </p>
        )}

        {data.onchainTxHash && (
          <p className="mt-4 text-xs text-ink-500">On-chain confirmation: {data.onchainTxHash}</p>
        )}

        <button
          onClick={() => window.print()}
          className="no-print mt-8 w-full border border-indigo-900 py-2.5 text-sm font-medium text-indigo-900 hover:bg-indigo-50"
        >
          Print / save as PDF
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-ink-500">{label}</dt>
      <dd className={strong ? "font-semibold text-indigo-950" : "text-ink-900"}>{value}</dd>
    </div>
  );
}
