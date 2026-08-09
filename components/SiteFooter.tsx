import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-indigo-100 bg-indigo-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p>UI Alumni Halls Fund — an independent giving platform for University of Ibadan alumni.</p>
          <p className="mt-1">Every confirmed hall total is stamped on a public blockchain ledger for independent verification.</p>
        </div>
        <Link href="/support" className="shrink-0 font-medium text-indigo-900 underline decoration-gold-500 underline-offset-2">
          Support &amp; FAQ
        </Link>
      </div>
    </footer>
  );
}
