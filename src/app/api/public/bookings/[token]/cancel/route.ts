// POST /api/public/bookings/[token]/cancel — client cancels (spec 7.3).
import { clientIp } from "@/lib/rate-limit";
import { errorResponse, json } from "@/server/api";
import { cancelByClient } from "@/server/bookings";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/public/bookings/[token]/cancel">,
) {
  try {
    const { token } = await ctx.params;
    const body: unknown = await request.json().catch(() => ({}));
    const result = await cancelByClient(token, body, { ip: clientIp(request.headers) });
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
