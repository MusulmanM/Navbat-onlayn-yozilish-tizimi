// Integration tests against a real PostgreSQL (spec 10, 15). They run only when
// TEST_DATABASE_URL points to a migrated, disposable database; otherwise they are skipped.
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const TEST_DB = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DB)("database integration", () => {
  type Db = typeof import("@/lib/db").db;
  let db: Db;
  let isOverlap: (error: unknown) => boolean;
  const createdBusinessIds: string[] = [];
  const createdUserIds: string[] = [];
  let a: { businessId: string; serviceId: string; staffId: string };
  let b: {
    businessId: string;
    serviceId: string;
    staffId: string;
    clientId: string;
    bookingId: string;
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB;
    process.env.TELEGRAM_BOT_TOKEN = ""; // never send real messages from tests
    const dbModule = await import("@/lib/db");
    db = dbModule.db;
    isOverlap = dbModule.isOverlapError;
    const { defaultWeeklySchedule } = await import("@/lib/schedule");
    const suffix = Math.random().toString(36).slice(2, 8);

    const makeBusiness = async (name: string) => {
      const user = await db.user.create({
        data: { telegramId: BigInt(Math.floor(Math.random() * 1e12)), firstName: name },
      });
      createdUserIds.push(user.id);
      const business = await db.business.create({
        data: {
          slug: `${name}-${suffix}`,
          name,
          category: "BARBERSHOP",
          region: "TASHKENT_CITY",
          district: "Chilonzor",
          address: "Test 1",
          phone: "+998901234567",
          weeklySchedule: defaultWeeklySchedule(),
          trialEndsAt: new Date(Date.now() + 14 * 86400000),
          referralCode: `${name}${suffix}`.toUpperCase().slice(0, 12),
          isPublished: true,
          onboardingStep: null,
          memberships: { create: { userId: user.id, role: "OWNER" } },
        },
      });
      createdBusinessIds.push(business.id);
      const staff = await db.staff.create({ data: { businessId: business.id, name: "Usta" } });
      const service = await db.service.create({
        data: {
          businessId: business.id,
          nameUz: "Soch olish",
          durationMinutes: 60,
          price: 50000,
          staff: { create: { staffId: staff.id } },
        },
      });
      return { businessId: business.id, serviceId: service.id, staffId: staff.id };
    };

    a = await makeBusiness("alpha");
    const base = await makeBusiness("beta");
    const client = await db.client.create({
      data: { businessId: base.businessId, name: "Mijoz", phone: "+998901112233" },
    });
    const startsAt = new Date(Date.now() + 3 * 86400000);
    const booking = await db.booking.create({
      data: {
        businessId: base.businessId,
        staffId: base.staffId,
        serviceId: base.serviceId,
        clientId: client.id,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 3600000),
        blockedUntil: new Date(startsAt.getTime() + 3600000),
        status: "CONFIRMED",
        source: "WEB",
        serviceNameSnapshot: "Soch olish",
        priceSnapshot: 50000,
        durationSnapshot: 60,
        manageToken: `tok${suffix}`.padEnd(32, "x"),
      },
    });
    b = { ...base, clientId: client.id, bookingId: booking.id };
  });

  afterAll(async () => {
    if (!db) return;
    await db.business.deleteMany({ where: { id: { in: createdBusinessIds } } });
    await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await db.$disconnect();
  });

  it("owner of A cannot change a booking of business B", async () => {
    const { transitionBooking } = await import("@/server/booking-status");
    await expect(
      transitionBooking({
        bookingId: b.bookingId,
        businessId: a.businessId,
        to: "CANCELLED_BY_BUSINESS",
        actor: "business",
      }),
    ).rejects.toMatchObject({ code: "BOOKING_NOT_FOUND" });
    const { updateInternalNote } = await import("@/server/panel/bookings");
    await expect(updateInternalNote(a.businessId, b.bookingId, "hack")).rejects.toMatchObject({
      code: "BOOKING_NOT_FOUND",
    });
    const untouched = await db.booking.findUniqueOrThrow({ where: { id: b.bookingId } });
    expect(untouched.status).toBe("CONFIRMED");
    expect(untouched.internalNote).toBeNull();
  });

  it("owner of A cannot edit services, staff or clients of B", async () => {
    const catalog = await import("@/server/panel/catalog");
    await expect(
      catalog.saveService(a.businessId, {
        id: b.serviceId,
        nameUz: "Hacked",
        durationMinutes: 30,
        price: 1,
      }),
    ).rejects.toMatchObject({ code: "SERVICE_NOT_FOUND" });
    await expect(catalog.setServiceActive(a.businessId, b.serviceId, false)).rejects.toMatchObject({
      code: "SERVICE_NOT_FOUND",
    });
    await expect(catalog.deleteStaff(a.businessId, b.staffId)).rejects.toMatchObject({
      code: "STAFF_NOT_FOUND",
    });
    await expect(
      catalog.saveClient(a.businessId, { id: b.clientId, name: "Hacked" }),
    ).rejects.toMatchObject({ code: "NOT_ALLOWED" });
    expect((await db.service.findUniqueOrThrow({ where: { id: b.serviceId } })).nameUz).toBe(
      "Soch olish",
    );
    expect((await db.client.findUniqueOrThrow({ where: { id: b.clientId } })).name).toBe("Mijoz");
  });

  it("owner of A cannot attach B's client or staff to a booking", async () => {
    const { createPanelBooking } = await import("@/server/panel/bookings");
    const businessA = await db.business.findUniqueOrThrow({ where: { id: a.businessId } });
    const startsAt = new Date(Date.now() + 5 * 86400000);
    await expect(
      createPanelBooking(businessA, {
        clientId: b.clientId,
        serviceId: a.serviceId,
        staffId: b.staffId,
        startsAt: startsAt.toISOString(),
        outsideHours: true,
      }),
    ).rejects.toMatchObject({ code: "STAFF_NOT_FOUND" });
  });

  it("the database refuses two overlapping bookings for one staff member", async () => {
    const existing = await db.booking.findUniqueOrThrow({ where: { id: b.bookingId } });
    await expect(
      db.booking.create({
        data: {
          ...existing,
          id: undefined,
          manageToken: "y".repeat(32),
          startsAt: new Date(existing.startsAt.getTime() + 30 * 60000),
          endsAt: new Date(existing.endsAt.getTime() + 30 * 60000),
          blockedUntil: new Date(existing.blockedUntil.getTime() + 30 * 60000),
          createdAt: undefined,
          updatedAt: undefined,
        },
      }),
    ).rejects.toSatisfy((error: unknown) => isOverlap(error));
  });

  it("a login token can be used exactly once", async () => {
    const login = await import("@/server/login");
    const { token } = await login.createLoginToken();
    expect(await login.consumeLoginToken(token)).toBeNull(); // not confirmed yet
    const telegramId = BigInt(Math.floor(Math.random() * 1e12));
    expect(await login.confirmLoginToken(token, { id: telegramId, firstName: "Ega" })).toBe(true);
    expect(await login.confirmLoginToken(token, { id: 1n, firstName: "Boshqa" })).toBe(false);
    const user = await login.consumeLoginToken(token);
    expect(user?.telegramId).toBe(telegramId);
    expect(await login.consumeLoginToken(token)).toBeNull();
    if (user) createdUserIds.push(user.id);
  });

  it("rate limit counts atomically under parallel requests", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const key = `test:${Math.random()}`;
    const results = await Promise.all(Array.from({ length: 12 }, () => rateLimit(key, 10, 60)));
    const counts = results.map((r) => r.count).sort((x, y) => x - y);
    expect(counts).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    expect(results.filter((r) => !r.ok)).toHaveLength(2);
    await db.rateLimit.delete({ where: { key } });
  });
});
