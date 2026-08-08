import crypto from "node:crypto";
import { receiptTokenSecret } from "@/lib/config";
import type { Currency } from "@/lib/money";

/**
 * Self-contained, signed "mock mode" tokens.
 *
 * When Supabase isn't configured yet, there's nowhere to persist a
 * donation row — but the spec still requires the full public donor
 * journey (including a retrievable receipt) to work on a bare Vercel
 * deploy with zero database. So in mock mode, the donation's details
 * travel *inside* a signed token instead of a database row: the token
 * itself is the record. HMAC-SHA256 signing means a visitor can't forge
 * or inflate a donation amount by hand-editing the URL.
 *
 * These tokens are always prefixed "m." so /receipt/[token] can tell at
 * a glance whether to decode locally or look up a real Supabase row —
 * the two code paths never get confused with each other.
 */

export interface MockDonationPayload {
  ref: string;
  hallSlug: string;
  hallName: string;
  amount: number; // subunits
  currency: Currency;
  donorName: string | null;
  donorEmail: string;
  isAnonymous: boolean;
  provider: "paystack" | "stripe" | "mock";
  createdAt: string; // ISO
  status: "pending" | "success" | "failed";
}

function base64url(input: Buffer): string {
  return input.toString("base64url");
}

function sign(payload: string): string {
  return base64url(crypto.createHmac("sha256", receiptTokenSecret).update(payload).digest());
}

export function encodeMockToken(payload: MockDonationPayload): string {
  const json = JSON.stringify(payload);
  const body = base64url(Buffer.from(json, "utf8"));
  const sig = sign(body);
  return `m.${body}.${sig}`;
}

export function decodeMockToken(token: string): MockDonationPayload | null {
  if (!token.startsWith("m.")) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [, body, sig] = parts;

  const expectedSig = sign(body);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const json = Buffer.from(body, "base64url").toString("utf8");
    return JSON.parse(json) as MockDonationPayload;
  } catch {
    return null;
  }
}

export function isMockToken(token: string): boolean {
  return token.startsWith("m.");
}

export function generateRef(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(12).toString("hex")}`;
}
