import PendingConfirmation from "./PendingConfirmation";

export default function ThankYouPage({
  searchParams,
}: {
  searchParams: { receipt?: string; donation?: string };
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-[11px] font-medium uppercase tracking-widest text-gold-700">Thank you</p>
      <h1 className="mt-2 font-serif text-4xl text-indigo-950">Your gift means a great deal.</h1>
      <p className="mt-4 text-ink-500">
        A receipt is on its way to your inbox. You can also view it right here.
      </p>

      {searchParams.receipt && (
        <a
          href={searchParams.receipt}
          className="mt-6 inline-block bg-gold-500 px-5 py-2.5 text-sm font-semibold text-indigo-950 hover:bg-gold-400"
        >
          View your receipt
        </a>
      )}

      {searchParams.donation && !searchParams.receipt && (
        <PendingConfirmation donationId={searchParams.donation} />
      )}

      <a href="/" className="mt-8 text-sm text-ink-500 underline decoration-gold-500 underline-offset-2">
        Back to all halls
      </a>
    </main>
  );
}
