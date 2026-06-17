import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PICKUP_INTERVALS } from "@shared/checkoutOptions";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function todayStr() {
  const d = new Date();
  return dateStrFromParts(d.getFullYear(), d.getMonth(), d.getDate());
}

function dateStrFromParts(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDateStr(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return { year: y, monthIndex: m - 1, day: d };
}

function formatSlotTime(value: string | Date) {
  return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatHourLabel(hour: number) {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function buildMonthGrid(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<{ date: string | null; day: number | null }> = [];

  for (let i = 0; i < firstDay; i++) cells.push({ date: null, day: null });
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: dateStrFromParts(year, monthIndex, day), day });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, day: null });
  return cells;
}

type RightView = "month" | "day";

export default function AdminPickupCalendar() {
  const [date, setDate] = useState(todayStr());
  const [rightView, setRightView] = useState<RightView>("month");
  const [displayMonth, setDisplayMonth] = useState(() => {
    const t = new Date();
    return { year: t.getFullYear(), monthIndex: t.getMonth() };
  });
  const [intervalMinutes, setIntervalMinutes] = useState<15 | 30 | 60>(30);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(18);

  const monthQuery = trpc.admin.pickup.listMonth.useQuery({
    year: displayMonth.year,
    month: displayMonth.monthIndex + 1,
  });
  const slotsQuery = trpc.admin.pickup.listDay.useQuery({ date }, { enabled: Boolean(date) });

  const refetchAll = () => {
    monthQuery.refetch();
    slotsQuery.refetch();
  };

  const generateMutation = trpc.admin.pickup.generateDay.useMutation({
    onSuccess: (result) => {
      toast.success(`Created ${result.created} available time slots.`);
      refetchAll();
      setRightView("day");
    },
    onError: (err) => toast.error(err.message),
  });
  const clearMutation = trpc.admin.pickup.clearDay.useMutation({
    onSuccess: () => {
      toast.success("Open slots cleared for this day.");
      refetchAll();
    },
    onError: (err) => toast.error(err.message),
  });
  const toggleMutation = trpc.admin.pickup.toggleSlot.useMutation({
    onSuccess: (result) => {
      refetchAll();
      if (result.status === "blocked") toast.message("Slot marked unavailable.");
      else toast.message("Slot marked available.");
    },
    onError: (err) => toast.error(err.message),
  });

  const slots = slotsQuery.data || [];
  const daySummary = useMemo(() => {
    const available = slots.filter((s) => s.status === "available").length;
    const booked = slots.filter((s) => s.status === "booked").length;
    const blocked = slots.filter((s) => s.status === "blocked").length;
    return { available, booked, blocked };
  }, [slots]);

  const summaryByDate = useMemo(() => {
    const map = new Map<string, { available: number; booked: number; blocked: number }>();
    for (const row of monthQuery.data || []) {
      map.set(row.date, { available: row.available, booked: row.booked, blocked: row.blocked });
    }
    return map;
  }, [monthQuery.data]);

  const monthCells = useMemo(
    () => buildMonthGrid(displayMonth.year, displayMonth.monthIndex),
    [displayMonth]
  );

  const monthLabel = new Date(displayMonth.year, displayMonth.monthIndex, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const allDayLabel = useMemo(
    () => `All day (${formatHourLabel(startHour)} – ${formatHourLabel(endHour)}, ${intervalMinutes} min)`,
    [startHour, endHour, intervalMinutes]
  );

  const generateSlotsForDay = () => {
    generateMutation.mutate({ date, intervalMinutes, startHour, endHour });
  };

  const shiftMonth = (delta: number) => {
    setDisplayMonth((prev) => {
      const next = new Date(prev.year, prev.monthIndex + delta, 1);
      return { year: next.getFullYear(), monthIndex: next.getMonth() };
    });
  };

  const openDay = (dateStr: string) => {
    setDate(dateStr);
    const parts = parseDateStr(dateStr);
    setDisplayMonth({ year: parts.year, monthIndex: parts.monthIndex });
    setRightView("day");
  };

  const onDateInputChange = (value: string) => {
    setDate(value);
    if (value) {
      const parts = parseDateStr(value);
      setDisplayMonth({ year: parts.year, monthIndex: parts.monthIndex });
    }
  };

  const slotStyles = (status: string) => {
    if (status === "booked") return "bg-slate-50 border-slate-200 cursor-default";
    if (status === "blocked") return "bg-red-50 border-red-300 hover:bg-red-100 cursor-pointer";
    return "bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100 cursor-pointer";
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarDays className="h-7 w-7 text-blue-600" />
          Local Meetup Calendar
        </h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          Pick a day on the month calendar, generate time slots, then click individual slots to mark them unavailable (red).
          Customers only see open green slots at checkout.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div>
              <Label>Selected date</Label>
              <Input type="date" value={date} onChange={(e) => onDateInputChange(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Slot interval</Label>
              <Select value={String(intervalMinutes)} onValueChange={(v) => setIntervalMinutes(Number(v) as 15 | 30 | 60)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PICKUP_INTERVALS.map((m) => (
                    <SelectItem key={m} value={String(m)}>{m} minutes</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start hour</Label>
                <Select value={String(startHour)} onValueChange={(v) => setStartHour(Number(v))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>{i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>End hour</Label>
                <Select value={String(endHour)} onValueChange={(v) => setEndHour(Number(v))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 25 }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>{i === 0 ? "12 AM" : i <= 12 ? (i === 12 ? "12 PM" : `${i} AM`) : `${i - 12} PM`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={generateMutation.isPending || endHour <= startHour}
              onClick={generateSlotsForDay}
            >
              {allDayLabel}
            </Button>
            <Button
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
              disabled={generateMutation.isPending || endHour <= startHour}
              onClick={generateSlotsForDay}
            >
              {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Generate slots for selected day
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-2"
              disabled={clearMutation.isPending}
              onClick={() => clearMutation.mutate({ date })}
            >
              {clearMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Clear open slots (selected day)
            </Button>
          </div>

          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 text-sm text-blue-900 space-y-2">
            <p className="font-medium">How it works</p>
            <p>1. Click a day on the month calendar.</p>
            <p>2. Generate slots using the controls here.</p>
            <p>3. Click any open slot to mark it unavailable (turns red). Click again to reopen.</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-h-[560px] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              {rightView === "month" ? (
                <>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => shiftMonth(-1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="font-semibold text-slate-800 min-w-[160px] text-center">{monthLabel}</h2>
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => shiftMonth(1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={refetchAll} className="gap-1">
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <Button type="button" variant="ghost" size="sm" className="gap-1 shrink-0" onClick={() => setRightView("month")}>
                      <ChevronLeft className="h-4 w-4" /> Month
                    </Button>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-slate-800 truncate">
                        {new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </h2>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {daySummary.available} open · {daySummary.blocked} unavailable · {daySummary.booked} booked
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={refetchAll} className="gap-1 shrink-0">
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                  </Button>
                </>
              )}
            </div>

            {rightView === "month" ? (
              <div className="p-4 flex-1">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {WEEKDAYS.map((label) => (
                    <div key={label} className="text-center text-xs font-semibold text-slate-500 py-2">
                      {label}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {monthCells.map((cell, index) => {
                    if (!cell.date || !cell.day) {
                      return <div key={`empty-${index}`} className="min-h-[88px] rounded-lg bg-slate-50/50" />;
                    }

                    const summary = summaryByDate.get(cell.date);
                    const total = summary ? summary.available + summary.booked + summary.blocked : 0;
                    const isSelected = cell.date === date;
                    const isToday = cell.date === todayStr();

                    return (
                      <button
                        key={cell.date}
                        type="button"
                        onClick={() => openDay(cell.date!)}
                        className={`min-h-[88px] rounded-lg border p-2 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40 ${
                          isSelected ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200" : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-sm font-semibold ${isToday ? "text-blue-600" : "text-slate-800"}`}>
                            {cell.day}
                          </span>
                          {total > 0 ? (
                            <span className="text-[10px] text-slate-400">{total}</span>
                          ) : null}
                        </div>
                        {summary ? (
                          <div className="mt-2 space-y-1">
                            {summary.available > 0 ? (
                              <div className="h-1.5 rounded-full bg-emerald-400" title={`${summary.available} open`} />
                            ) : null}
                            {summary.blocked > 0 ? (
                              <div className="h-1.5 rounded-full bg-red-400" title={`${summary.blocked} unavailable`} />
                            ) : null}
                            {summary.booked > 0 ? (
                              <div className="h-1.5 rounded-full bg-slate-300" title={`${summary.booked} booked`} />
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 mt-3">No slots</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : slotsQuery.isLoading ? (
              <div className="p-12 text-center text-slate-400 flex-1">Loading slots...</div>
            ) : slots.length === 0 ? (
              <div className="p-12 text-center flex-1">
                <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No slots for this day yet.</p>
                <p className="text-sm text-slate-400 mt-1">Use the left panel to generate availability, or pick another day from the month view.</p>
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setRightView("month")}>
                  Back to month
                </Button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="px-4 py-2 border-b border-slate-100 flex flex-wrap gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400" /> Open — click to block</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400" /> Unavailable — click to reopen</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-300" /> Booked by customer</span>
                </div>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2 p-4 overflow-y-auto flex-1">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={slot.status === "booked" || toggleMutation.isPending}
                      onClick={() => {
                        if (slot.status === "booked") return;
                        toggleMutation.mutate({ slotId: slot.id });
                      }}
                      className={`rounded-lg border px-3 py-2.5 flex items-center justify-between gap-2 text-left transition-colors ${slotStyles(slot.status)}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {formatSlotTime(slot.startsAt)} – {formatSlotTime(slot.endsAt)}
                        </p>
                        {slot.status === "booked" && slot.orderId ? (
                          <p className="text-xs text-slate-500">Order #{slot.orderId}</p>
                        ) : slot.status === "blocked" ? (
                          <p className="text-xs text-red-600">Unavailable</p>
                        ) : (
                          <p className="text-xs text-emerald-700">Open</p>
                        )}
                      </div>
                      <Badge
                        className={
                          slot.status === "booked"
                            ? "bg-slate-200 text-slate-700"
                            : slot.status === "blocked"
                              ? "bg-red-100 text-red-800"
                              : "bg-emerald-100 text-emerald-800"
                        }
                      >
                        {slot.status === "booked" ? "Booked" : slot.status === "blocked" ? "Blocked" : "Open"}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
