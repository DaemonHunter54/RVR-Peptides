import { and, asc, eq, gte, sql } from "drizzle-orm";
import { pickupSlots } from "../drizzle/schema";
import { getDb } from "./db";

export type PickupSlotRow = {
  id: number;
  startsAt: Date;
  endsAt: Date;
  status: "available" | "booked";
  orderId: number | null;
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

function pad(n: number) {
  return String(n).padStart(2, "0");
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
