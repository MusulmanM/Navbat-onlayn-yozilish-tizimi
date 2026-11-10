// GET /api/public/[slug]/days?serviceId=…&staffId=any|<id> → [{ date, hasSlots }] (spec 6.2)
import { z } from "zod";
import { errorResponse, json, parseOrThrow } from "@/server/api";
import { loadAvailability, stripDates } from "@/server/availability";
import { requireBookableBusiness } from "@/server/public-business";

const querySchema = z.object({
  serviceId: z.string().min(1).max(64),
  staffId: z.string().min(1).max(64).default("any"),
});

export async function GET(request: Request, ctx: RouteContext<"/api/public/[slug]/days">) {
  try {
    const { slug } = await ctx.params;
    const query = parseOrThrow(querySchema, Object.fromEntries(new URL(request.url).searchParams));
    const now = new Date();
    const business = await requireBookableBusiness(slug, now);
    const dates = stripDates(business, now);
    const { slotsByDate } = await loadAvailability({
      business,
      serviceId: query.serviceId,
      staffId: query.staffId,
      dates,
      now,
    });
    return json({
      days: dates.map((date) => ({ date, hasSlots: (slotsByDate.get(date)?.length ?? 0) > 0 })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
