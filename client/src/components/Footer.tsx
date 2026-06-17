import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { ASSETS } from "@/lib/assets";
import { BUSINESS } from "@shared/business";
import { useVisualBuilderSettings } from "@/contexts/VisualBuilderContext";
import { themeValue } from "@/lib/siteTheme";
import AcceptedPaymentMethods from "@/components/AcceptedPaymentMethods";

export default function Footer() {
  const { settings } = useVisualBuilderSettings();
  const [email, setEmail] = useState("");

  const legalName = settings.business_legal_name || BUSINESS.legalName;
  const supportEmail = settings.contact_email || BUSINESS.supportEmail;
  const customerServiceEmail = settings.customer_service_email || BUSINESS.customerServiceEmail;
  const ordersEmail = settings.orders_email || BUSINESS.ordersEmail;
  const mailingListEmail = settings.mailing_list_email || BUSINESS.mailingListEmail;

  const newsletterBgStart = themeValue(settings, "footer_newsletter_bg_start");
  const newsletterBgEnd = themeValue(settings, "footer_newsletter_bg_end");
  const newsletterTitle = themeValue(settings, "footer_newsletter_title_color");
  const newsletterSubtitle = themeValue(settings, "footer_newsletter_subtitle_color");
  const newsletterButtonBg = themeValue(settings, "footer_newsletter_button_bg");
  const newsletterButtonText = themeValue(settings, "footer_newsletter_button_text");
  const footerMainBg = themeValue(settings, "footer_main_bg_color");
  const footerHeading = themeValue(settings, "footer_heading_color");
  const footerText = themeValue(settings, "footer_text_color");
  const footerAccent = themeValue(settings, "footer_accent_color");
  const footerLink = themeValue(settings, "footer_link_color");
  const footerCopyrightBg = themeValue(settings, "footer_copyright_bg_color");
  const footerCopyrightText = themeValue(settings, "footer_copyright_text_color");
  const footerDisclaimer = themeValue(settings, "footer_disclaimer");

  const handleNewsletterSubscribe = () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    window.location.href = `mailto:${mailingListEmail}?subject=${encodeURIComponent("Newsletter Subscription")}&body=${encodeURIComponent(
      `Please subscribe the following email to the RVR Peptides newsletter:\n\n${trimmed}`
    )}`;
    toast.success("Opening your email app to complete your subscription request.");
  };

  return (
    <footer>
      <section
        className="relative py-14 lg:py-16 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${newsletterBgStart} 0%, ${newsletterBgEnd} 50%, ${newsletterBgStart} 100%)` }}
        data-rvr-setting="footer_newsletter_bg_start"
      >
        <div className="absolute inset-0 opacity-[0.15]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
        }} />

        <div className="container mx-auto px-6 lg:px-12 relative z-10 text-center">
          <h3
            className="text-xl md:text-2xl font-bold tracking-wider uppercase mb-2"
            style={{ color: newsletterTitle }}
            data-rvr-setting="footer_newsletter_title_color"
          >
            SUBSCRIBE TO OUR NEWSLETTER
          </h3>
          <p
            className="text-sm tracking-wider uppercase mb-6"
            style={{ color: newsletterSubtitle }}
            data-rvr-setting="footer_newsletter_subtitle_color"
          >
            ENJOY PROMOTIONS AND DISCOUNTS
          </p>

          <div className="max-w-md mx-auto flex gap-2 mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 text-sm rounded-sm focus:outline-none focus:border-[#4a9eff]"
            />
            <button
              type="button"
              onClick={handleNewsletterSubscribe}
              className="px-6 py-3 text-sm font-bold tracking-wider transition-colors rounded-sm"
              style={{ backgroundColor: newsletterButtonBg, color: newsletterButtonText }}
              data-rvr-setting="footer_newsletter_button_bg"
            >
              SUBSCRIBE
            </button>
          </div>

          <p className="text-[10px] uppercase tracking-wider max-w-2xl mx-auto leading-relaxed" style={{ color: footerText }} data-rvr-setting="footer_text_color">
            BY SUBSCRIBING, YOU AGREE TO RECEIVE RECURRING MESSAGES FROM {legalName.toUpperCase()}. MESSAGE FREQUENCY MAY VARY. MSG & DATA RATES MAY APPLY. REPLY STOP TO UNSUBSCRIBE OR HELP FOR HELP.
          </p>
        </div>
      </section>

      <div className="py-14 lg:py-16" style={{ backgroundColor: footerMainBg }} data-rvr-setting="footer_main_bg_color">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
            <div className="lg:col-span-1">
              <img src={ASSETS.logo} alt={legalName} className="h-14 w-auto mb-4" />
              <p className="text-sm font-medium mb-4" style={{ color: newsletterTitle }}>{legalName}</p>
              <div className="space-y-2 mb-4 text-sm">
                <p>
                  <a href={`mailto:${customerServiceEmail}`} className="transition-colors hover:opacity-80" style={{ color: footerLink }} data-rvr-setting="footer_link_color">
                    {customerServiceEmail}
                  </a>
                  <span className="text-xs block" style={{ color: footerCopyrightText }}>Customer Service</span>
                </p>
                <p>
                  <a href={`mailto:${ordersEmail}`} className="transition-colors hover:opacity-80" style={{ color: footerLink }}>
                    {ordersEmail}
                  </a>
                  <span className="text-xs block" style={{ color: footerCopyrightText }}>Orders</span>
                </p>
                <p>
                  <a href={`mailto:${supportEmail}`} className="transition-colors hover:opacity-80" style={{ color: footerLink }}>
                    {supportEmail}
                  </a>
                  <span className="text-xs block" style={{ color: footerCopyrightText }}>Support</span>
                </p>
              </div>
              <p className="text-sm italic font-medium mb-4" style={{ color: footerAccent }} data-rvr-setting="footer_disclaimer">
                {footerDisclaimer}
              </p>
              <p className="text-sm leading-relaxed mb-4" style={{ color: footerText }}>
                {legalName} is a chemical supplier. {legalName} is not a compounding pharmacy or chemical compounding facility as defined under 503A of the Federal Food, Drug, and Cosmetic act. {legalName} is not an outsourcing facility as defined under 503B of the Federal Food, Drug, and Cosmetic act.
              </p>
              <p className="text-sm leading-relaxed mb-4" style={{ color: footerText }}>
                The statements made within this website have not been evaluated by the US Food and Drug Administration. The products we offer are not intended to diagnose, treat, cure or prevent any disease.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: footerText }}>
                Human/Animal Consumption Prohibited. Laboratory/In-Vitro Experimental Use Only
              </p>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-5" style={{ color: footerHeading }} data-rvr-setting="footer_heading_color">
                Quick links
              </h4>
              <ul className="space-y-3">
                {[
                  { href: "/shop", label: "Peptides for Sale" },
                  { href: "/about", label: "About Us" },
                  { href: "/shipping", label: "Shipping, Returns & Refunds" },
                  { href: "/privacy", label: "Privacy Policy" },
                  { href: "/terms", label: "Terms and Conditions" },
                  { href: "/contact", label: "Contact" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm transition-colors hover:opacity-80" style={{ color: footerLink }}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-5" style={{ color: footerHeading }}>
                Now Accepting
              </h4>
              <AcceptedPaymentMethods />
              <p className="text-xs mt-3" style={{ color: footerCopyrightText }}>
                Invoicing and local payment options. All prices in USD.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-4" style={{ backgroundColor: footerCopyrightBg }} data-rvr-setting="footer_copyright_bg_color">
        <div className="container mx-auto px-6 lg:px-12">
          <p className="text-xs text-center" style={{ color: footerCopyrightText }} data-rvr-setting="footer_copyright_text_color">
            &copy; {new Date().getFullYear()} {legalName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
