import { useAuth } from "@/_core/hooks/useAuth";
import { ASSETS } from "@/lib/assets";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Menu, ShoppingCart, User, X, LogOut, Package, Settings, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { useGuestCart } from "@/hooks/useGuestCart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const settingsQuery = trpc.settings.public.useQuery();
  const settings = settingsQuery.data || {};

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const cartQuery = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });
  const guestCart = useGuestCart();
  const cartCount = isAuthenticated
    ? (cartQuery.data?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0)
    : guestCart.itemCount;

  const navLinks = [
    { href: "/", label: "HOME" },
    { href: "/shop", label: "PEPTIDES FOR SALE" },
    { href: "/about", label: "ABOUT US" },
    { href: "/contact", label: "CONTACT" },
  ];

  const bannerEnabled = settings.banner_enabled === "true";
  const bannerText = settings.banner_text || "";

  // Determine if we're on the homepage for transparent navbar
  const isHome = location === "/";

  return (
    <>
      {/* Announcement Banner */}
      {bannerEnabled && bannerText && (
        <div
          className="text-center py-2 px-4 text-sm font-medium"
          style={{
            backgroundColor: settings.banner_bg_color || "#0a1628",
            color: settings.banner_text_color || "#94a3b8",
          }}
        >
          {bannerText}
        </div>
      )}

      {/* Main Navbar - Dark blue that blends into hero */}
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-[#0a1628]/98 backdrop-blur-md shadow-lg shadow-black/20"
            : isHome
              ? "bg-[#0a1628]"
              : "bg-[#0a1628]"
        )}
      >
        <div className="container">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <img
                src={ASSETS.logo}
                alt="River Valley Research Peptides"
                className="h-10 lg:h-14 w-auto object-contain"
              />
            </Link>

            {/* Desktop: nav links + icons grouped on the right */}
            <div className="hidden lg:flex items-center gap-8 ml-auto">
              <nav className="flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "text-sm font-semibold tracking-wide uppercase transition-colors",
                      location === link.href
                        ? "text-white"
                        : "text-slate-200 hover:text-white"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-4">
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="p-1 text-slate-200 hover:text-white transition-colors"
                        aria-label="Account menu"
                      >
                        <User className="h-5 w-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href="/account" className="flex items-center gap-2 cursor-pointer">
                          <User className="h-4 w-4" /> My Account
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/orders" className="flex items-center gap-2 cursor-pointer">
                          <Package className="h-4 w-4" /> My Orders
                        </Link>
                      </DropdownMenuItem>
                      {(user?.role === "admin" || user?.role === "super_admin") && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                              <Settings className="h-4 w-4" /> Admin Panel
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => logout()} className="flex items-center gap-2 cursor-pointer text-red-600">
                        <LogOut className="h-4 w-4" /> Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link
                    href="/login"
                    className="p-1 text-slate-200 hover:text-white transition-colors"
                    aria-label="Sign in"
                  >
                    <User className="h-5 w-5" />
                  </Link>
                )}

                <Link
                  href="/cart"
                  className="relative p-1 text-slate-200 hover:text-white transition-colors"
                  aria-label="Shopping cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-700 text-white text-[10px] font-bold rounded-full h-[18px] w-[18px] flex items-center justify-center min-w-[18px]">
                    {cartCount}
                  </span>
                </Link>

                <Link
                  href="/shop"
                  className="p-1 text-slate-200 hover:text-white transition-colors"
                  aria-label="Search products"
                >
                  <Search className="h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 lg:hidden">
              <Link href="/cart" className="relative p-2 text-slate-300 hover:text-white transition-colors">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center min-w-[18px]">
                    {cartCount}
                  </span>
                )}
              </Link>

              <button
                className="p-2 text-slate-300 hover:text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#0a1628]">
            <nav className="container py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    location === link.href
                      ? "text-white bg-white/10"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <div className="pt-3 border-t border-white/10 space-y-2 px-4">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full border-slate-500 text-slate-200 bg-transparent hover:bg-white/10">Sign In</Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">Register</Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
