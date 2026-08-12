import type { Hall } from "@/types/database";

/**
 * Static fallback hall list, used only when Supabase isn't configured yet
 * (see lib/config.ts#isSupabaseConfigured). Mirrors supabase/schema.sql's
 * seed data exactly, including placeholder "raised" progress purely for
 * a believable demo — mock mode has no database, so there is nowhere to
 * persist real running totals. This list stops being read the moment
 * Supabase env vars are set; halls then come live from the `halls` table
 * instead, with real per-donation totals and realtime updates.
 *
 * All 15 real, confirmed UI hall names.
 */
export const STATIC_HALLS: Hall[] = [
  mk("Mellanby Hall", "mellanby-hall", "One of UI's founding halls, home to generations of alumni.", 1, false, 5_000_000_00, 1_450_000_00, 30_000_00, 8_200_00),
  mk("Tedder Hall", "tedder-hall", "Historic hall with a long record of student leadership.", 2, false, 5_000_000_00, 2_100_000_00, 30_000_00, 11_000_00),
  mk("Kuti Hall", "kuti-hall", "Named for the Kuti family's legacy at the university.", 3, false, 5_000_000_00, 900_000_00, 30_000_00, 5_400_00),
  mk("Sultan Bello Hall", "sultan-bello-hall", "A landmark residence on the UI campus.", 4, false, 5_000_000_00, 1_780_000_00, 30_000_00, 9_100_00),
  mk("Nnamdi Azikiwe Hall (Zik Hall)", "zik-hall", "Named for Nigeria's first president.", 5, false, 5_000_000_00, 2_650_000_00, 30_000_00, 14_300_00),
  mk("Independence Hall", "independence-hall", "One of the largest halls of residence at UI.", 6, false, 6_000_000_00, 3_100_000_00, 36_000_00, 17_800_00),
  mk("Queen Elizabeth II Hall", "queen-elizabeth-ii-hall", "A historic hall for female students.", 7, false, 5_000_000_00, 1_250_000_00, 30_000_00, 6_700_00),
  mk("Queen Idia Hall", "queen-idia-hall", "Named for the celebrated Benin queen mother.", 8, false, 5_000_000_00, 1_020_000_00, 30_000_00, 4_900_00),
  mk("Obafemi Awolowo Hall", "obafemi-awolowo-hall", "Named for the statesman and first premier of the Western Region.", 9, false, 5_000_000_00, 2_940_000_00, 30_000_00, 15_600_00),
  mk("Tafawa Balewa Hall", "tafawa-balewa-hall", "Named for Nigeria's first prime minister.", 10, false, 5_000_000_00, 1_610_000_00, 30_000_00, 8_800_00),
  mk("Alexander Brown Hall", "alexander-brown-hall", "A postgraduate hall of residence.", 11, false, 4_000_000_00, 860_000_00, 24_000_00, 4_100_00),
  mk("Idia Hall", "idia-hall", "A women's hall of residence at UI.", 12, false, 5_000_000_00, 1_390_000_00, 30_000_00, 7_300_00),
  mk("Abdulsalami Abubakar Hall", "abdulsalami-abubakar-hall", "Named for the former Nigerian head of state.", 13, false, 5_000_000_00, 720_000_00, 30_000_00, 3_600_00),
  mk("Ayodele Falase Hall", "ayodele-falase-hall", "A hall of residence at the University of Ibadan.", 14, false, 4_000_000_00, 310_000_00, 24_000_00, 1_800_00),
  mk("Adetoun Ogunsheye Hall", "adetoun-ogunsheye-hall", "A hall of residence at the University of Ibadan.", 15, false, 4_000_000_00, 260_000_00, 24_000_00, 1_400_00),
];

function mk(
  name: string,
  slug: string,
  blurb: string,
  sort_order: number,
  is_placeholder: boolean,
  goal_kobo: number,
  raised_kobo: number,
  goal_cents: number,
  raised_cents: number,
): Hall {
  return {
    id: `static-${slug}`,
    name,
    slug,
    blurb,
    photo_url: null,
    sort_order,
    is_placeholder,
    goal_kobo,
    raised_kobo,
    goal_cents,
    raised_cents,
    onchain_ngn_tx_hash: null,
    onchain_usd_tx_hash: null,
    created_at: new Date().toISOString(),
  };
}

export function findStaticHallBySlug(slug: string): Hall | undefined {
  return STATIC_HALLS.find((h) => h.slug === slug);
}
