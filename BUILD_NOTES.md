# Build notes — judgment calls made beyond the spec

Per the brief: "wherever you see a way to make this more secure, faster,
cheaper to run, or simpler to use — do it, even if I didn't ask for it
explicitly." Here's everything added, changed, or decided beyond a
literal reading of the spec, and why.

## Framework version

**Built on Next.js 14.2.x, not the latest 16.x** that `create-next-app`
would grab by default. This was a deliberate pin, not an oversight — the
spec explicitly calls for "Next.js 14 (App Router)," and Next 15+
changed `params`/`cookies()`/`headers()` from synchronous to
Promise-based across every route and page, which is exactly the kind of
churn you don't want touching a build this security-sensitive (webhook
signature checks, RLS, role gating) in one pass. Worth revisiting for a
production build once the team is ready to re-verify against a newer
version.

## Mock mode is stateless and signed, not just "fake data"

The spec requires the entire public donor journey — including a
retrievable receipt — to work on a bare Vercel deploy with **zero**
services configured, not just locally. A Vercel serverless function has
no persistent memory between requests, so an in-memory "pretend
database" wouldn't actually survive the redirect-to-checkout-and-back
flow in production. Instead, when Supabase isn't configured, a pending
donation's full details travel inside an HMAC-SHA256-signed token
(`lib/receiptToken.ts`) through the checkout URL — the token *is* the
record, and it can't be forged into claiming a fake or inflated amount
because the signature is checked on every read. This was the one piece
of real engineering judgment the spec's constraints forced, and it's
probably the most load-bearing decision in the whole build.

## Never call a real payment provider without a database, even if keys exist

If Supabase isn't configured but Paystack/Stripe keys somehow are,
`/api/donations/init` still forces mock checkout rather than taking real
money. Charging a real card with nowhere to durably record the
donation would directly violate the spec's own "the database is the
single source of truth for all money" constraint. This isn't a
realistic deployment shape, but it's a one-line guard worth having.

## Rate limiting is in-memory, with the tradeoff documented, not hidden

Upstash Redis or Vercel KV is the "correct" production answer for a
rate limiter that works across serverless instances, but adding a
required extra service conflicts with "zero paid services provisioned
to demo." Shipped an in-memory sliding-window limiter instead, with a
comment in `lib/rateLimit.ts` flagging exactly where and why to swap it
before expecting real traffic.

## Combined homepage total: side-by-side, not FX-converted

The spec offered a choice: show NGN/USD side by side, or convert to one
figure with an explicit, clearly-labeled-as-approximate FX rate. Went
with side-by-side (the spec's own preferred option) — it's strictly
safer (no stale/wrong exchange rate ever silently understates or
overstates the campaign total) and removes an entire config value and
its staleness problem.

## Realtime is on `halls`, not a public donations feed

Postgres logical replication (which Supabase Realtime's `postgres_changes`
relies on) can only publish base tables, not views — so the
`public_donations` view (kept in the schema for a future public feed)
can't be added to the realtime publication, and I didn't try to force
it. The spec's actual realtime requirement — "gauge animates smoothly
and updates live" — only needs the `halls` table, which is realtime-enabled
and has a public RLS read policy. The admin recent-donations feed
fetches on load and after actions instead of subscribing live, since
the spec didn't ask for realtime there specifically and the donations
table has no public RLS policy to subscribe through anyway (client-side
subscriptions are RLS-scoped, same as any other query).

## Guest receipt lookup bypasses RLS deliberately, server-side only

RLS alone can't express "readable by exact token match, never listable"
— a `using (true)` policy that only *feels* safe because queries happen
to filter by token would still allow a full table scan from any
authenticated Supabase client. `/receipt/[token]` instead does the
lookup server-side with the service-role key, filtered by an exact,
cryptographically-random token equality check. RLS still fully protects
the `donations` table from any other client-side access path.

## Idempotent webhook handling

Both webhook routes (and the underlying `finalizeDonationSuccess`) treat
a second delivery of the same success event as a no-op rather than
double-crediting a hall's total — guarded with a `status = 'pending'`
condition on the update. Payment providers retry webhooks; this wasn't
explicitly asked for but is table stakes for a "money is correct"
system.

## Chain stamp failures never surface as donation failures

`stampConfirmation()` catches its own errors and always returns a
result object rather than throwing — callers fire it without awaiting
and simply skip persisting a tx hash if it fails. This was implied by
"a slow or failed chain call must never delay or break the donor's
payment confirmation" but worth calling out as an explicit design
choice: a donor's receipt and DB record are complete and correct
*before* the chain call is even attempted.

## Fonts: system stacks, not next/font/google

Originally built with next/font/google (Fraunces/Manrope/IBM Plex Mono).
Verifying the build in this session, `npm run build` failed
deterministically on `fonts.gstatic.com`/`fonts.googleapis.com` — TCP
connects, but the TLS handshake resets every single time across many
retries, on a network where `registry.npmjs.org` worked fine. That's the
signature of a filtered host, not transient flakiness, and it's not a
risk specific to this sandbox — plenty of CI runners and corporate
networks filter Google Fonts the same way. Rather than ship a build
that's a coin flip depending on the network it's built on, switched to
system font stacks (`tailwind.config.ts`) that keep the same three
roles — editorial serif for headings, clean sans for body, monospace
for currency — with zero build-time network dependency. `npm run build`
and `contracts`' `npm run compile` both verified clean after the switch
(see the end of this file). Swapping back to real webfonts on a network
that can reach Google Fonts is a small, isolated change — the comment
above `fontFamily` in `tailwind.config.ts` spells out exactly what to
change and nothing else needs to move.

## Design

- Custom indigo/gold Tailwind palette (not the default Tailwind indigo,
  which trends purple/generic) — see `tailwind.config.ts`. Sharp
  hairline borders and flat fields throughout instead of soft shadows
  or gradients, per the "not maximalist" and "no gradient soup"
  direction.
- Fraunces (serif) for headings/hall names, Manrope (sans) for body,
  IBM Plex Mono for every currency figure — chosen for a distinct,
  slightly editorial character rather than defaulting to Inter/system
  fonts everywhere.
- The gauge fill uses SVG `pathLength="100"` with
  `stroke-dasharray`/`stroke-dashoffset`, which sidesteps writing
  per-percentage arc-endpoint trigonometry for the animated fill itself
  while still hand-deriving the tick marks and arc geometry from first
  principles (`components/Gauge.tsx`) — kept the actual barometer-dial
  shape (270° sweep, tick marks, filling arc) rather than substituting
  a plain circular progress ring, per the "signature visual" direction.

## Things intentionally left as follow-ups, not silently skipped

- **Donation limits and hall fundraising goals are placeholder
  figures.** Flagged explicitly in the README's "needs Dean's sign-off"
  section rather than presented as real numbers.
- **The Solidity contract is written, compiles against the pinned
  0.8.24 toolchain, and has a deploy script — but hasn't been deployed
  to a live testnet**, since that requires a funded wallet only a human
  can create (a faucet claim + a private key I shouldn't be generating
  unsupervised). `contracts/README.md` covers the five-minute manual
  step.
- **Paystack/Stripe/Resend/Turnstile integrations are written against
  each provider's real API and webhook-verification scheme correctly,
  but untested against a live sandbox** — there were no API keys to test
  against in this session. The mock-mode paths (which don't depend on
  reaching any external service) were the ones actually exercised here.

## What was actually verified in this session

- `npm run typecheck` (root app) — clean.
- `npm run build` (root app) — clean production build, all 18 routes
  compile (static + dynamic), middleware bundles correctly.
- `npm run compile` (contracts) — `HallConfirmation.sol` compiles
  against solc 0.8.24 with no warnings.
- `npm run start` + a live smoke test against the running server in full
  mock mode (no env vars set): `/`, `/login`, `/admin`, `/thank-you`,
  and `/account` (correctly redirects to `/login` unauthenticated) all
  return the expected response — and the full donation loop was
  exercised end-to-end over HTTP: `POST /api/donations/init` → signed
  mock-checkout token → `POST /api/donations/mock-confirm` → `GET
  /receipt/[token]` rendered the correct donor, hall, and amount.
- Not exercised: any code path that requires real Supabase/Paystack/
  Stripe/Resend/Turnstile/chain credentials, since none were available
  in this session — see the integration-by-integration caveat above.
