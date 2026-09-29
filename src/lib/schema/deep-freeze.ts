/**
 * Recursively freezes an object graph. Used to make CaseTruth immutability
 * (docs/02, docs/06) a runtime guarantee instead of a convention that
 * "nothing happens to write to it" — after this, an attempted mutation
 * throws in strict mode (all ESM code in this project) rather than
 * silently succeeding.
 */
export function deepFreeze<T>(value: T): Readonly<T> {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const key of Object.getOwnPropertyNames(value)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return value;
}
