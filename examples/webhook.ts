import {
  constructStripeEvent,
  verifyStripeSignature,
} from "../src/index.js";

/**
 * Example for a separate edge function or service. The Go API already
 * verifies its own webhooks; this is only for handlers outside it.
 */
export async function handleStripeWebhook(
  rawBody: string,
  signature: string,
  secret: string,
): Promise<number> {
  if (!(await verifyStripeSignature({ payload: rawBody, signature, secret }))) {
    return 400;
  }

  const event = await constructStripeEvent<{ id: string; metadata?: Record<string, string> }>({
    payload: rawBody,
    signature,
    secret,
  });

  if (event.type === "checkout.session.completed") {
    console.log("Paid session", event.data.object.id);
  }

  return 200;
}
