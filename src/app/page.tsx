// Temporary stage-0 placeholder; replaced by the landing page in stage 5.
// Reads messages directly until next-intl is wired up in stage 2.
import messages from "../../messages/uz.json";

const brandName = process.env.NEXT_PUBLIC_BRAND_NAME ?? "";

export default function Home() {
  const t = messages.Home;

  return (
    <main className="flex flex-1 items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 text-center shadow-sm ring-1 ring-border sm:p-8">
        {brandName && (
          <>
            <div
              aria-hidden
              className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground"
            >
              {brandName.charAt(0).toUpperCase()}
            </div>
            <p className="mt-3 text-lg font-semibold">{brandName}</p>
          </>
        )}
        <span className="mt-5 inline-flex rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
          {t.badge}
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-balance">{t.title}</h1>
        <p className="mt-2 text-base text-pretty text-muted-foreground">{t.subtitle}</p>
      </div>
    </main>
  );
}
