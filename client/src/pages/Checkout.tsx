import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ASSETS } from "@/lib/assets";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useGuestCart } from "@/hooks/useGuestCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus, Mail, MapPin, CalendarClock, Send } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { BUSINESS } from "@shared/business";
import {
  FULFILLMENT_METHODS,
  paymentOptionsForFulfillment,
  type FulfillmentMethod,
  type PaymentChoice,
} from "@shared/checkoutOptions";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];


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

  // Authenticated cart
  const cartQuery = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });

  // Guest cart
  const guestCart = useGuestCart();

  const createOrder = trpc.orders.create.useMutation({
    onError: (err) => { toast.error(err.message); setIsProcessing(false); },
  });
  const pickupSlotsQuery = trpc.pickup.listAvailable.useQuery(undefined, { staleTime: 30_000 });
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("ship");
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("email_invoice");
  const [pickupSlotId, setPickupSlotId] = useState<number | null>(null);

  const paymentOptions = useMemo(() => paymentOptionsForFulfillment(fulfillmentMethod), [fulfillmentMethod]);

  useEffect(() => {
    const allowed = paymentOptionsForFulfillment(fulfillmentMethod);
    if (!allowed.some((option) => option.id === paymentChoice)) {
      setPaymentChoice(allowed[0]?.id || "email_invoice");
    }
    if (fulfillmentMethod !== "local_pickup") setPickupSlotId(null);
  }, [fulfillmentMethod, paymentChoice]);

  const registerMutation = trpc.auth.register.useMutation({
    onError: (err) => { toast.error("Account creation failed: " + err.message); },
  });

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

  // Unified items
  const authItems = cartQuery.data || [];
  const items = isAuthenticated ? authItems : guestCart.items.map((gi, idx) => ({
    id: idx,
    productId: gi.productId,
    quantity: gi.quantity,
    product: gi.product,
    variantId: gi.variantId,
    variantLabel: gi.variantLabel,
  }));

  const subtotal = items.reduce((sum, item) => {
    return sum + lineItemUnitPrice(item) * item.quantity;
  }, 0);
  const hasShippableItems = items.some((item) => !isGiftCardProduct(item.product));
  const flatRateShipping = 9.99;
  const shippingCost =
    fulfillmentMethod === "local_pickup" ? 0 : hasShippableItems ? flatRateShipping : 0;
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
      toast.error("Shipping address is required for shipped orders.");
      return;
    }

    if (fulfillmentMethod === "local_pickup" && !pickupSlotId) {
      toast.error("Please select an available local meetup time.");
      return;
    }

    // Validate account creation fields if opted in
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

    if (!agreedToTerms) {
      toast.error("Please agree to the Terms and Conditions and Privacy Policy before placing your order.");
      return;
    }

    if (!agreedToResearch) {
      toast.error("Please confirm that your purchase is for laboratory research purposes only.");
      return;
    }

    if (!agreedToAge) {
      toast.error("Please confirm that you are 18 years of age or older.");
      return;
    }

    setIsProcessing(true);

    try {
      // If guest wants to create an account, do it first
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
          // Account creation failed but we can still proceed with guest checkout
          toast.info("Could not create account, proceeding as guest.");
        }
      }

      // Step 1: Create the order
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

      // Clear guest cart after successful order
      if (!isAuthenticated) {
        guestCart.clearCart();
      }

      if (Number(orderData.total || 0) <= 0 || orderData.paid) {
        toast.success("Order paid with gift card.");
        setLocation(`/order/${orderData.orderNumber}?status=success`);
        return;
      }

      toast.success("Order submitted! We will email you shortly to confirm payment or your meetup time.");
      setLocation(`/order/${orderData.orderNumber}?status=submitted`);
    } catch {
      // Order creation failed - error already shown by mutation
    } finally {
      setIsProcessing(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="container py-8 lg:py-12">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Guest Info - Required email for receipts/tracking */}
              {!isAuthenticated && (
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" /> Contact Information
                  </h2>
                  <p className="text-sm text-slate-500 mb-4">
                    Already have an account? <a href="/login" className="text-blue-600 hover:underline font-medium">Sign in</a> to track your orders.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input value={form.guestName} onChange={(e) => updateField("guestName", e.target.value)} required className="mt-1.5" placeholder="John Doe" />
                    </div>
                    <div>
                      <Label>Email Address <span className="text-red-500">*</span></Label>
                      <Input type="email" value={form.guestEmail} onChange={(e) => updateField("guestEmail", e.target.value)} required className="mt-1.5" placeholder="john@example.com" />
                      <p className="text-xs text-slate-400 mt-1">Required for order receipt, tracking updates, and shipping notifications.</p>
                    </div>
                  </div>

                  {/* Account Creation Option */}
                  <div className="mt-5 pt-5 border-t border-slate-100">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="create-account"
                        checked={createAccount}
                        onCheckedChange={(checked) => setCreateAccount(checked === true)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <label htmlFor="create-account" className="text-sm font-medium text-slate-800 cursor-pointer flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-blue-600" />
                          Create an account for faster future checkouts
                        </label>
                        <p className="text-xs text-slate-500 mt-1">
                          Track orders, save shipping info, and get exclusive member discounts.
                        </p>
                      </div>
                    </div>

                    {createAccount && (
                      <div className="mt-4 ml-7 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div>
                          <Label className="text-sm">Username</Label>
                          <Input
                            value={accountUsername}
                            onChange={(e) => setAccountUsername(e.target.value)}
                            className="mt-1.5 bg-white"
                            placeholder="Choose a username"
                            minLength={3}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Password</Label>
                          <Input
                            type="password"
                            value={accountPassword}
                            onChange={(e) => setAccountPassword(e.target.value)}
                            className="mt-1.5 bg-white"
                            placeholder="Min 6 characters"
                            minLength={6}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* Gift Card */}
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="use-gift-card"
                    checked={useGiftCard}
                    onCheckedChange={(checked) => setUseGiftCard(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <label htmlFor="use-gift-card" className="text-sm font-semibold text-slate-800 cursor-pointer">
                      Use gift card
                    </label>
                    <p className="text-xs text-slate-500 mt-1">Enter your 8-digit code in XXXX-XXXX format. Available balances can cover full or partial payment.</p>
                    {useGiftCard && (
                      <Input
                        value={giftCardCode}
                        onChange={(e) => setGiftCardCode(e.target.value.replace(/[^A-Za-z0-9-]/g, ""))}
                        className="mt-3 max-w-xs"
                        placeholder="XXXX-XXXX"
                        maxLength={9}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Fulfillment & payment */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-5">
                <div>
                  <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" /> How would you like to receive your order?
                  </h2>
                  <Select value={fulfillmentMethod} onValueChange={(v) => setFulfillmentMethod(v as FulfillmentMethod)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.values(FULFILLMENT_METHODS).map((method) => (
                        <SelectItem key={method.id} value={method.id}>{method.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-2">{FULFILLMENT_METHODS[fulfillmentMethod].description}</p>
                </div>

                <div>
                  <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Send className="h-5 w-5 text-blue-600" /> Payment method
                  </h2>
                  <Select value={paymentChoice} onValueChange={(v) => setPaymentChoice(v as PaymentChoice)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {paymentOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-2">
                    {paymentOptions.find((o) => o.id === paymentChoice)?.description}
                  </p>
                </div>

                {fulfillmentMethod === "local_pickup" && (
                  <div>
                    <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <CalendarClock className="h-5 w-5 text-blue-600" /> Choose a meetup time
                    </h2>
                    {pickupSlotsQuery.isLoading ? (
                      <p className="text-sm text-slate-500">Loading available times...</p>
                    ) : (pickupSlotsQuery.data || []).length === 0 ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        No meetup times are open right now. Please check back soon or choose shipping instead.
                      </div>
                    ) : (
                      <Select value={pickupSlotId ? String(pickupSlotId) : ""} onValueChange={(v) => setPickupSlotId(Number(v))}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select a time slot" /></SelectTrigger>
                        <SelectContent>
                          {(pickupSlotsQuery.data || []).map((slot) => (
                            <SelectItem key={slot.id} value={String(slot.id)}>{slot.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      We will email or text you to confirm your appointment after you submit the order.
                    </p>
                  </div>
                )}
              </div>

              {/* Shipping */}
              {fulfillmentMethod === "ship" && hasShippableItems ? (
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h2 className="font-semibold text-slate-800 mb-4">Shipping Address</h2>
                <div className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={form.shippingName} onChange={(e) => updateField("shippingName", e.target.value)} required className="mt-1.5" placeholder="John Doe" />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input value={form.shippingAddress} onChange={(e) => updateField("shippingAddress", e.target.value)} required className="mt-1.5" placeholder="123 Main St" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input value={form.shippingCity} onChange={(e) => updateField("shippingCity", e.target.value)} required className="mt-1.5" />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Select value={form.shippingState} onValueChange={(v) => updateField("shippingState", v)}>
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="State" /></SelectTrigger>
                        <SelectContent>
                          {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>ZIP Code</Label>
                      <Input value={form.shippingZip} onChange={(e) => updateField("shippingZip", e.target.value)} required className="mt-1.5" />
                    </div>
                  </div>
                  <div>
                    <Label>Order Notes (optional)</Label>
                    <Textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} className="mt-1.5" placeholder="Special instructions..." rows={3} />
                  </div>
                </div>
              </div>
              ) : fulfillmentMethod === "ship" ? (
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h2 className="font-semibold text-slate-800 mb-2">Email Delivery</h2>
                <p className="text-sm text-slate-500">This order contains only gift cards, so no shipping address or shipping fee is required.</p>
              </div>
              ) : null}

              {fulfillmentMethod === "local_pickup" && (
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <h2 className="font-semibold text-slate-800 mb-2">Local pickup</h2>
                  <p className="text-sm text-slate-500">No shipping address needed. Meet locally at your selected time.</p>
                  <div className="mt-4">
                    <Label>Order Notes (optional)</Label>
                    <Textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} className="mt-1.5" placeholder="Preferred meetup location or special instructions..." rows={3} />
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-800 font-medium">No online payment at checkout</p>
                  <p className="text-xs text-slate-600 leading-relaxed mt-2">
                    When you submit your order, {BUSINESS.legalName} receives your order details by email.
                    {fulfillmentMethod === "ship"
                      ? " You will receive an invoice by email to pay before your order ships."
                      : " We will confirm your meetup time and you can pay by invoice, card, or cash in person."}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="agree-age"
                    checked={agreedToAge}
                    onCheckedChange={(checked) => setAgreedToAge(checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="agree-age" className="text-sm text-slate-700 leading-relaxed cursor-pointer">
                    I confirm that I am 18 years of age or older.
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="agree-research"
                    checked={agreedToResearch}
                    onCheckedChange={(checked) => setAgreedToResearch(checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="agree-research" className="text-sm text-slate-700 leading-relaxed cursor-pointer">
                    I confirm that all products in this order are intended for laboratory, in-vitro research, or analytical purposes only and are not for human or animal consumption.
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="agree-terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="agree-terms" className="text-sm text-slate-700 leading-relaxed cursor-pointer">
                    I agree to the{" "}
                    <Link href="/terms" className="text-blue-600 hover:underline">Terms and Conditions</Link>,{" "}
                    <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>, and{" "}
                    <Link href="/shipping" className="text-blue-600 hover:underline">Shipping, Returns & Refunds</Link> policies of {BUSINESS.legalName}.
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 border border-slate-200 sticky top-24">
                <h2 className="font-semibold text-slate-800 text-lg mb-4">Order Summary</h2>

                <div className="space-y-3 mb-4">
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
                  {items.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No items in cart. <a href="/shop" className="text-blue-600 underline">Browse products</a></p>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Shipping</span>
                    <span>
                      {fulfillmentMethod === "local_pickup"
                        ? "Local pickup — Free"
                        : hasShippableItems
                          ? `$${shippingCost.toFixed(2)}`
                          : "Email delivery — Free"}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-slate-100">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11"
                  disabled={isProcessing || items.length === 0 || !agreedToTerms || !agreedToResearch || !agreedToAge}
                >
                  {isProcessing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Submit Order</>
                  )}
                </Button>

                <p className="text-xs text-slate-400 text-center mt-3">
                  All amounts in USD. The owner will follow up by email to confirm payment or your meetup.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
