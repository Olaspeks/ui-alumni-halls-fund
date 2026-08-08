import { chainExplorerTxBaseUrl } from "@/lib/config";

/**
 * The actual trust/transparency feature for alumni: a genuinely
 * clickable link to the block explorer transaction that stamped this
 * hall's total, not a decorative badge. Renders nothing until a real
 * tx hash exists (mock mode logs a stamp but has no real hash to link).
 */
export default function VerifyOnChainLink({ txHash }: { txHash: string | null | undefined }) {
  if (!txHash) return null;
  const href = `${chainExplorerTxBaseUrl}${txHash}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 underline decoration-gold-500 decoration-2 underline-offset-2 hover:text-indigo-900"
    >
      Verify this total ↗
    </a>
  );
}
