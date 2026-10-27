/** Encodes a path segment (IDs, slugs) without stripping leading slashes. */
export function segment(value: string): string {
  return encodeURIComponent(value);
}
