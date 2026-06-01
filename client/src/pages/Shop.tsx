import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useSearch } from "wouter";
import { cn } from "@/lib/utils";

export default function Shop() {
  const searchParams = useSearch();
  const params = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
  const [searchTerm, setSearchTerm] = useState(params.get("search") || "");
  const [activeCategory, setActiveCategory] = useState(params.get("category") || "");
  const [showFilters, setShowFilters] = useState(false);

  const categoriesQuery = trpc.categories.list.useQuery();
  const productsQuery = trpc.products.list.useQuery({
    search: searchTerm || undefined,
    category: activeCategory || undefined,
    limit: 100,
  });

  const handleCategoryChange = useCallback((slug: string) => {
    setActiveCategory(slug === activeCategory ? "" : slug);
  }, [activeCategory]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setActiveCategory("");
  }, []);

  const products = productsQuery.data?.products || [];
  const categories = categoriesQuery.data || [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Page Header - Dark blue matching navbar */}
      <div className="bg-gradient-to-b from-[#0d2147] to-[#1a3a6b] py-10 lg:py-14">
        <div className="container text-center">
          <h1 className="text-3xl lg:text-4xl font-bold text-white">Research Peptides</h1>
          <p className="text-blue-200 mt-2 text-sm lg:text-base">Browse our complete catalog of premium research compounds</p>
        </div>
      </div>

      <div className="container py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className={cn(
            "lg:w-56 shrink-0",
            showFilters ? "block" : "hidden lg:block"
          )}>
            {/* Search */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-200"
                />
              </div>
            </form>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-3">Categories</h3>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveCategory("")}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    !activeCategory ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  All Products
                </button>
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      activeCategory === cat.slug ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {(searchTerm || activeCategory) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 gap-1">
                <X className="h-3 w-3" /> Clear Filters
              </Button>
            )}
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Mobile filter toggle */}
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </Button>
              <span className="text-sm text-slate-500">
                {products.length} product{products.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Results count */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <span className="text-sm text-slate-500">
                Showing {products.length} product{products.length !== 1 ? "s" : ""}
                {activeCategory && ` in "${categories.find((c: any) => c.slug === activeCategory)?.name || activeCategory}"`}
                {searchTerm && ` matching "${searchTerm}"`}
              </span>
            </div>

            {productsQuery.isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <Skeleton className="aspect-square" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-6 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-500 text-lg">No products found</p>
                <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
                {products.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
