/** Sérialise une proforma Prisma pour JSON (Decimal → number). */
export function serializeProforma<T>(row: T): T {
  return JSON.parse(
    JSON.stringify(row, (_key, value) => {
      if (value !== null && typeof value === "object") {
        if (typeof (value as { toNumber?: () => number }).toNumber === "function") {
          return (value as { toNumber: () => number }).toNumber();
        }
      }
      return value;
    }),
  ) as T;
}
