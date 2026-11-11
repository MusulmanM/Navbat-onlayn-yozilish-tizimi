import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./src/i18n/request.ts",
  experimental: {
    // ICU messages are compiled at build time: the browser gets a tiny formatter
    // instead of intl-messageformat (lighter business page, see docs/DECISIONS.md).
    messages: { path: "./messages", format: "json", locales: "infer", precompile: true },
  },
});

const isProd = process.env.NODE_ENV === "production";

const baseHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  // Classic dynamic rendering (see docs/DECISIONS.md): every panel page depends on the
  // session cookie and the database, so Cache Components would add friction, not speed.
  poweredByHeader: false,
  // Docker/VPS builds set NEXT_OUTPUT=standalone (see Dockerfile); Vercel ignores this.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      // Default: no framing at all (panel, admin, login …).
      {
        source: "/:path*",
        headers: [
          ...baseHeaders,
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
      { source: "/:path((?!b/|ru/b/).*)", headers: [{ key: "X-Frame-Options", value: "DENY" }] },
      // Business pages open inside Telegram Web as a Mini App iframe (spec 8.5).
      {
        source: "/b/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org",
          },
        ],
      },
      {
        source: "/ru/b/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
