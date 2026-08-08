import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import AdminDashboard, { type DonationRow, type FundMovementRow } from "@/components/AdminDashboard";

export default async function AdminPage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-serif text-2xl text-indigo-950">Admin isn&apos;t available yet</h1>
        <p className="mt-3 text-sm text-ink-500">
          This demo is running without a connected Supabase project, so there are no real
          logins to check. Connect Supabase (see the README) to unlock /admin.
        </p>
      </main>
    );
  }

  const session = await requireRole("staff_admin", "finance_admin");
  if (!session) redirect("/login?next=/admin");

  const admin = createSupabaseAdminClient()!;
  const [{ data: halls }, { data: donations }, { data: fundMovements }] = await Promise.all([
    admin.from("halls").select("*").order("sort_order", { ascending: true }),
    admin
      .from("donations")
      .select("id, hall_id, donor_name, is_anonymous, amount, currency, status, created_at, halls(name)")
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("fund_movements")
      .select("id, hall_id, amount, currency, note, created_at, onchain_tx_hash, profiles(email), halls(name)")
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  return (
    <AdminDashboard
      role={session.profile.role}
      initialHalls={halls ?? []}
      initialDonations={(donations ?? []) as unknown as DonationRow[]}
      initialFundMovements={(fundMovements ?? []) as unknown as FundMovementRow[]}
    />
  );
}
