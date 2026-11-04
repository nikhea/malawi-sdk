/** Builds the optional `Idempotency-Key` header for replay-safe writes. */
export function idempotencyHeaders(
  key?: string,
): Record<string, string> | undefined {
  return key ? { "Idempotency-Key": key } : undefined;
}
