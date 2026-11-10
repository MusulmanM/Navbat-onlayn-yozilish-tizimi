// POST /api/auth/login-token — start a Telegram login (spec 7.4).
import QRCode from "qrcode";
import { botStartLink } from "@/config/public-env";
import { clientIp, rateLimitIp } from "@/lib/rate-limit";
import { ApiError, errorResponse, json } from "@/server/api";
import { createLoginToken } from "@/server/login";

export async function POST(request: Request) {
  try {
    const limit = await rateLimitIp("login", clientIp(request.headers));
    if (!limit.ok) throw new ApiError(429, "TOO_MANY_REQUESTS");
    const link = botStartLink("login_");
    if (!link) throw new ApiError(500, "CONFIG");
    const { token, expiresAt } = await createLoginToken();
    const botLink = `${link}${token}`;
    const svg = await QRCode.toString(botLink, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    });
    return json({
      token,
      expiresAt: expiresAt.toISOString(),
      botLink,
      qr: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
