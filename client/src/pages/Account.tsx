import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Truck, Clock, CheckCircle, User, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
};

export default function Account() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const ordersQuery = trpc.orders.myOrders.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="container py-12">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <User className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">My Account</h1>
            <p className="text-slate-500 mb-6">Sign in to view your orders and account details</p>
            <Link href="/login">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Sign In</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const orders = ordersQuery.data || [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <div className="container py-8 lg:py-12">
        {/* Account Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">My Account</h1>
            <p className="text-slate-500 mt-1">Welcome back, {user?.name || user?.username || user?.email}</p>
          </div>
          <Button variant="outline" onClick={() => logout()} className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>

        {/* Account Info */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-8">
          <h2 className="font-semibold text-slate-800 mb-3">Account Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {user?.name && (
              <div>
                <span className="text-slate-500">Name</span>
                <p className="font-medium text-slate-800">{user.name}</p>
              </div>
            )}
            {user?.email && (
              <div>
                <span className="text-slate-500">Email</span>
                <p className="font-medium text-slate-800">{user.email}</p>
              </div>
            )}
            {user?.username && (
              <div>
                <span className="text-slate-500">Username</span>
                <p className="font-medium text-slate-800">{user.username}</p>
              </div>
            )}
          </div>
        </div>

        {/* Orders */}
        <h2 className="text-xl font-bold text-slate-900 mb-4">Order History</h2>

        {ordersQuery.isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No orders yet</p>
            <Link href="/shop">
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const StatusIcon = statusIcons[order.status] || Package;
              return (
                <Link key={order.id} href={`/order/${order.orderNumber}`}>
                  <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                          <StatusIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">Order #{order.orderNumber}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[order.status] || "bg-slate-100 text-slate-800"}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                        <span className="font-semibold text-slate-800">${Number(order.total).toFixed(2)}</span>
                      </div>
                    </div>
                    {order.trackingNumber && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-sm">
                        <Truck className="h-4 w-4 text-blue-500" />
                        <span className="text-slate-500">Tracking:</span>
                        <span className="font-medium text-blue-600">{order.trackingNumber}</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
