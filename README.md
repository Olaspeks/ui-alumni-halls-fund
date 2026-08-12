# UI Alumni Halls Fund

A crowdfunding platform for University of Ibadan alumni to donate toward
renovating their halls of residence — Naira or US Dollar, with an
automatic email receipt, an admin dashboard for staff and finance
roles, and a blockchain confirmation stamp so anyone can independently
verify a hall's published total.

Donors never see or touch crypto anywhere in this app. The blockchain
piece is a one-way, after-the-fact confirmation stamp only.

## How mock mode works (read this first)

Every external service — Supabase, Paystack, Stripe, Resend, Turnstile,
the blockchain stamp — has a real implementation and a mock one. Which
one runs is decided **only** by whether that service's environment
variables are set (see `lib/config.ts`). Nothing else needs to change
in code to go from a fully-mocked local demo to a fully-live deployment.

Two things worth understanding up front:

- **With no Supabase configured**, the whole public donor journey still
  works end-to-end (pick a hall → guest → currency → give → mock
  checkout → thank-you → receipt), but there's nowhere to persist a
  database row. Instead, the pending donation's details travel inside a
  short-lived, HMAC-signed token through the URL (see
  `lib/receiptToken.ts`) — the token *is* the record. Hall progress
  numbers shown in this mode are static demo data (`lib/halls.ts`), not
  live totals.
- **`/admin` and `/account` always require a real Supabase project** —
  there's no meaningful way to mock "who's logged in," and that's by
  design (see the brief). Every other page works without one.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the full public giving flow works
immediately with zero configuration. `/admin` and `/account` will show a
friendly "connect Supabase" message until you set that up (next
section).

## Going live, one integration at a time

Copy `.env.example` to `.env.local` and fill in only what you're ready
to turn on — each row below is independent.

| Service | What it does here | Free tier | Where to get keys |
|---|---|---|---|
| **Supabase** | Database (donations, halls, admin logins, receipts), Auth, and realtime updates for the live gauge. | Generous free tier; Postgres + auth + realtime in one project. | [supabase.com](https://supabase.com) → New project → Project Settings → API |
| **Paystack** | Processes Naira donations. Test mode = fake-money test keys. | Free to integrate; per-transaction fee only on real charges. | [dashboard.paystack.com](https://dashboard.paystack.com) → Settings → API Keys & Webhooks |
| **Stripe** | Processes USD donations from diaspora alumni. Test mode = same idea. | Free to integrate; per-transaction fee only on real charges. | [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → API keys, and → Webhooks — add an endpoint at `/api/webhooks/stripe` and subscribe it to both `checkout.session.completed` **and** `checkout.session.expired` (the second one is what lets an abandoned/declined payment resolve to a clear "failed" status instead of sitting as pending forever) |
| **Resend** | Sends the "thanks — here's your receipt" email. | Free tier generous for this volume. | [resend.com](https://resend.com) → API Keys |
| **Cloudflare Turnstile** | Invisible bot check on the donation form. | Free. | [dash.cloudflare.com](https://dash.cloudflare.com) → Turnstile → Add site |
| **Testnet wallet + Polygon Amoy** | The backend's server wallet that stamps confirmed totals on-chain. | Free testnet, no real funds. | See [`contracts/README.md`](./contracts/README.md) |

### Setting up Supabase (required for `/admin` and `/account`)

1. Create a project at [supabase.com](https://supabase.com).
2. Project Settings → API → copy the Project URL, `anon` public key, and
   `service_role` secret key into `.env.local` as
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY`.
3. SQL Editor → New query → paste the entire contents of
   [`supabase/schema.sql`](./supabase/schema.sql) → Run. This creates
   every table, trigger, RLS policy, and seeds the 15 halls.
4. Restart `npm run dev` — the homepage now reads live data, and
   sign-in/sign-up work.

### Creating the first staff/finance admin accounts

There's deliberately no public "become an admin" page. To promote
someone:

1. Have them sign up as a normal alumnus (magic link is easiest) at
   `/login`, **or** create them directly in Supabase dashboard →
   Authentication → Users → Add user.
2. In the SQL Editor, run:
   ```sql
   update public.profiles set role = 'finance_admin' where email = 'dean@example.edu.ng';
   update public.profiles set role = 'staff_admin'   where email = 'staff@example.edu.ng';
   ```
3. They can now sign in at `/login` and will see an **Admin** link in
   the header.

### Deploying the smart contract

See [`contracts/README.md`](./contracts/README.md) — a separate,
self-contained Hardhat project so contract tooling never touches the
Next.js build. Takes about five minutes with a free testnet faucet.

## Deploying to Vercel (free)

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → sign in with GitHub → **New
   Project** → select this repo → **Deploy**. No configuration needed —
   it's a standard Next.js app.
3. You'll get a free `https://<project-name>.vercel.app` URL with HTTPS
   immediately. The full public donor journey (including a receipt)
   works on that URL right away, with zero real credentials — this is
   the link you can send the Dean today.
4. Add real env vars later: Vercel → your project → **Settings** →
   **Environment Variables** → paste each one from the table above →
   redeploy (Vercel does this automatically on env var changes, or
   trigger a manual redeploy from the Deployments tab).
5. A custom domain can be attached to the same project later — Settings
   → Domains → just a DNS change, no rebuild required.

Set `NEXT_PUBLIC_SITE_URL` to your real `https://<project>.vercel.app`
URL (or custom domain) once deployed — it's used in emailed receipt
links, so don't leave it as `localhost` in production.

## What still needs the Dean's sign-off before going fully live

- **Real fundraising goals per hall.** The goals currently in
  `supabase/schema.sql` (and the mock-mode fallback in `lib/halls.ts`)
  are placeholder figures — reasonable round numbers, not real budget
  estimates. Update the `halls` table (or re-run the seed with real
  numbers) before publicizing the live link.
- **Donation min/max limits.** `lib/money.ts` clamps donations to
  ₦100–₦10,000,000 and $1–$20,000 as a conservative placeholder — adjust
  to whatever the university's actual comfort range is.
- **The "from" email address** for receipts (`RECEIPT_FROM_EMAIL`) —
  currently a placeholder; needs a real domain verified in Resend.

## Project structure

```
app/                  Next.js App Router pages + API routes
  api/donations/       init + mock-confirm + status
  api/webhooks/         paystack + stripe (the only place a donation is
                         ever marked successful)
  api/admin/            fund-movements (finance_admin only) + dashboard
  admin/, account/, login/, receipt/[token]/, checkout/mock/[token]/
components/            UI components (Gauge, HallCard, DonationDialog,
                        AdminDashboard, ReceiptCard, ...)
hooks/                 Client-side "API hooks" bridging UI ↔ backend:
                        useDonationInit, useHallsRealtime, useAuthUser
lib/                   Server-side logic: config flags, money math,
                        validation, rate limiting, Supabase clients,
                        payment/email/turnstile/blockchain adapters
supabase/schema.sql    Full DB schema, RLS policies, triggers, seed data
contracts/             Self-contained Hardhat project (HallConfirmation.sol)
types/database.ts      Shared TypeScript types (Hall, Donation, ...)
```

## Security notes (what's already handled)

- Every webhook (Paystack, Stripe) verifies its signature before
  touching the database — a donation is *never* marked successful from
  a client redirect.
- Donation amounts are validated and clamped server-side; the client's
  requested amount is never trusted as-is.
- `/api/donations/init` is rate-limited per IP (in-memory — see the
  comment in `lib/rateLimit.ts` for the production caveat on serverless).
- All writes to `donations` and `fund_movements` happen server-side with
  the Supabase service-role key — there is no client-side insert/update
  policy for either table.
- Roles (`donor` / `staff_admin` / `finance_admin`) are stored in
  `profiles.role` and re-checked on every admin request server-side
  (`lib/auth/roles.ts`) — never trusted from the browser.
- The smart contract has zero payable functions and one `onlyOwner`
  write function — see the comment block in
  `contracts/contracts/HallConfirmation.sol`.

## A final summary of build decisions and judgment calls

See **[BUILD_NOTES.md](./BUILD_NOTES.md)** for the full list of
everything added or changed beyond the original spec, and why.
