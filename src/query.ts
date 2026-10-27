export type QueryScalar = string | number | boolean | Date;
export type QueryValue = QueryScalar | QueryScalar[] | null | undefined;
export type QueryParams = Record<string, QueryValue>;

/** Serializes query params, skipping `null`/`undefined` but keeping `false` and `0`. */
export function buildQuery(query?: QueryParams): string {
  if (!query) return "";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) continue;

    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (item === null || item === undefined) continue;
      params.append(key, item instanceof Date ? item.toISOString() : String(item));
    }
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}
