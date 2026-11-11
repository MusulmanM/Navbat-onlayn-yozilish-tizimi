import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/public-env";

// Private areas are closed for search engines (spec 13).
const PRIVATE = ["/panel", "/admin", "/api", "/onboarding", "/login", "/y/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: [...PRIVATE, ...PRIVATE.map((p) => `/ru${p}`)] },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
