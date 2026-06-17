import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PICKUP_INTERVALS } from "@shared/checkoutOptions";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatSlotTime(value: string | Date) {
  return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function AdminPickupCalendar() {
  const [date, setDate] = useState(todayStr());
  const [intervalMinutes, setIntervalMinutes] = useState<15 | 30 | 60>(30);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(18);

  const slotsQuery = trpc.admin.pickup.listDay.useQuery({ date }, { enabled: Boolean(date) });
  const generateMutation = trpc.admin.pickup.generateDay.useMutation({
    onSuccess: (result) => {
      toast.success(`Created ${result.created} available time slots.`);
      slotsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const clearMutation = trpc.admin.pickup.clearDay.useMutation({
    onSuccess: () => {
      toast.success("Available slots cleared for this day.");
      slotsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const slots = slotsQuery.data || [];
  const availableCount = useMemo(() => slots.filter((s) => s.status === "available").length, [slots]);
  const bookedCount = useMemo(() => slots.filter((s) => s.status === "booked").length, [slots]);

  const setAllDay30 = () => {
    setIntervalMinutes(30);
    setStartHour(9);
    setEndHour(18);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarDays className="h-7 w-7 text-blue-600" />
          Local Meetup Calendar
        </h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          Set when you are available for local delivery meetups. Customers choose from open slots at checkout.
          Use &ldquo;All day (30 min)&rdquo; for a quick full-day schedule.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5" />
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
            <Button type="button" variant="outline" className="w-full" onClick={setAllDay30}>
              All day (9 AM – 6 PM, 30 min)
            </Button>
            <Button
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
              disabled={generateMutation.isPending || endHour <= startHour}
              onClick={() => generateMutation.mutate({ date, intervalMinutes, startHour, endHour })}
            >
              {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Generate slots
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-2"
              disabled={clearMutation.isPending}
              onClick={() => clearMutation.mutate({ date })}
            >
              {clearMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Clear open slots
            </Button>
          </div>

          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 text-sm text-blue-900">
            <p className="font-medium mb-1">Tip</p>
            <p>Booked slots stay on the calendar when you regenerate. Only open slots are replaced when you generate again.</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-800">
                  {new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">{availableCount} open · {bookedCount} booked</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => slotsQuery.refetch()} className="gap-1">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
            </div>

            {slotsQuery.isLoading ? (
              <div className="p-12 text-center text-slate-400">Loading slots...</div>
            ) : slots.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No slots for this day yet.</p>
                <p className="text-sm text-slate-400 mt-1">Generate availability using the panel on the left.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2 p-4 max-h-[520px] overflow-y-auto">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`rounded-lg border px-3 py-2.5 flex items-center justify-between gap-2 ${
                      slot.status === "booked" ? "bg-slate-50 border-slate-200" : "bg-emerald-50/60 border-emerald-200"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {formatSlotTime(slot.startsAt)} – {formatSlotTime(slot.endsAt)}
                      </p>
                      {slot.status === "booked" && slot.orderId ? (
                        <p className="text-xs text-slate-500">Order #{slot.orderId}</p>
                      ) : null}
                    </div>
                    <Badge className={slot.status === "booked" ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-800"}>
                      {slot.status === "booked" ? "Booked" : "Open"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
