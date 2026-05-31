import { trpc } from "@/lib/trpc";
import ProductCard from "@/components/ProductCard";
import { Link } from "wouter";
import { Plane, ShieldCheck, Headphones } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { ASSETS } from "@/lib/assets";

export default function Home() {
  const allProductsQuery = trpc.products.list.useQuery({ limit: 100 });
  const allProducts = allProductsQuery.data?.products || [];
  const settingsQuery = trpc.settings.public.useQuery();
  const settings = settingsQuery.data || {};

  // Template-driven colors (fall back to defaults)
  const heroBg = settings.hero_bg_color || "#0d2147";
  const heroText = settings.hero_text_color || "#ffffff";
  const accentColor = settings.accent_color || "#2563eb";

  // Generate gradient from hero bg color
  const heroGradient = `linear-gradient(135deg, ${heroBg} 0%, ${adjustBrightness(heroBg, 15)} 50%, ${adjustBrightness(heroBg, 30)} 100%)`;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* HERO SECTION - Colors driven by template settings */}
      <section className="relative overflow-hidden" style={{ background: heroGradient }}>
        {/* Subtle wave pattern overlay */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.04) 35px, rgba(255,255,255,0.04) 70px)`
        }} />

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[500px] py-16 lg:py-0">
            {/* Left side - Text content */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight" style={{ color: heroText }}>
                HIGHEST QUALITY<br />
                PEPTIDES FOR SALE
              </h1>
              <p className="text-lg max-w-md leading-relaxed" style={{ color: `${heroText}cc` }}>
                We are proud to carry the highest quality peptides and peptide blends in the research industry.
              </p>
              <Link href="/shop" className="inline-block border-2 px-8 py-3 text-sm font-bold tracking-widest transition-all duration-300 hover:text-white" style={{ borderColor: accentColor, color: accentColor }}>
                  BUY PEPTIDES
              </Link>
            </div>

            {/* Right side - 3 Vials HD product photo */}
            <div className="flex justify-center lg:justify-end">
              <img
                src={ASSETS.heroVials}
                alt="River Valley Research Peptide Vials - BPC-157, TB-500, GHK-Cu"
                className="w-full max-w-xl object-contain drop-shadow-[0_20px_50px_rgba(74,158,255,0.3)] scale-75 translate-y-4"
              />
            </div>
          </div>
        </div>

        {/* Diagonal white cut at bottom - matching corepeptides style */}
        <div className="absolute bottom-0 left-0 right-0 h-[80px]">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <polygon points="1440,0 1440,80 0,80" fill="#1a1a2e" />
          </svg>
        </div>
      </section>

      {/* TRUST BADGES BAR - Dark section with 3 badges (silver text, not gold) */}
      <section className="bg-[#1a1a2e] py-14 lg:py-16">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
            {/* Free Delivery */}
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 text-[#a8b8cc]">
                <Plane className="w-12 h-12 stroke-[1.2]" />
              </div>
              <div>
                <h3 className="text-[#c8d6e5] font-bold text-base tracking-wider uppercase mb-2">FREE DELIVERY</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Any purchase of $200 or more qualifies for free delivery within the USA.</p>
              </div>
            </div>

            {/* Highest Quality */}
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 text-[#a8b8cc]">
                <ShieldCheck className="w-12 h-12 stroke-[1.2]" />
              </div>
              <div>
                <h3 className="text-[#c8d6e5] font-bold text-base tracking-wider uppercase mb-2">HIGHEST QUALITY PEPTIDES</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Our products are scientifically-formulated and produced in cGMP facilities.</p>
              </div>
            </div>

            {/* Online Support */}
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 text-[#a8b8cc]">
                <Headphones className="w-12 h-12 stroke-[1.2]" />
              </div>
              <div>
                <h3 className="text-[#c8d6e5] font-bold text-base tracking-wider uppercase mb-2">ONLINE SUPPORT</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Have questions? We can help. Email us or connect with us via our <Link href="/contact" className="text-[#4a9eff] hover:underline">Contact</Link> page.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AVAILABLE RESEARCH PEPTIDES - White background, 4-column product grid, NO color lines */}
      <section className="bg-white py-16 lg:py-20">
        <div className="container mx-auto px-6 lg:px-12">
          {allProductsQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-7">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <Skeleton className="w-full aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-3/4 mt-4" />
                  <Skeleton className="h-4 w-1/3 mt-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-7">
              {allProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {!allProductsQuery.isLoading && allProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No products available.</p>
            </div>
          )}
        </div>
      </section>

      {/* BOTTOM SECTION - "Highest Quality Peptides For Sale" with LARGE logo filling the background */}
      <section className="bg-white py-20 lg:py-28 relative overflow-hidden border-t border-gray-100">
        {/* Large RVR logo filling the space behind text and button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src={ASSETS.logo}
            alt=""
            className="w-[600px] md:w-[800px] lg:w-[1000px] h-auto object-contain opacity-[0.18]"
          />
        </div>

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-8">
                <span className="inline-block bg-[#e8edf5] px-3 py-1">Highest Quality</span><br />
                <span className="inline-block bg-[#e8edf5] px-3 py-1 mt-3">Peptides For Sale</span>
              </h2>

              <p className="text-gray-500 text-base leading-relaxed max-w-lg">
                Welcome to River Valley Research Peptides. We are dedicated to providing the highest quality peptides and peptide blends for the research community. All of our peptides have undergone rigorous quality control procedures to ensure our clients receive the finest research-grade compounds available. We offer an extensive selection of peptides for sale online.
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <Link href="/shop" className="inline-block bg-gradient-to-r from-[#b8c5d4] to-[#8fa4bd] text-gray-900 px-14 py-5 text-xl font-bold tracking-wider shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.03] rounded-sm">
                  SHOP NOW
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Helper to adjust hex color brightness
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
