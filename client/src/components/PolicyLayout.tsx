import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";

const POLICY_LINKS = [
  { href: "/shipping", label: "Shipping, Returns & Refunds" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms and Conditions" },
  { href: "/contact", label: "Contact Us" },
] as const;

interface PolicyLayoutProps {
  title: string;
  subtitle?: string;
  currentPath: string;
  children: React.ReactNode;
}

export default function PolicyLayout({
  title,
  subtitle,
  currentPath,
  children,
}: PolicyLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 py-12 lg:py-16">
        <div className="container">
          <h1 className="text-3xl lg:text-4xl font-bold text-white uppercase tracking-wide">
            {title}
          </h1>
          {subtitle && <p className="text-slate-300 mt-2">{subtitle}</p>}
        </div>
      </div>

      <div className="container py-12 lg:py-16 flex-1">
        <article className="max-w-3xl mx-auto policy-content">{children}</article>

        <nav
          className="max-w-3xl mx-auto mt-12 pt-8 border-t border-slate-200"
          aria-label="Related policies"
        >
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Related Policies
          </h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {POLICY_LINKS.filter((link) => link.href !== currentPath).map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <Footer />
    </div>
  );
}

export function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-slate-900 mb-4">{title}</h2>
      <div className="space-y-4 text-slate-600 leading-relaxed text-[15px]">{children}</div>
    </section>
  );
}

export function PolicySubsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-3">{title}</h3>
      <div className="space-y-3 text-slate-600 leading-relaxed text-[15px]">{children}</div>
    </div>
  );
}
