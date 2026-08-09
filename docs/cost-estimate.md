# UI Alumni Halls Fund — Cost to Go Live

*Prepared August 2026. All prices checked directly against each provider's
current pricing page at time of writing — verify before finalizing a
budget, as pricing can change.*

## Bottom line

**$0 fixed cost to launch a fully working version.** The realistic
recommended setup for an official university fundraising platform —
proper hosting tier included — comes to roughly **$20–65/month**, plus
a small percentage taken automatically out of each donation (standard
for any online payment processor, not specific to this build).

There are two ways to read the table below: the absolute minimum to
have everything technically working, and what's recommended for a
platform representing the university publicly.

---

## One-time costs

| Item | Cost | Notes |
|---|---|---|
| Domain name | **$10–15/year** | e.g. a `.org` domain. **Free alternative:** ask UI's IT/webmaster for a subdomain of the university's own domain (e.g. `give.ui.edu.ng`) — more official-looking and costs nothing beyond an internal request. |
| Everything else (dev, setup, deployment) | **$0** | No setup fees on any service used. |

## Monthly recurring costs

| Service | What it's for | Free tier | Recommended paid tier |
|---|---|---|---|
| **Hosting (Vercel)** | Serves the website | Free — but Vercel's free "Hobby" tier is licensed for **personal, non-commercial use only** per their terms | **$20/month** (Pro plan, per team member) — the correct tier for an institutional site like this |
| **Supabase** | Database, logins, live totals | Free: 500MB database, 50,000 monthly logins, 5GB bandwidth — comfortably enough for this project for a long time | $25/month (Pro) — only needed if it outgrows the free tier |
| **Resend** | Sends receipt emails | Free: 3,000 emails/month (100/day) | $20/month (covers 50,000/month) — only needed at higher donation volume |
| **Cloudflare Turnstile** | Bot protection on the donation form | Free, no limits | — |
| **FX rate lookup** (for the ₦/$ combined total) | Free, no key required, no realistic way to exceed the free limit at this traffic | — |

**Minimum realistic monthly cost: $20/month** (just Vercel Pro — the
other free tiers are genuinely sufficient at this scale).
**If it outgrows the free tiers: up to ~$65/month** (Vercel Pro +
Supabase Pro + Resend Pro).

## Variable costs — a percentage of each donation

This isn't a bill you pay; it's deducted automatically from each
donation by the payment processor, same as it would be anywhere else
donations are accepted by card.

| Provider | Fee |
|---|---|
| Paystack (Naira donations) | 1.5% + ₦100 per transaction (₦100 waived under ₦2,500; capped at ₦2,000 max), plus 7.5% VAT on the fee |
| Stripe (Dollar donations) | 2.9% + $0.30 per transaction |

*Example: a ₦25,000 Naira donation costs about ₦486 in fees (≈1.9%) —
the hall's recorded total reflects the full ₦25,000 given; the fee is
between Paystack and the university's settlement account, same as any
card payment.*

## Blockchain (confirmation stamp)

| Item | Cost |
|---|---|
| Testnet (current demo setup) | Free forever |
| Real mainnet deployment (recommended before public launch — see note below) | One-time: a few dollars of MATIC/POL for gas. Ongoing: well under **$5 total** for the entire campaign's lifetime — Polygon is extremely cheap per transaction |

**Note:** the demo currently uses Polygon's free *test* network, which
is fine for evaluation but would show "testnet" to anyone who clicks
"verify this total" — worth switching to the real network before this
goes out to alumni, at near-zero added cost.

---

## Two ways to launch

| | Bare minimum | Recommended |
|---|---|---|
| Hosting | Vercel Hobby (free, but against their terms for institutional use) | Vercel Pro — **$20/mo** |
| Database/Auth | Supabase Free | Supabase Free (upgrade only if it grows) |
| Email | Resend Free | Resend Free (upgrade only if it grows) |
| Domain | `.vercel.app` subdomain (free) | Own domain or a UI subdomain — **$0–15/yr** |
| Blockchain | Amoy testnet (free) | Polygon mainnet — **~$5 one-time** |
| **Monthly total** | **$0** | **~$20/month** |

---

## What this document doesn't cover

- Ongoing developer time for changes/maintenance after this initial
  build — not a hosting or service cost, a separate labor question.
- Any custom design/branding work beyond what's already built.
- Marketing or promotion of the campaign itself.
