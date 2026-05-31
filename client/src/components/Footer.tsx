import { ASSETS } from "@/lib/assets";
import { trpc } from "@/lib/trpc";
import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  const settingsQuery = trpc.settings.public.useQuery();
  const settings = settingsQuery.data || {};

  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Main Footer */}
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <img
              src={ASSETS.logo}
              alt="River Valley Research Peptides"
              className="h-14 w-auto mb-4 rounded-md bg-white object-contain"
            />
            <p className="text-sm text-slate-400 leading-relaxed">
              {settings.site_description || "We are proud to carry the highest quality peptides and peptide blends in the research industry."}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { href: "/shop", label: "Shop All" },
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact" },
                { href: "/account", label: "My Account" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Categories</h3>
            <ul className="space-y-2.5">
              {["Peptides", "Fat Loss", "Recovery", "Longevity", "Nootropic", "Cosmetics"].map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/shop?category=${cat.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Contact</h3>
            <ul className="space-y-3">
              {settings.contact_email && (
                <li className="flex items-center gap-2.5 text-sm text-slate-400">
                  <Mail className="h-4 w-4 text-blue-400 shrink-0" />
                  <a href={`mailto:${settings.contact_email}`} className="hover:text-white transition-colors">
                    {settings.contact_email}
                  </a>
                </li>
              )}
              {settings.contact_phone && (
                <li className="flex items-center gap-2.5 text-sm text-slate-400">
                  <Phone className="h-4 w-4 text-blue-400 shrink-0" />
                  <a href={`tel:${settings.contact_phone}`} className="hover:text-white transition-colors">
                    {settings.contact_phone}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container py-6">
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            {settings.footer_disclaimer || "All products are sold for research, laboratory, or analytical purposes only, and are not for human consumption."}
          </p>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} River Valley Research Peptides. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
