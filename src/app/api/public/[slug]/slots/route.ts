// GET /api/public/[slug]/slots?serviceId=…&staffId=any|<id>&date=YYYY-MM-DD (spec 6.2)
import { z } from "zod";
import { isValidDateStr } from "@/lib/time";
import { errorResponse, json, parseOrThrow } from "@/server/api";
import { loadAvailability } from "@/server/availability";
import { requireBookableBusiness } from "@/server/public-business";

const querySchema = z.object({
  serviceId: z.string().min(1).max(64),
  staffId: z.string().min(1).max(64).default("any"),
  date: z.string().refine(isValidDateStr, "date"),
});

export async function GET(request: Request, ctx: RouteContext<"/api/public/[slug]/slots">) {
  try {
    const { slug } = await ctx.params;
    const query = parseOrThrow(querySchema, Object.fromEntries(new URL(request.url).searchParams));
    const now = new Date();
    const business = await requireBookableBusiness(slug, now);
    const { slotsByDate } = await loadAvailability({
      business,
      serviceId: query.serviceId,
      staffId: query.staffId,
      dates: [query.date],
      now,
    });
    const slots = slotsByDate.get(query.date) ?? [];
    return json({
      date: query.date,
      slots: slots.map((s) => ({
        time: s.time,
        startsAt: s.startsAt.toISOString(),
        staffIds: s.staffIds,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
