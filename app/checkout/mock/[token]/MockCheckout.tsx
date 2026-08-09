"use client";

import { useState } from "react";

export default function MockCheckout({ token }: { token: string }) {
  const [loading, setLoading] = useState<"success" | "failed" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirm(outcome: "success" | "failed") {
    setLoading(outcome);
    setError(null);
    try {
      const res = await fetch("/api/donations/mock-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initToken: token, outcome }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setLoading(null);
        return;
      }
      if (outcome === "success" && json.receiptUrl) {
        window.location.href = `/thank-you?receipt=${encodeURIComponent(json.receiptUrl)}`;
      } else {
        window.location.href = "/thank-you?status=failed";
      }
    } catch {
      setError("Network error — please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="mt-6 space-y-3">
      <button
        onClick={() => confirm("success")}
        disabled={loading !== null}
        className="w-full bg-gold-500 py-3 text-sm font-semibold text-indigo-950 hover:bg-gold-400 disabled:opacity-60"
      >
        {loading === "success" ? "Confirming…" : "Simulate successful payment"}
      </button>
      <button
        onClick={() => confirm("failed")}
        disabled={loading !== null}
        className="w-full border border-indigo-200 py-3 text-sm font-medium text-ink-700 hover:bg-indigo-50 disabled:opacity-60"
      >
        {loading === "failed" ? "Please wait…" : "Simulate failed payment"}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
