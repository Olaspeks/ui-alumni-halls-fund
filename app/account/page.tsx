import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import StatusBadge from "@/components/StatusBadge";

export default async function AccountPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login?next=/account");

  // Regular (non-admin) server client — RLS enforces "own rows only" here,
  // not an application-level filter, so this can't accidentally leak
  // another donor's history even if the query below were ever loosened.
  const supabase = createSupabaseServerClient()!;
  const { data: donations } = await supabase
    .from("donations")
    .select("*, halls(name, slug)")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="font-serif text-3xl text-indigo-950">My giving</h1>
      <p className="mt-1 text-sm text-ink-500">Signed in as {session.email}</p>

      <div className="mt-8 divide-y divide-indigo-100 border border-indigo-100 bg-white">
        {(!donations || donations.length === 0) && (
          <p className="p-6 text-sm text-ink-500">
            No donations yet —{" "}
            <Link href="/" className="underline decoration-gold-500 underline-offset-2">
              give to a hall
            </Link>
            .
          </p>
        )}
        {donations?.map((d) => {
          const hall = d.halls as unknown as { name: string; slug: string } | null;
          return (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-indigo-950">{hall?.name ?? "Unknown hall"}</p>
                <p className="font-mono text-xs text-ink-500">
                  {new Date(d.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                  {d.is_anonymous ? " · given anonymously (public view only)" : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={d.status} />
                <span className="font-mono text-sm text-indigo-950">{formatMoney(d.amount, d.currency)}</span>
                {d.status === "success" && (
                  <Link
                    href={`/receipt/${d.receipt_token}`}
                    className="text-xs font-medium text-indigo-900 underline decoration-gold-500 underline-offset-2"
                  >
                    Receipt
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
