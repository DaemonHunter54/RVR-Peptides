import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ASSETS } from "@/lib/assets";
import { productAssetForSlug } from "@/lib/productAssetMap";
import { generatedVialUrl as makeDynamicVialUrl, productImageUrl } from "@/lib/vialDisplay";
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
  Paintbrush, RotateCcw, Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { ProductResearchWorkflow, PersistedProductResearchWorkflow, type ProductResearchDraft } from "@/components/admin/ProductResearchWorkflow";

// ─── Admin Layout ────────────────────────────────────────────────────
export default function AdminPanel() {
  const { user, isAuthenticated, loading } = useAuth();
  const { section } = useParams<{ section?: string }>();
  const activeSection = section || "dashboard";
  const adminSettingsQuery = trpc.settings.all.useQuery(undefined, {
    enabled: isAuthenticated && (user?.role === "admin" || user?.role === "super_admin"),
  });
  const adminInboxEmail = adminSettingsQuery.data?.admin_inbox_email || "";

  const openAdminEmail = () => {
    if (adminInboxEmail) {
      window.location.href = `mailto:${adminInboxEmail}`;
      return;
    }
    toast.info("Set Admin Inbox Email in Settings to link this button to your Gmail hub.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "super_admin")) {
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
    { id: "gift-cards", label: "Gift Cards", icon: CreditCard },
    { id: "customers", label: "Customers", icon: Users },
    { id: "customization", label: "Website Customization", icon: Paintbrush },
    { id: "settings", label: "Site Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full overflow-y-auto hidden lg:block">
        <div className="p-4 border-b border-slate-100">
          <Link href="/" className="block w-full">
            <img
              src={ASSETS.logo}
              alt="River Valley Research Peptides"
              className="w-full h-auto object-contain"
            />
          </Link>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-bold text-slate-800 text-sm">Admin Panel</span>
            <button onClick={openAdminEmail} className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline">
              Email
            </button>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => (
            <Link key={item.id} href={item.id === "dashboard" ? "/admin" : `/admin/${item.id}`}>
              <button onClick={() => item.id === "products" && window.dispatchEvent(new CustomEvent("rvr-admin-products-list"))} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === item.id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
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
            <button onClick={openAdminEmail} className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline">
              Email
            </button>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {menuItems.map((item) => (
              <Link key={item.id} href={item.id === "dashboard" ? "/admin" : `/admin/${item.id}`}>
                <button onClick={() => item.id === "products" && window.dispatchEvent(new CustomEvent("rvr-admin-products-list"))} className={`p-2 rounded-lg ${activeSection === item.id ? "bg-blue-50 text-blue-700" : "text-slate-500"}`}>
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
          {activeSection === "gift-cards" && <GiftCardsSection />}
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
  const importAllFromCore = trpc.admin.research.importAllFromCore.useMutation({
    onSuccess: (result) => {
      toast.success(`Imported ${result.imported} product research template(s)${result.failed ? ` (${result.failed} skipped)` : ""}.`);
      productsQuery.refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });


  const products = productsQuery.data?.products ?? (Array.isArray(productsQuery.data) ? productsQuery.data : []);

  const openProductEditor = (product: any) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  useEffect(() => {
    const returnToProductsList = () => {
      setShowForm(false);
      setEditingProduct(null);
    };

    window.addEventListener("rvr-admin-products-list", returnToProductsList);
    return () => window.removeEventListener("rvr-admin-products-list", returnToProductsList);
  }, []);

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
          <Button
            variant="outline"
            onClick={() => importAllFromCore.mutate()}
            disabled={importAllFromCore.isPending}
            className="gap-2"
          >
            {importAllFromCore.isPending ? "Importing..." : "Import Research Templates"}
          </Button>
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
                      <img src={productImageUrl(product) || ASSETS.peptideVial} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ASSETS.peptideVial; }}
                      className="w-10 h-10 object-contain bg-slate-50 rounded" />
                      <div>
                        <button
                          type="button"
                          onClick={() => openProductEditor(product)}
                          className="block text-left font-medium text-slate-800 hover:text-blue-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-sm"
                        >
                          {product.name}
                        </button>
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
                      <Button variant="ghost" size="sm" onClick={() => openProductEditor(product)}><Pencil className="h-3.5 w-3.5" /></Button>
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
const generatedVialPreviewUrl = (slug: string, name: string, size?: string) => makeDynamicVialUrl(slug || makeSlug(name || "preview-product"), name || "Preview Product", size || "");
const imageUrlForSlug = (slug: string) => productAssetForSlug(slug) || generatedVialUrl(slug);
const imageUrlForVariant = (productSlug: string, variantLabel: string) => {
  const variantSlug = makeSlug(`${productSlug} ${variantLabel}`);
  return productAssetForSlug(variantSlug) || generatedVialUrl(variantSlug);
};
const blankVariant = () => ({ label: "", price: "", compareAtPrice: "", sku: "", stockQuantity: 100, inStock: true, imageUrl: "", sortOrder: 0 });

const blankResearchDraft = (): ProductResearchDraft => ({
  productBrief: "",
  qualityNotes: "",
  overview: "",
  description: "",
  chemicalMakeup: "",
  researchContent: "",
  citations: [],
});

const applyListingSpecsToForm = (updateField: (field: string, value: string) => void, form: any, specs: Partial<{ size?: string; purity?: string; form?: string; contents?: string; sku?: string; molecularFormula?: string; molecularWeight?: string }>) => {
  if (!form.size && specs.size) updateField("size", specs.size);
  if (!form.purity && specs.purity) updateField("purity", specs.purity);
  if (!form.form && specs.form) updateField("form", specs.form);
  if (!form.contents && specs.contents) updateField("contents", specs.contents);
  if (!form.sku && specs.sku) updateField("sku", specs.sku);
  if (!form.molecularFormula && specs.molecularFormula) updateField("molecularFormula", specs.molecularFormula);
  if (!form.molecularWeight && specs.molecularWeight) updateField("molecularWeight", specs.molecularWeight);
};

const productResearchMetaFromForm = (form: any) => ({
  size: form.size || "",
  purity: form.purity || "",
  form: form.form || "",
  contents: form.contents || "",
  sku: form.sku || "",
  otherNames: form.otherNames || "",
  molecularFormula: form.molecularFormula || "",
  molecularWeight: form.molecularWeight || "",
  shortDescription: form.shortDescription || "",
});

type PreviewProductType = "" | "vial" | "cream" | "face-mask" | "gift-card";
const PRODUCT_PREVIEW_TYPES: Array<{ value: PreviewProductType; label: string }> = [
  { value: "", label: "None (File Upload)" },
  { value: "vial", label: "Vial" },
  { value: "cream", label: "Cream" },
  { value: "face-mask", label: "Face Mask" },
  { value: "gift-card", label: "Gift Card" },
];

const blankPreviewSrc = (type: PreviewProductType, slug: string, name: string, size?: string) => {
  if (type === "cream") return "/assets/lotion-bottle-blank-hd-tube.png";
  if (type === "face-mask") return "/assets/face-mask-blank-hd.png";
  if (type === "gift-card") return "/assets/Gift-Card.png";
  return generatedVialPreviewUrl(slug, name || "Preview Product", size);
};

function formatGiftCardMinimum(minAmount?: string) {
  const parsed = Number(String(minAmount || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0
    ? `$${parsed.toLocaleString(undefined, { maximumFractionDigits: 2 })}+`
    : "";
}

function ProductVialPreview({ name, slug, size, previewType, imageUrl, minAmount, maxAmount }: { name: string; slug: string; size?: string; previewType: PreviewProductType; imageUrl?: string; minAmount?: string; maxAmount?: string }) {
  const previewSrc = previewType
    ? blankPreviewSrc(previewType, slug, name || "Preview Product", size)
    : productImageUrl({ name, slug, size, imageUrl }) || imageUrl;
  const title =
    previewType === "cream" ? "Live Cream Preview" :
    previewType === "face-mask" ? "Live Face Mask Preview" :
    previewType === "gift-card" ? "Live Gift Card Preview" :
    "Live Vial Preview";
  const giftCardRange = previewType === "gift-card" ? formatGiftCardMinimum(minAmount) : "";

  if (!previewSrc) {
    return (
      <div className="h-full min-h-[235px] flex items-center justify-center bg-transparent px-6 text-center">
        <p className="text-sm font-medium text-slate-400">Select template or upload an image to preview</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[235px] flex items-start justify-center bg-transparent pt-0">
      <div className="relative inline-flex">
        <img
          src={previewSrc}
          alt={title}
          className="h-[245px] w-auto max-w-full object-contain"
        />
        {giftCardRange ? (
          <div className="absolute left-[64%] top-[21%] whitespace-nowrap text-sm font-bold tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
            {giftCardRange}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProductForm({ product, onSave, onCancel, saving }: any) {
  const categoriesQuery = trpc.categories.list.useQuery();
  const originalProductImageUrl = String(product?.imageUrl || "");
  const mappedProductImageUrl = productAssetForSlug(product?.slug || makeSlug(product?.name || ""));
  const initialLockedImageUrl =
    originalProductImageUrl.startsWith("/assets/products/")
      ? originalProductImageUrl
      : (mappedProductImageUrl || originalProductImageUrl || "");
  const [form, setForm] = useState({
    id: product?.id,
    name: product?.name || "",
    slug: product?.slug || "",
    sku: product?.sku || "",
    price: product?.price ? String(product.price) : "",
    compareAtPrice: product?.compareAtPrice ? String(product.compareAtPrice) : "",
    description: "",
    shortDescription: product?.shortDescription || "",
    imageUrl: initialLockedImageUrl,
    inStock: product?.inStock ?? true,
    stockQuantity: product?.stockQuantity ?? 100,
    isFeatured: false,
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
  const [draftResearch, setDraftResearch] = useState<ProductResearchDraft>(blankResearchDraft());
  const [showTestingDocuments, setShowTestingDocuments] = useState(false);
  const [showSpecifications, setShowSpecifications] = useState(false);

  const initialPreviewType: PreviewProductType =
    (product?.previewType as PreviewProductType) ||
    (makeSlug(product?.slug || product?.name || "") === "gift-card" || String(initialLockedImageUrl || "").toLowerCase().includes("gift-card") ? "gift-card" : "");
  const [previewType, setPreviewType] = useState<PreviewProductType>(initialPreviewType);
  const [lockedOriginalImageUrl] = useState(initialLockedImageUrl);
  const isGiftCardTemplate = previewType === "gift-card" || makeSlug(form.name) === "gift-card";
  const [linkingPreview, setLinkingPreview] = useState(false);
  const [imageAssets, setImageAssets] = useState<Array<{ name: string; url: string }>>([]);
  const [multipleProducts, setMultipleProducts] = useState(Boolean(product?.variants?.length));
  const [pullingNih, setPullingNih] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [product?.id]);


  useEffect(() => {
    fetch("/api/product-assets")
      .then((response) => response.ok ? response.json() : [])
      .then((assets) => setImageAssets(Array.isArray(assets) ? assets : []))
      .catch(() => setImageAssets([]));
  }, []);

  const autoSlug = makeSlug(form.name);
  const autoSku = autoSlug ? autoSlug.toUpperCase().replace(/-/g, "-") : "";

  const linkPreviewToUrl = async () => {
    if (!previewType) return form.imageUrl;
    const slug = autoSlug || makeSlug(form.slug || "preview-product");
    setLinkingPreview(true);
    try {
      const response = await fetch("/api/product-preview/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: previewType,
          slug,
          name: form.name || "Preview Product",
          size: form.size || "",
          minAmount: form.price || "",
          maxAmount: "",
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setForm(prev => ({ ...prev, imageUrl: data.url }));
      return data.url as string;
    } catch (error: any) {
      alert(error?.message || "Unable to link preview image.");
      return "";
    } finally {
      setLinkingPreview(false);
    }
  };

  const handlePreviewTypeChange = (value: string) => {
    const nextType = (value === "none" ? "" : value) as PreviewProductType;
    setPreviewType(nextType);
    if (nextType === "gift-card") {
      setForm(prev => ({
        ...prev,
        name: "Gift Card",
        slug: "gift-card",
        sku: "GIFT-CARD",
        price: prev.price || "10",
        compareAtPrice: "",
        size: "",
        stockQuantity: 9999,
        imageUrl: "/assets/Gift-Card.png",
      }));
      return;
    }
    if (nextType) {
      const slug = autoSlug || makeSlug(form.slug || form.name || "preview-product");
      updateField("imageUrl", blankPreviewSrc(nextType, slug, form.name || "Preview Product", form.size));
    } else if (form.imageUrl?.startsWith("/api/vial/") || form.imageUrl?.startsWith("/assets/lotion-bottle-blank") || form.imageUrl?.startsWith("/assets/face-mask-blank") || form.imageUrl?.includes("Gift-Card.png")) {
      updateField("imageUrl", lockedOriginalImageUrl || "");
    }
  };

  const handleAssetFile = async (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await fetch("/api/product-image/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            dataUrl: String(reader.result || ""),
            slug: autoSlug || makeSlug(form.name || file.name),
          }),
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        updateField("imageUrl", data.url);
        setImageAssets((prev) => [{ name: data.name || file.name, url: data.url }, ...prev.filter((asset) => asset.url !== data.url)]);
      } catch (error: any) {
        alert(error?.message || "Unable to upload image asset.");
      }
    };
    reader.readAsDataURL(file);
  };



  const updateField = (field: string, value: any) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === "name") {
        const slug = makeSlug(value);
        next.slug = slug;
        next.sku = slug ? slug.toUpperCase().replace(/-/g, "-") : "";
        if (previewType && previewType !== "gift-card") {
          next.imageUrl = blankPreviewSrc(previewType, slug, value || "Preview Product", next.size);
        }
        if (previewType === "gift-card") {
          next.imageUrl = "/assets/Gift-Card.png";
        }
      }
      if (field === "size" && previewType && previewType !== "gift-card") {
        next.imageUrl = blankPreviewSrc(previewType, next.slug || makeSlug(next.name), next.name || "Preview Product", value);
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

  const setMultipleProductMode = (enabled: boolean) => {
    setMultipleProducts(enabled);
    setForm(prev => {
      if (enabled && prev.variants.length === 0) {
        return {
          ...prev,
          variants: [{
            ...blankVariant(),
            label: prev.size || "",
            price: prev.price || "",
            stockQuantity: prev.stockQuantity ?? 100,
            sortOrder: 0,
          }],
        };
      }
      if (!enabled) {
        return { ...prev, variants: [] };
      }
      return prev;
    });
  };

  const saveProduct = async () => {
    const slug = makeSlug(form.name || form.slug);
    const linkedImageUrl = previewType ? (await linkPreviewToUrl()) : form.imageUrl;

    const variants = (form.variants || [])
      .filter((v: any) => String(v.label || "").trim() || String(v.price || "").trim() || (!previewType && String(v.compareAtPrice || "").trim()))
      .map((v: any, index: number) => {
        const cleanLabel = previewType === "gift-card"
          ? `$${String(v.price || form.price || "10").trim()} minimum`
          : String(v.label || "").trim();
        return {
          ...v,
          label: cleanLabel,
          price: String(v.price || form.price || "0").trim(),
          compareAtPrice: previewType === "gift-card" ? undefined : (String(v.compareAtPrice || "").trim() || undefined),
          stockQuantity: previewType === "gift-card" ? 9999 : (v.stockQuantity ?? form.stockQuantity ?? 100),
          sortOrder: index,
          imageUrl: v.imageUrl || linkedImageUrl || imageUrlForVariant(form.slug, cleanLabel) || imageUrlForSlug(form.slug),
        };
      });

    const payload = {
      ...form,
      slug,
      sku: slug ? slug.toUpperCase().replace(/-/g, "-") : form.sku,
      size: previewType === "gift-card" ? "" : form.size,
      compareAtPrice: previewType === "gift-card" ? "" : form.compareAtPrice,
      stockQuantity: previewType === "gift-card" ? 9999 : form.stockQuantity,
      imageUrl: linkedImageUrl || form.imageUrl || imageUrlForSlug(slug),
      variants,
      researchDraft: previewType !== "gift-card" && !product?.id ? draftResearch : undefined,
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
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,780px)_1fr] gap-8 items-start">
            <div className="space-y-4">
              <div className={`grid grid-cols-1 gap-4 items-end ${previewType === "gift-card" ? "md:grid-cols-[minmax(260px,1.45fr)_minmax(150px,0.55fr)]" : "md:grid-cols-[minmax(260px,1.45fr)_repeat(3,minmax(115px,0.55fr))]"}`}>
                <div>
                  <Label>Product Name *</Label>
                  <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} className="mt-1.5" />
                </div>
                {previewType !== "gift-card" ? (
                  <div>
                    <Label>Dose / Size</Label>
                    <Input value={form.size} onChange={(e) => updateField("size", e.target.value)} className="mt-1.5" placeholder="e.g. 5mg" />
                  </div>
                ) : null}
                <div>
                  <Label>{previewType === "gift-card" ? "Minimum Amount ($)" : "Price ($) *"}</Label>
                  <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => updateField("price", e.target.value)} className="mt-1.5" />
                </div>
                {previewType !== "gift-card" ? (
                  <div>
                    <Label>Stock</Label>
                    <Input type="number" min="0" value={form.stockQuantity} onChange={(e) => updateField("stockQuantity", parseInt(e.target.value) || 0)} className="mt-1.5" />
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Switch checked={multipleProducts} onCheckedChange={setMultipleProductMode} />
                <Label className="font-medium">Multiple Products</Label>
                <span className="text-xs text-slate-500">Add additional dose, price, and stock options under this product.</span>
              </div>

              {multipleProducts ? (
                <div className="space-y-3 rounded-xl bg-slate-50/80 p-3">
                  {form.variants.map((variant: any, index: number) => (
                    <div key={index} className={`grid grid-cols-1 gap-4 items-end ${previewType === "gift-card" ? "md:grid-cols-[minmax(260px,1.45fr)_minmax(150px,0.55fr)_auto]" : "md:grid-cols-[minmax(260px,1.45fr)_repeat(3,minmax(115px,0.55fr))_auto]"}`}>
                      <div className="hidden md:block text-xs font-medium text-slate-500 pb-3">
                        {previewType === "gift-card" ? `Additional Minimum ${index + 1}` : `Additional Dose ${index + 1}`}
                      </div>
                      {previewType !== "gift-card" ? (
                        <div>
                          <Label>Dose / Size</Label>
                          <Input value={variant.label} onChange={(e) => updateVariant(index, "label", e.target.value)} className="mt-1.5 bg-white" placeholder={form.size || "e.g. 10mg"} />
                        </div>
                      ) : null}
                      <div>
                        <Label>{previewType === "gift-card" ? "Minimum Amount ($)" : "Price ($)"}</Label>
                        <Input type="number" step="0.01" min="0" value={variant.price} onChange={(e) => updateVariant(index, "price", e.target.value)} className="mt-1.5 bg-white" placeholder={form.price || "10.00"} />
                      </div>
                      {previewType !== "gift-card" ? (
                        <div>
                          <Label>Stock</Label>
                          <Input type="number" min="0" value={variant.stockQuantity} onChange={(e) => updateVariant(index, "stockQuantity", parseInt(e.target.value) || 0)} className="mt-1.5 bg-white" />
                        </div>
                      ) : null}
                      <Button type="button" variant="ghost" size="sm" className="text-red-500 mb-0.5" onClick={() => removeVariant(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addVariant} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> {previewType === "gift-card" ? "Add Minimum" : "Add Dose"}
                  </Button>
                </div>
              ) : null}

              <div>
                <Label>Select product template</Label>
                <div className="mt-1.5 grid grid-cols-1 md:grid-cols-[minmax(220px,1fr)_auto] gap-3 items-center">
                  <Select value={previewType || "none"} onValueChange={handlePreviewTypeChange}>
                    <SelectTrigger><SelectValue placeholder="Select product template" /></SelectTrigger>
                    <SelectContent>
                      {PRODUCT_PREVIEW_TYPES.map((option) => (
                        <SelectItem key={option.label} value={option.value || "none"}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div>
                    <input
                      id="admin-product-image-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={Boolean(previewType)}
                      onChange={(e) => {
                        handleAssetFile(e.target.files?.[0]);
                        e.currentTarget.value = "";
                      }}
                    />
                    <label
                      htmlFor={previewType ? undefined : "admin-product-image-upload"}
                      className={`inline-flex h-10 min-w-[132px] items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors ${
                        previewType
                          ? "cursor-not-allowed bg-slate-200 text-slate-400"
                          : "cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      Choose File
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(180px,280px)_1fr] gap-4 items-end pt-1">
                <div>
                  <Label>Discount (%)</Label>
                  <Input type="number" step="1" value={form.discountPercent} onChange={(e) => updateField("discountPercent", e.target.value)} className="mt-1.5" />
                </div>
                <div className="flex items-center gap-5 flex-wrap pb-2">
                  <div className="flex items-center gap-2"><Switch checked={form.discountActive} onCheckedChange={(v) => updateField("discountActive", v)} /><Label>Discount Active</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={form.inStock} onCheckedChange={(v) => updateField("inStock", v)} /><Label>In Stock</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={form.isFeatured} onCheckedChange={(v) => updateField("isFeatured", v)} /><Label>Featured</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={(v) => updateField("isActive", v)} /><Label>Active</Label></div>
                </div>
              </div>
            </div>

            <div className="justify-self-center w-full max-w-[360px]">
              <ProductVialPreview
                name={form.name}
                slug={form.slug || autoSlug}
                size={form.size}
                previewType={previewType}
                imageUrl={form.imageUrl}
                minAmount={form.price}
                maxAmount={form.compareAtPrice}
              />
            </div>


            <div className="xl:col-span-2">
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
          </div>
        </div>

        {!isGiftCardTemplate && (
          <>
        {/* Testing Documents */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-800">Testing Documents</h2>
              <p className="text-sm text-slate-500 mt-1">Turn on only when CoA, HPLC, or Mass Spectrometry links are available.</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={showTestingDocuments} onCheckedChange={setShowTestingDocuments} />
              <Label className="font-medium">{showTestingDocuments ? "Shown" : "Hidden"}</Label>
            </div>
          </div>
          {showTestingDocuments && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div><Label>CoA URL</Label><Input value={form.coaUrl} onChange={(e) => updateField("coaUrl", e.target.value)} className="mt-1.5" placeholder="https://..." /></div>
              <div><Label>HPLC URL</Label><Input value={form.hplcUrl} onChange={(e) => updateField("hplcUrl", e.target.value)} className="mt-1.5" placeholder="https://..." /></div>
              <div><Label>Mass Spectrometry URL</Label><Input value={form.massSpecUrl} onChange={(e) => updateField("massSpecUrl", e.target.value)} className="mt-1.5" placeholder="https://..." /></div>
            </div>
          )}
        </div>

        {/* Specs */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">Specifications</h2>
              <p className="text-sm text-slate-500 mt-1">Turn on only when product specification details are available.</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={showSpecifications} onCheckedChange={setShowSpecifications} />
              <Label className="font-medium">{showSpecifications ? "Shown" : "Hidden"}</Label>
            </div>
          </div>
          {showSpecifications && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Purity</Label><Input value={form.purity} onChange={(e) => updateField("purity", e.target.value)} className="mt-1.5" placeholder="e.g. >99%" /></div>
            <div><Label>Dose / Size</Label><Input value={form.size} onChange={(e) => updateField("size", e.target.value)} className="mt-1.5" placeholder="e.g. 5mg" /></div>
            <div><Label>Form</Label><Input value={form.form} onChange={(e) => updateField("form", e.target.value)} className="mt-1.5" placeholder="e.g. Lyophilized Powder" /></div>
            <div><Label>Contents</Label><Input value={form.contents} onChange={(e) => updateField("contents", e.target.value)} className="mt-1.5" /></div>
            <div><Label>Molecular Formula</Label><Input value={form.molecularFormula} onChange={(e) => updateField("molecularFormula", e.target.value)} className="mt-1.5" /></div>
            <div><Label>Molecular Weight</Label><Input value={form.molecularWeight} onChange={(e) => updateField("molecularWeight", e.target.value)} className="mt-1.5" /></div>
            <div className="md:col-span-3"><Label>Other Names / Aliases</Label><Input value={form.otherNames} onChange={(e) => updateField("otherNames", e.target.value)} className="mt-1.5" /></div>
          </div>
          )}
        </div>

          </>
        )}

        {!isGiftCardTemplate && (
          product?.id ? (
            <PersistedProductResearchWorkflow
              productId={product.id}
              productName={form.name}
              productSlug={form.slug}
              productMeta={productResearchMetaFromForm(form)}
              onShortDescriptionChange={(shortDescription) => updateField("shortDescription", shortDescription)}
              onListingSpecsApply={(specs) => applyListingSpecsToForm(updateField, form, specs)}
            />
          ) : (
            <ProductResearchWorkflow
              productName={form.name}
              productSlug={form.slug || autoSlug}
              productMeta={productResearchMetaFromForm(form)}
              value={draftResearch}
              onChange={setDraftResearch}
              onShortDescriptionChange={(shortDescription) => updateField("shortDescription", shortDescription)}
              onListingSpecsApply={(specs) => applyListingSpecsToForm(updateField, form, specs)}
            />
          )
        )}

        {/* Save */}
        <div className="flex items-center gap-3">
          <Button onClick={saveProduct} disabled={saving || linkingPreview} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Save className="h-4 w-4" /> {saving || linkingPreview ? "Saving..." : "Save Product"}
          </Button>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
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

// ─── Customers / Admin Roles ─────────────────────────────────────────

function GiftCardsSection() {
  const cardsQuery = trpc.admin.giftCards.list.useQuery();
  const cards = Array.isArray(cardsQuery.data) ? cardsQuery.data : [];

  const money = (value: any) => `$${Number(value || 0).toFixed(2)}`;
  const formatDate = (value: any) => value ? new Date(value).toLocaleDateString() : "—";

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gift Cards</h1>
          <p className="text-slate-500 mt-1">
            Track issued gift cards, balances, codes, recipient emails, order numbers, expiration, and delivery status.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Code</th>
                <th className="text-left px-4 py-3 font-semibold">Original</th>
                <th className="text-left px-4 py-3 font-semibold">Balance</th>
                <th className="text-left px-4 py-3 font-semibold">Reserved</th>
                <th className="text-left px-4 py-3 font-semibold">Available</th>
                <th className="text-left px-4 py-3 font-semibold">Recipient</th>
                <th className="text-left px-4 py-3 font-semibold">Order #</th>
                <th className="text-left px-4 py-3 font-semibold">Expires</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {cards.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    No gift cards have been issued yet.
                  </td>
                </tr>
              )}
              {cards.map((card: any) => (
                <tr key={card.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">{card.code}</td>
                  <td className="px-4 py-3">{money(card.originalAmount)}</td>
                  <td className="px-4 py-3 font-semibold">{money(card.balance)}</td>
                  <td className="px-4 py-3 text-amber-700">{money(card.reservedAmount)}</td>
                  <td className="px-4 py-3 text-blue-700 font-semibold">{money(card.availableBalance)}</td>
                  <td className="px-4 py-3">{card.recipientEmail || card.purchaserEmail || "—"}</td>
                  <td className="px-4 py-3">{card.orderId ? `#${card.orderId}` : "—"}</td>
                  <td className="px-4 py-3">{formatDate(card.expiresAt)}</td>
                  <td className="px-4 py-3">
                    <Badge className={card.emailStatus === "sent" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                      {card.emailStatus || "pending"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={!card.isActive || card.expired ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                      {!card.isActive ? "Depleted" : card.expired ? "Expired" : "Active"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        Gift cards are issued only after payment is verified, use unique mixed-case 8-character codes in XXXX-XXXX format,
        deplete as they are redeemed, cannot be reloaded, and expire 1 year from purchase.
      </div>
    </div>
  );
}

function CustomersSection() {
  const { user } = useAuth();
  const customersQuery = trpc.admin.users.list.useQuery();
  const utils = trpc.useUtils();
  const customers = Array.isArray(customersQuery.data) ? customersQuery.data : [];
  const canManageRoles = user?.role === "super_admin";

  const updateRole = trpc.admin.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated");
      utils.admin.users.list.invalidate();
    },
    onError: (err: any) => toast.error(err.message || "Unable to update role"),
  });

  const roleBadgeClass = (role: string) => {
    if (role === "super_admin") return "bg-blue-100 text-blue-800";
    if (role === "admin") return "bg-purple-100 text-purple-800";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers & Admin Roles</h1>
          <p className="text-sm text-slate-500 mt-1">
            Admin access is now controlled by database roles. Super admins can promote or demote users here.
          </p>
        </div>
        <Badge className={canManageRoles ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}>
          Signed in as {user?.role?.replace("_", " ") || "user"}
        </Badge>
      </div>

      {!canManageRoles && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You can view users because you are an admin. Only a super admin can change database roles.
        </div>
      )}

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
                <th className="text-left px-4 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c: any) => {
                const isSelf = c.id === user?.id;
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{c.name || "N/A"}</td>
                    <td className="px-4 py-3 text-slate-600">{c.email || "N/A"}</td>
                    <td className="px-4 py-3 text-slate-600">{c.username || "N/A"}</td>
                    <td className="px-4 py-3">
                      <Badge className={roleBadgeClass(c.role)}>{String(c.role || "user").replace("_", " ")}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "N/A"}</td>
                    <td className="px-4 py-3">
                      {canManageRoles ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={c.role || "user"}
                            disabled={updateRole.isPending || (isSelf && c.role === "super_admin")}
                            onValueChange={(role: "user" | "admin" | "super_admin") => {
                              if (isSelf && role !== "super_admin") {
                                toast.error("You cannot remove your own super admin role.");
                                return;
                              }
                              updateRole.mutate({ id: c.id, role });
                            }}
                          >
                            <SelectTrigger className="h-9 w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super_admin">Super admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <span className="text-slate-400">View only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Payments / PaymentCloud Config ──────────────────────────────────
function PaymentsSection() {
  const settingsQuery = trpc.settings.all.useQuery();
  const paymentStatusQuery = trpc.admin.paymentStatus.useQuery();
  const updateSetting = trpc.admin.settings.update.useMutation({
    onSuccess: () => { toast.success("Setting saved!"); settingsQuery.refetch(); paymentStatusQuery.refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const settings = settingsQuery.data || {};
  const paymentStatus = paymentStatusQuery.data;

  const [gateway, setGateway] = useState("authorize_net");
  const [apiLoginId, setApiLoginId] = useState("");
  const [transactionKey, setTransactionKey] = useState("");
  const [securityKey, setSecurityKey] = useState("");
  const [billingDescriptor, setBillingDescriptor] = useState("RVR Peptides LLC");
  const [sandboxMode, setSandboxMode] = useState(true);
  const [showTransactionKey, setShowTransactionKey] = useState(false);
  const [showSecurityKey, setShowSecurityKey] = useState(false);
  const [apiLoginChanged, setApiLoginChanged] = useState(false);
  const [transactionKeyChanged, setTransactionKeyChanged] = useState(false);
  const [securityKeyChanged, setSecurityKeyChanged] = useState(false);
  const [descriptorChanged, setDescriptorChanged] = useState(false);

  useEffect(() => {
    if (settings) {
      setGateway(settings.paymentcloud_gateway || "authorize_net");
      setApiLoginId(settings.paymentcloud_api_login_id || "");
      setTransactionKey(settings.paymentcloud_transaction_key || "");
      setSecurityKey(settings.paymentcloud_security_key || "");
      setBillingDescriptor(settings.paymentcloud_billing_descriptor || "RVR Peptides LLC");
      setSandboxMode(settings.paymentcloud_sandbox_mode !== "false");
      setApiLoginChanged(false);
      setTransactionKeyChanged(false);
      setSecurityKeyChanged(false);
      setDescriptorChanged(false);
    }
  }, [
    settings.paymentcloud_gateway,
    settings.paymentcloud_api_login_id,
    settings.paymentcloud_transaction_key,
    settings.paymentcloud_security_key,
    settings.paymentcloud_billing_descriptor,
    settings.paymentcloud_sandbox_mode,
  ]);

  const appBaseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-domain.up.railway.app";

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">PaymentCloud Gateway</h1>
      <p className="text-slate-500 text-sm mb-8">
        Configure the PaymentCloud payment gateway credentials provided by your account manager.
        PaymentCloud typically connects through Authorize.net or NMI depending on your merchant setup.
      </p>

      <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800 mb-1">Connection Status</h2>
            <p className="text-sm text-slate-500">
              Gateway: {paymentStatus?.gateway === "nmi" ? "NMI" : "Authorize.net"}
            </p>
          </div>
          {paymentStatus?.configured ? (
            paymentStatus.status === "ok" || paymentStatus.status === "ready" ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium text-sm">Ready{paymentStatus.sandbox ? " (Sandbox)" : " (Live)"}</span>
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

      <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Gateway Selection</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Gateway Provider</Label>
            <Select
              value={gateway}
              onValueChange={(value) => {
                setGateway(value);
                updateSetting.mutate({ key: "paymentcloud_gateway", value });
              }}
            >
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="authorize_net">Authorize.net (most common with PaymentCloud)</SelectItem>
                <SelectItem value="nmi">NMI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium">Billing Descriptor</Label>
            <p className="text-xs text-slate-400 mb-1.5">Name customers will see on their card statement.</p>
            <div className="flex items-center gap-2">
              <Input
                value={billingDescriptor}
                onChange={(e) => { setBillingDescriptor(e.target.value); setDescriptorChanged(true); }}
                placeholder="RVR Peptides LLC"
              />
              {descriptorChanged && (
                <Button size="sm" onClick={() => { updateSetting.mutate({ key: "paymentcloud_billing_descriptor", value: billingDescriptor }); setDescriptorChanged(false); }} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                  <Save className="h-3.5 w-3.5 mr-1" /> Save
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {gateway === "authorize_net" ? (
        <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">Authorize.net Credentials</h2>
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-medium">API Login ID</Label>
              <p className="text-xs text-slate-400 mb-1.5">Provided by PaymentCloud / Authorize.net merchant settings.</p>
              <div className="flex items-center gap-2">
                <Input
                  value={apiLoginId}
                  onChange={(e) => { setApiLoginId(e.target.value); setApiLoginChanged(true); }}
                  placeholder="Enter API Login ID"
                />
                {apiLoginChanged && (
                  <Button size="sm" onClick={() => { updateSetting.mutate({ key: "paymentcloud_api_login_id", value: apiLoginId }); setApiLoginChanged(false); }} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                    <Save className="h-3.5 w-3.5 mr-1" /> Save
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Transaction Key</Label>
              <p className="text-xs text-slate-400 mb-1.5">Generate this in your Authorize.net merchant interface.</p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showTransactionKey ? "text" : "password"}
                    value={transactionKey}
                    onChange={(e) => { setTransactionKey(e.target.value); setTransactionKeyChanged(true); }}
                    placeholder="Enter Transaction Key"
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowTransactionKey(!showTransactionKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showTransactionKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {transactionKeyChanged && (
                  <Button size="sm" onClick={() => { updateSetting.mutate({ key: "paymentcloud_transaction_key", value: transactionKey }); setTransactionKeyChanged(false); }} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                    <Save className="h-3.5 w-3.5 mr-1" /> Save
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">NMI Credentials</h2>
          <div>
            <Label className="text-sm font-medium">Security Key</Label>
            <p className="text-xs text-slate-400 mb-1.5">Private security key from your NMI merchant portal.</p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showSecurityKey ? "text" : "password"}
                  value={securityKey}
                  onChange={(e) => { setSecurityKey(e.target.value); setSecurityKeyChanged(true); }}
                  placeholder="Enter NMI Security Key"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowSecurityKey(!showSecurityKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showSecurityKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {securityKeyChanged && (
                <Button size="sm" onClick={() => { updateSetting.mutate({ key: "paymentcloud_security_key", value: securityKey }); setSecurityKeyChanged(false); }} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                  <Save className="h-3.5 w-3.5 mr-1" /> Save
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
        <h2 className="font-semibold text-slate-800 mb-1">Webhook & Return URLs</h2>
        <p className="text-xs text-slate-400 mb-4">
          Provide these URLs to PaymentCloud or your gateway if silent post / webhook configuration is required.
        </p>
        <div className="space-y-3 text-sm">
          <div>
            <Label className="text-xs text-slate-500">Payment Return URL</Label>
            <Input readOnly value={`${appBaseUrl}/api/paymentcloud/return?order=ORDER_NUMBER`} className="mt-1 bg-slate-50" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Silent Post / Webhook URL</Label>
            <Input readOnly value={`${appBaseUrl}/api/paymentcloud/webhook`} className="mt-1 bg-slate-50" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800 mb-1">Sandbox Mode</h2>
            <p className="text-xs text-slate-400">Keep enabled while testing with sandbox credentials. Disable for live PaymentCloud processing.</p>
          </div>
          <Switch checked={sandboxMode} onCheckedChange={(v) => { setSandboxMode(v); updateSetting.mutate({ key: "paymentcloud_sandbox_mode", value: v ? "true" : "false" }); }} />
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
    { key: "banner_text", label: "Banner Text", type: "text", placeholder: "Research-grade peptides and supplies" },
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
        { key: "business_legal_name", label: "Legal Business Name", type: "text", placeholder: "River Valley Research Peptides LLC" },
      ],
    },
    {
      title: "Contact & Email",
      items: [
        { key: "customer_service_email", label: "Customer Service Email", type: "text", placeholder: "CustomerService@RVRPeptides.com" },
        { key: "orders_email", label: "Orders Email", type: "text", placeholder: "Orders@RVRPeptides.com" },
        { key: "contact_email", label: "Support Email", type: "text", placeholder: "Support@RVRPeptides.com" },
        { key: "mailing_list_email", label: "Mailing List Email", type: "text", placeholder: "MailingList@RVRPeptides.com" },
        { key: "admin_inbox_email", label: "Admin Inbox Email (Gmail hub)", type: "text", placeholder: "owner@gmail.com" },
        { key: "contact_phone", label: "Contact Phone", type: "text", placeholder: "+1 (555) 123-4567" },
      ],
    },
    {
      title: "Banner / Announcements",
      items: [
        { key: "banner_enabled", label: "Enable Banner", type: "toggle" },
        { key: "banner_text", label: "Banner Text", type: "text", placeholder: "Research-grade peptides and supplies" },
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
