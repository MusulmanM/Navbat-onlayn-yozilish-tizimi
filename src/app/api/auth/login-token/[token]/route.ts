// GET /api/auth/login-token/[token] — the login page polls this every 2 seconds.
import { ApiError, errorResponse, json } from "@/server/api";
import { getLoginTokenState } from "@/server/login";

export async function GET(_request: Request, ctx: RouteContext<"/api/auth/login-token/[token]">) {
  try {
    const { token } = await ctx.params;
    const state = await getLoginTokenState(token);
    if (!state) throw new ApiError(404, "NOT_FOUND");
    return json({ state: state.state, expiresAt: state.expiresAt.toISOString() });
  } catch (error) {
    return errorResponse(error);
  }
}
