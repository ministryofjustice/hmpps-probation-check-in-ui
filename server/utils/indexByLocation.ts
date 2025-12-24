export type WithLocation = { location: string }

/**
 * Index an array of rows by their location field.
 * Handles null/undefined inputs gracefully by returning empty object.
 */
export function indexByLocation<T extends WithLocation, V>(
  rows: T[] | null | undefined,
  mapper: (row: T) => V,
  reducer?: (acc: V, val: V) => V,
): Record<string, V> {
  const out: Record<string, V> = {}
  if (!Array.isArray(rows)) {
    return {}
  }
  for (const row of rows) {
    const key = row.location
    const next = mapper(row)

    if (key in out && reducer) {
      out[key] = reducer(out[key], next)
    } else {
      out[key] = next
    }
  }
  return out
}
