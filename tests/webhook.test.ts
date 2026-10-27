import { describe, expect, it } from "vitest";
import {
  constructStripeEvent,
  verifyStripeSignature,
  type StripeEvent,
} from "../src/index.js";

const SECRET = "whsec_test_secret";
const PAYLOAD = JSON.stringify({
  id: "evt_123",
  object: "event",
  type: "checkout.session.completed",
  data: { object: { id: "cs_123", amount_total: 735 } },
});

async function sign(
  payload: string,
  secret: string,
  timestamp: number,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `t=${timestamp},v1=${hex}`;
}

const NOW = 1_800_000_000_000;
const TIMESTAMP = Math.floor(NOW / 1000);

describe("verifyStripeSignature", () => {
  it("accepts a valid signature", async () => {
    const signature = await sign(PAYLOAD, SECRET, TIMESTAMP);
    await expect(
      verifyStripeSignature({
        payload: PAYLOAD,
        signature,
        secret: SECRET,
        now: NOW,
      }),
    ).resolves.toBe(true);
  });

  it("accepts Uint8Array payloads", async () => {
    const signature = await sign(PAYLOAD, SECRET, TIMESTAMP);
    await expect(
      verifyStripeSignature({
        payload: new TextEncoder().encode(PAYLOAD),
        signature,
        secret: SECRET,
        now: NOW,
      }),
    ).resolves.toBe(true);
  });

  it("rejects a tampered payload", async () => {
    const signature = await sign(PAYLOAD, SECRET, TIMESTAMP);
    await expect(
      verifyStripeSignature({
        payload: PAYLOAD.replace("735", "1"),
        signature,
        secret: SECRET,
        now: NOW,
      }),
    ).resolves.toBe(false);
  });

  it("rejects a wrong secret", async () => {
    const signature = await sign(PAYLOAD, "whsec_wrong", TIMESTAMP);
    await expect(
      verifyStripeSignature({
        payload: PAYLOAD,
        signature,
        secret: SECRET,
        now: NOW,
      }),
    ).resolves.toBe(false);
  });

  it("rejects stale timestamps outside the tolerance", async () => {
    const signature = await sign(PAYLOAD, SECRET, TIMESTAMP - 600);
    await expect(
      verifyStripeSignature({
        payload: PAYLOAD,
        signature,
        secret: SECRET,
        now: NOW,
      }),
    ).resolves.toBe(false);
  });

  it("disables the tolerance when set to zero", async () => {
    const signature = await sign(PAYLOAD, SECRET, TIMESTAMP - 86_400);
    await expect(
      verifyStripeSignature({
        payload: PAYLOAD,
        signature,
        secret: SECRET,
        now: NOW,
        toleranceSeconds: 0,
      }),
    ).resolves.toBe(true);
  });

  it("rejects malformed signature headers", async () => {
    for (const signature of ["", "v1=abc", "t=123", "t=abc,v1=def"]) {
      await expect(
        verifyStripeSignature({
          payload: PAYLOAD,
          signature,
          secret: SECRET,
          now: NOW,
        }),
      ).resolves.toBe(false);
    }
  });

  it("supports multiple v1 signatures", async () => {
    const good = await sign(PAYLOAD, SECRET, TIMESTAMP);
    const hex = good.split("v1=")[1];
    const signature = `t=${TIMESTAMP},v1=deadbeef,v1=${hex}`;

    await expect(
      verifyStripeSignature({
        payload: PAYLOAD,
        signature,
        secret: SECRET,
        now: NOW,
      }),
    ).resolves.toBe(true);
  });
});

describe("constructStripeEvent", () => {
  it("returns the parsed event when valid", async () => {
    const signature = await sign(PAYLOAD, SECRET, TIMESTAMP);

    const event = await constructStripeEvent<{ id: string; amount_total: number }>({
      payload: PAYLOAD,
      signature,
      secret: SECRET,
      now: NOW,
    });

    expect(event.id).toBe("evt_123");
    expect(event.type).toBe("checkout.session.completed");
    expect(event.data.object.amount_total).toBe(735);
  });

  it("throws on an invalid signature", async () => {
    await expect(
      constructStripeEvent({
        payload: PAYLOAD,
        signature: "t=1,v1=bad",
        secret: SECRET,
        now: NOW,
      }),
    ).rejects.toThrow("Invalid Stripe webhook signature");
  });
});

const _typeCheck: StripeEvent<{ id: string }> | undefined = undefined;
void _typeCheck;
