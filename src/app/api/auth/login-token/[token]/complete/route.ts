// POST /api/auth/login-token/[token]/complete — confirmed token → session cookie (one time).
import { startSession } from "@/lib/auth/session";
import { ApiError, errorResponse, json } from "@/server/api";
import { consumeLoginToken } from "@/server/login";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/auth/login-token/[token]/complete">,
) {
  try {
    const { token } = await ctx.params;
    const user = await consumeLoginToken(token);
    if (!user) throw new ApiError(409, "EXPIRED");
    await startSession(user);
    return json({ redirect: user.memberships.length > 0 ? "/panel" : "/onboarding" });
  } catch (error) {
    return errorResponse(error);
  }
}
