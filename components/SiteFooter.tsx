import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-indigo-100 bg-indigo-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-ink-300">Built by alumni, for the halls that raised us.</p>
        <div className="flex shrink-0 gap-4">
          <Link href="/admin/login" className="font-medium text-indigo-900 underline decoration-gold-500 underline-offset-2">
            Staff &amp; finance
          </Link>
          <Link href="/support" className="font-medium text-indigo-900 underline decoration-gold-500 underline-offset-2">
            Support &amp; FAQ
          </Link>
        </div>
      </div>
    </footer>
  );
}
