import { describe, expect, it } from "vitest";
import { isOverlapError, isRetryableTxError, withTxRetry } from "./db";

const deadlock = Object.assign(
  new Error("Transaction failed due to a write conflict or a deadlock"),
  {
    code: "P2034",
  },
);

describe("withTxRetry", () => {
  it("retries a deadlocked transaction and returns its result", async () => {
    let calls = 0;
    const result = await withTxRetry(async () => {
      calls++;
      if (calls < 3) throw deadlock;
      return "ok";
    });
    expect(result).toBe("ok");
    expect(calls).toBe(3);
  });

  it("gives up after the last attempt", async () => {
    let calls = 0;
    await expect(
      withTxRetry(async () => {
        calls++;
        throw deadlock;
      }),
    ).rejects.toBe(deadlock);
    expect(calls).toBe(3);
  });

  it("does not retry other errors (overlap is handled by the caller)", async () => {
    const overlap = new Error('violates exclusion constraint "Booking_no_overlap" (23P01)');
    let calls = 0;
    await expect(
      withTxRetry(async () => {
        calls++;
        throw overlap;
      }),
    ).rejects.toBe(overlap);
    expect(calls).toBe(1);
    expect(isOverlapError(overlap)).toBe(true);
    expect(isRetryableTxError(overlap)).toBe(false);
  });
});
