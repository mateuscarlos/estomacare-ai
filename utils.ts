/**
 * Deep clones an object and strips undefined values from it.
 * This is a performance optimization over JSON.parse(JSON.stringify(obj)).
 *
 * Behavior:
 * - Removes keys with `undefined` values from objects.
 * - Converts `undefined` values in arrays to `null` (matching JSON.stringify behavior).
 * - Converts `Date` objects to ISO strings (matching JSON.stringify behavior).
 * - Recursively clones nested objects and arrays.
 * - Preserves other primitive types.
 */
export function deepCloneAndStripUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return (obj as Date).toISOString() as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => {
      const val = deepCloneAndStripUndefined(item);
      return val === undefined ? null : val;
    }) as unknown as T;
  }

  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as any)[key];
      if (value !== undefined) {
        result[key] = deepCloneAndStripUndefined(value);
      }
    }
  }
  return result;
}
