export interface StripeEvent<T = Record<string, unknown>> {
  id: string;
  object: string;
  type: string;
  data: {
    object: T;
    previous_attributes?: Record<string, unknown>;
  };
  [key: string]: unknown;
}

export interface VerifyStripeSignatureOptions {
  /** Raw request body, exactly as received. Do not parse and re-stringify. */
  payload: string | Uint8Array | ArrayBuffer;
  /** Value of the `Stripe-Signature` header. */
  signature: string;
  /** Stripe webhook signing secret (`whsec_…`). */
  secret: string;
  /** Allowed clock skew. Set `0` to disable. Default 300 seconds. */
  toleranceSeconds?: number;
  /** Current time in milliseconds (tests). Default `Date.now()`. */
  now?: number;
}

const DEFAULT_TOLERANCE_SECONDS = 300;

function toBytes(payload: string | Uint8Array | ArrayBuffer): Uint8Array {
  if (typeof payload === "string") return new TextEncoder().encode(payload);
  if (payload instanceof Uint8Array) return payload;
  return new Uint8Array(payload);
}

function hex(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

interface ParsedSignature {
  timestamp: number;
  signatures: string[];
}

function parseSignature(header: string): ParsedSignature | undefined {
  let timestamp: number | undefined;
  const signatures: string[] = [];

  for (const part of header.split(",")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;

    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();

    if (key === "t") {
      timestamp = Number(value);
    } else if (key === "v1") {
      signatures.push(value);
    }
  }

  if (timestamp === undefined || !Number.isFinite(timestamp)) return undefined;
  if (signatures.length === 0) return undefined;
  return { timestamp, signatures };
}

/**
 * Verifies a Stripe webhook signature using the Web Crypto API
 * (Node 20+, browsers, workers). Returns `false` instead of throwing for
 * invalid signatures.
 *
 * The backend already verifies webhooks; this helper is for edge
 * functions or services that receive Stripe events directly.
 */
export async function verifyStripeSignature(
  options: VerifyStripeSignatureOptions,
): Promise<boolean> {
  const parsed = parseSignature(options.signature);
  if (!parsed) return false;

  const tolerance = options.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  if (tolerance > 0) {
    const now = options.now ?? Date.now();
    const age = Math.abs(now - parsed.timestamp * 1000);
    if (age > tolerance * 1000) return false;
  }

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error(
      "Web Crypto is unavailable. verifyStripeSignature needs Node 20+, a browser, or a worker runtime.",
    );
  }

  const key = await subtle.importKey(
    "raw",
    new TextEncoder().encode(options.secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const payloadBytes = toBytes(options.payload);
  const signedPrefix = new TextEncoder().encode(`${parsed.timestamp}.`);
  const signedPayload = new Uint8Array(signedPrefix.length + payloadBytes.length);
  signedPayload.set(signedPrefix, 0);
  signedPayload.set(payloadBytes, signedPrefix.length);

  const digest = await subtle.sign("HMAC", key, signedPayload);
  const expected = hex(new Uint8Array(digest));

  return parsed.signatures.some((signature) =>
    constantTimeEqual(signature.toLowerCase(), expected),
  );
}

/**
 * Verifies a Stripe webhook and returns the parsed event. Throws when the
 * signature is invalid or the body is not valid JSON.
 */
export async function constructStripeEvent<T = Record<string, unknown>>(
  options: VerifyStripeSignatureOptions,
): Promise<StripeEvent<T>> {
  const valid = await verifyStripeSignature(options);
  if (!valid) throw new Error("Invalid Stripe webhook signature");

  const text =
    typeof options.payload === "string"
      ? options.payload
      : new TextDecoder().decode(toBytes(options.payload));

  return JSON.parse(text) as StripeEvent<T>;
}
