import type { Metadata } from "next";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/config";
import AdminAccessGate from "@/components/AdminAccessGate";

export const metadata: Metadata = { title: "Command Center — UI Alumni Halls Fund" };

export default function AdminLoginPage() {
  // Real mode: there's no separate admin login — staff/finance admins
  // are invite-only (created directly in Supabase, see the README) and
  // sign in through the same /login as everyone else; /admin itself
  // checks their role server-side afterward. This page only exists as
  // a themed entry point for the mock preview below.
  if (isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-serif text-2xl text-indigo-950">Staff &amp; finance sign in</h1>
        <p className="mt-3 text-sm text-ink-500">
          Admin accounts are invite-only and use the same sign-in as everyone else — your role is
          checked automatically once you&apos;re signed in.
        </p>
        <Link
          href="/login?next=/admin"
          className="mt-6 inline-block bg-indigo-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-800"
        >
          Go to sign in
        </Link>
      </main>
    );
  }

  return <AdminAccessGate />;
}
