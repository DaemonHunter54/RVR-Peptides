import { useEffect, useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type PickupSlotOption = {
  id: number;
  startsAt: string | Date;
  endsAt: string | Date;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dateKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateKeyFromSlot(startsAt: string | Date) {
  return dateKeyFromDate(new Date(startsAt));
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatSlotTime(startsAt: string | Date) {
  return new Date(startsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatSelectedDay(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

type PickupMeetupPickerProps = {
  slots: PickupSlotOption[];
  isLoading: boolean;
  selectedSlotId: number | null;
  onSelectSlot: (slotId: number | null) => void;
};

export default function PickupMeetupPicker({
  slots,
  isLoading,
  selectedSlotId,
  onSelectSlot,
}: PickupMeetupPickerProps) {
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();

  const slotsByDate = useMemo(() => {
    const map = new Map<string, PickupSlotOption[]>();
    for (const slot of slots) {
      const key = dateKeyFromSlot(slot.startsAt);
      const list = map.get(key) || [];
      list.push(slot);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    }
    return map;
  }, [slots]);

  const availableDateKeys = useMemo(() => new Set(slotsByDate.keys()), [slotsByDate]);

  const defaultMonth = useMemo(() => {
    if (slots.length === 0) return new Date();
    return new Date(slots[0].startsAt);
  }, [slots]);

  const selectedDaySlots = useMemo(() => {
    if (!selectedDay) return [];
    return slotsByDate.get(dateKeyFromDate(selectedDay)) || [];
  }, [selectedDay, slotsByDate]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedSlotId) || null,
    [slots, selectedSlotId]
  );

  useEffect(() => {
    if (!selectedSlotId) return;
    const slot = slots.find((s) => s.id === selectedSlotId);
    if (!slot) {
      onSelectSlot(null);
      return;
    }
    const day = startOfDay(new Date(slot.startsAt));
    setSelectedDay(day);
  }, [selectedSlotId, slots, onSelectSlot]);

  useEffect(() => {
    if (selectedSlotId || slots.length === 0) return;
    const firstKey = [...availableDateKeys].sort()[0];
    if (!firstKey) return;
    const [y, m, d] = firstKey.split("-").map(Number);
    setSelectedDay(new Date(y, m - 1, d));
  }, [slots.length, availableDateKeys, selectedSlotId]);

  const handleSelectDay = (day: Date | undefined) => {
    setSelectedDay(day);
    if (!day) {
      onSelectSlot(null);
      return;
    }
    const key = dateKeyFromDate(day);
    const daySlots = slotsByDate.get(key) || [];
    if (selectedSlotId && !daySlots.some((slot) => slot.id === selectedSlotId)) {
      onSelectSlot(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-8 text-sm text-slate-500 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading available meetup days...
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        No meetup times are open right now. Please check back soon or choose shipping instead.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50/90 to-white overflow-hidden shadow-sm">
      <div className="p-4 sm:p-5">
        <Calendar
          mode="single"
          selected={selectedDay}
          onSelect={handleSelectDay}
          defaultMonth={defaultMonth}
          disabled={(date) => {
            if (date < startOfDay(new Date())) return true;
            return !availableDateKeys.has(dateKeyFromDate(date));
          }}
          modifiers={{ hasSlots: (date) => availableDateKeys.has(dateKeyFromDate(date)) }}
          modifiersClassNames={{
            hasSlots: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-blue-500",
          }}
          className="mx-auto w-full max-w-[340px] rounded-lg border border-slate-100 bg-white p-2 shadow-sm"
        />
      </div>

      {selectedDay ? (
        <div className="border-t border-slate-100 bg-white px-4 sm:px-5 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Available times</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{formatSelectedDay(selectedDay)}</p>
            </div>
            {selectedSlot ? (
              <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 self-start sm:self-auto">
                Selected: {formatSlotTime(selectedSlot.startsAt)}
              </p>
            ) : (
              <p className="text-xs text-slate-500">Select a time below</p>
            )}
          </div>

          {selectedDaySlots.length === 0 ? (
            <p className="text-sm text-slate-500">No times available for this day.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {selectedDaySlots.map((slot) => {
                const active = selectedSlotId === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => onSelectSlot(slot.id)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                      active
                        ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50/80"
                    )}
                  >
                    {formatSlotTime(slot.startsAt)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="border-t border-slate-100 px-4 sm:px-5 py-4 text-sm text-slate-500 text-center">
          Select a highlighted day on the calendar to view meetup times.
        </div>
      )}
    </div>
  );
}
