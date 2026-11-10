// Data passed from the server page to the booking widget, and API shapes.
export type WidgetService = {
  id: string;
  name: string;
  description: string | null;
  durationLabel: string;
  priceLabel: string;
  staffIds: string[];
};

export type WidgetStaff = { id: string; name: string; position: string | null };

export type DayInfo = { date: string; hasSlots: boolean };
export type SlotInfo = { time: string; startsAt: string; staffIds: string[] };

export type BookingResult = {
  bookingId: string;
  manageToken: string;
  status: "PENDING" | "CONFIRMED";
  startsAt: string;
  telegramLink: string | null;
  telegramLinked: boolean;
  staffName: string;
};

export type ApiFailure = {
  code: string;
  status: number;
  fields?: Record<string, string>;
  data?: Record<string, string | number>;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiFailure };
