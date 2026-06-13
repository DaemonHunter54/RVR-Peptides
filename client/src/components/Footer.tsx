import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { ASSETS } from "@/lib/assets";

export default function Footer() {
  const settingsQuery = trpc.settings.public.useQuery();
  const settings = settingsQuery.data || {};
  const [email, setEmail] = useState("");

  return (
    <footer>
      {/* NEWSLETTER SECTION - Dark textured background like corepeptides */}
      <section className="relative py-14 lg:py-16 overflow-hidden" style={{ background: "linear-gradient(135deg, #0f1923 0%, #1a2a3e 50%, #0f1923 100%)" }}>
        {/* Marble/texture overlay */}
        <div className="absolute inset-0 opacity-[0.15]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
        }} />

        <div className="container mx-auto px-6 lg:px-12 relative z-10 text-center">
          <h3 className="text-white text-xl md:text-2xl font-bold tracking-wider uppercase mb-2">
            SUBSCRIBE TO OUR NEWSLETTER
          </h3>
          <p className="text-[#b8c5d4] text-sm tracking-wider uppercase mb-6">
            ENJOY PROMOTIONS AND DISCOUNTS
          </p>

          {/* Email input */}
          <div className="max-w-md mx-auto flex gap-2 mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 text-sm rounded-sm focus:outline-none focus:border-[#4a9eff]"
            />
            <button className="px-6 py-3 bg-[#4a9eff] text-white text-sm font-bold tracking-wider hover:bg-[#3a8eef] transition-colors rounded-sm">
              SUBSCRIBE
            </button>
          </div>

          <p className="text-gray-500 text-[10px] uppercase tracking-wider max-w-2xl mx-auto leading-relaxed">
            BY SUBSCRIBING, YOU AGREE TO RECEIVE RECURRING MESSAGES FROM RIVER VALLEY RESEARCH PEPTIDES. MESSAGE FREQUENCY MAY VARY. MSG & DATA RATES MAY APPLY. REPLY STOP TO UNSUBSCRIBE OR HELP FOR HELP.
          </p>
        </div>
      </section>

      {/* MAIN FOOTER - Dark background with logo, disclaimer, links, payment */}
      <div className="bg-[#0a0f18] py-14 lg:py-16">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
            {/* Left - Logo and disclaimer */}
            <div className="lg:col-span-1">
              <img
                src={ASSETS.logo}
                alt="River Valley Research Peptides"
                className="h-14 w-auto mb-6"
              />
              <p className="text-[#4a9eff] text-sm italic font-medium mb-4">
                All products are sold for research, laboratory, or analytical purposes only, and are not for human consumption.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                River Valley Research Peptides is a chemical supplier. River Valley Research Peptides is not a compounding pharmacy or chemical compounding facility as defined under 503A of the Federal Food, Drug, and Cosmetic act. River Valley Research Peptides is not an outsourcing facility as defined under 503B of the Federal Food, Drug, and Cosmetic act.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                The statements made within this website have not been evaluated by the US Food and Drug Administration. The products we offer are not intended to diagnose, treat, cure or prevent any disease.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Human/Animal Consumption Prohibited. Laboratory/In-Vitro Experimental Use Only
              </p>
            </div>

            {/* Middle - Quick Links */}
            <div>
              <h4 className="text-[#b8c5d4] text-lg font-medium mb-5">Quick links</h4>
              <ul className="space-y-3">
                {[
                  { href: "/shop", label: "Peptides for Sale" },
                  { href: "/about", label: "About Us" },
                  { href: "/contact", label: "Contact" },
                  { href: "/shipping", label: "Shipping, Returns & Refunds" },
                  { href: "/privacy", label: "Privacy Policy" },
                  { href: "/terms", label: "Terms and Conditions" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-gray-400 text-sm hover:text-white transition-colors">
                        {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right - Now Accepting */}
            <div>
              <h4 className="text-[#b8c5d4] text-lg font-medium mb-5">Now Accepting</h4>
              <div className="flex gap-3">
                {/* Crypto payment badges */}
                <div className="bg-[#f7931a] text-white text-xs font-bold px-3 py-2 rounded-sm">BTC</div>
                <div className="bg-[#627eea] text-white text-xs font-bold px-3 py-2 rounded-sm">ETH</div>
                <div className="bg-[#26a17b] text-white text-xs font-bold px-3 py-2 rounded-sm">USDT</div>
                <div className="bg-[#2775ca] text-white text-xs font-bold px-3 py-2 rounded-sm">USDC</div>
              </div>
              <p className="text-gray-500 text-xs mt-3">Cryptocurrency payments via NowPayments</p>
            </div>
          </div>
        </div>
      </div>

      {/* COPYRIGHT BAR */}
      <div className="bg-[#060a10] py-4">
        <div className="container mx-auto px-6 lg:px-12">
          <p className="text-gray-600 text-xs text-center">
            &copy; {new Date().getFullYear()} River Valley Research Peptides. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
