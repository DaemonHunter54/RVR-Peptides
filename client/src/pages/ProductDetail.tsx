import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ASSETS } from "@/lib/assets";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Minus, Plus, ArrowLeft, ExternalLink, FlaskConical, Shield, Check } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { useGuestCart } from "@/hooks/useGuestCart";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const productQuery = trpc.products.bySlug.useQuery({ slug: slug || "" });
  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("Added to cart!");
    },
    onError: (err) => toast.error(err.message),
  });
  const utils = trpc.useUtils();

  const product = productQuery.data;

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

  const price = Number(product.price);
  const hasDiscount = product.discountActive && product.discountPercent;
  const discountedPrice = hasDiscount ? price * (1 - Number(product.discountPercent) / 100) : price;

  const guestCart = useGuestCart();

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      // Add to guest cart (localStorage)
      guestCart.addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        discountActive: product.discountActive || false,
        discountPercent: product.discountPercent || null,
      }, quantity);
      toast.success("Added to cart!");
      return;
    }
    addToCart.mutate({ productId: product.id, quantity }, {
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
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl p-8 lg:p-12 flex items-center justify-center">
            <img
              src={product.imageUrl || ASSETS.peptideVial}
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

            {/* Quick specs */}
            <div className="grid grid-cols-2 gap-3">
              {product.purity && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Purity</p>
                  <p className="font-semibold text-slate-800">{product.purity}</p>
                </div>
              )}
              {product.size && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Size</p>
                  <p className="font-semibold text-slate-800">{product.size}</p>
                </div>
              )}
              {product.form && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Form</p>
                  <p className="font-semibold text-slate-800">{product.form}</p>
                </div>
              )}
              {product.molecularWeight && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Mol. Weight</p>
                  <p className="font-semibold text-slate-800">{product.molecularWeight}</p>
                </div>
              )}
            </div>

            {product.description && (
              <p className="text-slate-600 leading-relaxed">{product.description}</p>
            )}

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

        {/* Tabs: Description, Research, Citations */}
        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="description" className="rounded-md">Description</TabsTrigger>
            <TabsTrigger value="research" className="rounded-md">Research</TabsTrigger>
            <TabsTrigger value="citations" className="rounded-md">Citations</TabsTrigger>
            <TabsTrigger value="specs" className="rounded-md">Specifications</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 leading-relaxed">{product.description || "No description available."}</p>
              {product.shortDescription && product.shortDescription !== product.description && (
                <p className="text-slate-600 leading-relaxed mt-4">{product.shortDescription}</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="research" className="mt-6">
            {product.research ? (
              <div className="space-y-6">
                {product.research.overview && (
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg mb-2">Overview</h3>
                    <p className="text-slate-600 leading-relaxed">{product.research.overview}</p>
                  </div>
                )}
                {product.research.chemicalMakeup && (
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg mb-2">Chemical Makeup</h3>
                    <p className="text-slate-600 leading-relaxed">{product.research.chemicalMakeup}</p>
                  </div>
                )}
                {product.research.researchContent && (
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg mb-2">Research Findings</h3>
                    <p className="text-slate-600 leading-relaxed">{product.research.researchContent}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500">Research information coming soon.</p>
            )}
          </TabsContent>

          <TabsContent value="citations" className="mt-6">
            {product.citations && product.citations.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 mb-4">
                  The following research citations support the scientific study of this compound.
                </p>
                {product.citations.map((citation: any, idx: number) => (
                  <div key={citation.id} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <div className="flex items-start gap-3">
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shrink-0 mt-0.5">
                        {citation.citationNumber || idx + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-800 text-sm">{citation.title}</h4>
                        {citation.authors && (
                          <p className="text-xs text-slate-500 mt-1">{citation.authors}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          {citation.journal && (
                            <span className="text-xs text-slate-500 italic">{citation.journal}</span>
                          )}
                          {citation.year && (
                            <span className="text-xs text-slate-400">({citation.year})</span>
                          )}
                        </div>
                        {citation.summary && (
                          <p className="text-sm text-slate-600 mt-2">{citation.summary}</p>
                        )}
                        {citation.url && (
                          <a
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2"
                          >
                            View Source <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No research citations available yet.</p>
            )}
          </TabsContent>

          <TabsContent value="specs" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "SKU", value: product.sku },
                { label: "Size", value: product.size },
                { label: "Form", value: product.form },
                { label: "Purity", value: product.purity },
                { label: "Contents", value: product.contents },
                { label: "Molecular Formula", value: product.molecularFormula },
                { label: "Molecular Weight", value: product.molecularWeight },
                { label: "Other Names", value: product.otherNames },
              ].filter(s => s.value).map((spec) => (
                <div key={spec.label} className="flex justify-between py-3 border-b border-slate-100">
                  <span className="text-sm font-medium text-slate-500">{spec.label}</span>
                  <span className="text-sm text-slate-800">{spec.value}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
