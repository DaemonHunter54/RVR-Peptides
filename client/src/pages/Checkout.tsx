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
import { Lock, CreditCard, Loader2, UserPlus, Mail } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

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

  // Authenticated cart
  const cartQuery = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });

  // Guest cart
  const guestCart = useGuestCart();

  const createOrder = trpc.orders.create.useMutation({
    onError: (err) => { toast.error(err.message); setIsProcessing(false); },
  });
  const createInvoice = trpc.payments.createInvoice.useMutation({
    onError: (err) => { toast.error("Payment error: " + err.message); setIsProcessing(false); },
  });
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
  }));

  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.product.price);
    const disc = item.product.discountActive && item.product.discountPercent
      ? price * (1 - Number(item.product.discountPercent) / 100) : price;
    return sum + disc * item.quantity;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Validate guest email is provided for guest checkout
    if (!isAuthenticated && !form.guestEmail) {
      toast.error("Email address is required for order updates and tracking information.");
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
        guestEmail: (!isAuthenticated && !newUserId) ? form.guestEmail : undefined,
        guestName: (!isAuthenticated && !newUserId) ? form.guestName : undefined,
        shippingName: form.shippingName,
        shippingAddress: form.shippingAddress,
        shippingCity: form.shippingCity,
        shippingState: form.shippingState,
        shippingZip: form.shippingZip,
        shippingCountry: form.shippingCountry,
        discountCode: discountCode || undefined,
        items: items.map(item => ({ productId: item.productId, quantity: item.quantity })),
        notes: form.notes || undefined,
      });

      // Clear guest cart after successful order
      if (!isAuthenticated) {
        guestCart.clearCart();
      }

      // Step 2: Create NowPayments invoice
      try {
        const invoice = await createInvoice.mutateAsync({
          orderNumber: orderData.orderNumber,
          email: form.guestEmail || user?.email || undefined,
        });

        if (invoice.invoiceUrl) {
          // Redirect to NowPayments checkout
          window.location.href = invoice.invoiceUrl;
          return;
        }
      } catch {
        // Payment creation failed but order exists - redirect to order page
        toast.info("Order created. You can complete payment later.");
      }

      setLocation(`/order/${orderData.orderNumber}`);
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

              {/* Shipping */}
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

              {/* Payment */}
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" /> Payment
                </h2>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-sm text-blue-800 font-medium">Cryptocurrency Payment via NowPayments</p>
                  <p className="text-xs text-blue-600 mt-1">
                    After placing your order, you'll be redirected to NowPayments to complete payment securely.
                    We accept Bitcoin, Ethereum, Litecoin, and 100+ other cryptocurrencies.
                  </p>
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
                        <img src={item.product.imageUrl || ASSETS.peptideVial} alt="" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ASSETS.peptideVial; }}
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
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-slate-100">
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11"
                  disabled={isProcessing || items.length === 0}
                >
                  {isProcessing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <><Lock className="h-4 w-4" /> Place Order & Pay</>
                  )}
                </Button>

                <p className="text-xs text-slate-400 text-center mt-3">
                  Secure checkout powered by NowPayments
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
