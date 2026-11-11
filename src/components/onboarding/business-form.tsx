"use client";

import { useTranslations } from "next-intl";
import { PhoneInput } from "@/components/common/phone-input";
import { Field, inputClass } from "@/components/panel/fields";
import { CATEGORIES, CATEGORY_CODES, type CategoryCode } from "@/config/categories";
import type { BusinessFormValues } from "@/components/onboarding/business-values";
import type { Locale } from "@/config/locales";
import { REGIONS, REGION_CODES, type RegionCode } from "@/config/regions";

/** Name, category, region, district, address, landmark, phone (spec 7.5 step 1, settings). */
export function BusinessForm({
  values,
  onChange,
  errors,
  locale,
}: {
  values: BusinessFormValues;
  onChange: (values: BusinessFormValues) => void;
  errors: Record<string, string>;
  locale: Locale;
}) {
  const t = useTranslations("Settings");
  const set = <K extends keyof BusinessFormValues>(key: K, value: BusinessFormValues[K]) =>
    onChange({ ...values, [key]: value });
  const err = (key: string) =>
    errors[key] ? (t.has(`errors.${key}`) ? t(`errors.${key}`) : errors[key]) : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="bf-name" label={t("name")} error={err("name")} className="sm:col-span-2">
        <input
          id="bf-name"
          value={values.name}
          maxLength={80}
          autoComplete="organization"
          onChange={(e) => set("name", e.target.value)}
          aria-invalid={!!errors.name || undefined}
          className={inputClass}
        />
      </Field>
      <Field id="bf-category" label={t("category")}>
        <select
          id="bf-category"
          value={values.category}
          onChange={(e) => set("category", e.target.value as CategoryCode)}
          className={inputClass}
        >
          {CATEGORY_CODES.map((code) => (
            <option key={code} value={code}>
              {CATEGORIES[code].emoji} {CATEGORIES[code].name[locale]}
            </option>
          ))}
        </select>
      </Field>
      <Field id="bf-region" label={t("region")}>
        <select
          id="bf-region"
          value={values.region}
          onChange={(e) => set("region", e.target.value as RegionCode)}
          className={inputClass}
        >
          {REGION_CODES.map((code) => (
            <option key={code} value={code}>
              {REGIONS[code][locale]}
            </option>
          ))}
        </select>
      </Field>
      <Field id="bf-district" label={t("district")} error={err("district")}>
        <input
          id="bf-district"
          value={values.district}
          maxLength={80}
          placeholder={t("districtPlaceholder")}
          onChange={(e) => set("district", e.target.value)}
          aria-invalid={!!errors.district || undefined}
          className={inputClass}
        />
      </Field>
      <Field id="bf-phone" label={t("phone")} error={err("phone")}>
        <PhoneInput
          id="bf-phone"
          value={values.phone}
          onChange={(v) => set("phone", v)}
          invalid={!!errors.phone}
        />
      </Field>
      <Field id="bf-address" label={t("address")} error={err("address")} className="sm:col-span-2">
        <input
          id="bf-address"
          value={values.address}
          maxLength={160}
          autoComplete="street-address"
          placeholder={t("addressPlaceholder")}
          onChange={(e) => set("address", e.target.value)}
          aria-invalid={!!errors.address || undefined}
          className={inputClass}
        />
      </Field>
      <Field id="bf-landmark" label={t("landmark")} className="sm:col-span-2">
        <input
          id="bf-landmark"
          value={values.landmark}
          maxLength={120}
          placeholder={t("landmarkPlaceholder")}
          onChange={(e) => set("landmark", e.target.value)}
          className={inputClass}
        />
      </Field>
    </div>
  );
}

export {
  businessPayload,
  validateBusiness,
  type BusinessFormValues,
} from "@/components/onboarding/business-values";
