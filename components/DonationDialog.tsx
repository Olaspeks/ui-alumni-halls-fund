"use client";

import { useState } from "react";
import type { Hall } from "@/types/database";
import type { Currency } from "@/lib/money";
import { useDonationInit } from "@/hooks/useDonationInit";
import { useAuthUser } from "@/hooks/useAuthUser";
import TurnstileWidget from "./TurnstileWidget";

const SUGGESTED: Record<Currency, number[]> = {
  NGN: [5000, 25000, 100000, 500000],
  USD: [25, 50, 200, 1000],
};

export default function DonationDialog({ hall, onClose }: { hall: Hall; onClose: () => void }) {
  const { email: authedEmail, profile } = useAuthUser();
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [amount, setAmount] = useState<number | "">(SUGGESTED.NGN[1]);
  const [name, setName] = useState(profile?.full_name ?? "");
  const [email, setEmail] = useState(authedEmail ?? "");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { submit, loading, error } = useDonationInit();

  function switchCurrency(next: Currency) {
    setCurrency(next);
    setAmount(SUGGESTED[next][1]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    const checkoutUrl = await submit({
      hallSlug: hall.slug,
      amountMajor: Number(amount),
      currency,
      donorName: isAnonymous ? null : name || null,
      donorEmail: email,
      isAnonymous,
      turnstileToken,
    });

    if (checkoutUrl) window.location.href = checkoutUrl;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-indigo-950/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto bg-white shadow-raised"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-indigo-100 bg-indigo-950 px-6 py-5">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gold-300">Giving to</p>
            <h2 className="font-serif text-xl text-white">{hall.name}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-2xl leading-none text-indigo-200 hover:text-white">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          {!profile && (
            <p className="text-xs text-ink-500">
              Giving as a guest — you&apos;ll get a receipt by email either way.{" "}
              <a href="/login" className="underline decoration-gold-500 underline-offset-2">
                Sign in
              </a>{" "}
              to keep a giving history.
            </p>
          )}

          <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">Currency</span>
            <div className="inline-flex border border-indigo-200">
              {(["NGN", "USD"] as const).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => switchCurrency(c)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    currency === c ? "bg-indigo-900 text-white" : "bg-white text-ink-700 hover:bg-indigo-50"
                  }`}
                >
                  {c === "NGN" ? "₦ Naira" : "$ US Dollar"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">Amount</span>
            <div className="mb-2 flex flex-wrap gap-2">
              {SUGGESTED[currency].map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setAmount(v)}
                  className={`border px-3 py-1.5 font-mono text-sm ${
                    amount === v ? "border-gold-500 bg-gold-50 text-indigo-950" : "border-indigo-200 text-ink-700 hover:border-indigo-400"
                  }`}
                >
                  {currency === "NGN" ? "₦" : "$"}
                  {v.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full border border-indigo-200 bg-white px-3 py-2.5 font-mono text-sm outline-none focus:border-gold-500"
              placeholder={currency === "NGN" ? "Custom amount in ₦" : "Custom amount in $"}
            />
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">Name (optional)</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isAnonymous}
              className="w-full border border-indigo-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold-500 disabled:bg-indigo-50 disabled:text-ink-300"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-indigo-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold-500"
              placeholder="Where your receipt will be sent"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="h-4 w-4 accent-indigo-900" />
            Give anonymously (hides your name from public view only — your receipt is unaffected)
          </label>

          <TurnstileWidget onVerify={setTurnstileToken} />

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading || !turnstileToken}
            className="w-full bg-gold-500 px-4 py-3 text-sm font-semibold text-indigo-950 transition-colors hover:bg-gold-400 disabled:opacity-60"
          >
            {loading ? "Starting…" : `Give ${currency === "NGN" ? "₦" : "$"}${amount || 0}`}
          </button>
        </form>
      </div>
    </div>
  );
}
