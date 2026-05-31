import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ASSETS } from "@/lib/assets";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Minus, Plus, ExternalLink, FlaskConical, Shield, Check } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { useGuestCart } from "@/hooks/useGuestCart";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("description");
  const productQuery = trpc.products.bySlug.useQuery({ slug: slug || "" });
  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("Added to cart!");
    },
    onError: (err) => toast.error(err.message),
  });
  const utils = trpc.useUtils();
  const guestCart = useGuestCart();

  const product = productQuery.data;

  // Determine which tabs to show based on available data
  const availableTabs = useMemo(() => {
    if (!product) return [];
    const tabs: { id: string; label: string }[] = [];
    // Description tab always shows if there's description or research content
    if (product.description || product.research?.overview || product.research?.researchContent) {
      tabs.push({ id: "description", label: "Description" });
    }
    if (product.coaUrl) {
      tabs.push({ id: "coa", label: "CoA" });
    }
    if (product.hplcUrl) {
      tabs.push({ id: "hplc", label: "HPLC" });
    }
    if (product.massSpecUrl) {
      tabs.push({ id: "massspec", label: "Mass Spectrometry" });
    }
    return tabs;
  }, [product]);

  // Set default active tab to first available
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(t => t.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs]);

  if (productQuery.isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="container py-12">
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-48" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-slate-800">Product Not Found</h1>
          <p className="text-slate-500 mt-2">The product you're looking for doesn't exist.</p>
          <Link href="/shop">
            <Button className="mt-6 bg-blue-600 hover:bg-blue-700">Back to Shop</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const variants = product.variants || [];
  const hasVariants = variants.length > 1;
  
  const activeVariant = hasVariants
    ? variants.find((v: any) => v.id === selectedVariantId) || variants[0]
    : null;
  
  const price = activeVariant ? Number(activeVariant.price) : Number(product.price);
  const hasDiscount = product.discountActive && product.discountPercent;
  const discountedPrice = hasDiscount ? price * (1 - Number(product.discountPercent) / 100) : price;

  const handleAddToCart = () => {
    const cartPrice = activeVariant ? activeVariant.price : product.price;
    const cartName = activeVariant ? `${product.name} (${activeVariant.label})` : product.name;
    const cartImage = activeVariant?.imageUrl || product.imageUrl;
    
    if (!isAuthenticated) {
      guestCart.addItem({
        id: product.id,
        name: cartName,
        price: cartPrice,
        imageUrl: cartImage,
        discountActive: product.discountActive || false,
        discountPercent: product.discountPercent || null,
        variantId: activeVariant?.id,
        variantLabel: activeVariant?.label,
      }, quantity);
      toast.success("Added to cart!");
      return;
    }
    addToCart.mutate({ productId: product.id, quantity, variantId: activeVariant?.id, variantLabel: activeVariant?.label }, {
      onSuccess: () => utils.cart.get.invalidate(),
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="container py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-blue-600">Shop</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container py-8 lg:py-12">
        {/* Product Main Section */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Image */}
          <div className="rounded-2xl p-8 lg:p-12 flex items-center justify-center">
            <img
              src={product.imageUrl || `/api/vial/${product.slug}.png?v=2`}
              alt={product.name}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ASSETS.peptideVial; }}
              className="w-full max-w-md object-contain"
            />
          </div>

          {/* Info */}
          <div className="space-y-6">
            {/* Categories */}
            {product.categories && product.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.categories.map((cat: any) => (
                  <Badge key={cat.id} variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-100">
                    {cat.name}
                  </Badge>
                ))}
              </div>
            )}

            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{product.name}</h1>

            {/* Quick specs inline */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              {product.size && <span><strong>Size:</strong> {product.size}</span>}
              {product.contents && <span><strong>Contents:</strong> {product.contents}</span>}
              {product.form && <span><strong>Form:</strong> {product.form}</span>}
              {product.purity && <span><strong>Purity:</strong> {product.purity}</span>}
              {product.sku && <span><strong>SKU:</strong> {product.sku}</span>}
            </div>

            {/* Dose Selector Dropdown */}
            {hasVariants && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Select Dose:</label>
                <select
                  value={activeVariant?.id || ""}
                  onChange={(e) => setSelectedVariantId(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-800 font-medium bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none cursor-pointer"
                >
                  {variants.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.label} — ${Number(v.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className={`text-3xl font-bold ${hasDiscount ? "text-red-600" : "text-slate-900"}`}>
                ${discountedPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-slate-400 line-through">${price.toFixed(2)}</span>
                  <Badge className="bg-red-500 text-white">{Number(product.discountPercent)}% OFF</Badge>
                </>
              )}
            </div>

            {/* Free shipping notice */}
            <p className="text-sm text-green-600 font-medium">FREE Shipping on $200+ orders</p>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.inStock ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">In Stock</span>
                </>
              ) : (
                <span className="text-sm font-medium text-red-600">Out of Stock</span>
              )}
            </div>

            {/* Add to Cart */}
            {product.inStock && (
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center border border-slate-200 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 font-medium text-slate-800 min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2.5 text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  size="lg"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2 h-12"
                  onClick={handleAddToCart}
                  disabled={addToCart.isPending}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {addToCart.isPending ? "Adding..." : "Add to Cart"}
                </Button>
              </div>
            )}

            {/* Trust */}
            <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Shield className="h-4 w-4 text-blue-500" /> Third-party tested
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <FlaskConical className="h-4 w-4 text-blue-500" /> Research grade
              </div>
            </div>
          </div>
        </div>

        {/* Conditional Tabs: Description, CoA, HPLC, Mass Spectrometry */}
        {availableTabs.length > 0 && (
          <div className="mb-12">
            {/* Tab Navigation */}
            <div className="border-b border-slate-200">
              <div className="flex gap-0">
                {availableTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="pt-8">
              {/* Description Tab */}
              {activeTab === "description" && (
                <div className="prose prose-slate max-w-none">
                  {/* Overview */}
                  {product.research?.overview && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-slate-900 mb-4">{product.name} Peptide</h2>
                      <div className="text-slate-600 leading-relaxed whitespace-pre-line">
                        {product.research.overview}
                      </div>
                    </div>
                  )}

                  {/* If no research overview, show the basic description */}
                  {!product.research?.overview && product.description && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-slate-900 mb-4">Overview</h2>
                      <p className="text-slate-600 leading-relaxed">{product.description}</p>
                    </div>
                  )}

                  {/* Chemical Makeup */}
                  {(product.molecularFormula || product.molecularWeight || product.otherNames || product.research?.chemicalMakeup) && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-slate-900 mb-3">Chemical Makeup</h3>
                      <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                        {product.research?.chemicalMakeup && product.research.chemicalMakeup.split('\n').map((line: string, i: number) => {
                          const parts = line.split(':');
                          if (parts.length >= 2) {
                            return (
                              <p key={i} className="text-sm text-slate-700">
                                <strong>{parts[0].trim()}:</strong> {parts.slice(1).join(':').trim()}
                              </p>
                            );
                          }
                          return <p key={i} className="text-sm text-slate-700">{line}</p>;
                        })}
                        {product.molecularFormula && (
                          <p className="text-sm text-slate-700"><strong>Molecular Formula:</strong> {product.molecularFormula}</p>
                        )}
                        {product.molecularWeight && (
                          <p className="text-sm text-slate-700"><strong>Molecular Weight:</strong> {product.molecularWeight}</p>
                        )}
                        {product.otherNames && (
                          <p className="text-sm text-slate-700"><strong>Other Known Titles:</strong> {product.otherNames}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Research Content */}
                  {product.research?.researchContent && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-slate-900 mb-3">Research and Clinical Studies</h3>
                      <div className="text-slate-600 leading-relaxed whitespace-pre-line">
                        {product.research.researchContent}
                      </div>
                    </div>
                  )}

                  {/* Citations / Sources */}
                  {product.citations && product.citations.length > 0 && (
                    <div className="mt-10 pt-6 border-t border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Sources</h3>
                      <ol className="space-y-2">
                        {product.citations.map((citation: any, idx: number) => (
                          <li key={citation.id} className="text-sm text-slate-600 flex gap-2">
                            <span className="text-slate-400 font-medium shrink-0">[{citation.citationNumber || idx + 1}]</span>
                            <span>
                              {citation.title}
                              {citation.authors && <span className="text-slate-400"> — {citation.authors}</span>}
                              {citation.journal && <span className="text-slate-400 italic"> {citation.journal}</span>}
                              {citation.year && <span className="text-slate-400"> ({citation.year})</span>}
                              {citation.url && (
                                <a
                                  href={citation.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 ml-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* CoA Tab */}
              {activeTab === "coa" && product.coaUrl && (
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-3xl">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Certificate of Analysis</h3>
                    <p className="text-slate-600 mb-6">
                      The Certificate of Analysis (CoA) verifies the identity, purity, and quality of this product.
                    </p>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <iframe
                        src={product.coaUrl}
                        className="w-full h-[600px]"
                        title="Certificate of Analysis"
                      />
                    </div>
                    <a
                      href={product.coaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Open in new tab <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* HPLC Tab */}
              {activeTab === "hplc" && product.hplcUrl && (
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-3xl">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">HPLC Analysis</h3>
                    <p className="text-slate-600 mb-6">
                      High-Performance Liquid Chromatography (HPLC) analysis confirms the purity and composition of this compound.
                    </p>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <iframe
                        src={product.hplcUrl}
                        className="w-full h-[600px]"
                        title="HPLC Analysis"
                      />
                    </div>
                    <a
                      href={product.hplcUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Open in new tab <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Mass Spectrometry Tab */}
              {activeTab === "massspec" && product.massSpecUrl && (
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-3xl">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Mass Spectrometry</h3>
                    <p className="text-slate-600 mb-6">
                      Mass spectrometry analysis confirms the molecular weight and structural integrity of this compound.
                    </p>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <iframe
                        src={product.massSpecUrl}
                        className="w-full h-[600px]"
                        title="Mass Spectrometry"
                      />
                    </div>
                    <a
                      href={product.massSpecUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Open in new tab <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
