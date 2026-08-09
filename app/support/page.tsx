import type { Metadata } from "next";
import { supportEmail } from "@/lib/config";

export const metadata: Metadata = { title: "Support — UI Alumni Halls Fund" };

const FAQS: { q: string; a: string }[] = [
  {
    q: "I gave, but I haven't received a receipt email.",
    a: "First, check spam/junk — automated receipts sometimes land there. You can also view or print your receipt any time from the link on the thank-you page after giving, or from My Account if you're signed in. (If this site is still running in demo mode, email sending is switched off on purpose — the receipt is still viewable in-app, it just isn't emailed yet.)",
  },
  {
    q: "Is my card information safe?",
    a: "Yes. Card details are entered directly on Paystack's or Stripe's own secure checkout page, never on this site — we never see or store your card number.",
  },
  {
    q: "Can I give without creating an account?",
    a: "Yes. Giving as a guest is fully supported — you'll still get a receipt by email, and a link to view it, without ever signing up.",
  },
  {
    q: "What does \"give anonymously\" actually hide?",
    a: "It hides your name from the public hall pages only. Your gift is still tied to your own receipt and to the university's internal records — anonymity here means \"hidden from public view,\" not \"untracked.\"",
  },
  {
    q: "How can I check a hall's total hasn't been altered?",
    a: "Every confirmed total is stamped on a public blockchain ledger the moment it changes. Click \"Verify this total\" next to any hall's figure to see the independent, tamper-evident record for yourself.",
  },
  {
    q: "I gave in the wrong currency, or need a correction.",
    a: `Naira and Dollar gifts are tracked as separate totals, so please make sure you pick the right one before giving. For anything that needs correcting after the fact, contact us below.`,
  },
];

export default function SupportPage() {
  return (
    <main className="support-page-scope mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <p className="text-[11px] font-medium uppercase tracking-widest text-gold-700">We&apos;re here to help</p>
      <h1 className="mt-1 font-serif text-3xl text-indigo-950 sm:text-4xl">Support &amp; FAQ</h1>
      <p className="mt-3 text-sm text-ink-500">
        Answers to the most common questions. If yours isn&apos;t here, reach us directly below.
      </p>

      <div className="mt-8 divide-y divide-indigo-100 border border-indigo-100 bg-white">
        {FAQS.map((item) => (
          <details key={item.q} className="group px-5 py-4">
            <summary className="cursor-pointer list-none font-medium text-indigo-950 marker:content-none">
              <span className="mr-2 inline-block text-gold-600 transition-transform group-open:rotate-45">+</span>
              {item.q}
            </summary>
            <p className="mt-2 pl-5 text-sm leading-relaxed text-ink-500">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-10 border border-indigo-100 bg-indigo-50 p-6">
        <h2 className="font-serif text-lg text-indigo-950">Still need help?</h2>
        <p className="mt-2 text-sm text-ink-700">
          Email us at{" "}
          <a href={`mailto:${supportEmail}`} className="font-medium text-indigo-900 underline decoration-gold-500 underline-offset-2">
            {supportEmail}
          </a>{" "}
          and we&apos;ll get back to you as soon as we can.
        </p>
      </div>
    </main>
  );
}
