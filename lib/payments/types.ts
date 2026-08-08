import type { Currency } from "@/lib/money";

export interface PaymentInitParams {
  amountSubunits: number;
  currency: Currency;
  email: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentInitResult {
  checkoutUrl: string;
  providerRef: string;
}
