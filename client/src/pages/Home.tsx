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
  const allProductsQuery = trpc.products.list.useQuery({ limit: 100 });
  const categoriesQuery = trpc.categories.list.useQuery();

  const allProducts = allProductsQuery.data?.products || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section - Dark blue gradient matching navbar, with 3 branded vials */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0a1628] via-[#0d2147] to-[#102a5a]">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }} />

        <div className="container relative py-16 lg:py-24">
          <div className="text-center mb-10 lg:mb-14">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-4">
              {settings.site_tagline || "Premium Research Peptides"}
            </h1>
            <p className="text-base lg:text-lg text-slate-300 max-w-2xl mx-auto mb-8">
              {settings.site_description || "We are proud to carry the highest quality peptides and peptide blends in the research industry. Third-party tested, 99%+ purity guaranteed."}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/shop">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white gap-2 px-8 h-12 text-base font-semibold shadow-lg shadow-blue-600/30">
                  Shop All Peptides <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="border-slate-400/40 text-slate-200 hover:bg-white/10 hover:border-slate-300/60 gap-2 h-12 text-base bg-transparent">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          {/* 3 Branded Vials Hero Image */}
          <div className="flex justify-center">
            <img
              src={ASSETS.heroVials}
              alt="River Valley Research Peptides - BPC-157, TB-500, GHK-Cu"
              className="w-full max-w-4xl h-auto object-contain rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* Trust Badges - Light blue background with silver text */}
      <section className="bg-gradient-to-b from-[#e8f0fa] to-[#dce8f5] py-10 lg:py-14">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { icon: Shield, title: "99%+ Purity", desc: "Third-party verified" },
              { icon: Truck, title: "Fast Shipping", desc: "Same-day processing" },
              { icon: FlaskConical, title: "Lab Tested", desc: "COA with every order" },
              { icon: Award, title: "Research Grade", desc: "Premium quality assured" },
            ].map((badge, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-full bg-white/80 text-blue-700 shadow-sm">
                  <badge.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-700 text-sm lg:text-base">{badge.title}</p>
                  <p className="text-xs lg:text-sm text-slate-500">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section - Slightly lighter blue bg with silver/white text */}
      <section className="py-14 lg:py-20 bg-gradient-to-b from-[#dce8f5] to-[#f0f4f9]">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-800">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-500 to-slate-700">Featured</span>{" "}
              Research Peptides
            </h2>
            <p className="text-slate-500 mt-2 text-sm lg:text-base">Our most popular compounds for advanced research</p>
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
              {(featuredQuery.data || []).slice(0, 8).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/shop">
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 gap-2 px-6">
                View All Products <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* All Available Peptides - White background, matching corepeptides catalog section */}
      <section className="py-14 lg:py-20 bg-white">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">All Available Peptides</h2>
            <p className="text-slate-500 mt-2">Browse our complete catalog of research compounds</p>
          </div>

          {/* Category filter pills */}
          {categoriesQuery.data && categoriesQuery.data.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <Link href="/shop">
                <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-blue-600 text-white cursor-pointer">
                  All
                </span>
              </Link>
              {categoriesQuery.data.slice(0, 6).map((cat: any) => (
                <Link key={cat.id} href={`/shop?category=${cat.slug}`}>
                  <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {allProductsQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <Skeleton className="aspect-square" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
              {allProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Research CTA Section */}
      <section className="py-14 lg:py-20 bg-gradient-to-r from-[#0d2147] to-[#1a3a6b]">
        <div className="container text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Backed by Research
          </h2>
          <p className="text-blue-200 max-w-2xl mx-auto mb-8 text-sm lg:text-base">
            Every product in our catalog includes detailed research citations and scientific sources.
            We believe in transparency and providing researchers with the information they need.
          </p>
          <Link href="/shop">
            <Button size="lg" className="bg-white text-blue-800 hover:bg-blue-50 gap-2 px-8 h-12 font-semibold">
              Explore Our Catalog <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
