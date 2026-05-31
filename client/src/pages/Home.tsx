import { ASSETS } from "@/lib/assets";
import { trpc } from "@/lib/trpc";
import ProductCard from "@/components/ProductCard";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Truck, FlaskConical, Award, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const settingsQuery = trpc.settings.public.useQuery();
  const settings = settingsQuery.data || {};
  const featuredQuery = trpc.products.featured.useQuery();
  const categoriesQuery = trpc.categories.list.useQuery();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 25% 25%, rgba(59,130,246,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(148,163,184,0.2) 0%, transparent 50%)"
          }} />
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="200" height="200" fill="url(#grid)" />
          </svg>
        </div>

        <div className="container relative py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5">
                <FlaskConical className="h-4 w-4 text-blue-400" />
                <span className="text-blue-300 text-sm font-medium">Research Grade Quality</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                {settings.site_tagline || "Highest Quality Research Peptides"}
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed max-w-lg">
                {settings.site_description || "We are proud to carry the highest quality peptides and peptide blends in the research industry."}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/shop">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8 h-12 text-base">
                    Shop Now <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="border-slate-500 text-slate-200 hover:bg-white/10 gap-2 h-12 text-base bg-transparent">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl" />
                <img
                  src={ASSETS.peptideVial}
                  alt="Research Peptide Vial"
                  className="relative w-80 h-80 object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-b border-slate-100">
        <div className="container py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "99%+ Purity", desc: "Third-party tested" },
              { icon: Truck, title: "Fast Shipping", desc: "Same-day processing" },
              { icon: FlaskConical, title: "Lab Tested", desc: "COA available" },
              { icon: Award, title: "Premium Quality", desc: "Research grade" },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <badge.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{badge.title}</p>
                  <p className="text-xs text-slate-500">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 lg:py-20 bg-slate-50/50">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">Featured Products</h2>
              <p className="text-slate-500 mt-1">Our most popular research peptides</p>
            </div>
            <Link href="/shop">
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700 gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {featuredQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <Skeleton className="aspect-square" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {(featuredQuery.data || []).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      {categoriesQuery.data && categoriesQuery.data.length > 0 && (
        <section className="py-16 lg:py-20">
          <div className="container">
            <div className="text-center mb-10">
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">Shop by Category</h2>
              <p className="text-slate-500 mt-1">Browse our complete selection of research compounds</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoriesQuery.data.map((cat: any) => (
                <Link key={cat.id} href={`/shop?category=${cat.slug}`}>
                  <div className="group relative bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h3 className="font-semibold text-base relative z-10">{cat.name}</h3>
                    {cat.description && (
                      <p className="text-blue-200 text-xs mt-1 relative z-10 line-clamp-2">{cat.description}</p>
                    )}
                    <ChevronRight className="h-5 w-5 absolute bottom-4 right-4 text-blue-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Research CTA */}
      <section className="py-16 lg:py-20 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="container text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Backed by Research
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8">
            Every product in our catalog includes detailed research citations and scientific sources.
            We believe in transparency and providing researchers with the information they need.
          </p>
          <Link href="/shop">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 gap-2 px-8 h-12">
              Explore Our Catalog <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
