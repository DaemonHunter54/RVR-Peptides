import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ArrowLeft, CalendarDays, Home, MapPin, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import type { FulfillmentMethod, PaymentChoice } from "@shared/checkoutOptions";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

type PickupSlot = { id: number; startsAt: string | Date; endsAt: string | Date };

type WizardStep = "fulfillment" | "ship-details" | "pickup-schedule" | "payment" | "agreements";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatSlotTime(startsAt: string | Date) {
  return new Date(startsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const PICKUP_PREVIEW_DAYS = 10;

function ChoiceButton({
  onClick,
  title,
  subtitle,
  icon: Icon,
}: {
  onClick: () => void;
  title: string;
  subtitle: string;
  icon: typeof Truck;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-lg border-2 px-3 py-3 text-left transition-all duration-300 border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      <Icon className="h-4 w-4 mb-1.5 text-blue-600" />
      <p className="font-semibold text-slate-900 text-sm">{title}</p>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{subtitle}</p>
    </button>
  );
}

function PaymentButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex-1 rounded-lg border-2 px-2 py-2.5 text-xs font-semibold transition-all duration-300",
        disabled && "opacity-40 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400",
        !disabled && active && "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20",
        !disabled && !active && "border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50"
      )}
    >
      {label}
    </button>
  );
}

function GiftCardBlock({
  useGiftCard,
  onUseGiftCardChange,
  giftCardCode,
  onGiftCardCodeChange,
}: {
  useGiftCard: boolean;
  onUseGiftCardChange: (v: boolean) => void;
  giftCardCode: string;
  onGiftCardCodeChange: (v: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 space-y-2">
      <p className="text-[11px] font-medium text-slate-700 leading-snug">
        Will you be using a gift card for some or all of this payment?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onUseGiftCardChange(true)}
          className={cn(
            "flex-1 rounded-lg border-2 py-2 text-xs font-semibold transition-all",
            useGiftCard
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
          )}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => {
            onUseGiftCardChange(false);
            onGiftCardCodeChange("");
          }}
          className={cn(
            "flex-1 rounded-lg border-2 py-2 text-xs font-semibold transition-all",
            !useGiftCard
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
          )}
        >
          No
        </button>
      </div>
      {useGiftCard ? (
        <Input
          value={giftCardCode}
          onChange={(e) => onGiftCardCodeChange(e.target.value.replace(/[^A-Za-z0-9-]/g, ""))}
          className="h-8 text-sm"
          placeholder="Gift card code (XXXX-XXXX)"
          maxLength={9}
        />
      ) : null}
    </div>
  );
}

export type CheckoutWizardForm = {
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  notes: string;
};

type CheckoutWizardProps = {
  fulfillmentMethod: FulfillmentMethod;
  onFulfillmentChange: (method: FulfillmentMethod) => void;
  paymentChoice: PaymentChoice;
  onPaymentChange: (choice: PaymentChoice) => void;
  form: CheckoutWizardForm;
  onFormChange: (patch: Partial<CheckoutWizardForm>) => void;
  pickupSlots: PickupSlot[];
  pickupSlotsLoading: boolean;
  pickupSlotId: number | null;
  onPickupSlotChange: (id: number | null) => void;
  hasShippableItems: boolean;
  agreedToTerms: boolean;
  agreedToResearch: boolean;
  agreedToAge: boolean;
  onAgreedToTermsChange: (v: boolean) => void;
  onAgreedToResearchChange: (v: boolean) => void;
  onAgreedToAgeChange: (v: boolean) => void;
  legalName: string;
  useGiftCard: boolean;
  onUseGiftCardChange: (v: boolean) => void;
  giftCardCode: string;
  onGiftCardCodeChange: (v: string) => void;
};

export default function CheckoutWizard(props: CheckoutWizardProps) {
  const {
    fulfillmentMethod,
    onFulfillmentChange,
    paymentChoice,
    onPaymentChange,
    form,
    onFormChange,
    pickupSlots,
    pickupSlotsLoading,
    pickupSlotId,
    onPickupSlotChange,
    hasShippableItems,
    agreedToTerms,
    agreedToResearch,
    agreedToAge,
    onAgreedToTermsChange,
    onAgreedToResearchChange,
    onAgreedToAgeChange,
    legalName,
    useGiftCard,
    onUseGiftCardChange,
    giftCardCode,
    onGiftCardCodeChange,
  } = props;

  const [step, setStep] = useState<WizardStep>("fulfillment");
  const [slidePhase, setSlidePhase] = useState<"enter" | "idle" | "exit">("idle");
  const [pickupDayKey, setPickupDayKey] = useState("");
  const [pickupPhase, setPickupPhase] = useState<"days" | "times">("days");

  const slotsByDate = useMemo(() => {
    const map = new Map<string, PickupSlot[]>();
    for (const slot of pickupSlots) {
      const key = dateKey(new Date(slot.startsAt));
      const list = map.get(key) || [];
      list.push(slot);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    }
    return map;
  }, [pickupSlots]);

  const pickupPreviewDays = useMemo(() => {
    const days: Array<{ key: string; date: Date; weekday: string; dayNum: number; isToday: boolean; hasSlots: boolean }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = dateKey(today);
    for (let i = 0; i < PICKUP_PREVIEW_DAYS; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const key = dateKey(date);
      days.push({
        key,
        date,
        weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: date.getDate(),
        isToday: key === todayKey,
        hasSlots: slotsByDate.has(key),
      });
    }
    return days;
  }, [slotsByDate]);

  const selectedPickupDay = useMemo(
    () => pickupPreviewDays.find((day) => day.key === pickupDayKey) || null,
    [pickupPreviewDays, pickupDayKey]
  );

  const timesForSelectedDay = useMemo(() => {
    if (!pickupDayKey) return [];
    return slotsByDate.get(pickupDayKey) || [];
  }, [pickupDayKey, slotsByDate]);

  const timeSlotGridCols = useMemo(() => {
    const count = timesForSelectedDay.length;
    if (count <= 2) return 2;
    if (count <= 6) return 3;
    return 4;
  }, [timesForSelectedDay.length]);

  const showGiftCardOnShipDetails = fulfillmentMethod === "ship" && hasShippableItems;
  const showGiftCardOnPayment = fulfillmentMethod === "local_pickup" || (fulfillmentMethod === "ship" && !hasShippableItems);

  const stepSequence = useMemo((): WizardStep[] => {
    if (fulfillmentMethod === "ship") {
      if (!hasShippableItems) return ["fulfillment", "payment", "agreements"];
      return ["fulfillment", "ship-details", "payment", "agreements"];
    }
    return ["fulfillment", "pickup-schedule", "payment", "agreements"];
  }, [fulfillmentMethod, hasShippableItems]);

  const stepIndex = Math.max(0, stepSequence.indexOf(step));

  const goToStep = (next: WizardStep) => {
    if (next === step) return;
    setSlidePhase("exit");
    window.setTimeout(() => {
      setStep(next);
      setSlidePhase("enter");
      window.setTimeout(() => setSlidePhase("idle"), 320);
    }, 280);
  };

  const goNext = () => {
    const idx = stepSequence.indexOf(step);
    if (idx >= 0 && idx < stepSequence.length - 1) goToStep(stepSequence[idx + 1]);
  };

  const goBack = () => {
    const idx = stepSequence.indexOf(step);
    if (idx > 0) {
      const prev = stepSequence[idx - 1];
      if (prev === "pickup-schedule" && pickupDayKey) setPickupPhase("times");
      goToStep(prev);
    }
  };

  const selectPickupDay = (key: string) => {
    setPickupDayKey(key);
    onPickupSlotChange(null);
    setPickupPhase("times");
  };

  const selectPickupTime = (slotId: number) => {
    onPickupSlotChange(slotId);
    window.setTimeout(() => goToStep("payment"), 220);
  };

  const showPickupDayPicker = () => {
    setPickupPhase("days");
    onPickupSlotChange(null);
  };

  const selectFulfillment = (method: FulfillmentMethod) => {
    onFulfillmentChange(method);
    if (method === "ship") {
      onPaymentChange("email_invoice");
      goToStep(hasShippableItems ? "ship-details" : "payment");
    } else {
      onPaymentChange("local_invoice");
      setPickupDayKey("");
      setPickupPhase("days");
      onPickupSlotChange(null);
      goToStep("pickup-schedule");
    }
  };

  const selectPayment = (choice: PaymentChoice) => {
    onPaymentChange(choice);
  };

  useEffect(() => {
    if (fulfillmentMethod !== "local_pickup") return;
    if (pickupDayKey && !slotsByDate.has(pickupDayKey)) {
      setPickupDayKey("");
      setPickupPhase("days");
      onPickupSlotChange(null);
    }
  }, [fulfillmentMethod, pickupDayKey, slotsByDate, onPickupSlotChange]);

  useEffect(() => {
    if (slidePhase === "enter") {
      const t = window.setTimeout(() => setSlidePhase("idle"), 320);
      return () => window.clearTimeout(t);
    }
  }, [slidePhase]);

  const panelClass = cn(
    "absolute inset-0 flex flex-col px-4 sm:px-5 py-3 transition-all duration-300 ease-in-out",
    slidePhase === "exit" && "-translate-y-6 opacity-0 pointer-events-none",
    slidePhase === "enter" && "translate-y-6 opacity-0",
    slidePhase === "idle" && "translate-y-0 opacity-100"
  );

  const showPanel = (name: WizardStep) => step === name;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-md shadow-slate-200/50 overflow-hidden">
      <div className="px-4 sm:px-5 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-gradient-to-r from-slate-50 to-white">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Checkout</p>
          <p className="text-sm font-semibold text-slate-900">
            Step {stepIndex + 1} of {stepSequence.length}
          </p>
        </div>
        <div className="flex gap-1.5">
          {stepSequence.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === stepIndex ? "w-6 bg-blue-600" : i < stepIndex ? "w-1.5 bg-blue-300" : "w-1.5 bg-slate-200"
              )}
            />
          ))}
        </div>
      </div>

      <div className="relative h-[min(375px,48vh)] min-h-[320px] overflow-hidden">
        {step !== "fulfillment" ? (
          <button
            type="button"
            onClick={goBack}
            className="absolute top-2 left-3 z-20 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        ) : null}

        {showPanel("fulfillment") ? (
          <div className={panelClass}>
            <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full">
              <h2 className="text-base font-bold text-slate-900 text-center mb-1">How would you like to receive your order?</h2>
              <p className="text-xs text-slate-500 text-center mb-3">Choose one option to continue.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <ChoiceButton
                  icon={Truck}
                  title="Ship to my home"
                  subtitle="Invoice emailed when you submit your order."
                  onClick={() => selectFulfillment("ship")}
                />
                <ChoiceButton
                  icon={MapPin}
                  title="Local pickup / meetup"
                  subtitle="Choose a day and time, pay in person."
                  onClick={() => selectFulfillment("local_pickup")}
                />
              </div>
            </div>
          </div>
        ) : null}

        {showPanel("ship-details") ? (
          <div className={panelClass}>
            <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full pt-4 space-y-2">
              <h2 className="text-base font-bold text-slate-900">Shipping details</h2>
              <p className="text-[11px] text-slate-500">Invoice will be emailed when you submit your order.</p>
              <div>
                <Label className="text-[11px]">Full name</Label>
                <Input value={form.shippingName} onChange={(e) => onFormChange({ shippingName: e.target.value })} className="mt-0.5 h-8 text-sm" placeholder="John Doe" />
              </div>
              <div>
                <Label className="text-[11px]">Address</Label>
                <Input value={form.shippingAddress} onChange={(e) => onFormChange({ shippingAddress: e.target.value })} className="mt-0.5 h-8 text-sm" placeholder="123 Main St" />
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                <div className="col-span-2">
                  <Label className="text-[11px]">City</Label>
                  <Input value={form.shippingCity} onChange={(e) => onFormChange({ shippingCity: e.target.value })} className="mt-0.5 h-8 text-sm" />
                </div>
                <div className="col-span-1">
                  <Label className="text-[11px]">State</Label>
                  <Select value={form.shippingState} onValueChange={(v) => onFormChange({ shippingState: v })}>
                    <SelectTrigger className="mt-0.5 h-8 text-xs"><SelectValue placeholder="ST" /></SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-[11px]">ZIP code</Label>
                  <Input value={form.shippingZip} onChange={(e) => onFormChange({ shippingZip: e.target.value })} className="mt-0.5 h-8 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-[11px]">Order notes (optional)</Label>
                <Textarea value={form.notes} onChange={(e) => onFormChange({ notes: e.target.value })} className="mt-0.5 min-h-[36px] text-xs resize-none" rows={1} placeholder="Delivery instructions..." />
              </div>
              {showGiftCardOnShipDetails ? (
                <GiftCardBlock
                  useGiftCard={useGiftCard}
                  onUseGiftCardChange={onUseGiftCardChange}
                  giftCardCode={giftCardCode}
                  onGiftCardCodeChange={onGiftCardCodeChange}
                />
              ) : null}
              <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-sm mt-0.5" onClick={goNext}>
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {showPanel("pickup-schedule") ? (
          <div className={panelClass}>
            <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full pt-5">
              {pickupSlotsLoading ? (
                <p className="text-sm text-slate-500 text-center">Loading available times...</p>
              ) : pickupSlots.length === 0 ? (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  No meetup times are open right now. Go back and choose shipping instead.
                </p>
              ) : pickupPhase === "days" ? (
                <>
                  <h2 className="text-base font-bold text-slate-900 text-center mb-1">Choose a meetup day</h2>
                  <p className="text-[11px] text-slate-500 text-center mb-3">Next {PICKUP_PREVIEW_DAYS} days with open slots</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {pickupPreviewDays.map((day) => (
                      <button
                        key={day.key}
                        type="button"
                        disabled={!day.hasSlots}
                        onClick={() => selectPickupDay(day.key)}
                        className={cn(
                          "aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-200 min-w-0 p-0.5",
                          !day.hasSlots && "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300",
                          day.hasSlots && "border-slate-200 bg-white text-slate-800 hover:border-blue-400 hover:bg-blue-50/60"
                        )}
                      >
                        <span className="text-[8px] font-semibold uppercase leading-none text-slate-500">{day.weekday}</span>
                        <span className="text-xs font-bold leading-tight mt-0.5">{day.dayNum}</span>
                        {day.isToday ? (
                          <span className="text-[7px] leading-none mt-0.5 text-blue-600">Today</span>
                        ) : day.hasSlots ? (
                          <span className="h-1 w-1 rounded-full mt-0.5 bg-blue-500" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Pick a time</h2>
                      {selectedPickupDay ? (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {selectedPickupDay.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={showPickupDayPicker}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 shrink-0"
                    >
                      <CalendarDays className="h-3 w-3" /> Change day
                    </button>
                  </div>
                  {timesForSelectedDay.length === 0 ? (
                    <p className="text-[11px] text-slate-500 text-center py-8">No times available for this day.</p>
                  ) : (
                    <div
                      className="grid gap-1.5 max-h-[200px] overflow-y-auto overscroll-contain pr-0.5"
                      style={{ gridTemplateColumns: `repeat(${timeSlotGridCols}, minmax(0, 1fr))` }}
                    >
                      {timesForSelectedDay.map((slot) => {
                        const active = pickupSlotId === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => selectPickupTime(slot.id)}
                            className={cn(
                              "rounded-lg border py-2.5 text-xs font-semibold transition-all flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
                              active
                                ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                                : "border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50/80"
                            )}
                          >
                            {formatSlotTime(slot.startsAt)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : null}

        {showPanel("payment") ? (
          <div className={panelClass}>
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 text-center mb-1">Payment method</h2>
                <p className="text-[11px] text-slate-500 text-center">
                  {fulfillmentMethod === "ship"
                    ? "Shipped orders are paid by email invoice."
                    : "Choose how you will pay at your local meetup."}
                </p>
              </div>
              <div className="flex gap-2">
                {fulfillmentMethod === "ship" ? (
                  <>
                    <PaymentButton label="Invoice" active={paymentChoice === "email_invoice"} onClick={() => selectPayment("email_invoice")} />
                    <PaymentButton label="Card" disabled onClick={() => {}} />
                    <PaymentButton label="Cash" disabled onClick={() => {}} />
                  </>
                ) : (
                  <>
                    <PaymentButton label="Invoice" active={paymentChoice === "local_invoice"} onClick={() => selectPayment("local_invoice")} />
                    <PaymentButton label="Card" active={paymentChoice === "local_card"} onClick={() => selectPayment("local_card")} />
                    <PaymentButton label="Cash" active={paymentChoice === "local_cash"} onClick={() => selectPayment("local_cash")} />
                  </>
                )}
              </div>
              {fulfillmentMethod === "ship" ? (
                <p className="text-[10px] text-slate-400 text-center">Card and cash are available for local pickup orders.</p>
              ) : null}
              {showGiftCardOnPayment ? (
                <GiftCardBlock
                  useGiftCard={useGiftCard}
                  onUseGiftCardChange={onUseGiftCardChange}
                  giftCardCode={giftCardCode}
                  onGiftCardCodeChange={onGiftCardCodeChange}
                />
              ) : null}
              {fulfillmentMethod === "local_pickup" ? (
                <div>
                  <Label className="text-[11px]">Order notes (optional)</Label>
                  <Textarea value={form.notes} onChange={(e) => onFormChange({ notes: e.target.value })} className="mt-0.5 min-h-[36px] text-xs resize-none" rows={1} placeholder="Preferred meetup location..." />
                </div>
              ) : null}
              <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-sm" onClick={goNext}>
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {showPanel("agreements") ? (
          <div className={panelClass}>
            <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full pt-3 space-y-2">
              <h2 className="text-base font-bold text-slate-900">Confirm & submit</h2>
              <p className="text-[11px] text-slate-500">Accept the following, then submit using the button on the right.</p>
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5">
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox checked={agreedToAge} onCheckedChange={(c) => onAgreedToAgeChange(c === true)} className="mt-0.5 h-3.5 w-3.5" />
                  <span className="text-[11px] text-slate-700 leading-snug">I confirm that I am 18 years of age or older.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox checked={agreedToResearch} onCheckedChange={(c) => onAgreedToResearchChange(c === true)} className="mt-0.5 h-3.5 w-3.5" />
                  <span className="text-[11px] text-slate-700 leading-snug">
                    I confirm that all products are for laboratory, in-vitro research, or analytical purposes only — not for human or animal consumption.
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox checked={agreedToTerms} onCheckedChange={(c) => onAgreedToTermsChange(c === true)} className="mt-0.5 h-3.5 w-3.5" />
                  <span className="text-[11px] text-slate-700 leading-snug">
                    I agree to the{" "}
                    <Link href="/terms" className="text-blue-600 hover:underline">Terms</Link>,{" "}
                    <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>, and{" "}
                    <Link href="/shipping" className="text-blue-600 hover:underline">Shipping & Returns</Link> of {legalName}.
                  </span>
                </label>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5">
                <Home className="h-3 w-3 shrink-0" />
                {fulfillmentMethod === "ship" ? "Ready to submit — invoice will be emailed." : "Ready to submit — we will confirm your meetup."}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
