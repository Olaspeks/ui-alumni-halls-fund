import { isMockToken, decodeMockToken } from "@/lib/receiptToken";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import ReceiptCard, { type ReceiptCardData } from "@/components/ReceiptCard";

async function resolveReceipt(token: string): Promise<ReceiptCardData | null> {
  if (isMockToken(token)) {
    const payload = decodeMockToken(token);
    if (!payload || payload.status !== "success") return null;
    return {
      hallName: payload.hallName,
      hallSlug: payload.hallSlug,
      amount: payload.amount,
      currency: payload.currency,
      reference: payload.ref,
      createdAt: payload.createdAt,
      donorDisplayName: payload.donorName?.trim() || "Friend of UI",
      isAnonymous: payload.isAnonymous,
      onchainTxHash: null,
    };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  // Server-side lookup only, by exact unguessable token — never listable,
  // never exposed through a client-side RLS policy (see supabase/schema.sql).
  const { data } = await admin
    .from("donations")
    .select("*, halls(name, slug)")
    .eq("receipt_token", token)
    .eq("status", "success")
    .single();

  if (!data) return null;
  const hall = data.halls as unknown as { name: string; slug: string };

  return {
    hallName: hall.name,
    hallSlug: hall.slug,
    amount: data.amount,
    currency: data.currency,
    reference: data.provider_ref,
    createdAt: data.created_at,
    donorDisplayName: data.donor_name?.trim() || "Friend of UI",
    isAnonymous: data.is_anonymous,
    onchainTxHash: data.onchain_tx_hash,
  };
}

export default async function ReceiptPage({ params }: { params: { token: string } }) {
  const receipt = await resolveReceipt(params.token);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      {receipt ? (
        <ReceiptCard data={receipt} />
      ) : (
        <div className="mx-auto max-w-md border border-indigo-100 bg-white p-8 text-center shadow-card">
          <h1 className="font-serif text-xl text-indigo-950">Receipt not found</h1>
          <p className="mt-2 text-sm text-ink-500">
            This link may have expired or the donation is still being confirmed. If you just
            gave, check your email in a moment.
          </p>
        </div>
      )}
    </main>
  );
}
