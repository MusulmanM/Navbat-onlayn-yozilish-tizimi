"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { textareaClass } from "@/components/panel/fields";
import { useAction } from "@/components/panel/use-action";
import { saveClientAction } from "@/server/actions/catalog";

export function ClientNotes({
  id,
  name,
  notes,
}: {
  id: string;
  name: string;
  notes: string | null;
}) {
  const t = useTranslations("ClientsPage");
  const { run, pending } = useAction();
  const [value, setValue] = useState(notes ?? "");
  return (
    <div>
      <label htmlFor="client-notes" className="mb-1.5 block font-medium">
        {t("notes")}
      </label>
      <textarea
        id="client-notes"
        rows={3}
        maxLength={1000}
        value={value}
        placeholder={t("notesPlaceholder")}
        onChange={(e) => setValue(e.target.value)}
        className={textareaClass}
      />
      {value !== (notes ?? "") && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => saveClientAction({ id, name, notes: value }))}
          className="mt-2 inline-flex h-11 items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60"
        >
          {t("saveNotes")}
        </button>
      )}
    </div>
  );
}
