import { NextRequest, NextResponse } from "next/server";
import { donationInitSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rateLimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { clampDonationAmount, majorToSubunits } from "@/lib/money";
import { findStaticHallBySlug } from "@/lib/halls";
import { isSupabaseAdminConfigured, isPaystackConfigured, isStripeConfigured, siteUrl } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { initPaystackTransaction } from "@/lib/payments/paystack";
import { initStripeCheckout } from "@/lib/payments/stripe";
import { encodeMockToken, generateRef } from "@/lib/receiptToken";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const rate = checkRateLimit(`donations:init:${ip}`);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests — please wait a moment and try again." },
      { status: 429, headers: rate.retryAfterSeconds ? { "Retry-After": String(rate.retryAfterSeconds) } : {} },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = donationInitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid donation request.", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const turnstileOk = await verifyTurnstileToken(input.turnstileToken, ip);
  if (!turnstileOk) {
    return NextResponse.json({ error: "Bot check failed — please try again." }, { status: 400 });
  }

  const amountSubunits = clampDonationAmount(majorToSubunits(input.amountMajor), input.currency);
  const donorName = input.isAnonymous ? null : input.donorName?.trim() || null;
  const reference = generateRef("ui");

  // ---------------------------------------------------------------
  // Mode A: Supabase (the database of record) isn't configured.
  // We deliberately never touch a real payment provider here, even if
  // Paystack/Stripe keys happen to be set — there would be nowhere to
  // durably record the money, and the DB is the single source of truth
  // for all money per the hard constraints. Always fall back to mock
  // checkout, driven by a signed self-contained token instead of a row.
  // ---------------------------------------------------------------
  if (!isSupabaseAdminConfigured) {
    const hall = findStaticHallBySlug(input.hallSlug);
    if (!hall) return NextResponse.json({ error: "Unknown hall." }, { status: 404 });

    const initToken = encodeMockToken({
      ref: reference,
      hallSlug: hall.slug,
      hallName: hall.name,
      amount: amountSubunits,
      currency: input.currency,
      donorName,
      donorEmail: input.donorEmail,
      isAnonymous: input.isAnonymous,
      provider: "mock",
      createdAt: new Date().toISOString(),
      status: "pending",
    });

    return NextResponse.json({ checkoutUrl: `/checkout/mock/${initToken}` });
  }

  // ---------------------------------------------------------------
  // Mode B: Supabase is configured — insert the real pending row first,
  // then try to hand off to a real payment provider for this currency.
  // ---------------------------------------------------------------
  const admin = createSupabaseAdminClient()!;

  const { data: hall, error: hallErr } = await admin
    .from("halls")
    .select("*")
    .eq("slug", input.hallSlug)
    .single();

  if (hallErr || !hall) return NextResponse.json({ error: "Unknown hall." }, { status: 404 });

  const provider = input.currency === "NGN" ? "paystack" : "stripe";
  const providerReady = input.currency === "NGN" ? isPaystackConfigured : isStripeConfigured;

  const { data: donation, error: insertErr } = await admin
    .from("donations")
    .insert({
      hall_id: hall.id,
      donor_id: null, // set below if the requester is logged in
      donor_name: donorName,
      donor_email: input.donorEmail,
      amount: amountSubunits,
      currency: input.currency,
      payment_provider: providerReady ? provider : "mock",
      provider_ref: reference,
      status: "pending",
      is_anonymous: input.isAnonymous,
    })
    .select()
    .single();

  if (insertErr || !donation) {
    console.error("[donations/init] insert failed:", insertErr);
    return NextResponse.json({ error: "Could not start donation." }, { status: 500 });
  }

  // Best-effort: attach donor_id if the requester has a Supabase session.
  // (Not required — guests never need one.)
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = createSupabaseServerClient();
    const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
    if (data?.user) {
      await admin.from("donations").update({ donor_id: data.user.id }).eq("id", donation.id);
    }
  } catch {
    // Non-fatal — donation still proceeds as a guest gift.
  }

  if (!providerReady) {
    return NextResponse.json({ checkoutUrl: `/checkout/mock/${donation.id}` });
  }

  try {
    if (input.currency === "NGN") {
      const result = await initPaystackTransaction({
        amountSubunits,
        currency: "NGN",
        email: input.donorEmail,
        reference,
        callbackUrl: `${siteUrl}/thank-you?donation=${donation.id}`,
        metadata: { hallName: hall.name, hallSlug: hall.slug, donationId: donation.id },
      });
      return NextResponse.json({ checkoutUrl: result.checkoutUrl });
    } else {
      const result = await initStripeCheckout(
        {
          amountSubunits,
          currency: "USD",
          email: input.donorEmail,
          reference,
          callbackUrl: `${siteUrl}/thank-you?donation=${donation.id}`,
          metadata: { hallName: hall.name, hallSlug: hall.slug, donationId: donation.id },
        },
        `${siteUrl}/thank-you?donation=${donation.id}`,
        `${siteUrl}/#${hall.slug}`,
      );
      return NextResponse.json({ checkoutUrl: result.checkoutUrl });
    }
  } catch (err) {
    console.error(`[donations/init] ${provider} init failed, falling back to mock checkout:`, err);
    return NextResponse.json({ checkoutUrl: `/checkout/mock/${donation.id}` });
  }
}
