import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ASSETS } from "@/lib/assets";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, Truck, Clock, CheckCircle } from "lucide-react";
import { Link, useParams } from "wouter";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrderDetail() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const orderQuery = trpc.orders.byNumber.useQuery({ orderNumber: orderNumber || "" });
  const order = orderQuery.data;

  if (orderQuery.isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="container py-12">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-slate-800">Order Not Found</h1>
          <Link href="/account">
            <Button className="mt-6 bg-blue-600 hover:bg-blue-700">Back to Account</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <div className="container py-8 lg:py-12">
        <Link href="/account" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Account
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Order #{order.orderNumber}</h1>
            <p className="text-slate-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <Badge className={`text-sm px-3 py-1 ${statusColors[order.status] || "bg-slate-100 text-slate-800"}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h2 className="font-semibold text-slate-800">Items</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <img
                      src={item.product?.imageUrl || ASSETS.peptideVial}
                      alt={item.productName}
                      className="w-16 h-16 object-contain bg-slate-50 rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{item.productName}</p>
                      <p className="text-sm text-slate-500">Qty: {item.quantity} &times; ${Number(item.unitPrice).toFixed(2)}</p>
                    </div>
                    <span className="font-semibold text-slate-800">
                      ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Tracking */}
            {order.trackingNumber && (
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Tracking Information</h3>
                </div>
                <p className="text-sm text-blue-700 font-mono">{order.trackingNumber}</p>
                {order.trackingCarrier && (
                  <p className="text-xs text-blue-600 mt-1">Carrier: {order.trackingCarrier}</p>
                )}
              </div>
            )}

            {/* Summary */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span>${Number(order.subtotal).toFixed(2)}</span>
                </div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${Number(order.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipping</span>
                  <span>${Number(order.shippingCost).toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3">Shipping Address</h3>
              <div className="text-sm text-slate-600 space-y-1">
                <p>{order.shippingName}</p>
                <p>{order.shippingAddress}</p>
                <p>{order.shippingCity}, {order.shippingState} {order.shippingZip}</p>
                <p>{order.shippingCountry}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
