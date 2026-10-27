export type PaymentStatus = "pending" | "succeeded" | "failed" | "cancelled";

/**
 * A Stripe payment intent. `amount_cents` is the charged USD amount;
 * `order_amount_cents` preserves the source MWK total.
 */
export interface Payment {
  id: string;
  order_id: string;
  stripe_intent_id: string;
  /** Pass to Stripe.js to confirm the card payment. */
  client_secret: string;
  amount_cents: number;
  currency: string;
  order_amount_cents: number;
  status: PaymentStatus;
  /** ISO-8601 timestamp. */
  created_at: string;
}
