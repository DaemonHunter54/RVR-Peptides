import { and, asc, eq, gte, sql } from "drizzle-orm";
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

function dateStrFromUtcParts(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export async function listPickupSlotsSummaryForMonth(year: number, month: number): Promise<DaySlotSummary[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`
    SELECT DATE(startsAt) as day, status, COUNT(*) as cnt
    FROM pickupSlots
    WHERE YEAR(startsAt) = ${year} AND MONTH(startsAt) = ${month}
    GROUP BY DATE(startsAt), status
  `);
  const raw = ((rows as unknown as [{ day: Date | string; status: string; cnt: number }[]])[0] || []);
  const map = new Map<string, DaySlotSummary>();

  for (const row of raw) {
    const date =
      typeof row.day === "string"
        ? row.day.slice(0, 10)
        : dateStrFromUtcParts(row.day as Date);
    const entry = map.get(date) || { date, available: 0, booked: 0, blocked: 0 };
    const count = Number(row.cnt || 0);
    if (row.status === "available") entry.available = count;
    else if (row.status === "booked") entry.booked = count;
    else if (row.status === "blocked") entry.blocked = count;
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
  const rows = await db.execute(sql`
    SELECT id, startsAt, endsAt, status, orderId
    FROM pickupSlots
    WHERE DATE(startsAt) = ${dateStr}
    ORDER BY startsAt ASC
  `);
  return ((rows as unknown as [PickupSlotRow[]])[0] || []) as PickupSlotRow[];
}

export async function clearPickupSlotsForDay(dateStr: string) {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`
    DELETE FROM pickupSlots
    WHERE DATE(startsAt) = ${dateStr} AND status = 'available'
  `);
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
    const startsAt = `${dateStr} ${pad(sh)}:${pad(sm)}:00`;
    const endsAt = `${dateStr} ${pad(eh)}:${pad(em)}:00`;
    await db.insert(pickupSlots).values({ startsAt: new Date(startsAt), endsAt: new Date(endsAt), status: "available" });
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
