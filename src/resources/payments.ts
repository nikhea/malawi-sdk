import type { HttpClient } from "../http.js";
import type { CheckoutSession, Payment } from "../types/index.js";

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

  /** Creates a Stripe-hosted Checkout page and returns its URL. */
  createCheckoutSession(orderId: string): Promise<CheckoutSession> {
    return this.http.request<CheckoutSession>("POST", "/payments/checkout-sessions", {
      body: { order_id: orderId },
      retry: false,
    });
  }
}
