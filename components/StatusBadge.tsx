import type { DonationStatus } from "@/types/database";

const STYLES: Record<DonationStatus, string> = {
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  pending: "bg-gold-50 text-gold-800 border-gold-200",
  failed: "bg-red-50 text-red-800 border-red-200",
};

export default function StatusBadge({ status }: { status: DonationStatus }) {
  return (
    <span className={`inline-block border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${STYLES[status]}`}>
      {status}
    </span>
  );
}
