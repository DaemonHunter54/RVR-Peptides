import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ASSETS } from "@/lib/assets";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useGuestCart } from "@/hooks/useGuestCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus, Mail, Send } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { BUSINESS } from "@shared/business";
import type { FulfillmentMethod, PaymentChoice } from "@shared/checkoutOptions";
import { paymentOptionsForFulfillment } from "@shared/checkoutOptions";
import CheckoutWizard from "@/components/checkout/CheckoutWizard";

const makeProductSlug = (value: string) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const isGiftCardProduct = (product: any) =>
  makeProductSlug(product?.slug || product?.name || product?.sku || "") === "gift-card" ||
  String(product?.name || "").toLowerCase().includes("gift card") ||
  String(product?.sku || "").toLowerCase() === "gift-card";

const parseGiftCardAmountFromLabel = (label?: string | null) => {
  const match = String(label || "").match(/(?:gift\s*card\s*)?\$?([0-9]+(?:\.[0-9]{1,2})?)/i);
  const amount = match ? Number(match[1]) : NaN;
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const lineItemUnitPrice = (item: any) => {
  if (isGiftCardProduct(item.product)) {
    const amount = parseGiftCardAmountFromLabel(item.variantLabel || item.product?.variantLabel);
    if (amount) return amount;
  }
  const price = Number(item.product.price);
  return item.product.discountActive && item.product.discountPercent
    ? price * (1 - Number(item.product.discountPercent) / 100)
    : price;
};

export default function Checkout() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const params = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
  const discountCode = params.get("discount") || "";
  const [isProcessing, setIsProcessing] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState("");
  const [accountUsername, setAccountUsername] = useState("");
  const [useGiftCard, setUseGiftCard] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToResearch, setAgreedToResearch] = useState(false);
  const [agreedToAge, setAgreedToAge] = useState(false);

  const cartQuery = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });
  const guestCart = useGuestCart();

  const createOrder = trpc.orders.create.useMutation({
    onError: (err) => { toast.error(err.message); setIsProcessing(false); },
  });
  const pickupSlotsQuery = trpc.pickup.listAvailable.useQuery(undefined, { staleTime: 30_000 });
  const registerMutation = trpc.auth.register.useMutation({
    onError: (err) => { toast.error("Account creation failed: " + err.message); },
  });

  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("ship");
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("email_invoice");
  const [pickupSlotId, setPickupSlotId] = useState<number | null>(null);

  useEffect(() => {
    const allowed = paymentOptionsForFulfillment(fulfillmentMethod);
    if (!allowed.some((option) => option.id === paymentChoice)) {
      setPaymentChoice(allowed[0]?.id || "email_invoice");
    }
    if (fulfillmentMethod !== "local_pickup") setPickupSlotId(null);
  }, [fulfillmentMethod, paymentChoice]);

  const [form, setForm] = useState({
    guestEmail: "",
    guestName: "",
    shippingName: user?.name || "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingZip: "",
    shippingCountry: "US",
    notes: "",
  });

  const authItems = cartQuery.data || [];
  const items = isAuthenticated ? authItems : guestCart.items.map((gi, idx) => ({
    id: idx,
    productId: gi.productId,
    quantity: gi.quantity,
    product: gi.product,
    variantId: gi.variantId,
    variantLabel: gi.variantLabel,
  }));

  const subtotal = items.reduce((sum, item) => sum + lineItemUnitPrice(item) * item.quantity, 0);
  const hasShippableItems = items.some((item) => !isGiftCardProduct(item.product));
  const flatRateShipping = 9.99;
  const shippingCost = fulfillmentMethod === "local_pickup" ? 0 : hasShippableItems ? flatRateShipping : 0;
  const total = subtotal + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const contactEmail = form.guestEmail || user?.email || "";
    if (!contactEmail) {
      toast.error("Email address is required so we can send your invoice and order updates.");
      return;
    }

    if (fulfillmentMethod === "ship" && hasShippableItems && (!form.shippingName || !form.shippingAddress || !form.shippingCity || !form.shippingState || !form.shippingZip)) {
      toast.error("Complete shipping details in the checkout steps.");
      return;
    }

    if (fulfillmentMethod === "local_pickup" && !pickupSlotId) {
      toast.error("Please select a meetup day and time.");
      return;
    }

    if (!isAuthenticated && createAccount) {
      if (!accountPassword || accountPassword.length < 6) {
        toast.error("Password must be at least 6 characters to create an account.");
        return;
      }
      if (!accountUsername || accountUsername.length < 3) {
        toast.error("Username must be at least 3 characters.");
        return;
      }
    }

    if (!agreedToTerms || !agreedToResearch || !agreedToAge) {
      toast.error("Please complete the confirmation checkboxes in the checkout steps.");
      return;
    }

    if (useGiftCard && !giftCardCode.trim()) {
      toast.error("Please enter your gift card code.");
      return;
    }

    setIsProcessing(true);

    try {
      let newUserId: number | undefined;
      if (!isAuthenticated && createAccount && accountPassword && accountUsername) {
        try {
          const regResult = await registerMutation.mutateAsync({
            email: form.guestEmail,
            username: accountUsername,
            password: accountPassword,
            name: form.guestName || undefined,
          });
          newUserId = regResult.user.id;
          toast.success("Account created! Your order will be linked to your new account.");
        } catch {
          toast.info("Could not create account, proceeding as guest.");
        }
      }

      const orderData = await createOrder.mutateAsync({
        userId: isAuthenticated ? user?.id : newUserId,
        guestEmail: !isAuthenticated || !user?.email ? contactEmail : undefined,
        guestName: (!isAuthenticated && !newUserId) ? form.guestName : form.guestName || user?.name || undefined,
        shippingName: fulfillmentMethod === "ship" ? form.shippingName : form.guestName || user?.name || form.shippingName,
        shippingAddress: fulfillmentMethod === "ship" ? form.shippingAddress : undefined,
        shippingCity: fulfillmentMethod === "ship" ? form.shippingCity : undefined,
        shippingState: fulfillmentMethod === "ship" ? form.shippingState : undefined,
        shippingZip: fulfillmentMethod === "ship" ? form.shippingZip : undefined,
        shippingCountry: form.shippingCountry,
        fulfillmentMethod,
        paymentChoice,
        pickupSlotId: fulfillmentMethod === "local_pickup" ? pickupSlotId || undefined : undefined,
        discountCode: discountCode || undefined,
        giftCardCode: useGiftCard && giftCardCode.trim() ? giftCardCode.trim() : undefined,
        items: items.map(item => ({ productId: item.productId, quantity: item.quantity, variantId: (item as any).variantId, variantLabel: (item as any).variantLabel })),
        notes: form.notes || undefined,
      });

      if (!isAuthenticated) guestCart.clearCart();

      if (Number(orderData.total || 0) <= 0 || orderData.paid) {
        toast.success("Order paid with gift card.");
        setLocation(`/order/${orderData.orderNumber}?status=success`);
        return;
      }

      toast.success("Order submitted! We will email you shortly to confirm payment or your meetup time.");
      setLocation(`/order/${orderData.orderNumber}?status=submitted`);
    } catch {
      // handled by mutation
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="container py-8 lg:py-10">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
              {!isAuthenticated ? (
                <div className="bg-white rounded-xl px-5 py-4 border border-slate-200 flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1 grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Full name</Label>
                      <Input value={form.guestName} onChange={(e) => setForm((p) => ({ ...p, guestName: e.target.value }))} className="mt-1 h-9" placeholder="John Doe" />
                    </div>
                    <div>
                      <Label className="text-xs">Email <span className="text-red-500">*</span></Label>
                      <Input type="email" value={form.guestEmail} onChange={(e) => setForm((p) => ({ ...p, guestEmail: e.target.value }))} required className="mt-1 h-9" placeholder="you@email.com" />
                    </div>
                  </div>
                  <a href="/login" className="text-xs text-blue-600 hover:underline shrink-0 pb-1">Sign in</a>
                </div>
              ) : (
                <div className="bg-white rounded-xl px-5 py-3 border border-slate-200 flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="h-4 w-4 text-blue-600" />
                  Ordering as {user?.email}
                </div>
              )}

              <CheckoutWizard
                fulfillmentMethod={fulfillmentMethod}
                onFulfillmentChange={setFulfillmentMethod}
                paymentChoice={paymentChoice}
                onPaymentChange={setPaymentChoice}
                form={{
                  shippingName: form.shippingName,
                  shippingAddress: form.shippingAddress,
                  shippingCity: form.shippingCity,
                  shippingState: form.shippingState,
                  shippingZip: form.shippingZip,
                  notes: form.notes,
                }}
                onFormChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
                pickupSlots={pickupSlotsQuery.data || []}
                pickupSlotsLoading={pickupSlotsQuery.isLoading}
                pickupSlotId={pickupSlotId}
                onPickupSlotChange={setPickupSlotId}
                hasShippableItems={hasShippableItems}
                agreedToTerms={agreedToTerms}
                agreedToResearch={agreedToResearch}
                agreedToAge={agreedToAge}
                onAgreedToTermsChange={setAgreedToTerms}
                onAgreedToResearchChange={setAgreedToResearch}
                onAgreedToAgeChange={setAgreedToAge}
                legalName={BUSINESS.legalName}
                useGiftCard={useGiftCard}
                onUseGiftCardChange={setUseGiftCard}
                giftCardCode={giftCardCode}
                onGiftCardCodeChange={setGiftCardCode}
              />

              {!isAuthenticated ? (
              <div className="bg-white rounded-xl px-5 py-3 border border-slate-200">
                <div className="flex items-start gap-3">
                  <Checkbox id="create-account" checked={createAccount} onCheckedChange={(c) => setCreateAccount(c === true)} className="mt-0.5" />
                  <label htmlFor="create-account" className="text-xs text-slate-600 cursor-pointer flex items-center gap-1">
                    <UserPlus className="h-3.5 w-3.5 text-blue-600" /> Create an account after checkout
                  </label>
                </div>
                {createAccount ? (
                  <div className="mt-3 grid sm:grid-cols-2 gap-3">
                    <Input value={accountUsername} onChange={(e) => setAccountUsername(e.target.value)} placeholder="Username" className="h-9" minLength={3} />
                    <Input type="password" value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)} placeholder="Password (min 6)" className="h-9" minLength={6} />
                  </div>
                ) : null}
              </div>
              ) : null}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 border border-slate-200 sticky top-24 shadow-sm">
                <h2 className="font-semibold text-slate-800 text-lg mb-4">Order Summary</h2>
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {items.map((item) => {
                    const price = Number(item.product.price);
                    const hasDisc = item.product.discountActive && item.product.discountPercent;
                    const unitPrice = hasDisc ? price * (1 - Number(item.product.discountPercent) / 100) : price;
                    return (
                      <div key={item.id} className="flex items-center gap-3">
                        <img src={item.product.imageUrl || ASSETS.peptideVial} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ASSETS.peptideVial; }}
                          className="w-10 h-10 object-contain bg-slate-50 rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{item.product.name}</p>
                          <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-sm font-medium text-slate-800">${(unitPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-slate-100 pt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Shipping</span>
                    <span>{fulfillmentMethod === "local_pickup" ? "Local pickup — Free" : hasShippableItems ? `$${shippingCost.toFixed(2)}` : "Email delivery — Free"}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-slate-100">
                    <span>Total</span><span>${total.toFixed(2)}</span>
                  </div>
                </div>
                <Button type="submit" className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11" disabled={isProcessing || items.length === 0 || !agreedToTerms || !agreedToResearch || !agreedToAge}>
                  {isProcessing ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <><Send className="h-4 w-4" /> Submit Order</>}
                </Button>
                <p className="text-xs text-slate-400 text-center mt-3">All amounts in USD. No online payment at checkout.</p>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
