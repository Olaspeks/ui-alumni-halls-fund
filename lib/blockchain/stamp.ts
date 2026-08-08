import "server-only";
import { ethers } from "ethers";
import { isChainConfigured } from "@/lib/config";
import { HALL_CONFIRMATION_ABI } from "./abi";
import type { Currency } from "@/lib/money";

export interface StampResult {
  stamped: boolean;
  mocked: boolean;
  txHash: string | null;
  error?: string;
}

/**
 * Calls the confirmation contract's single write function. This is the
 * ONLY place the backend talks to the chain.
 *
 * Deliberately fire-and-forget by design (per the hard constraints): the
 * contract only ever reads a confirmed total and stamps it after the
 * fact, so a slow or unreachable chain must never delay or break a
 * donor's payment confirmation. Call sites should NOT `await` this
 * before responding to the webhook/API caller — call it, let it run, and
 * persist the resulting tx hash asynchronously (see the webhook routes).
 */
export async function stampConfirmation(params: {
  hallSlug: string;
  currency: Currency;
  totalSubunits: number;
  note: string;
}): Promise<StampResult> {
  if (!isChainConfigured) {
    console.log(
      `[mock chain] Would stamp ${params.hallSlug} (${params.currency}) total=${params.totalSubunits}: ${params.note}`,
    );
    return { stamped: false, mocked: true, txHash: null };
  }

  try {
    const provider = new ethers.JsonRpcProvider(process.env.CHAIN_RPC_URL);
    const wallet = new ethers.Wallet(process.env.CHAIN_PRIVATE_KEY!, provider);
    const contract = new ethers.Contract(
      process.env.CHAIN_CONTRACT_ADDRESS!,
      HALL_CONFIRMATION_ABI,
      wallet,
    );

    const tx = await contract.confirmTotal(
      params.hallSlug,
      params.currency,
      BigInt(params.totalSubunits),
      params.note,
    );
    const receipt = await tx.wait(1);

    return { stamped: true, mocked: false, txHash: receipt?.hash ?? tx.hash };
  } catch (err) {
    console.error("[chain] confirmTotal call failed (non-fatal):", err);
    return {
      stamped: false,
      mocked: false,
      txHash: null,
      error: err instanceof Error ? err.message : "unknown chain error",
    };
  }
}

/**
 * Fire-and-forget wrapper: swallows the result, only logs. Use this at
 * call sites that must never wait on chain confirmation before
 * responding (webhooks, fund-movement inserts). Where the resulting
 * hash needs to be persisted, prefer awaiting stampConfirmation()
 * directly in a code path that has already sent its HTTP response, or
 * accept an eventually-consistent tx hash.
 */
export function stampConfirmationInBackground(params: {
  hallSlug: string;
  currency: Currency;
  totalSubunits: number;
  note: string;
  onResult?: (result: StampResult) => void | Promise<void>;
}): void {
  stampConfirmation(params)
    .then((result) => params.onResult?.(result))
    .catch((err) => console.error("[chain] background stamp failed:", err));
}
