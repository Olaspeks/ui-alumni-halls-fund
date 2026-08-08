"use client";

import { useEffect, useState } from "react";

type Status = "pending" | "success" | "failed" | "timeout";

/** Polls /api/donations/status until the webhook (never the redirect
 * itself) confirms the payment, then reveals the receipt link. */
export default function PendingConfirmation({ donationId }: { donationId: string }) {
  const [status, setStatus] = useState<Status>("pending");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    let attempts = 0;
    let cancelled = false;

    async function poll() {
      attempts += 1;
      try {
        const res = await fetch(`/api/donations/status?id=${encodeURIComponent(donationId)}`);
        const json = await res.json();
        if (cancelled) return;
        if (json.status === "success") {
          setStatus("success");
          setReceiptUrl(json.receiptUrl);
          return;
        }
        if (json.status === "failed") {
          setStatus("failed");
          return;
        }
      } catch {
        // keep polling
      }
      if (attempts >= 15) {
        setStatus("timeout");
        return;
      }
      setTimeout(poll, 2000);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [donationId]);

  if (status === "pending") {
    return <p className="mt-4 text-sm text-ink-500">Confirming your payment with the provider — this usually takes a few seconds…</p>;
  }

  if (status === "success" && receiptUrl) {
    return (
      <a href={receiptUrl} className="mt-6 inline-block bg-gold-500 px-5 py-2.5 text-sm font-semibold text-indigo-950 hover:bg-gold-400">
        View your receipt
      </a>
    );
  }

  if (status === "failed") {
    return <p className="mt-4 text-sm text-red-700">This payment wasn&apos;t completed. No charge should have been made — please try again from the home page.</p>;
  }

  return (
    <p className="mt-4 text-sm text-ink-500">
      Still confirming — this can take a little longer than usual. Your receipt will also be
      emailed to you the moment it&apos;s ready.
    </p>
  );
}
