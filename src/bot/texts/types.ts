// Shape of bot texts (spec 8.6). All values are escaped by the implementations.

export type BookingCardData = {
  business: string;
  service: string;
  staffLabel: string;
  staff: string;
  date: string;
  time: string;
  price: string;
  address: string;
};

export type OwnerBookingData = {
  client: string;
  clientPhone: string;
  service: string;
  staff: string;
  date: string;
  time: string;
  price: string;
  source: "WEB" | "TELEGRAM" | "PANEL";
  comment: string | null;
  pending: boolean;
};

export type BotTexts = {
  welcome(p: { firstName: string; brand: string; appUrl: string }): string;
  businessCard(p: {
    name: string;
    category: string;
    address: string;
    landmark: string | null;
    todayHours: string | null;
    phone: string;
  }): string;
  bookingConfirmed(p: BookingCardData): string;
  bookingPending(p: Omit<BookingCardData, "price" | "address">): string;
  businessConfirmed(p: {
    business: string;
    date: string;
    time: string;
    service: string;
    staff: string;
  }): string;
  reminder24(p: {
    dayWord: string;
    time: string;
    business: string;
    service: string;
    staff: string;
    address: string;
  }): string;
  reminder2(p: {
    time: string;
    business: string;
    service: string;
    staff: string;
    address: string;
    landmark: string | null;
  }): string;
  comingThanks: string;
  cancelAsk: string;
  cancelledByClient: string;
  tooLateToCancel(p: { hours: number; phone: string }): string;
  cancelledByBusiness(p: {
    business: string;
    date: string;
    time: string;
    reason: string | null;
  }): string;
  rescheduled(p: {
    business: string;
    date: string;
    time: string;
    staffLabel: string;
    staff: string;
    phone: string;
  }): string;
  ownerNewBooking(p: OwnerBookingData): string;
  ownerClientCancelled(p: {
    client: string;
    clientPhone: string;
    service: string;
    staff: string;
    date: string;
    time: string;
  }): string;
  ownerConfirmedSuffix: string;
  ownerRejectedSuffix: string;
  dailyReport(p: { date: string; count: number; lines: string[]; more: number }): string;
  dailyReportEmpty(p: { date: string; link: string }): string;
  todayEmpty: string;
  todayHeader(p: { business: string; date: string; count: number }): string;
  billingWarning(p: { date: string; days: number; billingUrl: string }): string;
  billingExpired(p: { billingUrl: string }): string;
  paymentReceived(p: { date: string }): string;
  loginRequest(p: { brand: string }): string;
  loginDone: string;
  loginRejected: string;
  loginExpired: string;
  bookingNotFound: string;
  noActiveBookings: string;
  myBookingsHeader: string;
  myBookingLine(p: {
    business: string;
    date: string;
    time: string;
    service: string;
    status: string;
  }): string;
  help(p: { support: string }): string;
  yourId(p: { id: string }): string;
  chooseLanguage: string;
  languageChanged: string;
  unknown: string;
  linked: string;
  notAllowed: string;
  adminNewBusiness(p: {
    name: string;
    category: string;
    region: string;
    owner: string;
    username: string | null;
  }): string;
  adminPaymentClaim(p: { business: string; plan: string; adminUrl: string }): string;
  statusLabels: Record<
    | "PENDING"
    | "CONFIRMED"
    | "COMPLETED"
    | "NO_SHOW"
    | "CANCELLED_BY_CLIENT"
    | "CANCELLED_BY_BUSINESS",
    string
  >;
  dayWords: { today: string; tomorrow: string };
  sources: Record<"WEB" | "TELEGRAM" | "PANEL", string>;
  dayOff: string;
  buttons: {
    book: string;
    map: string;
    cancel: string;
    details: string;
    yesComing: string;
    yesCancel: string;
    noKeep: string;
    rebook: string;
    confirm: string;
    reject: string;
    openInPanel: string;
    loginConfirm: string;
    loginReject: string;
    myBookings: string;
    language: string;
    today: string;
    openPanel: string;
    uz: string;
    ru: string;
  };
  commands: Record<"start" | "yozilishlarim" | "bugun" | "til" | "yordam", string>;
  description: string;
  shortDescription: string;
};
