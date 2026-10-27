import type { HttpClient } from "../http.js";
import type { Payment } from "../types/index.js";

/** Requires authentication. */
export class PaymentsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Creates (or reuses) a Stripe payment intent for one of the caller's
   * orders. Send `payment.client_secret` to Stripe.js to confirm the card.
   */
  createIntent(orderId: string): Promise<Payment> {
    return this.http.request<Payment>("POST", "/payments/intents", {
      body: { order_id: orderId },
      retry: false,
    });
  }
}
