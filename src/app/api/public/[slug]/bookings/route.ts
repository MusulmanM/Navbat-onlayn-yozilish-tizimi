// POST /api/public/[slug]/bookings — create a booking (spec 6.3).
import { clientIp } from "@/lib/rate-limit";
import { errorResponse, json, readJson } from "@/server/api";
import { createPublicBooking } from "@/server/bookings";

export async function POST(request: Request, ctx: RouteContext<"/api/public/[slug]/bookings">) {
  try {
    const { slug } = await ctx.params;
    const body = await readJson(request);
    const result = await createPublicBooking(slug, body, { ip: clientIp(request.headers) });
    return json(result, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
