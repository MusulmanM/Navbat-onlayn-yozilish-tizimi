// GET /api/public/bookings/[token] — booking details for the client (by secret token only).
import { ApiError, errorResponse, json } from "@/server/api";
import { getBookingByToken } from "@/server/bookings";

export async function GET(_request: Request, ctx: RouteContext<"/api/public/bookings/[token]">) {
  try {
    const { token } = await ctx.params;
    const booking = await getBookingByToken(token);
    if (!booking) throw new ApiError(404, "BOOKING_NOT_FOUND");
    return json({
      status: booking.status,
      startsAt: booking.startsAt.toISOString(),
      endsAt: booking.endsAt.toISOString(),
      service: booking.serviceNameSnapshot,
      price: booking.priceSnapshot,
      staff: booking.staff.name,
      telegramLinked: booking.client.telegramId !== null,
      business: {
        slug: booking.business.slug,
        name: booking.business.name,
        address: booking.business.address,
        phone: booking.business.phone,
        timezone: booking.business.timezone,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
