"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@/config/locales";
import { AddBookingDialog } from "@/components/panel/add-booking-dialog";

export type PanelService = {
  id: string;
  name: string;
  durationMinutes: number;
  priceLabel: string;
  staffIds: string[];
};
export type PanelStaff = { id: string; name: string };

export type PanelInfo = {
  locale: Locale;
  businessName: string;
  slug: string;
  timezone: string;
  today: string;
  staffLabel: string;
  services: PanelService[];
  staff: PanelStaff[];
};

export type AddBookingPrefill = {
  staffId?: string;
  date?: string;
  time?: string;
  client?: { id: string; name: string; phone: string; telegram: boolean };
};

type PanelContextValue = PanelInfo & { openAddBooking: (prefill?: AddBookingPrefill) => void };

const PanelContext = createContext<PanelContextValue | null>(null);

export function usePanel(): PanelContextValue {
  const value = useContext(PanelContext);
  if (!value) throw new Error("usePanel must be used inside PanelProvider");
  return value;
}

export function PanelProvider({ info, children }: { info: PanelInfo; children: ReactNode }) {
  const [prefill, setPrefill] = useState<AddBookingPrefill | null>(null);
  const [open, setOpen] = useState(false);
  const openAddBooking = useCallback((next?: AddBookingPrefill) => {
    setPrefill(next ?? {});
    setOpen(true);
  }, []);
  const value = useMemo(() => ({ ...info, openAddBooking }), [info, openAddBooking]);
  return (
    <PanelContext.Provider value={value}>
      {children}
      {open && prefill && <AddBookingDialog open={open} onOpenChange={setOpen} prefill={prefill} />}
    </PanelContext.Provider>
  );
}
