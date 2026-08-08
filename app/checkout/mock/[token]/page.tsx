import { decodeMockToken, isMockToken } from "@/lib/receiptToken";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/money";
import MockCheckout from "./MockCheckout";

interface Summary {
  hallName: string;
  amount: number;
  currency: "NGN" | "USD";
}

async function resolveSummary(token: string): Promise<Summary | null> {
  if (isMockToken(token)) {
    const payload = decodeMockToken(token);
    if (!payload) return null;
    return { hallName: payload.hallName, amount: payload.amount, currency: payload.currency };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const { data } = await admin.from("donations").select("amount, currency, halls(name)").eq("id", token).single();
  if (!data) return null;
  const hall = data.halls as unknown as { name: string } | null;
  return { hallName: hall?.name ?? "UI Alumni Halls Fund", amount: data.amount, currency: data.currency };
}

export default async function MockCheckoutPage({ params }: { params: { token: string } }) {
  const summary = await resolveSummary(params.token);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="border border-indigo-100 bg-white shadow-card">
        <div className="border-b border-dashed border-indigo-200 bg-indigo-50 px-6 py-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-500">
            Mock checkout — no real payment provider is configured for this currency
          </p>
        </div>
        <div className="px-6 py-6">
          <h1 className="font-serif text-2xl text-indigo-950">Simulate payment</h1>
          {summary ? (
            <p className="mt-2 text-sm text-ink-700">
              You are about to give{" "}
              <strong className="font-mono">{formatMoney(summary.amount, summary.currency)}</strong> to{" "}
              <strong>{summary.hallName}</strong>.
            </p>
          ) : (
            <p className="mt-2 text-sm text-red-700">This checkout link is invalid or has expired.</p>
          )}

          {summary && <MockCheckout token={params.token} />}
        </div>
      </div>
    </main>
  );
}
