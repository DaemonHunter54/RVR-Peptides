import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import {
  businessDateKeyFromUtc,
  businessDayBoundsUtc,
  businessLocalSlotToUtc,
} from "../shared/pickupTime";
import { pickupSlots } from "../drizzle/schema";
import { getDb } from "./db";

export type PickupSlotRow = {
  id: number;
  startsAt: Date;
  endsAt: Date;
  status: "available" | "booked" | "blocked";
  orderId: number | null;
};

export type DaySlotSummary = {
  date: string;
  available: number;
  booked: number;
  blocked: number;
};

export async function listAvailablePickupSlots(from = new Date(), limit = 80): Promise<PickupSlotRow[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(pickupSlots)
    .where(and(eq(pickupSlots.status, "available"), gte(pickupSlots.startsAt, from)))
    .orderBy(asc(pickupSlots.startsAt))
    .limit(limit);
  return rows as PickupSlotRow[];
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export async function listPickupSlotsSummaryForMonth(year: number, month: number): Promise<DaySlotSummary[]> {
  const db = await getDb();
  if (!db) return [];

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = `${year}-${pad(month)}-01`;
  const lastDay = `${year}-${pad(month)}-${pad(daysInMonth)}`;
  const { start } = businessDayBoundsUtc(firstDay);
  const { end } = businessDayBoundsUtc(lastDay);

  const rows = await db
    .select()
    .from(pickupSlots)
    .where(and(gte(pickupSlots.startsAt, start), lte(pickupSlots.startsAt, end)));

  const map = new Map<string, DaySlotSummary>();
  for (const row of rows) {
    const date = businessDateKeyFromUtc(row.startsAt);
    const entry = map.get(date) || { date, available: 0, booked: 0, blocked: 0 };
    if (row.status === "available") entry.available += 1;
    else if (row.status === "booked") entry.booked += 1;
    else if (row.status === "blocked") entry.blocked += 1;
    map.set(date, entry);
  }

  return Array.from(map.values());
}

export async function togglePickupSlotAvailability(slotId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const slot = await getPickupSlotById(slotId);
  if (!slot) throw new Error("Slot not found.");
  if (slot.status === "booked") throw new Error("Booked slots cannot be changed.");
  const next = slot.status === "available" ? "blocked" : "available";
  await db.update(pickupSlots).set({ status: next }).where(eq(pickupSlots.id, slotId));
  return { id: slotId, status: next };
}

export async function listPickupSlotsForDay(dateStr: string): Promise<PickupSlotRow[]> {
  const db = await getDb();
  if (!db) return [];
  const { start, end } = businessDayBoundsUtc(dateStr);
  const rows = await db
    .select()
    .from(pickupSlots)
    .where(and(gte(pickupSlots.startsAt, start), lte(pickupSlots.startsAt, end)))
    .orderBy(asc(pickupSlots.startsAt));

  return (rows as PickupSlotRow[]).filter((row) => businessDateKeyFromUtc(row.startsAt) === dateStr);
}

export async function clearPickupSlotsForDay(dateStr: string) {
  const db = await getDb();
  if (!db) return;
  const openIds = (await listPickupSlotsForDay(dateStr))
    .filter((slot) => slot.status === "available")
    .map((slot) => slot.id);
  if (openIds.length === 0) return;
  await db.delete(pickupSlots).where(inArray(pickupSlots.id, openIds));
}

export async function generatePickupSlotsForDay(input: {
  dateStr: string;
  intervalMinutes: number;
  startHour: number;
  endHour: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const { dateStr, intervalMinutes, startHour, endHour } = input;
  await clearPickupSlotsForDay(dateStr);

  let cursor = startHour * 60;
  const endMinutes = endHour * 60;
  let created = 0;
  while (cursor + intervalMinutes <= endMinutes) {
    const sh = Math.floor(cursor / 60);
    const sm = cursor % 60;
    const next = cursor + intervalMinutes;
    const eh = Math.floor(next / 60);
    const em = next % 60;
    const startsAt = businessLocalSlotToUtc(dateStr, sh, sm);
    const endsAt = businessLocalSlotToUtc(dateStr, eh, em);
    await db.insert(pickupSlots).values({ startsAt, endsAt, status: "available" });
    created += 1;
    cursor = next;
  }
  return created;
}

export async function bookPickupSlot(slotId: number, orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select().from(pickupSlots).where(eq(pickupSlots.id, slotId)).limit(1);
  const slot = existing[0];
  if (!slot || slot.status !== "available") throw new Error("That meetup time is no longer available.");
  await db
    .update(pickupSlots)
    .set({ status: "booked", orderId })
    .where(and(eq(pickupSlots.id, slotId), eq(pickupSlots.status, "available")));
  return { startsAt: slot.startsAt, endsAt: slot.endsAt };
}

export async function getPickupSlotById(slotId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(pickupSlots).where(eq(pickupSlots.id, slotId)).limit(1);
  return rows[0] || null;
}
