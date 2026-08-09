import type { DonationRow, FundMovementRow } from "@/components/AdminDashboard";

/**
 * Fabricated data for the admin "command center" preview
 * (components/AdminCommandCenter.tsx), shown only when Supabase isn't
 * configured. None of this is persisted or real — it exists so the
 * Dean/finance team can see the intended shape of the real dashboard
 * before any accounts exist. Swap-over to real data happens automatically
 * the moment Supabase is connected (app/admin/page.tsx branches on
 * isSupabaseConfigured, same pattern as everywhere else in mock mode).
 */

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

function fakeTxHash(seed: string): string {
  // Deterministic-looking hex string, not a real transaction.
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  let hex = "";
  let x = h || 1;
  for (let i = 0; i < 64; i++) {
    x = (x * 1103515245 + 12345) >>> 0;
    hex += (x % 16).toString(16);
  }
  return `0x${hex}`;
}

export const MOCK_DONATIONS: DonationRow[] = [
  { id: "mock-d1", hall_id: "static-zik-hall", donor_name: "Bowie A.", is_anonymous: false, amount: 25_000_00, currency: "NGN", status: "success", created_at: hoursAgo(2), halls: { name: "Nnamdi Azikiwe Hall (Zik Hall)" } },
  { id: "mock-d2", hall_id: "static-mellanby-hall", donor_name: null, is_anonymous: true, amount: 100_000_00, currency: "NGN", status: "success", created_at: hoursAgo(5), halls: { name: "Mellanby Hall" } },
  { id: "mock-d3", hall_id: "static-independence-hall", donor_name: "Chinwe O.", is_anonymous: false, amount: 200_00, currency: "USD", status: "success", created_at: hoursAgo(9), halls: { name: "Independence Hall" } },
  { id: "mock-d4", hall_id: "static-obafemi-awolowo-hall", donor_name: "Tunde F.", is_anonymous: false, amount: 50_000_00, currency: "NGN", status: "pending", created_at: hoursAgo(11), halls: { name: "Obafemi Awolowo Hall" } },
  { id: "mock-d5", hall_id: "static-tedder-hall", donor_name: null, is_anonymous: true, amount: 500_00, currency: "USD", status: "success", created_at: hoursAgo(14), halls: { name: "Tedder Hall" } },
  { id: "mock-d6", hall_id: "static-queen-idia-hall", donor_name: "Femi A.", is_anonymous: false, amount: 15_000_00, currency: "NGN", status: "failed", created_at: hoursAgo(20), halls: { name: "Queen Idia Hall" } },
  { id: "mock-d7", hall_id: "static-kuti-hall", donor_name: "Ngozi E.", is_anonymous: false, amount: 75_000_00, currency: "NGN", status: "success", created_at: hoursAgo(26), halls: { name: "Kuti Hall" } },
  { id: "mock-d8", hall_id: "static-sultan-bello-hall", donor_name: "Bowie A.", is_anonymous: false, amount: 30_00, currency: "USD", status: "success", created_at: hoursAgo(31), halls: { name: "Sultan Bello Hall" } },
  { id: "mock-d9", hall_id: "static-idia-hall", donor_name: null, is_anonymous: true, amount: 40_000_00, currency: "NGN", status: "success", created_at: hoursAgo(40), halls: { name: "Idia Hall" } },
  { id: "mock-d10", hall_id: "static-tafawa-balewa-hall", donor_name: "Yusuf B.", is_anonymous: false, amount: 120_00, currency: "USD", status: "pending", created_at: hoursAgo(48), halls: { name: "Tafawa Balewa Hall" } },
];

export const MOCK_FUND_MOVEMENTS: FundMovementRow[] = [
  {
    id: "mock-fm1",
    hall_id: "static-mellanby-hall",
    amount: 1_800_000_00,
    currency: "NGN",
    note: "Moved from Paystack balance to university renovation account for Mellanby Hall roofing.",
    created_at: hoursAgo(30),
    onchain_tx_hash: fakeTxHash("mellanby-1"),
    profiles: { email: "dean@ui.edu.ng" },
    halls: { name: "Mellanby Hall" },
  },
  {
    id: "mock-fm2",
    hall_id: "static-zik-hall",
    amount: 2_100_00,
    currency: "USD",
    note: "Diaspora USD balance settled to renovation contractor for Zik Hall plumbing.",
    created_at: hoursAgo(55),
    onchain_tx_hash: fakeTxHash("zik-1"),
    profiles: { email: "finance@ui.edu.ng" },
    halls: { name: "Nnamdi Azikiwe Hall (Zik Hall)" },
  },
  {
    id: "mock-fm3",
    hall_id: "static-independence-hall",
    amount: 2_650_000_00,
    currency: "NGN",
    note: "Independence Hall — electrical rewiring, phase 1 of 3.",
    created_at: hoursAgo(80),
    onchain_tx_hash: fakeTxHash("independence-1"),
    profiles: { email: "finance@ui.edu.ng" },
    halls: { name: "Independence Hall" },
  },
];

export const MOCK_ADMIN_STATS = {
  totalDonors: 342,
  hallsFullyFunded: 2,
  avgDonationNgn: 42_500_00,
};

/** One alumnus's own giving history, for the /account demo persona. */
export interface MockBowieDonation {
  id: string;
  hallName: string;
  hallSlug: string;
  amount: number;
  currency: "NGN" | "USD";
  status: "success" | "pending" | "failed";
  createdAt: string;
  reference: string;
  txHash: string | null;
}

export const MOCK_BOWIE_DONATIONS: MockBowieDonation[] = [
  {
    id: "bowie-1",
    hallName: "Nnamdi Azikiwe Hall (Zik Hall)",
    hallSlug: "zik-hall",
    amount: 25_000_00,
    currency: "NGN",
    status: "success",
    createdAt: hoursAgo(2),
    reference: "ui_9f2a1c7d",
    txHash: fakeTxHash("bowie-zik"),
  },
  {
    id: "bowie-2",
    hallName: "Sultan Bello Hall",
    hallSlug: "sultan-bello-hall",
    amount: 30_00,
    currency: "USD",
    status: "success",
    createdAt: hoursAgo(31),
    reference: "ui_44d0e912",
    txHash: fakeTxHash("bowie-bello"),
  },
  {
    id: "bowie-3",
    hallName: "Independence Hall",
    hallSlug: "independence-hall",
    amount: 60_000_00,
    currency: "NGN",
    status: "pending",
    createdAt: hoursAgo(0.2),
    reference: "ui_a71bc203",
    txHash: null,
  },
  {
    id: "bowie-4",
    hallName: "Mellanby Hall",
    hallSlug: "mellanby-hall",
    amount: 10_000_00,
    currency: "NGN",
    status: "failed",
    createdAt: hoursAgo(96),
    reference: "ui_7c30f8e1",
    txHash: null,
  },
];
