import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ASSETS } from "@/lib/assets";
import { productAssetForSlug } from "@/lib/productAssetMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings, Tag,
  Plus, Pencil, Trash2, Search, Truck, Save, ArrowLeft,
  DollarSign, AlertCircle, CreditCard, Eye, EyeOff, CheckCircle2, XCircle,
  Paintbrush, RotateCcw
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

// ─── Admin Layout ────────────────────────────────────────────────────
export default function AdminPanel() {
  const { user, isAuthenticated, loading } = useAuth();
  const { section } = useParams<{ section?: string }>();
  const activeSection = section || "dashboard";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-500 mb-4">You need admin privileges to access this page.</p>
          <Link href="/"><Button className="bg-blue-600 hover:bg-blue-700 text-white">Go Home</Button></Link>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "discounts", label: "Discounts", icon: Tag },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "customers", label: "Customers", icon: Users },
    { id: "customization", label: "Website Customization", icon: Paintbrush },
    { id: "settings", label: "Site Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full overflow-y-auto hidden lg:block">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={ASSETS.logoIcon} alt="RVR" className="h-8 w-8" />
            <span className="font-bold text-slate-800 text-sm">Admin Panel</span>
          </Link>
          <button onClick={() => toast.info("Email platform coming soon. This will link to your email management dashboard once configured.")} className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline">
            Email
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => (
            <Link key={item.id} href={item.id === "dashboard" ? "/admin" : `/admin/${item.id}`}>
              <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === item.id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
          <Link href="/"><Button variant="ghost" size="sm" className="w-full gap-2 text-slate-500"><ArrowLeft className="h-4 w-4" /> Back to Store</Button></Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <img src={ASSETS.logoIcon} alt="RVR" className="h-8 w-8" />
              <span className="font-bold text-slate-800 text-sm">Admin</span>
            </Link>
            <button onClick={() => toast.info("Email platform coming soon. This will link to your email management dashboard once configured.")} className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline">
              Email
            </button>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {menuItems.map((item) => (
              <Link key={item.id} href={item.id === "dashboard" ? "/admin" : `/admin/${item.id}`}>
                <button className={`p-2 rounded-lg ${activeSection === item.id ? "bg-blue-50 text-blue-700" : "text-slate-500"}`}>
                  <item.icon className="h-4 w-4" />
                </button>
              </Link>
            ))}
          </div>
        </div>
        <div className="p-6 lg:p-8">
          {activeSection === "dashboard" && <DashboardSection />}
          {activeSection === "products" && <ProductsSection />}
          {activeSection === "orders" && <OrdersSection />}
          {activeSection === "discounts" && <DiscountsSection />}
          {activeSection === "customers" && <CustomersSection />}
          {activeSection === "payments" && <PaymentsSection />}
          {activeSection === "customization" && <CustomizationSection />}
          {activeSection === "settings" && <SettingsSection />}
        </div>
      </main>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────
function DashboardSection() {
  const statsQuery = trpc.admin.dashboard.useQuery();
  const stats = statsQuery.data;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Orders", value: stats?.totalOrders ?? 0, icon: ShoppingCart, color: "blue" },
          { label: "Total Revenue", value: `$${(stats?.totalRevenue ?? 0).toFixed(2)}`, icon: DollarSign, color: "green" },
          { label: "Products", value: stats?.totalProducts ?? 0, icon: Package, color: "purple" },
          { label: "Customers", value: stats?.totalUsers ?? 0, icon: Users, color: "orange" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">{stat.label}</span>
              <stat.icon className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Recent Orders</h2>
        </div>
        <RecentOrdersTable />
      </div>
    </div>
  );
}

function RecentOrdersTable() {
  const ordersQuery = trpc.admin.orders.list.useQuery({ limit: 10 });
  const result = ordersQuery.data;
  const orders = result?.orders || (Array.isArray(result) ? result : []);

  if (ordersQuery.isLoading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-500">Order</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">Customer</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">Total</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order: any) => (
            <tr key={order.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-blue-600">#{order.orderNumber}</td>
              <td className="px-4 py-3 text-slate-600">{order.shippingName || order.guestName || "N/A"}</td>
              <td className="px-4 py-3">
                <Badge className={`text-xs ${order.status === "delivered" ? "bg-green-100 text-green-800" : order.status === "shipped" ? "bg-purple-100 text-purple-800" : order.status === "processing" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>{order.status}</Badge>
              </td>
              <td className="px-4 py-3 font-medium">${Number(order.total).toFixed(2)}</td>
              <td className="px-4 py-3 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Products ────────────────────────────────────────────────────────
function ProductsSection() {
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const productsQuery = trpc.admin.products.list.useQuery({ search: search || undefined });
  const createProduct = trpc.admin.products.create.useMutation({
    onSuccess: () => { toast.success("Product created!"); productsQuery.refetch(); setShowForm(false); setEditingProduct(null); },
    onError: (err: any) => toast.error(err.message),
  });
  const updateProduct = trpc.admin.products.update.useMutation({
    onSuccess: () => { toast.success("Product updated!"); productsQuery.refetch(); setShowForm(false); setEditingProduct(null); },
    onError: (err: any) => toast.error(err.message),
  });
  const deleteProduct = trpc.admin.products.delete.useMutation({
    onSuccess: () => { toast.success("Product deleted"); productsQuery.refetch(); },
    onError: (err: any) => toast.error(err.message),
  });


  const products = productsQuery.data?.products ?? (Array.isArray(productsQuery.data) ? productsQuery.data : []);

  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        onSave={(data: any) => {
          if (data.id) {
            updateProduct.mutate(data);
          } else {
            const { id, ...rest } = data;
            createProduct.mutate(rest);
          }
        }}
        onCancel={() => { setShowForm(false); setEditingProduct(null); }}
        saving={createProduct.isPending || updateProduct.isPending}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <div className="flex gap-2">
          <Button onClick={() => { setEditingProduct(null); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Product</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Price</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Stock</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product: any) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={product.imageUrl || ASSETS.peptideVial} alt="" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ASSETS.peptideVial; }}
                      className="w-10 h-10 object-contain bg-slate-50 rounded" />
                      <div>
                        <p className="font-medium text-slate-800">{product.name}</p>
                        <p className="text-xs text-slate-400">{product.sku || "No SKU"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">${Number(product.price).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={product.stockQuantity <= 0 ? "text-red-600 font-medium" : "text-slate-600"}>{product.stockQuantity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={product.inStock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingProduct(product); setShowForm(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => { if (confirm("Delete this product?")) deleteProduct.mutate({ id: product.id }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Product Form ────────────────────────────────────────────────────
const makeSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const generatedVialUrl = (slug: string) => slug ? `/api/vial/${slug}.png` : "";
const generatedVialPreviewUrl = (slug: string, name: string, size?: string) => {
  const safeSlug = slug || makeSlug(name || "preview-product") || "preview-product";
  const params = new URLSearchParams();
  if (name) params.set("name", name);
  if (size) params.set("size", size);
  return `/api/vial/${safeSlug}.png${params.toString() ? `?${params.toString()}` : ""}`;
};
const imageUrlForSlug = (slug: string) => productAssetForSlug(slug) || generatedVialUrl(slug);
const imageUrlForVariant = (productSlug: string, variantLabel: string) => {
  const variantSlug = makeSlug(`${productSlug} ${variantLabel}`);
  return productAssetForSlug(variantSlug) || generatedVialUrl(variantSlug);
};
const blankVariant = () => ({ label: "", price: "", compareAtPrice: "", sku: "", stockQuantity: 100, inStock: true, imageUrl: "", sortOrder: 0 });

function ProductVialPreview({ name, slug, size }: { name: string; slug: string; size?: string }) {
  // Live preview uses the company blank vial asset and overlays the typed
  // product details without depending on a cached generated image.
  const cleanName = String(name || "").trim();
  const cleanSize = String(size || "").trim();
  const displayName = cleanName.toUpperCase();
  const displaySize = cleanSize.toUpperCase();

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">Live Vial Preview</h3>
          <p className="text-xs text-slate-500">Auto-updates from product name and size.</p>
        </div>
        <Badge variant="outline">Company blank vial</Badge>
      </div>
      <div className="flex justify-center rounded-lg bg-white p-4 min-h-[300px] overflow-hidden">
        <div className="relative w-[300px] h-[300px]">
          <img
            src={ASSETS.vialTemplate}
            alt="Live vial preview"
            className="absolute inset-0 h-full w-full object-contain"
          />

          <div className="absolute left-[25%] top-[58%] w-[50%] text-center pointer-events-none">
            {displayName ? (
              <div
                className="font-black leading-tight text-[#0b3767] break-words drop-shadow-sm"
                style={{ fontSize: displayName.length > 20 ? 10 : displayName.length > 13 ? 12 : 15 }}
              >
                {displayName}
              </div>
            ) : null}
            {displaySize ? (
              <div className="mt-1 text-[13px] font-black leading-none text-[#0b3767] drop-shadow-sm">
                {displaySize}
              </div>
            ) : null}
            {(displayName || displaySize) ? (
              <div className="mt-1 text-[6px] font-bold tracking-[0.08em] text-slate-500 uppercase">
                Research Use Only
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductForm({ product, onSave, onCancel, saving }: any) {
  const categoriesQuery = trpc.categories.list.useQuery();
  const [form, setForm] = useState({
    id: product?.id,
    name: product?.name || "",
    slug: product?.slug || "",
    sku: product?.sku || "",
    price: product?.price ? String(product.price) : "",
    compareAtPrice: product?.compareAtPrice ? String(product.compareAtPrice) : "",
    description: product?.description || "",
    shortDescription: product?.shortDescription || "",
    imageUrl: product?.imageUrl || "",
    inStock: product?.inStock ?? true,
    stockQuantity: product?.stockQuantity ?? 100,
    isFeatured: product?.isFeatured ?? false,
    isActive: product?.isActive ?? true,
    purity: product?.purity || "",
    size: product?.size || "",
    form: product?.form || "",
    contents: product?.contents || "",
    molecularFormula: product?.molecularFormula || "",
    molecularWeight: product?.molecularWeight || "",
    otherNames: product?.otherNames || "",
    discountPercent: product?.discountPercent ? String(product.discountPercent) : "",
    discountActive: product?.discountActive ?? false,
    categoryIds: product?.categories?.map((c: any) => c.id) || [],
    coaUrl: product?.coaUrl || "",
    hplcUrl: product?.hplcUrl || "",
    massSpecUrl: product?.massSpecUrl || "",
    variants: product?.variants?.length ? product.variants.map((v: any) => ({
      id: v.id,
      label: v.label || "",
      price: v.price ? String(v.price) : "",
      compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : "",
      sku: v.sku || "",
      stockQuantity: v.stockQuantity ?? 100,
      inStock: v.inStock ?? true,
      imageUrl: v.imageUrl || "",
      sortOrder: v.sortOrder ?? 0,
    })) : [],
  });

  const updateField = (field: string, value: any) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === "name" && !product?.id) {
        const slug = makeSlug(value);
        next.slug = slug;
        if (!prev.imageUrl || prev.imageUrl.startsWith("/api/vial/")) {
          next.imageUrl = imageUrlForSlug(slug);
        }
      }
      if (field === "slug" && !product?.id && (!prev.imageUrl || prev.imageUrl.startsWith("/api/vial/"))) {
        next.imageUrl = imageUrlForSlug(makeSlug(value));
      }
      return next;
    });
  };

  const updateVariant = (index: number, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.map((v: any, i: number) => i === index ? { ...v, [field]: value } : v),
    }));
  };

  const addVariant = () => {
    setForm(prev => ({ ...prev, variants: [...prev.variants, { ...blankVariant(), sortOrder: prev.variants.length }] }));
  };

  const removeVariant = (index: number) => {
    setForm(prev => ({ ...prev, variants: prev.variants.filter((_: any, i: number) => i !== index) }));
  };

  const saveProduct = () => {
    const variants = (form.variants || [])
      .filter((v: any) => String(v.label || "").trim() || String(v.price || "").trim())
      .map((v: any, index: number) => ({
        ...v,
        label: String(v.label || "").trim(),
        price: String(v.price || form.price || "0").trim(),
        sortOrder: index,
        imageUrl: v.imageUrl || imageUrlForVariant(form.slug, String(v.label || "")) || form.imageUrl || imageUrlForSlug(form.slug),
      }));

    const payload = {
      ...form,
      imageUrl: form.imageUrl || imageUrlForSlug(form.slug),
      variants,
    };

    onSave(payload);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onCancel}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold text-slate-900">{product ? "Edit Product" : "Add Product"}</h1>
      </div>
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="font-semibold text-slate-800 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Product Name *</Label><Input value={form.name} onChange={(e) => updateField("name", e.target.value)} className="mt-1.5" /></div>
            <div><Label>URL Slug *</Label><Input value={form.slug} onChange={(e) => updateField("slug", e.target.value)} className="mt-1.5" /></div>
            <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => updateField("sku", e.target.value)} className="mt-1.5" /></div>
            <div><Label>Dose / Size</Label><Input value={form.size} onChange={(e) => updateField("size", e.target.value)} className="mt-1.5" placeholder="e.g. 5mg" /></div>
            <div><Label>Image URL</Label><Input value={form.imageUrl} onChange={(e) => updateField("imageUrl", e.target.value)} className="mt-1.5" placeholder="Auto-filled from bundled company asset or generated company vial" /></div>
            <div className="md:col-span-2"><Label>Short Description</Label><Input value={form.shortDescription} onChange={(e) => updateField("shortDescription", e.target.value)} className="mt-1.5" /></div>
            <div className="md:col-span-2"><Label>Full Description</Label><Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} className="mt-1.5" rows={4} /></div>
          </div>
          <div className="mt-5">
            <ProductVialPreview name={form.name} slug={form.slug} size={form.size} />
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="font-semibold text-slate-800 mb-4">Pricing & Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Price ($) *</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => updateField("price", e.target.value)} className="mt-1.5" /></div>
            <div><Label>Compare At Price ($)</Label><Input type="number" step="0.01" value={form.compareAtPrice} onChange={(e) => updateField("compareAtPrice", e.target.value)} className="mt-1.5" /></div>
            <div><Label>Stock Quantity</Label><Input type="number" value={form.stockQuantity} onChange={(e) => updateField("stockQuantity", parseInt(e.target.value) || 0)} className="mt-1.5" /></div>
            <div><Label>Discount (%)</Label><Input type="number" step="1" value={form.discountPercent} onChange={(e) => updateField("discountPercent", e.target.value)} className="mt-1.5" /></div>
            <div className="flex items-center gap-6 md:col-span-2 flex-wrap">
              <div className="flex items-center gap-2"><Switch checked={form.inStock} onCheckedChange={(v) => updateField("inStock", v)} /><Label>In Stock</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.isFeatured} onCheckedChange={(v) => updateField("isFeatured", v)} /><Label>Featured</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={(v) => updateField("isActive", v)} /><Label>Active</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.discountActive} onCheckedChange={(v) => updateField("discountActive", v)} /><Label>Discount Active</Label></div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="font-semibold text-slate-800 mb-4">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {(categoriesQuery.data || []).map((cat: any) => {
              const selected = form.categoryIds.includes(cat.id);
              return (
                <button key={cat.id} type="button" onClick={() => setForm(prev => ({ ...prev, categoryIds: selected ? prev.categoryIds.filter((id: number) => id !== cat.id) : [...prev.categoryIds, cat.id] }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Variants / Dose Options */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">Dose Options / Variants</h2>
              <p className="text-sm text-slate-500">Add multiple sizes or mg amounts under this same product. Leave empty for a single product.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addVariant} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Option
            </Button>
          </div>
          {form.variants.length === 0 ? (
            <p className="text-sm text-slate-400">No dose options added. This product will save as a single item.</p>
          ) : (
            <div className="space-y-3">
              {form.variants.map((variant: any, index: number) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="md:col-span-2"><Label>Label / Size</Label><Input value={variant.label} onChange={(e) => updateVariant(index, "label", e.target.value)} className="mt-1.5" placeholder="5mg" /></div>
                  <div className="md:col-span-2"><Label>Price ($)</Label><Input type="number" step="0.01" value={variant.price} onChange={(e) => updateVariant(index, "price", e.target.value)} className="mt-1.5" placeholder={form.price || "0.00"} /></div>
                  <div className="md:col-span-2"><Label>Compare At</Label><Input type="number" step="0.01" value={variant.compareAtPrice} onChange={(e) => updateVariant(index, "compareAtPrice", e.target.value)} className="mt-1.5" /></div>
                  <div className="md:col-span-2"><Label>SKU</Label><Input value={variant.sku} onChange={(e) => updateVariant(index, "sku", e.target.value)} className="mt-1.5" /></div>
                  <div className="md:col-span-2"><Label>Stock</Label><Input type="number" value={variant.stockQuantity} onChange={(e) => updateVariant(index, "stockQuantity", parseInt(e.target.value) || 0)} className="mt-1.5" /></div>
                  <div className="md:col-span-1 flex items-end gap-2 pb-2"><Switch checked={variant.inStock} onCheckedChange={(v) => updateVariant(index, "inStock", v)} /><Label>Stock</Label></div>
                  <div className="md:col-span-1 flex items-end"><Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => removeVariant(index)}><Trash2 className="h-4 w-4" /></Button></div>
                  <div className="md:col-span-12"><Label>Variant Image URL</Label><Input value={variant.imageUrl} onChange={(e) => updateVariant(index, "imageUrl", e.target.value)} className="mt-1.5" placeholder="Leave blank to use main product image" /></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Testing Documents */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="font-semibold text-slate-800 mb-4">Testing Documents</h2>
          <p className="text-sm text-slate-500 mb-4">Leave blank if not available — the tab won't show on the product page.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>CoA URL</Label><Input value={form.coaUrl} onChange={(e) => updateField("coaUrl", e.target.value)} className="mt-1.5" placeholder="https://..." /></div>
            <div><Label>HPLC URL</Label><Input value={form.hplcUrl} onChange={(e) => updateField("hplcUrl", e.target.value)} className="mt-1.5" placeholder="https://..." /></div>
            <div><Label>Mass Spectrometry URL</Label><Input value={form.massSpecUrl} onChange={(e) => updateField("massSpecUrl", e.target.value)} className="mt-1.5" placeholder="https://..." /></div>
          </div>
        </div>

        {/* Specs */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="font-semibold text-slate-800 mb-4">Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Purity</Label><Input value={form.purity} onChange={(e) => updateField("purity", e.target.value)} className="mt-1.5" placeholder="e.g. >99%" /></div>
            <div><Label>Dose / Size</Label><Input value={form.size} onChange={(e) => updateField("size", e.target.value)} className="mt-1.5" placeholder="e.g. 5mg" /></div>
            <div><Label>Form</Label><Input value={form.form} onChange={(e) => updateField("form", e.target.value)} className="mt-1.5" placeholder="e.g. Lyophilized Powder" /></div>
            <div><Label>Contents</Label><Input value={form.contents} onChange={(e) => updateField("contents", e.target.value)} className="mt-1.5" /></div>
            <div><Label>Molecular Formula</Label><Input value={form.molecularFormula} onChange={(e) => updateField("molecularFormula", e.target.value)} className="mt-1.5" /></div>
            <div><Label>Molecular Weight</Label><Input value={form.molecularWeight} onChange={(e) => updateField("molecularWeight", e.target.value)} className="mt-1.5" /></div>
            <div className="md:col-span-3"><Label>Other Names / Aliases</Label><Input value={form.otherNames} onChange={(e) => updateField("otherNames", e.target.value)} className="mt-1.5" /></div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <Button onClick={saveProduct} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Product"}
          </Button>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>

        {/* Research Citations - only for existing products */}
        {product?.id && <ResearchCitationsEditor productId={product.id} />}
      </div>
    </div>
  );
}

// ─── Research Citations Editor ──────────────────────────────────────
function ResearchCitationsEditor({ productId }: { productId: number }) {
  const researchQuery = trpc.admin.research.get.useQuery({ productId });
  const upsertResearch = trpc.admin.research.upsert.useMutation({
    onSuccess: () => { toast.success("Research saved!"); researchQuery.refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const addCitation = trpc.admin.research.addCitation.useMutation({
    onSuccess: () => { toast.success("Citation added!"); researchQuery.refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const updateCitation = trpc.admin.research.updateCitation.useMutation({
    onSuccess: () => { toast.success("Citation updated!"); researchQuery.refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const deleteCitation = trpc.admin.research.deleteCitation.useMutation({
    onSuccess: () => { toast.success("Citation removed!"); researchQuery.refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const data = researchQuery.data;
  const research = data?.research;
  const citations = data?.citations || [];

  const [overview, setOverview] = useState("");
  const [chemicalMakeup, setChemicalMakeup] = useState("");
  const [researchContent, setResearchContent] = useState("");
  const [showAddCitation, setShowAddCitation] = useState(false);
  const [newCitation, setNewCitation] = useState({ citationNumber: 1, title: "", authors: "", journal: "", year: "", url: "", summary: "" });
  const [researchChanged, setResearchChanged] = useState(false);

  useEffect(() => {
    if (research) {
      setOverview(research.overview || "");
      setChemicalMakeup(research.chemicalMakeup || "");
      setResearchContent(research.researchContent || "");
      setResearchChanged(false);
    }
  }, [research]);

  return (
    <div className="space-y-6 mt-6">
      {/* Research Overview */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h2 className="font-semibold text-slate-800 mb-1">Research Information</h2>
        <p className="text-xs text-slate-400 mb-4">Add research background, chemical makeup, and study summaries. This appears on the product detail page.</p>
        <div className="space-y-4">
          <div>
            <Label>Overview</Label>
            <Textarea value={overview} onChange={(e) => { setOverview(e.target.value); setResearchChanged(true); }} className="mt-1.5" rows={3} placeholder="Brief overview of the peptide and its research applications..." />
          </div>
          <div>
            <Label>Chemical Makeup</Label>
            <Textarea value={chemicalMakeup} onChange={(e) => { setChemicalMakeup(e.target.value); setResearchChanged(true); }} className="mt-1.5" rows={3} placeholder="Chemical structure, amino acid sequence, etc." />
          </div>
          <div>
            <Label>Research Content</Label>
            <Textarea value={researchContent} onChange={(e) => { setResearchContent(e.target.value); setResearchChanged(true); }} className="mt-1.5" rows={5} placeholder="Detailed research findings, studies, and applications..." />
          </div>
          {researchChanged && (
            <Button onClick={() => { upsertResearch.mutate({ productId, overview, chemicalMakeup, researchContent }); setResearchChanged(false); }} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Save className="h-4 w-4" /> Save Research
            </Button>
          )}
        </div>
      </div>

      {/* Citations */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-800">Research Citations & Sources</h2>
            <p className="text-xs text-slate-400">Add published research papers and sources that back this product.</p>
          </div>
          <Button size="sm" onClick={() => { setShowAddCitation(!showAddCitation); setNewCitation(prev => ({ ...prev, citationNumber: citations.length + 1 })); }} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
            <Plus className="h-3.5 w-3.5" /> Add Citation
          </Button>
        </div>

        {showAddCitation && (
          <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
            <h3 className="font-medium text-slate-700 text-sm mb-3">New Citation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label className="text-xs">Citation # *</Label><Input type="number" value={newCitation.citationNumber} onChange={(e) => setNewCitation(p => ({ ...p, citationNumber: parseInt(e.target.value) || 1 }))} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">Year</Label><Input value={newCitation.year} onChange={(e) => setNewCitation(p => ({ ...p, year: e.target.value }))} className="mt-1 h-9 text-sm" placeholder="2024" /></div>
              <div className="md:col-span-2"><Label className="text-xs">Title *</Label><Input value={newCitation.title} onChange={(e) => setNewCitation(p => ({ ...p, title: e.target.value }))} className="mt-1 h-9 text-sm" placeholder="Study title" /></div>
              <div><Label className="text-xs">Authors</Label><Input value={newCitation.authors} onChange={(e) => setNewCitation(p => ({ ...p, authors: e.target.value }))} className="mt-1 h-9 text-sm" placeholder="Author names" /></div>
              <div><Label className="text-xs">Journal</Label><Input value={newCitation.journal} onChange={(e) => setNewCitation(p => ({ ...p, journal: e.target.value }))} className="mt-1 h-9 text-sm" placeholder="Journal name" /></div>
              <div className="md:col-span-2"><Label className="text-xs">URL / DOI Link</Label><Input value={newCitation.url} onChange={(e) => setNewCitation(p => ({ ...p, url: e.target.value }))} className="mt-1 h-9 text-sm" placeholder="https://pubmed.ncbi.nlm.nih.gov/..." /></div>
              <div className="md:col-span-2"><Label className="text-xs">Summary</Label><Textarea value={newCitation.summary} onChange={(e) => setNewCitation(p => ({ ...p, summary: e.target.value }))} className="mt-1 text-sm" rows={2} placeholder="Brief summary of findings" /></div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={() => { addCitation.mutate({ productId, ...newCitation }); setShowAddCitation(false); setNewCitation({ citationNumber: citations.length + 2, title: "", authors: "", journal: "", year: "", url: "", summary: "" }); }} className="bg-blue-600 hover:bg-blue-700 text-white gap-1" disabled={!newCitation.title}>
                <Save className="h-3.5 w-3.5" /> Save Citation
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddCitation(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {citations.length === 0 && !showAddCitation && (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">No citations added yet. Click "Add Citation" to add research sources.</p>
          </div>
        )}

        <div className="space-y-3">
          {citations.map((cit: any) => (
            <CitationRow key={cit.id} citation={cit} onUpdate={(data: any) => updateCitation.mutate(data)} onDelete={() => { if (confirm("Delete this citation?")) deleteCitation.mutate({ id: cit.id }); }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CitationRow({ citation, onUpdate, onDelete }: { citation: any; onUpdate: any; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(citation);

  if (editing) {
    return (
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label className="text-xs">Citation #</Label><Input type="number" value={form.citationNumber} onChange={(e) => setForm((p: any) => ({ ...p, citationNumber: parseInt(e.target.value) || 1 }))} className="mt-1 h-9 text-sm" /></div>
          <div><Label className="text-xs">Year</Label><Input value={form.year || ""} onChange={(e) => setForm((p: any) => ({ ...p, year: e.target.value }))} className="mt-1 h-9 text-sm" /></div>
          <div className="md:col-span-2"><Label className="text-xs">Title</Label><Input value={form.title} onChange={(e) => setForm((p: any) => ({ ...p, title: e.target.value }))} className="mt-1 h-9 text-sm" /></div>
          <div><Label className="text-xs">Authors</Label><Input value={form.authors || ""} onChange={(e) => setForm((p: any) => ({ ...p, authors: e.target.value }))} className="mt-1 h-9 text-sm" /></div>
          <div><Label className="text-xs">Journal</Label><Input value={form.journal || ""} onChange={(e) => setForm((p: any) => ({ ...p, journal: e.target.value }))} className="mt-1 h-9 text-sm" /></div>
          <div className="md:col-span-2"><Label className="text-xs">URL</Label><Input value={form.url || ""} onChange={(e) => setForm((p: any) => ({ ...p, url: e.target.value }))} className="mt-1 h-9 text-sm" /></div>
          <div className="md:col-span-2"><Label className="text-xs">Summary</Label><Textarea value={form.summary || ""} onChange={(e) => setForm((p: any) => ({ ...p, summary: e.target.value }))} className="mt-1 text-sm" rows={2} /></div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={() => { onUpdate(form); setEditing(false); }} className="bg-blue-600 hover:bg-blue-700 text-white gap-1"><Save className="h-3.5 w-3.5" /> Save</Button>
          <Button size="sm" variant="outline" onClick={() => { setForm(citation); setEditing(false); }}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
        {citation.citationNumber}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 text-sm">{citation.title}</p>
        <p className="text-xs text-slate-500">
          {[citation.authors, citation.journal, citation.year].filter(Boolean).join(" • ")}
        </p>
        {citation.url && <a href={citation.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">{citation.url}</a>}
      </div>
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-7 w-7 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 w-7 p-0 text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

// ─── Orders ──────────────────────────────────────────────────────────
function OrdersSection() {
  const [statusFilter, setStatusFilter] = useState("all");
  const ordersQuery = trpc.admin.orders.list.useQuery({ status: statusFilter !== "all" ? statusFilter : undefined, limit: 50 });
  const updateStatus = trpc.admin.orders.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated!"); ordersQuery.refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const updateTracking = trpc.admin.orders.updateTracking.useMutation({
    onSuccess: () => { toast.success("Tracking updated!"); ordersQuery.refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const result = ordersQuery.data;
  const orders = result?.orders || (Array.isArray(result) ? result : []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Orders</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}
            className={statusFilter === s ? "bg-blue-600 text-white" : ""}>{s.charAt(0).toUpperCase() + s.slice(1)}</Button>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Order</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Total</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Tracking</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order: any) => (
                <OrderRow key={order.id} order={order} onUpdateStatus={(data: any) => updateStatus.mutate(data)} onUpdateTracking={(data: any) => updateTracking.mutate(data)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order, onUpdateStatus, onUpdateTracking }: { order: any; onUpdateStatus: any; onUpdateTracking: any }) {
  const [tracking, setTracking] = useState(order.trackingNumber || "");
  const [carrier, setCarrier] = useState(order.trackingCarrier || "");
  const [status, setStatus] = useState(order.status);

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <p className="font-medium text-blue-600">#{order.orderNumber}</p>
        <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-slate-800">{order.shippingName || order.guestName}</p>
        <p className="text-xs text-slate-400">{order.guestEmail || ""}</p>
      </td>
      <td className="px-4 py-3 font-medium">${Number(order.total).toFixed(2)}</td>
      <td className="px-4 py-3">
        <Select value={status} onValueChange={(v) => { setStatus(v); onUpdateStatus({ id: order.id, status: v }); }}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking #" className="h-8 text-xs w-36" />
          <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Carrier" className="h-8 text-xs w-36" />
        </div>
      </td>
      <td className="px-4 py-3">
        <Button size="sm" onClick={() => onUpdateTracking({ id: order.id, trackingNumber: tracking, trackingCarrier: carrier })} className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">
          <Truck className="h-3 w-3 mr-1" /> Update
        </Button>
      </td>
    </tr>
  );
}

// ─── Discounts ───────────────────────────────────────────────────────
function DiscountsSection() {
  const [showForm, setShowForm] = useState(false);
  const discountsQuery = trpc.admin.discounts.list.useQuery();
  const createDiscount = trpc.admin.discounts.create.useMutation({
    onSuccess: () => { toast.success("Discount created!"); discountsQuery.refetch(); setShowForm(false); },
    onError: (err: any) => toast.error(err.message),
  });
  const deleteDiscount = trpc.admin.discounts.delete.useMutation({
    onSuccess: () => { toast.success("Discount deleted"); discountsQuery.refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const [form, setForm] = useState({ code: "", type: "percentage" as const, value: "", minOrderAmount: "", maxUses: "", isActive: true, expiresAt: "" });
  const discounts = Array.isArray(discountsQuery.data) ? discountsQuery.data : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Discounts & Promo Codes</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Add Discount"}
        </Button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">New Discount Code</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Code *</Label><Input value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="mt-1.5" placeholder="SAVE10" /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Value *</Label><Input type="number" value={form.value} onChange={(e) => setForm(p => ({ ...p, value: e.target.value }))} className="mt-1.5" /></div>
            <div><Label>Min Order ($)</Label><Input type="number" value={form.minOrderAmount} onChange={(e) => setForm(p => ({ ...p, minOrderAmount: e.target.value }))} className="mt-1.5" /></div>
            <div><Label>Max Uses</Label><Input type="number" value={form.maxUses} onChange={(e) => setForm(p => ({ ...p, maxUses: e.target.value }))} className="mt-1.5" /></div>
            <div><Label>Expires At</Label><Input type="date" value={form.expiresAt} onChange={(e) => setForm(p => ({ ...p, expiresAt: e.target.value }))} className="mt-1.5" /></div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm(p => ({ ...p, isActive: v }))} />
            <Label>Active</Label>
          </div>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={() => createDiscount.mutate({
            code: form.code, type: form.type, value: form.value,
            minOrderAmount: form.minOrderAmount || undefined,
            maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
            isActive: form.isActive,
            expiresAt: form.expiresAt ? new Date(form.expiresAt) : undefined,
          })} disabled={createDiscount.isPending}>
            <Save className="h-4 w-4" /> Save Discount
          </Button>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Code</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Value</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Uses</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {discounts.map((d: any) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-medium text-blue-600">{d.code}</td>
                  <td className="px-4 py-3 capitalize">{d.type}</td>
                  <td className="px-4 py-3">{d.type === "percentage" ? `${d.value}%` : `$${Number(d.value).toFixed(2)}`}</td>
                  <td className="px-4 py-3">{d.currentUses || 0}{d.maxUses ? `/${d.maxUses}` : ""}</td>
                  <td className="px-4 py-3"><Badge className={d.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}>{d.isActive ? "Active" : "Inactive"}</Badge></td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => { if (confirm("Delete this discount?")) deleteDiscount.mutate({ id: d.id }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Customers ───────────────────────────────────────────────────────
function CustomersSection() {
  const customersQuery = trpc.admin.users.list.useQuery();
  const customers = Array.isArray(customersQuery.data) ? customersQuery.data : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Customers</h1>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Username</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Role</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.name || "N/A"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.email || "N/A"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.username || "N/A"}</td>
                  <td className="px-4 py-3"><Badge className={c.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-600"}>{c.role}</Badge></td>
                  <td className="px-4 py-3 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Payments / NowPayments Config ──────────────────────────────────
function PaymentsSection() {
  const settingsQuery = trpc.settings.all.useQuery();
  const paymentStatusQuery = trpc.admin.paymentStatus.useQuery();
  const updateSetting = trpc.admin.settings.update.useMutation({
    onSuccess: () => { toast.success("Setting saved!"); settingsQuery.refetch(); paymentStatusQuery.refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const settings = settingsQuery.data || {};
  const paymentStatus = paymentStatusQuery.data;

  const [showApiKey, setShowApiKey] = useState(false);
  const [showIpnSecret, setShowIpnSecret] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [ipnSecret, setIpnSecret] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [sandboxMode, setSandboxMode] = useState(true);
  const [apiKeyChanged, setApiKeyChanged] = useState(false);
  const [ipnSecretChanged, setIpnSecretChanged] = useState(false);
  const [webhookChanged, setWebhookChanged] = useState(false);

  useEffect(() => {
    if (settings) {
      setApiKey(settings.nowpayments_api_key || "");
      setIpnSecret(settings.nowpayments_ipn_secret || "");
      setWebhookUrl(settings.nowpayments_webhook_url || "");
      setSandboxMode(settings.nowpayments_sandbox_mode === "true");
      setApiKeyChanged(false);
      setIpnSecretChanged(false);
      setWebhookChanged(false);
    }
  }, [settings.nowpayments_api_key, settings.nowpayments_ipn_secret, settings.nowpayments_webhook_url, settings.nowpayments_sandbox_mode]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Configuration</h1>
      <p className="text-slate-500 text-sm mb-8">Manage your NowPayments crypto payment gateway settings. Update your API key, IPN secret, and webhook URL at any time.</p>

      {/* Connection Status */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800 mb-1">Connection Status</h2>
            <p className="text-sm text-slate-500">Current NowPayments API connection status</p>
          </div>
          {paymentStatus?.configured ? (
            paymentStatus.status === "ok" || paymentStatus.status === "OK" ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium text-sm">Connected{paymentStatus.sandbox ? " (Sandbox)" : ""}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-500">
                <XCircle className="h-5 w-5" />
                <span className="font-medium text-sm">Error: {paymentStatus.error || paymentStatus.status}</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 text-amber-500">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium text-sm">Not Configured</span>
            </div>
          )}
        </div>
      </div>

      {/* API Key */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">API Credentials</h2>
        <div className="space-y-5">
          <div>
            <Label className="text-sm font-medium">API Key</Label>
            <p className="text-xs text-slate-400 mb-1.5">Your NowPayments API key for processing crypto payments. Find it in your NowPayments dashboard.</p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setApiKeyChanged(true); }}
                  placeholder="Enter your NowPayments API key"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {apiKeyChanged && (
                <Button size="sm" onClick={() => { updateSetting.mutate({ key: "nowpayments_api_key", value: apiKey }); setApiKeyChanged(false); }} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                  <Save className="h-3.5 w-3.5 mr-1" /> Save
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">IPN Secret</Label>
            <p className="text-xs text-slate-400 mb-1.5">Used to verify webhook callbacks from NowPayments. Find it in your NowPayments IPN settings.</p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showIpnSecret ? "text" : "password"}
                  value={ipnSecret}
                  onChange={(e) => { setIpnSecret(e.target.value); setIpnSecretChanged(true); }}
                  placeholder="Enter your NowPayments IPN secret"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowIpnSecret(!showIpnSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showIpnSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {ipnSecretChanged && (
                <Button size="sm" onClick={() => { updateSetting.mutate({ key: "nowpayments_ipn_secret", value: ipnSecret }); setIpnSecretChanged(false); }} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                  <Save className="h-3.5 w-3.5 mr-1" /> Save
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Webhook URL */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
        <h2 className="font-semibold text-slate-800 mb-1">Webhook URL</h2>
        <p className="text-xs text-slate-400 mb-4">This is the URL NowPayments will send payment notifications to. Set this in your NowPayments dashboard under IPN settings. It will be your Railway domain + <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">/api/nowpayments/ipn</code></p>
        <div className="flex items-center gap-2">
          <Input
            value={webhookUrl}
            onChange={(e) => { setWebhookUrl(e.target.value); setWebhookChanged(true); }}
            placeholder="https://your-railway-domain.up.railway.app/api/nowpayments/ipn"
            className="flex-1"
          />
          {webhookChanged && (
            <Button size="sm" onClick={() => { updateSetting.mutate({ key: "nowpayments_webhook_url", value: webhookUrl }); setWebhookChanged(false); }} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
              <Save className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
          )}
        </div>
      </div>

      {/* Sandbox Mode */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800 mb-1">Sandbox Mode</h2>
            <p className="text-xs text-slate-400">When enabled, payments use the NowPayments sandbox/test environment. Disable for live payments.</p>
          </div>
          <Switch checked={sandboxMode} onCheckedChange={(v) => { setSandboxMode(v); updateSetting.mutate({ key: "nowpayments_sandbox_mode", value: v ? "true" : "false" }); }} />
        </div>
      </div>
    </div>
  );
}

// ─── Website Customization (Visual Builder + Holiday Templates) ─────
function CustomizationSection() {
  const settingsQuery = trpc.settings.public.useQuery();
  const updateSetting = trpc.admin.settings.update.useMutation({
    onSuccess: () => { toast.success("Customization saved!"); settingsQuery.refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const settings = settingsQuery.data || {};
  const [activeTab, setActiveTab] = useState<"builder" | "templates">("builder");
  const [previewKey, setPreviewKey] = useState(0);
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, string>>({});
  const [revertState, setRevertState] = useState<Record<string, string> | null>(null);

  // Editable fields for the visual builder
  const builderFields = [
    { key: "site_tagline", label: "Hero Tagline", type: "text", placeholder: "Premium Research Peptides" },
    { key: "site_description", label: "Hero Description", type: "textarea", placeholder: "We are proud to carry the highest quality peptides..." },
    { key: "hero_bg_color", label: "Hero Background Color", type: "color", placeholder: "#0d2147" },
    { key: "hero_text_color", label: "Hero Text Color", type: "color", placeholder: "#ffffff" },
    { key: "accent_color", label: "Accent / Button Color", type: "color", placeholder: "#2563eb" },
    { key: "banner_enabled", label: "Show Announcement Banner", type: "toggle", placeholder: "" },
    { key: "banner_text", label: "Banner Text", type: "text", placeholder: "Free shipping on orders over $200!" },
    { key: "banner_bg_color", label: "Banner Background Color", type: "color", placeholder: "#0a1628" },
    { key: "banner_text_color", label: "Banner Text Color", type: "color", placeholder: "#94a3b8" },
    { key: "logo_url", label: "Logo Image URL", type: "text", placeholder: "/assets/rvr-company-logo-large.png" },
    { key: "footer_disclaimer", label: "Footer Disclaimer", type: "textarea", placeholder: "All products are sold for research purposes only..." },
  ];

  // Holiday templates
  const holidayTemplates = [
    {
      id: "main",
      name: "Main (Blue & Silver)",
      icon: "🧪",
      description: "Standard River Valley Research branding - no decorations",
      settings: {
        holiday_theme: "default",
        hero_bg_color: "#0d2147",
        hero_text_color: "#ffffff",
        accent_color: "#2563eb",
        banner_enabled: "false",
        banner_text: "",
        banner_bg_color: "#0a1628",
        banner_text_color: "#94a3b8",
      },
    },
    {
      id: "christmas",
      name: "Christmas",
      icon: "🎄",
      description: "Festive red & green with snowflakes, Christmas trees & lights",
      settings: {
        holiday_theme: "christmas",
        hero_bg_color: "#1a2e1a",
        hero_text_color: "#ffffff",
        accent_color: "#dc2626",
        banner_enabled: "true",
        banner_text: "🎄 Holiday Sale! Use code HOLIDAY25 for 25% off all peptides! 🎁",
        banner_bg_color: "#7f1d1d",
        banner_text_color: "#fecaca",
      },
    },
    {
      id: "halloween",
      name: "Halloween",
      icon: "🎃",
      description: "Spooky pumpkins, bats, ghosts & spider webs",
      settings: {
        holiday_theme: "halloween",
        hero_bg_color: "#1a0a2e",
        hero_text_color: "#f97316",
        accent_color: "#a855f7",
        banner_enabled: "true",
        banner_text: "🎃 Spooky Savings! 20% off site-wide this Halloween! 👻",
        banner_bg_color: "#431407",
        banner_text_color: "#fed7aa",
      },
    },
    {
      id: "easter",
      name: "Easter",
      icon: "🐰",
      description: "Easter bunnies, eggs, spring flowers & butterflies",
      settings: {
        holiday_theme: "easter",
        hero_bg_color: "#1e293b",
        hero_text_color: "#e9d5ff",
        accent_color: "#a78bfa",
        banner_enabled: "true",
        banner_text: "🐰 Spring Sale! Hop into savings with code SPRING20! 🌸",
        banner_bg_color: "#4c1d95",
        banner_text_color: "#e9d5ff",
      },
    },
    {
      id: "valentines",
      name: "Valentine's Day",
      icon: "💕",
      description: "Floating hearts, roses & romantic decorations",
      settings: {
        holiday_theme: "valentines",
        hero_bg_color: "#1c1017",
        hero_text_color: "#fda4af",
        accent_color: "#e11d48",
        banner_enabled: "true",
        banner_text: "💕 Valentine's Special! 15% off with code LOVE15 💕",
        banner_bg_color: "#881337",
        banner_text_color: "#fecdd3",
      },
    },
    {
      id: "4thofjuly",
      name: "4th of July",
      icon: "🇺🇸",
      description: "Fireworks, flags & patriotic stars",
      settings: {
        holiday_theme: "4thofjuly",
        hero_bg_color: "#0c1a3d",
        hero_text_color: "#ffffff",
        accent_color: "#dc2626",
        banner_enabled: "true",
        banner_text: "🇺🇸 Independence Day Sale! 20% off with code FREEDOM20 🎆",
        banner_bg_color: "#1e3a5f",
        banner_text_color: "#ffffff",
      },
    },
    {
      id: "blackfriday",
      name: "Black Friday",
      icon: "🏷️",
      description: "Sale tags, shopping bags & golden sparkles",
      settings: {
        holiday_theme: "blackfriday",
        hero_bg_color: "#0a0a0a",
        hero_text_color: "#fbbf24",
        accent_color: "#f59e0b",
        banner_enabled: "true",
        banner_text: "🏷️ BLACK FRIDAY! Biggest sale of the year - up to 40% off! 🏷️",
        banner_bg_color: "#000000",
        banner_text_color: "#fbbf24",
      },
    },
  ];

  const handleFieldChange = (key: string, value: string) => {
    setUnsavedChanges((prev) => ({ ...prev, [key]: value }));
  };

  const getFieldValue = (key: string) => {
    return unsavedChanges[key] !== undefined ? unsavedChanges[key] : (settings[key] || "");
  };

  const applyTemplate = async (template: typeof holidayTemplates[0]) => {
    // Save current state for revert
    const currentState: Record<string, string> = {};
    Object.keys(template.settings).forEach((key) => {
      currentState[key] = settings[key] || "";
    });
    setRevertState(currentState);

    // Apply all template settings
    for (const [key, value] of Object.entries(template.settings)) {
      await updateSetting.mutateAsync({ key, value });
    }
    setUnsavedChanges({});
    setPreviewKey((k) => k + 1);
    toast.success(`${template.name} template applied!`);
  };

  const revertChanges = async () => {
    if (!revertState) {
      toast.error("No previous state to revert to");
      return;
    }
    for (const [key, value] of Object.entries(revertState)) {
      await updateSetting.mutateAsync({ key, value });
    }
    setRevertState(null);
    setUnsavedChanges({});
    setPreviewKey((k) => k + 1);
    toast.success("Reverted to previous state!");
  };

  const saveAllChanges = async () => {
    if (Object.keys(unsavedChanges).length === 0) {
      toast("No changes to save");
      return;
    }
    // Save revert state
    const currentState: Record<string, string> = {};
    Object.keys(unsavedChanges).forEach((key) => {
      currentState[key] = settings[key] || "";
    });
    setRevertState(currentState);

    for (const [key, value] of Object.entries(unsavedChanges)) {
      await updateSetting.mutateAsync({ key, value });
    }
    setUnsavedChanges({});
    setPreviewKey((k) => k + 1);
    toast.success("All changes saved!");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Paintbrush className="h-6 w-6 text-blue-600" /> Website Customization
          </h2>
          <p className="text-sm text-slate-500 mt-1">Customize your website's look and feel without touching code</p>
        </div>
        <div className="flex items-center gap-2">
          {revertState && (
            <Button variant="outline" size="sm" onClick={revertChanges} className="gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50">
              <RotateCcw className="h-3.5 w-3.5" /> Revert
            </Button>
          )}
          {Object.keys(unsavedChanges).length > 0 && (
            <Button size="sm" onClick={saveAllChanges} className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="h-3.5 w-3.5" /> Save All Changes
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("builder")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "builder" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Paintbrush className="h-4 w-4 inline mr-1.5" /> Visual Builder
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "templates" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Sparkles className="h-4 w-4 inline mr-1.5" /> Holiday Templates
        </button>
      </div>

      {activeTab === "builder" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Builder Controls */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Customize Your Website</h3>
              <div className="space-y-4">
                {builderFields.map((field) => (
                  <div key={field.key}>
                    <Label className="text-sm text-slate-600 mb-1.5 block">{field.label}</Label>
                    {field.type === "toggle" ? (
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={getFieldValue(field.key) === "true"}
                          onCheckedChange={(checked) => handleFieldChange(field.key, checked ? "true" : "false")}
                        />
                        <span className="text-sm text-slate-500">{getFieldValue(field.key) === "true" ? "Enabled" : "Disabled"}</span>
                      </div>
                    ) : field.type === "color" ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={getFieldValue(field.key) || field.placeholder}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="h-9 w-14 rounded border border-slate-200 cursor-pointer"
                        />
                        <Input
                          value={getFieldValue(field.key)}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="flex-1"
                        />
                      </div>
                    ) : field.type === "textarea" ? (
                      <Textarea
                        value={getFieldValue(field.key)}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                      />
                    ) : (
                      <Input
                        value={getFieldValue(field.key)}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
              <span className="text-sm font-medium text-slate-700">Live Preview</span>
              <Button variant="ghost" size="sm" onClick={() => setPreviewKey((k) => k + 1)} className="text-xs">
                Refresh
              </Button>
            </div>
            <div className="h-[500px] overflow-hidden">
              <iframe
                key={previewKey}
                src="/?preview=true"
                className="w-full h-full border-0 transform scale-[0.6] origin-top-left"
                style={{ width: "166.67%", height: "166.67%" }}
                title="Website Preview"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "templates" && (
        <div>
          <p className="text-sm text-slate-500 mb-4">
            Click a template to instantly apply it to your website. You can always revert back using the Revert button above.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {holidayTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => applyTemplate(template)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{template.icon}</span>
                  <div>
                    <h4 className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{template.name}</h4>
                    <p className="text-xs text-slate-500">{template.description}</p>
                  </div>
                </div>
                {/* Color preview swatches */}
                <div className="flex gap-1.5 mt-3">
                  <div className="h-6 w-6 rounded-full border border-slate-200" style={{ backgroundColor: template.settings.hero_bg_color }} title="Hero BG" />
                  <div className="h-6 w-6 rounded-full border border-slate-200" style={{ backgroundColor: template.settings.hero_text_color }} title="Hero Text" />
                  <div className="h-6 w-6 rounded-full border border-slate-200" style={{ backgroundColor: template.settings.accent_color }} title="Accent" />
                  <div className="h-6 w-6 rounded-full border border-slate-200" style={{ backgroundColor: template.settings.banner_bg_color }} title="Banner BG" />
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-700">
                  Apply Template
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────
function SettingsSection() {
  const settingsQuery = trpc.settings.public.useQuery();
  const updateSetting = trpc.admin.settings.update.useMutation({
    onSuccess: () => { toast.success("Setting saved!"); settingsQuery.refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const settings = settingsQuery.data || {};

  const settingGroups = [
    {
      title: "General",
      items: [
        { key: "site_tagline", label: "Site Tagline", type: "text", placeholder: "Highest Quality Research Peptides" },
        { key: "site_description", label: "Site Description", type: "textarea", placeholder: "We are proud to carry..." },
        { key: "logo_url", label: "Logo URL", type: "text", placeholder: "https://..." },
        { key: "contact_email", label: "Contact Email", type: "text", placeholder: "support@rvrpeptides.com" },
        { key: "contact_phone", label: "Contact Phone", type: "text", placeholder: "+1 (555) 123-4567" },
      ],
    },
    {
      title: "Banner / Announcements",
      items: [
        { key: "banner_enabled", label: "Enable Banner", type: "toggle" },
        { key: "banner_text", label: "Banner Text", type: "text", placeholder: "Free shipping on orders over $200!" },
        { key: "banner_bg_color", label: "Banner Background Color", type: "text", placeholder: "#1E3A5F" },
        { key: "banner_text_color", label: "Banner Text Color", type: "text", placeholder: "#FFFFFF" },
      ],
    },
    {
      title: "Footer",
      items: [
        { key: "footer_disclaimer", label: "Footer Disclaimer", type: "textarea", placeholder: "All products are sold for research purposes only..." },
      ],
    },
    {
      title: "Shipping",
      items: [
        { key: "free_shipping_threshold", label: "Free Shipping Threshold ($)", type: "text", placeholder: "200" },
        { key: "flat_rate_shipping", label: "Flat Rate Shipping ($)", type: "text", placeholder: "9.99" },
      ],
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Site Settings</h1>
      <p className="text-slate-500 text-sm mb-8">Manage your website settings without touching any code. Changes take effect immediately.</p>
      <div className="space-y-6">
        {settingGroups.map((group) => (
          <div key={group.title} className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="font-semibold text-slate-800 mb-4">{group.title}</h2>
            <div className="space-y-4">
              {group.items.map((item) => (
                <SettingRow key={item.key} settingKey={item.key} label={item.label} type={item.type} placeholder={item.placeholder}
                  value={settings[item.key] || ""} onSave={(value: string) => updateSetting.mutate({ key: item.key, value })} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingRow({ settingKey, label, type, placeholder, value: initialValue, onSave }: {
  settingKey: string; label: string; type: string; placeholder?: string; value: string; onSave: (v: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [changed, setChanged] = useState(false);

  useEffect(() => { setValue(initialValue); setChanged(false); }, [initialValue]);

  const handleChange = (v: string) => { setValue(v); setChanged(v !== initialValue); };

  if (type === "toggle") {
    return (
      <div className="flex items-center justify-between py-2">
        <Label>{label}</Label>
        <Switch checked={value === "true"} onCheckedChange={(v) => onSave(v ? "true" : "false")} />
      </div>
    );
  }

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <Label className="text-sm">{label}</Label>
        {type === "textarea" ? (
          <Textarea value={value} onChange={(e) => handleChange(e.target.value)} placeholder={placeholder} className="mt-1.5" rows={3} />
        ) : (
          <Input value={value} onChange={(e) => handleChange(e.target.value)} placeholder={placeholder} className="mt-1.5" />
        )}
      </div>
      {changed && (
        <Button size="sm" onClick={() => { onSave(value); setChanged(false); }} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
          <Save className="h-3.5 w-3.5 mr-1" /> Save
        </Button>
      )}
    </div>
  );
}
