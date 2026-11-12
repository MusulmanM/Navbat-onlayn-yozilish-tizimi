import { ImageResponse } from "next/og";
import { categoryName } from "@/config/categories";
import { isLocale } from "@/config/locales";
import { publicEnv } from "@/config/public-env";
import { BRAND_COLOR, BRAND_COLOR_DARK, BRAND_COLOR_SOFT } from "@/config/theme";
import { interFonts } from "@/lib/og-font";
import { loadBusiness } from "./data";

// Preview image when the link is shared in Telegram (spec 13).
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Online booking";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "uz";
  const business = await loadBusiness(slug);
  const brand = publicEnv.brandName;
  const name = business?.name ?? brand;
  const subtitle = business
    ? `${categoryName(business.category, locale)} · ${business.district}`
    : "";
  const address = business?.address ?? "";
  const cta = locale === "ru" ? `Онлайн-запись · ${brand}` : `Onlayn yozilish · ${brand}`;
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  const fonts = await interFonts(`${name}${subtitle}${address}${cta}${initial}`);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: `linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_COLOR_DARK} 100%)`,
        color: "white",
        fontFamily: "Inter",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 36,
            background: BRAND_COLOR_SOFT,
            color: BRAND_COLOR_DARK,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 76,
            fontWeight: 700,
          }}
        >
          {initial}
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 820 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>{name}</div>
          {subtitle && <div style={{ fontSize: 36, opacity: 0.9, marginTop: 12 }}>{subtitle}</div>}
        </div>
      </div>
      {address && <div style={{ fontSize: 34, opacity: 0.9 }}>{address}</div>}
      <div
        style={{
          display: "flex",
          alignSelf: "flex-start",
          background: "white",
          color: BRAND_COLOR_DARK,
          borderRadius: 999,
          padding: "18px 36px",
          fontSize: 34,
          fontWeight: 700,
        }}
      >
        {cta}
      </div>
    </div>,
    // An empty fonts array makes ImageResponse throw; omit it to use the built-in font.
    { ...size, ...(fonts.length > 0 ? { fonts } : {}) },
  );
}
