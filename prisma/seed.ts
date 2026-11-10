// Demo data: "Ali Barber" (slug demo-barber). Safe to run many times: records are upserted
// and only the demo business's own bookings are recreated.
import { loadEnvConfig } from "@next/env";
import { SERVICE_TEMPLATES } from "@/config/service-templates";
import { db } from "@/lib/db";
import { defaultWeeklySchedule } from "@/lib/schedule";
import { addDays, dateInZone, localDateTimeToUtc, MINUTE_MS } from "@/lib/time";
import { randomToken } from "@/lib/tokens";

loadEnvConfig(process.cwd());

const TZ = "Asia/Tashkent";
const SLUG = "demo-barber";

async function main() {
  const schedule = defaultWeeklySchedule();
  for (const key of ["mon", "tue", "wed", "thu", "fri", "sat"] as const) {
    schedule[key].breaks = [{ start: "13:00", end: "14:00" }];
  }

  const data = {
    name: "Ali Barber",
    category: "BARBERSHOP" as const,
    region: "TASHKENT_CITY" as const,
    district: "Chilonzor tumani",
    address: "Bunyodkor shoh koʻchasi, 12",
    landmark: "Chilonzor metrosi yonida",
    mapUrl: "https://maps.google.com/?q=41.2756,69.2034",
    latitude: 41.2756,
    longitude: 69.2034,
    phone: "+998901234567",
    instagram: "ali.barber.demo",
    description:
      "Demo sahifa. Zamonaviy erkaklar sartaroshxonasi: soch olish, soqol, bolalar soch olish.",
    timezone: TZ,
    weeklySchedule: schedule,
    slotStepMinutes: 30,
    minLeadMinutes: 60,
    maxDaysAhead: 30,
    autoConfirm: true,
    isPublished: true,
    isDemo: true,
    isBlocked: false,
    plan: "TRIAL" as const,
    trialEndsAt: new Date("2099-12-31T00:00:00Z"),
    onboardingStep: null,
  };

  const business = await db.business.upsert({
    where: { slug: SLUG },
    update: data,
    create: { ...data, slug: SLUG, referralCode: "DEMO0001" },
  });

  const staffSeed = [
    { id: "demo-staff-ali", name: "Ali", position: "Barber", sortOrder: 0 },
    { id: "demo-staff-vali", name: "Vali", position: "Barber", sortOrder: 1 },
  ];
  for (const s of staffSeed) {
    await db.staff.upsert({
      where: { id: s.id },
      update: { ...s, isActive: true },
      create: { ...s, businessId: business.id },
    });
  }

  const services = SERVICE_TEMPLATES.BARBERSHOP.map((t, index) => ({
    id: `demo-service-${index + 1}`,
    nameUz: t.nameUz,
    nameRu: t.nameRu,
    durationMinutes: t.durationMinutes,
    price: t.price,
    priceIsFrom: t.priceIsFrom ?? false,
    bufferMinutes: 0,
    sortOrder: index,
    isActive: true,
  }));
  for (const s of services) {
    await db.service.upsert({
      where: { id: s.id },
      update: s,
      create: { ...s, businessId: business.id },
    });
    for (const staff of staffSeed) {
      await db.staffService.upsert({
        where: { staffId_serviceId: { staffId: staff.id, serviceId: s.id } },
        update: {},
        create: { staffId: staff.id, serviceId: s.id },
      });
    }
  }

  const clientSeed = [
    { name: "Aziz", phone: "+998901112233" },
    { name: "Dilshod", phone: "+998935556677" },
    { name: "Sardor", phone: "+998971234567" },
    { name: "Bekzod", phone: "+998998887766" },
  ];
  const clients: Array<{ id: string }> = [];
  for (const c of clientSeed) {
    clients.push(
      await db.client.upsert({
        where: { businessId_phone: { businessId: business.id, phone: c.phone } },
        update: { name: c.name },
        create: { ...c, businessId: business.id },
      }),
    );
  }

  // Recreate demo bookings relative to today so the demo always looks alive.
  const now = new Date();
  const today = dateInZone(now, TZ);
  const tomorrow = addDays(today, 1);
  const plan: Array<[string, string, string, number, number, boolean?]> = [
    // date, time, staffId, serviceIndex, clientIndex, pending?
    [today, "10:00", "demo-staff-ali", 0, 0],
    [today, "11:00", "demo-staff-vali", 2, 1],
    [today, "15:00", "demo-staff-ali", 1, 2],
    [today, "17:30", "demo-staff-vali", 3, 3],
    [tomorrow, "09:00", "demo-staff-ali", 2, 0],
    [tomorrow, "12:00", "demo-staff-vali", 0, 3, true],
    [tomorrow, "16:30", "demo-staff-ali", 0, 1],
  ];

  await db.$transaction(async (tx) => {
    await tx.booking.deleteMany({ where: { businessId: business.id } });
    for (const [date, time, staffId, serviceIndex, clientIndex, pending] of plan) {
      const service = services[serviceIndex];
      const startsAt = localDateTimeToUtc(date, time, TZ);
      const endsAt = new Date(startsAt.getTime() + service.durationMinutes * MINUTE_MS);
      const status = pending ? "PENDING" : endsAt < now ? "COMPLETED" : "CONFIRMED";
      await tx.booking.create({
        data: {
          businessId: business.id,
          staffId,
          serviceId: service.id,
          clientId: clients[clientIndex].id,
          startsAt,
          endsAt,
          blockedUntil: endsAt,
          status,
          source: clientIndex % 2 === 0 ? "WEB" : "TELEGRAM",
          serviceNameSnapshot: service.nameUz,
          priceSnapshot: service.price,
          durationSnapshot: service.durationMinutes,
          manageToken: randomToken(),
        },
      });
    }
  });

  const count = await db.booking.count({ where: { businessId: business.id } });
  console.log(`✅ Demo biznes tayyor: /b/${SLUG} (${count} ta yozilish)`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
