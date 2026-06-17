import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ArrowLeft, Home, MapPin, Truck } from "lucide-react";
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

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatSlotTime(startsAt: string | Date) {
  return new Date(startsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

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
      className="flex-1 rounded-xl border-2 px-4 py-5 text-left transition-all duration-300 border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      <Icon className="h-5 w-5 mb-2 text-blue-600" />
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
        "flex-1 rounded-xl border-2 px-3 py-4 text-sm font-semibold transition-all duration-300",
        disabled && "opacity-40 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400",
        !disabled && active && "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20",
        !disabled && !active && "border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50"
      )}
    >
      {label}
    </button>
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
  } = props;

  const [step, setStep] = useState<WizardStep>("fulfillment");
  const [slidePhase, setSlidePhase] = useState<"enter" | "idle" | "exit">("idle");
  const [pickupDayKey, setPickupDayKey] = useState("");

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

  const nextSevenDays = useMemo(() => {
    const days: Array<{ key: string; date: Date; label: string; hasSlots: boolean }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const key = dateKey(date);
      days.push({ key, date, label: formatDayLabel(date), hasSlots: slotsByDate.has(key) });
    }
    return days;
  }, [slotsByDate]);

  const timesForSelectedDay = useMemo(() => {
    if (!pickupDayKey) return [];
    return slotsByDate.get(pickupDayKey) || [];
  }, [pickupDayKey, slotsByDate]);

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
    if (idx > 0) goToStep(stepSequence[idx - 1]);
  };

  const selectFulfillment = (method: FulfillmentMethod) => {
    onFulfillmentChange(method);
    if (method === "ship") {
      onPaymentChange("email_invoice");
      goToStep(hasShippableItems ? "ship-details" : "payment");
    } else {
      onPaymentChange("local_invoice");
      setPickupDayKey("");
      onPickupSlotChange(null);
      goToStep("pickup-schedule");
    }
  };

  const selectPayment = (choice: PaymentChoice) => {
    onPaymentChange(choice);
    window.setTimeout(() => goToStep("agreements"), 180);
  };

  useEffect(() => {
    if (fulfillmentMethod !== "local_pickup") return;
    if (pickupDayKey && !slotsByDate.has(pickupDayKey)) {
      setPickupDayKey("");
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
    "absolute inset-0 flex flex-col px-6 sm:px-8 py-6 transition-all duration-300 ease-in-out",
    slidePhase === "exit" && "-translate-y-6 opacity-0 pointer-events-none",
    slidePhase === "enter" && "translate-y-6 opacity-0",
    slidePhase === "idle" && "translate-y-0 opacity-100"
  );

  const showPanel = (name: WizardStep) => step === name;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/60 overflow-hidden">
      <div className="px-6 sm:px-8 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
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

      <div className="relative h-[min(560px,72vh)] min-h-[480px] overflow-hidden">
        {step !== "fulfillment" ? (
          <button
            type="button"
            onClick={goBack}
            className="absolute top-4 left-4 z-20 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        ) : null}

        {showPanel("fulfillment") ? (
          <div className={panelClass}>
            <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full">
              <h2 className="text-xl font-bold text-slate-900 text-center mb-2">How would you like to receive your order?</h2>
              <p className="text-sm text-slate-500 text-center mb-6">Choose one option to continue.</p>
              <div className="flex flex-col sm:flex-row gap-3">
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
            <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full pt-6 space-y-3">
              <h2 className="text-lg font-bold text-slate-900">Shipping details</h2>
              <p className="text-xs text-slate-500 mb-1">Invoice will be emailed when you submit your order.</p>
              <div>
                <Label className="text-xs">Full name</Label>
                <Input value={form.shippingName} onChange={(e) => onFormChange({ shippingName: e.target.value })} className="mt-1 h-9" placeholder="John Doe" />
              </div>
              <div>
                <Label className="text-xs">Address</Label>
                <Input value={form.shippingAddress} onChange={(e) => onFormChange({ shippingAddress: e.target.value })} className="mt-1 h-9" placeholder="123 Main St" />
              </div>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-2">
                  <Label className="text-xs">City</Label>
                  <Input value={form.shippingCity} onChange={(e) => onFormChange({ shippingCity: e.target.value })} className="mt-1 h-9" />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">State</Label>
                  <Select value={form.shippingState} onValueChange={(v) => onFormChange({ shippingState: v })}>
                    <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder="ST" /></SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">ZIP code</Label>
                  <Input value={form.shippingZip} onChange={(e) => onFormChange({ shippingZip: e.target.value })} className="mt-1 h-9" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Order notes (optional)</Label>
                <Textarea value={form.notes} onChange={(e) => onFormChange({ notes: e.target.value })} className="mt-1 min-h-[56px] text-sm resize-none" rows={2} placeholder="Delivery instructions..." />
              </div>
              <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700 h-10 mt-1" onClick={goNext}>
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {showPanel("pickup-schedule") ? (
          <div className={panelClass}>
            <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full pt-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Choose a meetup day and time</h2>
              {pickupSlotsLoading ? (
                <p className="text-sm text-slate-500">Loading available times...</p>
              ) : pickupSlots.length === 0 ? (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  No meetup times are open right now. Go back and choose shipping instead.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Day</Label>
                      <Select
                        value={pickupDayKey}
                        onValueChange={(v) => {
                          setPickupDayKey(v);
                          onPickupSlotChange(null);
                        }}
                      >
                        <SelectTrigger className="mt-1 h-10"><SelectValue placeholder="Select a day" /></SelectTrigger>
                        <SelectContent>
                          {nextSevenDays.map((day) => (
                            <SelectItem key={day.key} value={day.key} disabled={!day.hasSlots}>
                              {day.label}{!day.hasSlots ? " — unavailable" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Time</Label>
                      <Select
                        value={pickupSlotId ? String(pickupSlotId) : ""}
                        onValueChange={(v) => onPickupSlotChange(Number(v))}
                        disabled={!pickupDayKey}
                      >
                        <SelectTrigger className={cn("mt-1 h-10", !pickupDayKey && "opacity-50")}>
                          <SelectValue placeholder={pickupDayKey ? "Select a time" : "Select a day first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {timesForSelectedDay.map((slot) => (
                            <SelectItem key={slot.id} value={String(slot.id)}>
                              {formatSlotTime(slot.startsAt)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Order notes (optional)</Label>
                    <Textarea value={form.notes} onChange={(e) => onFormChange({ notes: e.target.value })} className="mt-1 min-h-[56px] text-sm resize-none" rows={2} placeholder="Preferred meetup location..." />
                  </div>
                  <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700 h-10" disabled={!pickupSlotId} onClick={goNext}>
                    Continue
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : null}

        {showPanel("payment") ? (
          <div className={panelClass}>
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
              <h2 className="text-lg font-bold text-slate-900 text-center mb-2">Payment method</h2>
              <p className="text-xs text-slate-500 text-center mb-6">
                {fulfillmentMethod === "ship"
                  ? "Shipped orders are paid by email invoice."
                  : "Choose how you will pay at your local meetup."}
              </p>
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
                <p className="text-[11px] text-slate-400 text-center mt-4">Card and cash are available for local pickup orders.</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {showPanel("agreements") ? (
          <div className={panelClass}>
            <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full pt-4 space-y-3">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Confirm & submit</h2>
              <p className="text-xs text-slate-500 mb-2">Accept the following, then submit your order using the button on the right.</p>
              <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <Checkbox checked={agreedToAge} onCheckedChange={(c) => onAgreedToAgeChange(c === true)} className="mt-0.5" />
                  <span className="text-xs text-slate-700 leading-snug">I confirm that I am 18 years of age or older.</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <Checkbox checked={agreedToResearch} onCheckedChange={(c) => onAgreedToResearchChange(c === true)} className="mt-0.5" />
                  <span className="text-xs text-slate-700 leading-snug">
                    I confirm that all products are for laboratory, in-vitro research, or analytical purposes only — not for human or animal consumption.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <Checkbox checked={agreedToTerms} onCheckedChange={(c) => onAgreedToTermsChange(c === true)} className="mt-0.5" />
                  <span className="text-xs text-slate-700 leading-snug">
                    I agree to the{" "}
                    <Link href="/terms" className="text-blue-600 hover:underline">Terms</Link>,{" "}
                    <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>, and{" "}
                    <Link href="/shipping" className="text-blue-600 hover:underline">Shipping & Returns</Link> of {legalName}.
                  </span>
                </label>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                <Home className="h-3.5 w-3.5 shrink-0" />
                {fulfillmentMethod === "ship" ? "Ready to submit — invoice will be emailed." : "Ready to submit — we will confirm your meetup."}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
