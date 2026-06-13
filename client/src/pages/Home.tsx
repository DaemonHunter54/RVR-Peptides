import { trpc } from "@/lib/trpc";
import ProductCard from "@/components/ProductCard";
import { Link } from "wouter";
import { Plane, ShieldCheck, Headphones } from "lucide-react";
import { useVisualBuilderSettings } from "@/contexts/VisualBuilderContext";
import { themeValue } from "@/lib/siteTheme";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { ASSETS } from "@/lib/assets";
import { BUSINESS } from "@shared/business";

export default function Home() {
  const allProductsQuery = trpc.products.list.useQuery({ limit: 100 });
  const allProducts = allProductsQuery.data?.products || [];
  const { settings } = useVisualBuilderSettings();

  const heroBg = themeValue(settings, "hero_bg_color");
  const heroText = themeValue(settings, "hero_text_color");
  const accentColor = themeValue(settings, "accent_color");
  const heroTagline = themeValue(settings, "site_tagline");
  const heroDescription = themeValue(settings, "site_description");
  const heroDivider = themeValue(settings, "hero_divider_color");
  const trustBg = themeValue(settings, "trust_bg_color");
  const trustIcon = themeValue(settings, "trust_icon_color");
  const trustHeading = themeValue(settings, "trust_heading_color");
  const trustBody = themeValue(settings, "trust_body_color");
  const trustLink = themeValue(settings, "trust_link_color");
  const productsBg = themeValue(settings, "products_section_bg_color");
  const bottomBg = themeValue(settings, "bottom_section_bg_color");
  const bottomHighlight = themeValue(settings, "bottom_heading_highlight_bg");
  const bottomHeadingText = themeValue(settings, "bottom_heading_text_color");
  const bottomBodyText = themeValue(settings, "bottom_body_text_color");
  const bottomCtaStart = themeValue(settings, "bottom_cta_start_color");
  const bottomCtaEnd = themeValue(settings, "bottom_cta_end_color");
  const bottomCtaText = themeValue(settings, "bottom_cta_text_color");
  const bottomHeading = themeValue(settings, "home_bottom_heading");
  const bottomBody = themeValue(settings, "home_bottom_body");
  const bottomHeadingLines = bottomHeading.split("\n");

  const heroGradient = `linear-gradient(135deg, ${heroBg} 0%, ${adjustBrightness(heroBg, 15)} 50%, ${adjustBrightness(heroBg, 30)} 100%)`;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section
        className="relative overflow-hidden"
        style={{ background: heroGradient }}
        data-rvr-setting="hero_bg_color"
      >
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.04) 35px, rgba(255,255,255,0.04) 70px)`
        }} />

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[500px] py-16 lg:py-0">
            <div className="space-y-6">
              <h1
                className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight whitespace-pre-line"
                style={{ color: heroText }}
                data-rvr-setting="site_tagline"
              >
                {heroTagline}
              </h1>
              <p
                className="text-lg max-w-md leading-relaxed"
                style={{ color: `${heroText}cc` }}
                data-rvr-setting="site_description"
              >
                {heroDescription}
              </p>
              <Link
                href="/shop"
                className="inline-block border-2 px-8 py-3 text-sm font-bold tracking-widest transition-all duration-300 hover:text-white"
                style={{ borderColor: accentColor, color: accentColor }}
                data-rvr-setting="accent_color"
              >
                BUY PEPTIDES
              </Link>
            </div>

            <div className="flex justify-center lg:justify-end" data-rvr-setting="hero_text_color">
              <img
                src={ASSETS.heroVials}
                alt="River Valley Research Peptide Vials - BPC-157, TB-500, GHK-Cu"
                className="w-full max-w-xl object-contain drop-shadow-[0_20px_50px_rgba(74,158,255,0.3)] scale-75 -translate-y-14"
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[80px]" data-rvr-setting="hero_divider_color">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <polygon points="1440,0 1440,80 0,80" fill={heroDivider} />
          </svg>
        </div>
      </section>

      <section className="py-14 lg:py-16" style={{ backgroundColor: trustBg }} data-rvr-setting="trust_bg_color">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0" style={{ color: trustIcon }} data-rvr-setting="trust_icon_color">
                <Plane className="w-12 h-12 stroke-[1.2]" />
              </div>
              <div>
                <h3 className="font-bold text-base tracking-wider uppercase mb-2" style={{ color: trustHeading }} data-rvr-setting="trust_heading_color">
                  FAST ORDER PROCESSING
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: trustBody }} data-rvr-setting="trust_body_color">
                  Orders are typically processed within 1–2 business days with tracking provided.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="flex-shrink-0" style={{ color: trustIcon }}>
                <ShieldCheck className="w-12 h-12 stroke-[1.2]" />
              </div>
              <div>
                <h3 className="font-bold text-base tracking-wider uppercase mb-2" style={{ color: trustHeading }}>
                  HIGHEST QUALITY PEPTIDES
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: trustBody }}>
                  Our products are scientifically-formulated and produced in cGMP facilities.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="flex-shrink-0" style={{ color: trustIcon }}>
                <Headphones className="w-12 h-12 stroke-[1.2]" />
              </div>
              <div>
                <h3 className="font-bold text-base tracking-wider uppercase mb-2" style={{ color: trustHeading }}>
                  ONLINE SUPPORT
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: trustBody }}>
                  Have questions? Email{" "}
                  <a href={`mailto:${BUSINESS.customerServiceEmail}`} className="hover:underline" style={{ color: trustLink }} data-rvr-setting="trust_link_color">
                    {BUSINESS.customerServiceEmail}
                  </a>{" "}
                  or visit our <Link href="/contact" className="hover:underline" style={{ color: trustLink }}>Contact</Link> page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20" style={{ backgroundColor: productsBg }} data-rvr-setting="products_section_bg_color">
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

      <section
        className="py-20 lg:py-28 relative overflow-hidden border-t border-gray-100"
        style={{ backgroundColor: bottomBg }}
        data-rvr-setting="bottom_section_bg_color"
      >
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
              <h2
                className="text-4xl md:text-5xl font-bold leading-tight mb-8"
                style={{ color: bottomHeadingText }}
                data-rvr-setting="home_bottom_heading"
              >
                {bottomHeadingLines.map((line, index) => (
                  <span
                    key={index}
                    className={`block w-fit px-3 py-1 ${index > 0 ? "mt-3" : ""}`}
                    style={{ backgroundColor: bottomHighlight, color: bottomHeadingText }}
                    data-rvr-setting={index === 0 ? "bottom_heading_highlight_bg" : undefined}
                  >
                    {line}
                  </span>
                ))}
              </h2>

              <p
                className="text-base leading-relaxed max-w-lg"
                style={{ color: bottomBodyText }}
                data-rvr-setting="home_bottom_body"
              >
                {bottomBody}
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <Link
                href="/shop"
                className="inline-block px-14 py-5 text-xl font-bold tracking-wider shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.03] rounded-sm"
                style={{
                  background: `linear-gradient(to right, ${bottomCtaStart}, ${bottomCtaEnd})`,
                  color: bottomCtaText,
                }}
                data-rvr-setting="bottom_cta_start_color"
              >
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

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
