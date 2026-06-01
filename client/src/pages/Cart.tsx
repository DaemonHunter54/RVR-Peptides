import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ASSETS } from "@/lib/assets";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useGuestCart } from "@/hooks/useGuestCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);

  // Authenticated cart
  const cartQuery = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });
  const updateCart = trpc.cart.update.useMutation({ onSuccess: () => cartQuery.refetch() });
  const removeFromCart = trpc.cart.remove.useMutation({ onSuccess: () => cartQuery.refetch() });

  // Guest cart
  const guestCart = useGuestCart();

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
    const discount = item.product.discountActive && item.product.discountPercent
      ? price * (1 - Number(item.product.discountPercent) / 100)
      : price;
    return sum + discount * item.quantity;
  }, 0);

  const discountAmount = appliedDiscount?.discountAmount || 0;
  const freeShippingThreshold = 200;
  const flatRateShipping = 9.99;
  const shippingCost = (subtotal - discountAmount) >= freeShippingThreshold ? 0 : flatRateShipping;
  const total = subtotal - discountAmount + shippingCost;

  const validateDiscount = trpc.discounts.validate.useQuery(
    { code: discountCode, subtotal },
    { enabled: false }
  );

  const handleApplyDiscount = async () => {
    if (!discountCode) return;
    const result = await validateDiscount.refetch();
    if (result.data?.valid) {
      setAppliedDiscount(result.data);
      toast.success(result.data.message);
    } else {
      toast.error(result.data?.message || "Invalid code");
    }
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    if (isAuthenticated) {
      updateCart.mutate({ productId, quantity: Math.max(0, quantity) });
    } else {
      guestCart.updateQuantity(productId, quantity);
    }
  };

  const handleRemoveItem = (productId: number) => {
    if (isAuthenticated) {
      removeFromCart.mutate({ productId });
    } else {
      guestCart.removeItem(productId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <div className="container py-8 lg:py-12">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Your cart is empty</h2>
            <p className="text-slate-500 mb-6">Browse our products and add items to your cart</p>
            <Link href="/shop">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Shop Now</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {!isAuthenticated && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700 mb-2">
                  <Link href="/login" className="font-medium underline hover:text-blue-900">Sign in</Link> to save your cart across devices, or continue as a guest.
                </div>
              )}
              {items.map((item) => {
                const price = Number(item.product.price);
                const hasDiscount = item.product.discountActive && item.product.discountPercent;
                const unitPrice = hasDiscount ? price * (1 - Number(item.product.discountPercent) / 100) : price;

                return (
                  <div key={item.id} className="flex gap-4 p-4 bg-white rounded-xl border border-slate-200">
                    <img
                      src={item.product.imageUrl || ASSETS.peptideVial}
                      alt={item.product.name}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ASSETS.peptideVial; }}
                      className="w-20 h-20 object-contain bg-slate-50 rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-slate-500">${unitPrice.toFixed(2)} each</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-slate-200 rounded-lg">
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                            className="p-1.5 text-slate-500 hover:text-slate-700"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-3 text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                            className="p-1.5 text-slate-500 hover:text-slate-700"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-800">
                            ${(unitPrice * item.quantity).toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(item.productId)}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 sticky top-24">
                <h2 className="font-semibold text-slate-800 text-lg mb-4">Order Summary</h2>

                {/* Discount Code */}
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Discount code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="bg-white"
                  />
                  <Button variant="outline" size="sm" onClick={handleApplyDiscount} className="shrink-0">
                    Apply
                  </Button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-800">${subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Shipping</span>
                    <span className="text-slate-800">{shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}</span>
                  </div>
                  {shippingCost > 0 && (
                    <p className="text-xs text-blue-600">
                      Free shipping on orders over ${freeShippingThreshold}
                    </p>
                  )}
                  <div className="border-t border-slate-200 pt-3 flex justify-between font-semibold text-base">
                    <span className="text-slate-800">Total</span>
                    <span className="text-slate-900">${total.toFixed(2)}</span>
                  </div>
                </div>

                <Link href={`/checkout${appliedDiscount ? `?discount=${discountCode}` : ""}`}>
                  <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11">
                    Proceed to Checkout <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
