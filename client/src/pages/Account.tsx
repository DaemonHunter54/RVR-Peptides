import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Truck, Clock, CheckCircle, User, LogOut, Pencil, Save, X, MapPin, CreditCard } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { BUSINESS } from "@shared/business";

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
  const meQuery = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated });
  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      meQuery.refetch();
      setEditing(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to update profile"),
  });

  const [editing, setEditing] = useState(false);
  const [editingShipping, setEditingShipping] = useState(false);

  // Profile form state
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");

  // Shipping form state
  const [shippingAddress, setShippingAddress] = useState("");

  useEffect(() => {
    if (user) {
      setFormName(user.name || "");
      setFormUsername(user.username || "");
      setFormEmail(user.email || "");
      setFormPhone((user as any).phone || "");
      setShippingAddress((user as any).shippingAddress || "");
    }
  }, [user]);

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

  const handleSaveProfile = () => {
    updateProfile.mutate({
      name: formName || undefined,
      username: formUsername || undefined,
      email: formEmail || undefined,
      phone: formPhone || undefined,
    });
  };

  const handleSaveShipping = () => {
    updateProfile.mutate({ shippingAddress });
    setEditingShipping(false);
    toast.success("Shipping address saved!");
  };

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Profile & Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Account Details */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <User className="h-4 w-4" /> Profile Details
                </h2>
                {!editing ? (
                  <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="text-blue-600 hover:text-blue-700">
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="text-slate-500">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" onClick={handleSaveProfile} disabled={updateProfile.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Save className="h-3.5 w-3.5 mr-1" /> Save
                    </Button>
                  </div>
                )}
              </div>

              {!editing ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-slate-500 block">Name</span>
                    <p className="font-medium text-slate-800">{user?.name || "Not set"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Username</span>
                    <p className="font-medium text-slate-800">{user?.username || "Not set"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Email</span>
                    <p className="font-medium text-slate-800">{user?.email || "Not set"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Phone</span>
                    <p className="font-medium text-slate-800">{(user as any)?.phone || "Not set"}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-slate-500">Name</Label>
                    <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Your full name" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Username</Label>
                    <Input value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder="Your username" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Email</Label>
                    <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="your@email.com" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Phone</Label>
                    <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
              )}
            </div>

            {/* Shipping Address */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Shipping Address
                </h2>
                {!editingShipping ? (
                  <Button variant="ghost" size="sm" onClick={() => setEditingShipping(true)} className="text-blue-600 hover:text-blue-700">
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingShipping(false)} className="text-slate-500">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" onClick={handleSaveShipping} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Save className="h-3.5 w-3.5 mr-1" /> Save
                    </Button>
                  </div>
                )}
              </div>

              {!editingShipping ? (
                <p className="text-sm text-slate-700 whitespace-pre-line">
                  {(user as any)?.shippingAddress || "No shipping address saved. Add one for faster checkout."}
                </p>
              ) : (
                <Textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Street address&#10;City, State ZIP&#10;Country"
                  rows={4}
                />
              )}
            </div>

            {/* Payment Information */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <CreditCard className="h-4 w-4" /> Payment Information
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                Payments are completed securely at checkout through PaymentCloud. We do not store
                credit or debit card numbers on our servers.
              </p>
              <p className="text-sm text-slate-500 leading-relaxed mt-3">
                For billing or order questions, email{" "}
                <a href={`mailto:${BUSINESS.ordersEmail}`} className="text-blue-600 hover:underline">
                  {BUSINESS.ordersEmail}
                </a>{" "}
                or{" "}
                <a href={`mailto:${BUSINESS.customerServiceEmail}`} className="text-blue-600 hover:underline">
                  {BUSINESS.customerServiceEmail}
                </a>
                .
              </p>
            </div>
          </div>

          {/* Right column - Orders */}
          <div className="lg:col-span-2">
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
        </div>
      </div>

      <Footer />
    </div>
  );
}
