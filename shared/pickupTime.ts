/** Local timezone for meetup scheduling (River Valley, AR area). */
export const BUSINESS_PICKUP_TIMEZONE = "America/Chicago";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function partsFromUtc(ms: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms));

  const pick = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);
  const hour = pick("hour");
  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: hour === 24 ? 0 : hour,
    minute: pick("minute"),
    second: pick("second"),
  };
}

/** Convert a business-local wall clock on `dateStr` (YYYY-MM-DD) to a UTC Date. */
export function businessLocalSlotToUtc(dateStr: string, hour: number, minute: number): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let i = 0; i < 4; i++) {
    const local = partsFromUtc(utc, BUSINESS_PICKUP_TIMEZONE);
    const delta =
      Date.UTC(year, month - 1, day, hour, minute, 0) -
      Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, 0);
    if (delta === 0) break;
    utc += delta;
  }

  return new Date(utc);
}

export function businessDateKeyFromUtc(date: Date | string): string {
  const d = new Date(date);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_PICKUP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const year = parts.find((p) => p.type === "year")?.value || "0000";
  const month = parts.find((p) => p.type === "month")?.value || "01";
  const day = parts.find((p) => p.type === "day")?.value || "01";
  return `${year}-${month}-${day}`;
}

export function businessDayBoundsUtc(dateStr: string): { start: Date; end: Date } {
  const start = businessLocalSlotToUtc(dateStr, 0, 0);
  const end = businessLocalSlotToUtc(dateStr, 23, 59);
  end.setUTCSeconds(59, 999);
  return { start, end };
}

export function formatPickupSlotTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    timeZone: BUSINESS_PICKUP_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatPickupSlotDay(date: Date | string, style: Intl.DateTimeFormatOptions = {}): string {
  return new Date(date).toLocaleDateString("en-US", {
    timeZone: BUSINESS_PICKUP_TIMEZONE,
    ...style,
  });
}

export function businessTodayKey(): string {
  return businessDateKeyFromUtc(new Date());
}

export function addBusinessDays(dateStr: string, days: number): string {
  const anchor = businessLocalSlotToUtc(dateStr, 12, 0);
  anchor.setUTCDate(anchor.getUTCDate() + days);
  return businessDateKeyFromUtc(anchor);
}

export function businessPreviewDays(count: number): Array<{ key: string; weekday: string; dayNum: number; isToday: boolean }> {
  const todayKey = businessTodayKey();
  const days: Array<{ key: string; weekday: string; dayNum: number; isToday: boolean }> = [];

  for (let i = 0; i < count; i++) {
    const key = addBusinessDays(todayKey, i);
    const noon = businessLocalSlotToUtc(key, 12, 0);
    days.push({
      key,
      weekday: formatPickupSlotDay(noon, { weekday: "short" }),
      dayNum: Number(formatPickupSlotDay(noon, { day: "numeric" })),
      isToday: key === todayKey,
    });
  }

  return days;
}
