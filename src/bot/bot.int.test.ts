// Bot handlers and cron jobs against a real database, with a fake Telegram API that records
// every call. Runs only when TEST_DATABASE_URL is set (see src/server/isolation.int.test.ts).
import type { Bot } from "grammy";
import type { Update } from "grammy/types";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { BotContext } from "@/bot/context";

const TEST_DB = process.env.TEST_DATABASE_URL;

type Call = { method: string; payload: Record<string, unknown> };

describe.skipIf(!TEST_DB)("telegram bot and cron", () => {
  let db: typeof import("@/lib/db").db;
  let bot: Bot<BotContext>;
  const calls: Call[] = [];
  const blockedChats = new Set<number>();
  let updateId = 1;
  let slotCounter = 0;
  const ids = { business: "", owner: 0n, client: 0n, stranger: 0n, staffId: "", serviceId: "" };
  const createdUsers: string[] = [];

  const OWNER = 910000000 + Math.floor(Math.random() * 1e5);
  const CLIENT = OWNER + 1;
  const STRANGER = OWNER + 2;

  // grammY transformer: never talks to Telegram, answers like the Bot API would.
  const fakeApi = async (_prev: unknown, method: string, payload: Record<string, unknown>) => {
    calls.push({ method, payload });
    const chatId = Number(payload.chat_id);
    if (method === "sendMessage" && blockedChats.has(chatId)) {
      return {
        ok: false as const,
        error_code: 403,
        description: "Forbidden: bot was blocked by the user",
      };
    }
    const message = {
      message_id: calls.length,
      date: 0,
      chat: { id: chatId, type: "private", first_name: "x" },
      text: String(payload.text ?? ""),
    };
    return {
      ok: true as const,
      result: method === "sendMessage" || method === "editMessageText" ? message : true,
    };
  };

  const from = (id: number, first_name = "Ali") => ({
    id,
    is_bot: false,
    first_name,
    language_code: "uz",
  });

  async function sendText(userId: number, text: string, firstName?: string) {
    const entities = text.startsWith("/")
      ? [{ type: "bot_command" as const, offset: 0, length: text.split(" ")[0].length }]
      : [];
    await bot.handleUpdate({
      update_id: updateId++,
      message: {
        message_id: updateId,
        date: 0,
        chat: { id: userId, type: "private", first_name: "x" },
        from: from(userId, firstName),
        text,
        entities,
      },
    } as Update);
  }

  async function press(userId: number, data: string) {
    await bot.handleUpdate({
      update_id: updateId++,
      callback_query: {
        id: String(updateId),
        chat_instance: "1",
        data,
        from: from(userId),
        message: {
          message_id: 1,
          date: 0,
          chat: { id: userId, type: "private", first_name: "x" },
          text: "old",
        },
      },
    } as Update);
  }

  const last = (method: string) => [...calls].reverse().find((c) => c.method === method);

  async function makeBooking(
    status: "CONFIRMED" | "PENDING",
    daysAhead: number,
    clientTelegram: bigint | null = null,
  ) {
    const phone = `+99890${Math.floor(1000000 + Math.random() * 8999999)}`;
    const client = await db.client.create({
      data: { businessId: ids.business, name: "<b>Mijoz</b>", phone, telegramId: clientTelegram },
    });
    const startsAt = new Date(Date.now() + daysAhead * 86400000);
    // Each test booking gets its own hour so the overlap constraint never fires.
    startsAt.setUTCHours(5 + (slotCounter++ % 12), 0, 0, 0); // 10:00–21:00 Tashkent
    return db.booking.create({
      data: {
        businessId: ids.business,
        staffId: ids.staffId,
        serviceId: ids.serviceId,
        clientId: client.id,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 3600000),
        blockedUntil: new Date(startsAt.getTime() + 3600000),
        status,
        source: "WEB",
        serviceNameSnapshot: "Soch olish",
        priceSnapshot: 50000,
        durationSnapshot: 60,
        manageToken: Math.random().toString(36).slice(2).padEnd(32, "k").slice(0, 32),
      },
    });
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB;
    process.env.TELEGRAM_BOT_TOKEN = ""; // background notifications use the log notifier
    process.env.NEXT_PUBLIC_APP_URL = "https://navbat.example";
    db = (await import("@/lib/db")).db;
    const { createBot } = await import("@/bot/bot");
    const { defaultWeeklySchedule } = await import("@/lib/schedule");
    const { Api } = await import("grammy");

    bot = createBot("123:TEST", {
      botInfo: {
        id: 1,
        is_bot: true,
        first_name: "Navbat",
        username: "navbat_test_bot",
        can_join_groups: false,
        can_read_all_group_messages: false,
        supports_inline_queries: false,
        can_connect_to_business: false,
        has_main_web_app: false,
        has_topics_enabled: false,
        allows_users_to_create_topics: false,
        can_manage_bots: false,
        supports_join_request_queries: false,
      },
    });
    bot.api.config.use(fakeApi as never);
    // Cron and notifier send through the shared Api instance: point it at the fake too.
    const api = new Api("123:TEST");
    api.config.use(fakeApi as never);
    (globalThis as unknown as { telegramApi?: unknown }).telegramApi = api;

    const owner = await db.user.create({ data: { telegramId: BigInt(OWNER), firstName: "Ega" } });
    createdUsers.push(owner.id);
    const suffix = Math.random().toString(36).slice(2, 8);
    const business = await db.business.create({
      data: {
        slug: `bot-${suffix}`,
        name: "Bot Barber",
        category: "BARBERSHOP",
        region: "TASHKENT_CITY",
        district: "Chilonzor",
        address: "Test 1",
        phone: "+998901234567",
        weeklySchedule: defaultWeeklySchedule(),
        trialEndsAt: new Date(Date.now() + 14 * 86400000),
        referralCode: `BOT${suffix}`.toUpperCase(),
        isPublished: true,
        onboardingStep: null,
        autoConfirm: true,
        memberships: { create: { userId: owner.id, role: "OWNER" } },
      },
    });
    const staff = await db.staff.create({ data: { businessId: business.id, name: "Ali" } });
    const service = await db.service.create({
      data: {
        businessId: business.id,
        nameUz: "Soch olish",
        durationMinutes: 60,
        price: 50000,
        staff: { create: { staffId: staff.id } },
      },
    });
    Object.assign(ids, {
      business: business.id,
      owner: BigInt(OWNER),
      client: BigInt(CLIENT),
      stranger: BigInt(STRANGER),
      staffId: staff.id,
      serviceId: service.id,
    });
  });

  beforeEach(() => {
    calls.length = 0;
  });

  afterAll(async () => {
    if (!db) return;
    await db.business.deleteMany({ where: { id: ids.business } });
    await db.user.deleteMany({ where: { id: { in: createdUsers } } });
    await db.telegramChat.deleteMany({
      where: { telegramId: { in: [ids.owner, ids.client, ids.stranger] } },
    });
    await db.$disconnect();
  });

  it("/start greets with the name escaped and remembers the chat", async () => {
    await sendText(CLIENT, "/start", "<b>Ali</b>");
    const reply = last("sendMessage")!;
    expect(String(reply.payload.text)).toContain("&lt;b&gt;Ali&lt;/b&gt;");
    expect(reply.payload.parse_mode).toBe("HTML");
    expect(await db.telegramChat.findUnique({ where: { telegramId: ids.client } })).not.toBeNull();
  });

  it("bk_<token> links the client and schedules reminders", async () => {
    const booking = await makeBooking("CONFIRMED", 3);
    await sendText(CLIENT, `/start bk_${booking.manageToken}`);
    expect(String(last("sendMessage")!.payload.text)).toContain("Siz yozildingiz");
    const client = await db.client.findUniqueOrThrow({ where: { id: booking.clientId } });
    expect(client.telegramId).toBe(ids.client);
    const reminders = await db.scheduledMessage.findMany({ where: { bookingId: booking.id } });
    expect(reminders.map((r) => r.type).sort()).toEqual(["REMINDER_24H", "REMINDER_2H"]);
  });

  it("a stranger cannot press a client's buttons", async () => {
    const booking = await makeBooking("CONFIRMED", 3, ids.client);
    await press(STRANGER, `cy:${booking.id}`);
    expect(last("answerCallbackQuery")!.payload.show_alert).toBe(true);
    expect((await db.booking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe(
      "CONFIRMED",
    );
  });

  it("client: “I'm coming”, then cancel with confirmation", async () => {
    const booking = await makeBooking("CONFIRMED", 3, ids.client);
    await press(CLIENT, `k:${booking.id}`);
    expect(
      (await db.booking.findUniqueOrThrow({ where: { id: booking.id } })).clientConfirmedAt,
    ).not.toBeNull();
    expect(String(last("editMessageText")!.payload.text)).toContain("Rahmat");

    await press(CLIENT, `c:${booking.id}`);
    expect(String(last("editMessageText")!.payload.text)).toContain("Rostdan ham bekor qilasizmi");
    await press(CLIENT, `cy:${booking.id}`);
    expect((await db.booking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe(
      "CANCELLED_BY_CLIENT",
    );
    expect(String(last("editMessageText")!.payload.text)).toContain("bekor qilindi");
  });

  it("owner confirms a pending booking; a stranger cannot", async () => {
    const booking = await makeBooking("PENDING", 4);
    await press(STRANGER, `oa:${booking.id}`);
    expect((await db.booking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe(
      "PENDING",
    );
    await press(OWNER, `oa:${booking.id}`);
    expect((await db.booking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe(
      "CONFIRMED",
    );
    expect(String(last("editMessageText")!.payload.text)).toContain("Tasdiqlandi");
  });

  it("login: /start login_<token> asks, la: confirms for this Telegram user", async () => {
    const { createLoginToken } = await import("@/server/login");
    const { token } = await createLoginToken();
    await sendText(STRANGER, `/start login_${token}`);
    expect(String(last("sendMessage")!.payload.text)).toContain("saytiga kirish");
    await press(STRANGER, `la:${token}`);
    const row = await db.loginToken.findUniqueOrThrow({ where: { token } });
    expect(row.status).toBe("CONFIRMED");
    expect(row.telegramId).toBe(ids.stranger);
    const user = await db.user.findUnique({ where: { telegramId: ids.stranger } });
    if (user) createdUsers.push(user.id);
  });

  it("/id, /til and language switch, unknown text", async () => {
    await sendText(OWNER, "/id");
    expect(String(last("sendMessage")!.payload.text)).toContain(String(OWNER));
    await press(OWNER, "lang:ru");
    expect(
      (await db.telegramChat.findUniqueOrThrow({ where: { telegramId: ids.owner } })).locale,
    ).toBe("ru");
    await sendText(OWNER, "salom");
    expect(
      calls.some((c) => c.method === "sendMessage" && String(c.payload.text).includes("Не понял")),
    ).toBe(true);
    await press(OWNER, "lang:uz");
  });

  it("cron: sends due reminders, handles blocked chats, completes and expires bookings", async () => {
    const { processReminders } = await import("@/server/cron");
    process.env.TELEGRAM_BOT_TOKEN = "123:TEST"; // cron only sends when a bot is configured
    const due = await makeBooking("CONFIRMED", 1, ids.client);
    await db.scheduledMessage.create({
      data: {
        bookingId: due.id,
        chatId: ids.client,
        type: "REMINDER_24H",
        sendAt: new Date(Date.now() - 1000),
      },
    });

    const blockedUser = BigInt(STRANGER);
    blockedChats.add(STRANGER);
    const blocked = await makeBooking("CONFIRMED", 2, blockedUser);
    await db.telegramChat.update({
      where: { telegramId: blockedUser },
      data: { isBlocked: false },
    });
    await db.scheduledMessage.create({
      data: {
        bookingId: blocked.id,
        chatId: blockedUser,
        type: "REMINDER_2H",
        sendAt: new Date(Date.now() - 1000),
      },
    });

    const old = await makeBooking("CONFIRMED", -1);
    const stale = await makeBooking("PENDING", -1);

    const stats = await processReminders();
    expect(stats.sent).toBeGreaterThanOrEqual(1);
    const sent = await db.scheduledMessage.findFirstOrThrow({ where: { bookingId: due.id } });
    expect(sent.status).toBe("SENT");
    expect(
      calls.some((c) => c.method === "sendMessage" && String(c.payload.text).includes("Eslatma")),
    ).toBe(true);

    const failed = await db.scheduledMessage.findFirstOrThrow({ where: { bookingId: blocked.id } });
    expect(failed.status).toBe("CANCELLED");
    expect(
      (await db.telegramChat.findUniqueOrThrow({ where: { telegramId: blockedUser } })).isBlocked,
    ).toBe(true);

    expect((await db.booking.findUniqueOrThrow({ where: { id: old.id } })).status).toBe(
      "COMPLETED",
    );
    const expired = await db.booking.findUniqueOrThrow({ where: { id: stale.id } });
    expect(expired.status).toBe("CANCELLED_BY_BUSINESS");
    expect(expired.cancelReason).toBe("AUTO_EXPIRED");
    blockedChats.clear();
    process.env.TELEGRAM_BOT_TOKEN = "";
  });

  it("Mini App booking: signed initData links Telegram, a forged one is ignored", async () => {
    const { createPublicBooking } = await import("@/server/bookings");
    const { signInitData } = await import("@/lib/telegram/init-data");
    const { loadAvailability } = await import("@/server/availability");
    const business = await db.business.findUniqueOrThrow({ where: { id: ids.business } });
    const day = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
    const { slotsByDate } = await loadAvailability({
      business,
      serviceId: ids.serviceId,
      staffId: "any",
      dates: [day],
      now: new Date(),
    });
    const slots = slotsByDate.get(day) ?? [];
    const [first, second] = [slots[0], slots[4]]; // 2 hours apart: no overlap
    expect(first && second).toBeTruthy();

    const params = new URLSearchParams({
      user: JSON.stringify({ id: CLIENT, first_name: "Ali", language_code: "uz" }),
      auth_date: String(Math.floor(Date.now() / 1000)),
    });
    params.set("hash", signInitData(params, "123:TEST"));
    const body = (startsAt: Date, phone: string, tgInitData: string) => ({
      serviceId: ids.serviceId,
      staffId: "any",
      startsAt: startsAt.toISOString(),
      name: "Ali",
      phone,
      consent: true,
      tgInitData,
    });

    process.env.TELEGRAM_BOT_TOKEN = "123:TEST";
    try {
      const ok = await createPublicBooking(
        business.slug,
        body(first.startsAt, "+998901110001", params.toString()),
        { ip: "10.1.1.1" },
      );
      const booked = await db.booking.findUniqueOrThrow({
        where: { id: ok.bookingId },
        include: { client: true },
      });
      expect(booked.source).toBe("TELEGRAM");
      expect(booked.client.telegramId).toBe(ids.client);
      expect(ok.telegramLinked).toBe(true);
      expect(
        await db.scheduledMessage.count({ where: { bookingId: ok.bookingId } }),
      ).toBeGreaterThan(0);

      params.set("user", JSON.stringify({ id: STRANGER, first_name: "Hacker" }));
      const forged = await createPublicBooking(
        business.slug,
        body(second.startsAt, "+998901110002", params.toString()),
        { ip: "10.1.1.2" },
      );
      const plain = await db.booking.findUniqueOrThrow({
        where: { id: forged.bookingId },
        include: { client: true },
      });
      expect(plain.source).toBe("WEB");
      expect(plain.client.telegramId).toBeNull();
    } finally {
      process.env.TELEGRAM_BOT_TOKEN = "";
    }
  });

  it("cron: the same reminder is never sent twice by parallel runs", async () => {
    const { processReminders } = await import("@/server/cron");
    const booking = await makeBooking("CONFIRMED", 1, ids.client);
    await db.scheduledMessage.create({
      data: {
        bookingId: booking.id,
        chatId: ids.client,
        type: "REMINDER_2H",
        sendAt: new Date(Date.now() - 1000),
      },
    });
    calls.length = 0;
    process.env.TELEGRAM_BOT_TOKEN = "123:TEST";
    await Promise.all([processReminders(), processReminders(), processReminders()]);
    process.env.TELEGRAM_BOT_TOKEN = "";
    const sends = calls.filter(
      (c) => c.method === "sendMessage" && String(c.payload.text).includes("2 soatdan keyin"),
    );
    expect(sends).toHaveLength(1);
  });
});
