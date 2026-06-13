import { useAuth } from "@/_core/hooks/useAuth";
import { ASSETS } from "@/lib/assets";
import { trpc } from "@/lib/trpc";
import { useVisualBuilderSettings } from "@/contexts/VisualBuilderContext";
import { themeValue } from "@/lib/siteTheme";
import { cn } from "@/lib/utils";
import { Menu, ShoppingCart, User, X, LogOut, Package, Settings, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { useGuestCart } from "@/hooks/useGuestCart";
import { useHolidayTheme } from "@/hooks/useHolidayTheme";
import { ChristmasGarland } from "@/components/holiday/christmas/ChristmasGarland";
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
  const { settings } = useVisualBuilderSettings();
  const { isChristmas } = useHolidayTheme();

  const navbarBg = themeValue(settings, "navbar_bg_color");
  const navbarText = themeValue(settings, "navbar_text_color");
  const navbarActive = themeValue(settings, "navbar_text_active_color");
  const cartBadge = themeValue(settings, "navbar_cart_badge_color");
  const bannerEnabled = settings.banner_enabled === "true";
  const bannerText = settings.banner_text || "";

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

  const headerStyle = {
    backgroundColor: scrolled ? `${navbarBg}fa` : navbarBg,
  };

  return (
    <>
      {bannerEnabled && bannerText && (
        <div
          className="text-center py-2 px-4 text-sm font-medium"
          style={{
            backgroundColor: themeValue(settings, "banner_bg_color"),
          }}
          data-rvr-setting="banner_bg_color"
        >
          <span style={{ color: themeValue(settings, "banner_text_color") }} data-rvr-setting="banner_text">
            {bannerText}
          </span>
        </div>
      )}

      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300 relative",
          scrolled && "backdrop-blur-md shadow-lg shadow-black/20"
        )}
        style={headerStyle}
        data-rvr-setting="navbar_bg_color"
      >
        {isChristmas && <ChristmasGarland />}
        <div className="container">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <img src={ASSETS.logo} alt="River Valley Research Peptides" className="h-10 lg:h-14 w-auto object-contain" />
            </Link>

            <div className="hidden lg:flex items-center gap-8 ml-auto">
              <nav className="flex items-center gap-6" data-rvr-setting="navbar_text_color">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-semibold tracking-wide uppercase transition-colors"
                    style={{ color: location === link.href ? navbarActive : navbarText }}
                    data-rvr-setting={location === link.href ? "navbar_text_active_color" : undefined}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-4">
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className="p-1 transition-colors" style={{ color: navbarText }} aria-label="Account menu">
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
                  <Link href="/login" className="p-1 transition-colors" style={{ color: navbarText }} aria-label="Sign in">
                    <User className="h-5 w-5" />
                  </Link>
                )}

                <Link href="/cart" className="relative p-1 transition-colors" style={{ color: navbarText }} aria-label="Shopping cart">
                  <ShoppingCart className="h-5 w-5" />
                  <span
                    className="absolute -top-1.5 -right-1.5 text-white text-[10px] font-bold rounded-full h-[18px] w-[18px] flex items-center justify-center min-w-[18px]"
                    style={{ backgroundColor: cartBadge }}
                    data-rvr-setting="navbar_cart_badge_color"
                  >
                    {cartCount}
                  </span>
                </Link>

                <Link href="/shop" className="p-1 transition-colors" style={{ color: navbarText }} aria-label="Search products">
                  <Search className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <Link href="/cart" className="relative p-2 transition-colors" style={{ color: navbarText }}>
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center min-w-[18px]" style={{ backgroundColor: cartBadge }}>
                    {cartCount}
                  </span>
                )}
              </Link>

              <button className="p-2" style={{ color: navbarText }} onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Close menu" : "Open menu"}>
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-white/10" style={{ backgroundColor: navbarBg }}>
            <nav className="container py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    color: location === link.href ? navbarActive : navbarText,
                    backgroundColor: location === link.href ? "rgba(255,255,255,0.1)" : "transparent",
                  }}
                >
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <div className="pt-3 border-t border-white/10 space-y-2 px-4">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full border-slate-500 bg-transparent hover:bg-white/10" style={{ color: navbarText }}>
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full text-white" style={{ backgroundColor: themeValue(settings, "accent_color") }}>
                      Register
                    </Button>
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
