// GET /api/panel/qr?format=png|svg&target=web|telegram — QR of the owner's own business link.
import QRCode from "qrcode";
import { absoluteUrl, botStartLink } from "@/config/public-env";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { errorResponse, ApiError } from "@/server/api";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new ApiError(401, "UNAUTHORIZED");
    const membership = await db.membership.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      include: { business: { select: { slug: true } } },
    });
    if (!membership) throw new ApiError(404, "BUSINESS_NOT_FOUND");

    const params = new URL(request.url).searchParams;
    const format = params.get("format") === "svg" ? "svg" : "png";
    const slug = membership.business.slug;
    const link =
      params.get("target") === "telegram"
        ? (botStartLink(`biz_${slug}`) ?? absoluteUrl(`/b/${slug}`))
        : absoluteUrl(`/b/${slug}`);
    const options = {
      margin: 2,
      errorCorrectionLevel: "M" as const,
      color: { dark: "#0f172a", light: "#ffffff" },
    };

    if (format === "svg") {
      const svg = await QRCode.toString(link, { ...options, type: "svg" });
      return new Response(svg, {
        headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
      });
    }
    const png = await QRCode.toBuffer(link, { ...options, type: "png", width: 1024 });
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="qr-${slug}.png"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
