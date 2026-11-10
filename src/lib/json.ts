// JSON helpers: Prisma BigInt (Telegram IDs) cannot go through JSON.stringify as-is.

type Jsonable<T> = T extends bigint
  ? string
  : T extends Date
    ? string
    : T extends Array<infer U>
      ? Array<Jsonable<U>>
      : T extends object
        ? { [K in keyof T]: Jsonable<T[K]> }
        : T;

/** Deep-converts bigint → string and Date → ISO string. */
export function toJsonSafe<T>(value: T): Jsonable<T> {
  return JSON.parse(
    JSON.stringify(value, (_key, v: unknown) => (typeof v === "bigint" ? v.toString() : v)),
  ) as Jsonable<T>;
}
