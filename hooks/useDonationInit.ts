"use client";

import { useState } from "react";
import type { Currency } from "@/lib/money";

export interface DonationInitArgs {
  hallSlug: string;
  amountMajor: number;
  currency: Currency;
  donorName: string | null;
  donorEmail: string;
  isAnonymous: boolean;
  turnstileToken: string | null;
}

/**
 * Thin, typed wrapper around POST /api/donations/init — the one seam
 * between the donation form and the backend. Every field the form
 * collects flows through here and nowhere else, so there's a single
 * place to see exactly what crosses the network.
 */
export function useDonationInit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(args: DonationInitArgs): Promise<string | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/donations/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong — please try again.");
        return null;
      }
      return json.checkoutUrl as string;
    } catch {
      setError("Network error — please check your connection and try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { submit, loading, error };
}
