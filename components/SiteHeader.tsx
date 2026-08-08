"use client";

import Link from "next/link";
import { useAuthUser } from "@/hooks/useAuthUser";

export default function SiteHeader() {
  const { loading, profile, email, signOut } = useAuthUser();

  return (
    <header className="border-b border-indigo-100 bg-indigo-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-[10px] font-medium uppercase tracking-widest text-gold-700">University of Ibadan</span>
          <span className="font-serif text-lg text-indigo-950">Alumni Halls Fund</span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          {!loading && !email && (
            <Link href="/login" className="font-medium text-indigo-900 hover:underline">
              Sign in
            </Link>
          )}
          {!loading && email && profile?.role === "donor" && (
            <Link href="/account" className="font-medium text-indigo-900 hover:underline">
              My account
            </Link>
          )}
          {!loading && email && (profile?.role === "staff_admin" || profile?.role === "finance_admin") && (
            <Link href="/admin" className="font-medium text-indigo-900 hover:underline">
              Admin
            </Link>
          )}
          {!loading && email && (
            <button onClick={() => signOut()} className="text-ink-500 hover:text-indigo-900">
              Sign out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
