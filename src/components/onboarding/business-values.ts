// Plain helpers shared by server pages and the client business form.
import type { CategoryCode } from "@/config/categories";
import type { RegionCode } from "@/config/regions";
import { localPart } from "@/lib/phone";

export type BusinessFormValues = {
  name: string;
  category: CategoryCode;
  region: RegionCode;
  district: string;
  address: string;
  landmark: string;
  phone: string; // 9 digits after +998
};

export function initialBusinessValues(
  b?: {
    name: string;
    category: CategoryCode;
    region: RegionCode;
    district: string;
    address: string;
    landmark: string | null;
    phone: string;
  } | null,
): BusinessFormValues {
  return {
    name: b?.name ?? "",
    category: b?.category ?? "BARBERSHOP",
    region: b?.region ?? "TASHKENT_CITY",
    district: b?.district ?? "",
    address: b?.address ?? "",
    landmark: b?.landmark ?? "",
    phone: b ? localPart(b.phone) : "",
  };
}

/** Client-side check mirroring the server rules, so mistakes show before saving. */
export function validateBusiness(values: BusinessFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (values.name.trim().length < 2) errors.name = "name";
  if (values.district.trim().length < 2) errors.district = "district";
  if (values.address.trim().length < 3) errors.address = "address";
  if (values.phone.length !== 9) errors.phone = "phone";
  return errors;
}

export function businessPayload(values: BusinessFormValues) {
  return { ...values, landmark: values.landmark || null, phone: `+998${values.phone}` };
}
