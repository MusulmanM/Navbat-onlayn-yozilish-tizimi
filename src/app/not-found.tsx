import Link from "next/link";
import "./globals.css";

// Fallback for requests that never reach the [locale] segment. Bilingual on purpose.
export default function GlobalNotFound() {
  return (
    <html lang="uz">
      <body className="flex min-h-dvh items-center justify-center bg-muted p-4 font-sans">
        <main className="w-full max-w-sm rounded-2xl bg-card p-6 text-center shadow-sm ring-1 ring-border">
          <p className="text-5xl font-bold text-primary">404</p>
          <h1 className="mt-3 text-xl font-semibold">Sahifa topilmadi · Страница не найдена</h1>
          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 font-medium text-primary-foreground"
          >
            Bosh sahifa · Главная
          </Link>
        </main>
      </body>
    </html>
  );
}
