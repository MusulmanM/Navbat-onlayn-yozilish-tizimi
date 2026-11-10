import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter covers Latin (incl. ʻ U+02BB, ʼ U+02BC) and Cyrillic; subsets load only when used.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const brandName = process.env.NEXT_PUBLIC_BRAND_NAME ?? "";

export const metadata: Metadata = {
  title: brandName,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
