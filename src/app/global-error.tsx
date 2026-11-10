"use client";

import "./globals.css";

// Last-resort error page when even the root layout fails. Bilingual, no i18n dependency.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="uz">
      <body className="flex min-h-dvh items-center justify-center bg-muted p-4 font-sans">
        <main
          role="alert"
          className="w-full max-w-sm rounded-2xl bg-card p-6 text-center shadow-sm ring-1 ring-border"
        >
          <h1 className="text-xl font-semibold">
            Nimadir xato ketdi. Birozdan keyin qayta urinib koʻring.
          </h1>
          <p className="mt-2 text-muted-foreground">Что-то пошло не так. Попробуйте чуть позже.</p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 font-medium text-primary-foreground"
          >
            Qayta urinish · Повторить
          </button>
        </main>
      </body>
    </html>
  );
}
