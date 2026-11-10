// GET /api/public/bookings/[token]/ics — "Add to calendar" file (spec 7.3).
import { absoluteUrl } from "@/config/public-env";
import { buildIcs } from "@/lib/ics";
import { ApiError, errorResponse } from "@/server/api";
import { getBookingByToken } from "@/server/bookings";

export async function GET(request: Request, ctx: RouteContext<"/api/public/bookings/[token]/ics">) {
  try {
    const { token } = await ctx.params;
    const booking = await getBookingByToken(token);
    if (!booking) throw new ApiError(404, "BOOKING_NOT_FOUND");
    const locale = new URL(request.url).searchParams.get("locale") === "ru" ? "ru" : "uz";
    const manageUrl = absoluteUrl(`${locale === "ru" ? "/ru" : ""}/y/${token}`);
    const serviceName =
      locale === "ru"
        ? (booking.service.nameRu ?? booking.serviceNameSnapshot)
        : booking.serviceNameSnapshot;
    const location = [booking.business.address, booking.business.landmark]
      .filter(Boolean)
      .join(", ");

    const ics = buildIcs({
      uid: `${booking.id}@navbat`,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      summary: `${serviceName} — ${booking.business.name}`,
      location,
      description: manageUrl,
      url: manageUrl,
    });
    return new Response(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="booking-${booking.business.slug}.ics"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
