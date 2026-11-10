"use server";

// Panel booking actions. The business is always taken from the session (requireBusiness).
import { refresh } from "next/cache";
import { z } from "zod";
import { BOOKING_STATUSES } from "@/lib/bookings";
import { requireBusiness } from "@/lib/auth/guards";
import { isValidDateStr } from "@/lib/time";
import { parseOrThrow } from "@/server/api";
import { transitionBooking } from "@/server/booking-status";
import {
  createPanelBooking,
  panelSlots,
  rescheduleBooking,
  searchClients,
  updateInternalNote,
} from "@/server/panel/bookings";
import { runAction } from "@/server/panel/result";

const statusSchema = z.object({
  bookingId: z.string().min(1).max(64),
  to: z.enum(BOOKING_STATUSES),
  reason: z.string().trim().max(300).optional(),
});

export async function setBookingStatusAction(input: z.input<typeof statusSchema>) {
  return runAction(async () => {
    const { businessId } = await requireBusiness();
    const { bookingId, to, reason } = parseOrThrow(statusSchema, input);
    await transitionBooking({ bookingId, businessId, to, actor: "business", reason });
    refresh();
    return null;
  });
}

export async function createBookingAction(input: unknown) {
  return runAction(async () => {
    const { business } = await requireBusiness();
    const result = await createPanelBooking(business, input);
    refresh();
    return result;
  });
}

export async function rescheduleAction(input: unknown) {
  return runAction(async () => {
    const { business } = await requireBusiness();
    const result = await rescheduleBooking(business, input);
    refresh();
    return result;
  });
}

export async function updateNoteAction(bookingId: string, note: string) {
  return runAction(async () => {
    const { businessId } = await requireBusiness();
    await updateInternalNote(businessId, String(bookingId), String(note));
    refresh();
    return null;
  });
}

const slotsSchema = z.object({
  serviceId: z.string().min(1).max(64),
  staffId: z.string().min(1).max(64),
  date: z.string().refine(isValidDateStr),
  outsideHours: z.boolean().default(false),
  excludeBookingId: z.string().max(64).optional(),
});

export async function panelSlotsAction(input: z.input<typeof slotsSchema>) {
  return runAction(async () => {
    const { business } = await requireBusiness();
    return panelSlots(business, parseOrThrow(slotsSchema, input));
  });
}

export async function searchClientsAction(query: string) {
  return runAction(async () => {
    const { businessId } = await requireBusiness();
    return searchClients(businessId, String(query).slice(0, 60));
  });
}
