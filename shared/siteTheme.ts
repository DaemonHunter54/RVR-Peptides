import type { VisualBuilderFieldType } from "./visualBuilderRegions";

export type SiteThemeField = {
  key: string;
  label: string;
  type: VisualBuilderFieldType;
  defaultValue: string;
  group: string;
};

/** Default storefront look — this is the revert baseline. */
export const SITE_THEME_FIELDS: SiteThemeField[] = [
  { key: "banner_enabled", label: "Announcement Banner", type: "toggle", defaultValue: "false", group: "banner" },
  { key: "banner_text", label: "Banner Text", type: "text", defaultValue: "", group: "banner" },
  { key: "banner_bg_color", label: "Banner Background", type: "color", defaultValue: "#0a1628", group: "banner" },
  { key: "banner_text_color", label: "Banner Text Color", type: "color", defaultValue: "#94a3b8", group: "banner" },

  { key: "navbar_bg_color", label: "Navigation Bar Background", type: "color", defaultValue: "#0a1628", group: "navbar" },
  { key: "navbar_text_color", label: "Navigation Links", type: "color", defaultValue: "#e2e8f0", group: "navbar" },
  { key: "navbar_text_active_color", label: "Navigation Active Link", type: "color", defaultValue: "#ffffff", group: "navbar" },
  { key: "navbar_cart_badge_color", label: "Cart Badge", type: "color", defaultValue: "#b45309", group: "navbar" },

  { key: "site_tagline", label: "Hero Headline", type: "textarea", defaultValue: "HIGHEST QUALITY\nPEPTIDES FOR SALE", group: "hero" },
  { key: "site_description", label: "Hero Description", type: "textarea", defaultValue: "We are proud to carry the highest quality peptides and peptide blends in the research industry.", group: "hero" },
  { key: "hero_bg_color", label: "Hero Background", type: "color", defaultValue: "#0d2147", group: "hero" },
  { key: "hero_text_color", label: "Hero Text Color", type: "color", defaultValue: "#ffffff", group: "hero" },
  { key: "hero_divider_color", label: "Hero Bottom Divider", type: "color", defaultValue: "#1a1a2e", group: "hero" },
  { key: "accent_color", label: "Primary Button Accent", type: "color", defaultValue: "#2563eb", group: "hero" },

  { key: "trust_bg_color", label: "Trust Bar Background", type: "color", defaultValue: "#1a1a2e", group: "trust" },
  { key: "trust_icon_color", label: "Trust Bar Icons", type: "color", defaultValue: "#a8b8cc", group: "trust" },
  { key: "trust_heading_color", label: "Trust Bar Headings", type: "color", defaultValue: "#c8d6e5", group: "trust" },
  { key: "trust_body_color", label: "Trust Bar Body Text", type: "color", defaultValue: "#9ca3af", group: "trust" },
  { key: "trust_link_color", label: "Trust Bar Links", type: "color", defaultValue: "#4a9eff", group: "trust" },

  { key: "products_section_bg_color", label: "Product Grid Background", type: "color", defaultValue: "#ffffff", group: "products" },
  { key: "product_card_name_color", label: "Product Name Text", type: "color", defaultValue: "#1f2937", group: "products" },
  { key: "product_card_price_color", label: "Product Price Text", type: "color", defaultValue: "#4a9eff", group: "products" },
  { key: "product_card_meta_color", label: "Product Meta Text", type: "color", defaultValue: "#6b7280", group: "products" },

  { key: "home_bottom_heading", label: "Bottom Section Headline", type: "textarea", defaultValue: "Highest Quality\nPeptides For Sale", group: "bottom" },
  { key: "home_bottom_body", label: "Bottom Section Description", type: "textarea", defaultValue: "Welcome to River Valley Research Peptides. We are dedicated to providing the highest quality peptides and peptide blends for the research community. All of our peptides have undergone rigorous quality control procedures to ensure our clients receive the finest research-grade compounds available. We offer an extensive selection of peptides for sale online.", group: "bottom" },
  { key: "bottom_section_bg_color", label: "Bottom Section Background", type: "color", defaultValue: "#ffffff", group: "bottom" },
  { key: "bottom_heading_highlight_bg", label: "Bottom Headline Highlight", type: "color", defaultValue: "#e8edf5", group: "bottom" },
  { key: "bottom_heading_text_color", label: "Bottom Headline Text", type: "color", defaultValue: "#111827", group: "bottom" },
  { key: "bottom_body_text_color", label: "Bottom Body Text", type: "color", defaultValue: "#6b7280", group: "bottom" },
  { key: "bottom_cta_start_color", label: "Shop Now Button (Start)", type: "color", defaultValue: "#b8c5d4", group: "bottom" },
  { key: "bottom_cta_end_color", label: "Shop Now Button (End)", type: "color", defaultValue: "#8fa4bd", group: "bottom" },
  { key: "bottom_cta_text_color", label: "Shop Now Button Text", type: "color", defaultValue: "#111827", group: "bottom" },

  { key: "footer_newsletter_bg_start", label: "Newsletter Background (Start)", type: "color", defaultValue: "#0f1923", group: "footer" },
  { key: "footer_newsletter_bg_end", label: "Newsletter Background (End)", type: "color", defaultValue: "#1a2a3e", group: "footer" },
  { key: "footer_newsletter_title_color", label: "Newsletter Title", type: "color", defaultValue: "#ffffff", group: "footer" },
  { key: "footer_newsletter_subtitle_color", label: "Newsletter Subtitle", type: "color", defaultValue: "#b8c5d4", group: "footer" },
  { key: "footer_newsletter_button_bg", label: "Newsletter Button", type: "color", defaultValue: "#4a9eff", group: "footer" },
  { key: "footer_newsletter_button_text", label: "Newsletter Button Text", type: "color", defaultValue: "#ffffff", group: "footer" },
  { key: "footer_main_bg_color", label: "Footer Background", type: "color", defaultValue: "#0a0f18", group: "footer" },
  { key: "footer_heading_color", label: "Footer Section Headings", type: "color", defaultValue: "#b8c5d4", group: "footer" },
  { key: "footer_text_color", label: "Footer Body Text", type: "color", defaultValue: "#9ca3af", group: "footer" },
  { key: "footer_accent_color", label: "Footer Accent / Disclaimer", type: "color", defaultValue: "#4a9eff", group: "footer" },
  { key: "footer_link_color", label: "Footer Links", type: "color", defaultValue: "#9ca3af", group: "footer" },
  { key: "footer_copyright_bg_color", label: "Copyright Bar Background", type: "color", defaultValue: "#060a10", group: "footer" },
  { key: "footer_copyright_text_color", label: "Copyright Text", type: "color", defaultValue: "#4b5563", group: "footer" },
  { key: "footer_disclaimer", label: "Footer Research Disclaimer", type: "textarea", defaultValue: "All products are sold for research, laboratory, or analytical purposes only, and are not for human consumption.", group: "footer" },
  { key: "logo_url", label: "Logo Image URL", type: "text", defaultValue: "", group: "branding" },
];

export const SITE_THEME_KEYS = SITE_THEME_FIELDS.map((field) => field.key);

export const SITE_THEME_DEFAULTS: Record<string, string> = Object.fromEntries(
  SITE_THEME_FIELDS.map((field) => [field.key, field.defaultValue])
);

export const VISUAL_BUILDER_BASELINE_KEY = "visual_builder_baseline";

export function themeValue(settings: Record<string, string>, key: string): string {
  const value = settings[key];
  if (value !== undefined && value !== "") return value;
  return SITE_THEME_DEFAULTS[key] ?? "";
}

export function buildThemeBaselineSnapshot(settings: Record<string, string> = SITE_THEME_DEFAULTS): Record<string, string> {
  const snapshot: Record<string, string> = {};
  for (const key of SITE_THEME_KEYS) {
    snapshot[key] = settings[key] ?? SITE_THEME_DEFAULTS[key] ?? "";
  }
  return snapshot;
}

export function parseThemeBaseline(raw: string | undefined | null): Record<string, string> {
  if (!raw) return buildThemeBaselineSnapshot();
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return buildThemeBaselineSnapshot({ ...SITE_THEME_DEFAULTS, ...parsed });
  } catch {
    return buildThemeBaselineSnapshot();
  }
}
