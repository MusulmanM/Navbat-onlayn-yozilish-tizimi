"use server";

// Panel actions for services, staff, time off, clients and settings.
// The business always comes from the session; ids from the client are only used inside it.
import { refresh } from "next/cache";
import { z } from "zod";
import { requireBusiness } from "@/lib/auth/guards";
import {
  addTimeOff,
  changeSlug,
  deleteService,
  deleteStaff,
  deleteTimeOff,
  moveItem,
  saveBusinessSchedule,
  saveClient,
  saveNotifications,
  saveProfile,
  saveRules,
  saveService,
  saveStaff,
  setPublished,
  setServiceActive,
  setStaffActive,
} from "@/server/panel/catalog";
import { runAction } from "@/server/panel/result";

const idSchema = z.string().trim().min(1).max(64);
const direction = z.enum(["up", "down"]);

function mutate<T>(fn: () => Promise<T>) {
  return runAction(async () => {
    const result = await fn();
    refresh();
    return result;
  });
}

export async function saveServiceAction(input: unknown) {
  return mutate(async () => saveService((await requireBusiness()).businessId, input));
}
export async function setServiceActiveAction(serviceId: string, active: boolean) {
  return mutate(async () =>
    setServiceActive(
      (await requireBusiness()).businessId,
      idSchema.parse(serviceId),
      Boolean(active),
    ),
  );
}
export async function deleteServiceAction(serviceId: string) {
  return mutate(async () =>
    deleteService((await requireBusiness()).businessId, idSchema.parse(serviceId)),
  );
}
export async function moveServiceAction(serviceId: string, dir: "up" | "down") {
  return mutate(async () =>
    moveItem(
      "service",
      (await requireBusiness()).businessId,
      idSchema.parse(serviceId),
      direction.parse(dir),
    ),
  );
}

export async function saveStaffAction(input: unknown) {
  return mutate(async () => saveStaff((await requireBusiness()).business, input));
}
export async function setStaffActiveAction(staffId: string, active: boolean) {
  return mutate(async () =>
    setStaffActive((await requireBusiness()).business, idSchema.parse(staffId), Boolean(active)),
  );
}
export async function deleteStaffAction(staffId: string) {
  return mutate(async () =>
    deleteStaff((await requireBusiness()).businessId, idSchema.parse(staffId)),
  );
}
export async function moveStaffAction(staffId: string, dir: "up" | "down") {
  return mutate(async () =>
    moveItem(
      "staff",
      (await requireBusiness()).businessId,
      idSchema.parse(staffId),
      direction.parse(dir),
    ),
  );
}

export async function addTimeOffAction(input: unknown) {
  return mutate(async () => {
    const created = await addTimeOff((await requireBusiness()).business, input);
    return { id: created.id };
  });
}
export async function deleteTimeOffAction(timeOffId: string) {
  return mutate(async () =>
    deleteTimeOff((await requireBusiness()).businessId, idSchema.parse(timeOffId)),
  );
}

export async function saveClientAction(input: unknown) {
  return mutate(async () => saveClient((await requireBusiness()).businessId, input));
}

export async function saveProfileAction(input: unknown) {
  return mutate(async () => saveProfile((await requireBusiness()).businessId, input));
}
export async function saveScheduleAction(input: unknown) {
  return mutate(async () => saveBusinessSchedule((await requireBusiness()).businessId, input));
}
export async function saveRulesAction(input: unknown) {
  return mutate(async () => saveRules((await requireBusiness()).businessId, input));
}
export async function saveNotificationsAction(input: unknown) {
  return mutate(async () => {
    const ctx = await requireBusiness();
    return saveNotifications(ctx.businessId, ctx.user.id, input);
  });
}
export async function setPublishedAction(published: boolean) {
  return mutate(async () => setPublished((await requireBusiness()).businessId, Boolean(published)));
}
export async function changeSlugAction(slug: string) {
  return mutate(async () => changeSlug((await requireBusiness()).businessId, slug));
}
