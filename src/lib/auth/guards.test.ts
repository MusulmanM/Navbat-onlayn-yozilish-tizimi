import { describe, expect, it } from "vitest";
import { findMembership, isAdmin, safeNextPath } from "@/lib/auth/access-rules";
import { signSession, verifySession } from "@/lib/auth/jwt";
import { escapeHtml } from "@/bot/html";
import { ru } from "@/bot/texts/ru";
import { uz } from "@/bot/texts/uz";

const SECRET = "x".repeat(40);

describe("access rules", () => {
  const memberships = [{ businessId: "biz-a", role: "OWNER" as const }];

  it("a user only reaches businesses they are a member of", () => {
    expect(findMembership(memberships, "biz-a")).not.toBeNull();
    expect(findMembership(memberships, "biz-b")).toBeNull();
    expect(findMembership([], "biz-a")).toBeNull();
  });

  it("admin check uses the configured Telegram ids", () => {
    expect(isAdmin(123n, [123n, 456n])).toBe(true);
    expect(isAdmin(789n, [123n])).toBe(false);
    expect(isAdmin(123n, [])).toBe(false);
  });

  it("only internal panel paths are allowed after login", () => {
    expect(safeNextPath("/panel/kalendar?date=2026-11-16")).toBe("/panel/kalendar?date=2026-11-16");
    expect(safeNextPath("/ru/panel")).toBe("/ru/panel");
    expect(safeNextPath("https://evil.example")).toBeNull();
    expect(safeNextPath("//evil.example/panel")).toBeNull();
    expect(safeNextPath("/\\evil.example")).toBeNull();
    expect(safeNextPath("/b/demo")).toBeNull();
    expect(safeNextPath(null)).toBeNull();
  });
});

describe("session token", () => {
  const now = new Date("2026-11-10T10:00:00Z");

  it("round-trips uid and session version", async () => {
    const token = await signSession({ uid: "user-1", sv: 3 }, SECRET, now);
    expect(await verifySession(token, SECRET, now)).toEqual({ uid: "user-1", sv: 3 });
  });

  it("rejects a token signed with another secret or modified", async () => {
    const token = await signSession({ uid: "user-1", sv: 1 }, SECRET, now);
    expect(await verifySession(token, "y".repeat(40), now)).toBeNull();
    const [header, , signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ uid: "admin", sv: 1, iss: "navbat" })).toString(
      "base64url",
    );
    expect(await verifySession(`${header}.${forged}.${signature}`, SECRET, now)).toBeNull();
    expect(await verifySession(undefined, SECRET, now)).toBeNull();
    expect(await verifySession("garbage", SECRET, now)).toBeNull();
  });

  it("rejects an expired token (30 days)", async () => {
    const token = await signSession({ uid: "user-1", sv: 1 }, SECRET, now);
    const later = new Date(now.getTime() + 31 * 24 * 3600 * 1000);
    expect(await verifySession(token, SECRET, later)).toBeNull();
  });
});

describe("bot texts escape user input (spec 8.1)", () => {
  it("client name <b>test</b> is shown as plain text", () => {
    expect(escapeHtml("<b>test</b> & co")).toBe("&lt;b&gt;test&lt;/b&gt; &amp; co");
    for (const t of [uz, ru]) {
      const text = t.ownerNewBooking({
        client: "<b>test</b>",
        clientPhone: "+998 90 123 45 67",
        service: "Soch <i>olish</i>",
        staff: "Ali",
        date: "16-noyabr",
        time: "10:00",
        price: "50 000",
        source: "WEB",
        comment: "<script>x</script>",
        pending: false,
      });
      expect(text).toContain("&lt;b&gt;test&lt;/b&gt;");
      expect(text).toContain("&lt;script&gt;");
      expect(text).not.toContain("<b>test</b>");
      expect(text).toContain("<b>"); // our own formatting stays
    }
  });
});
