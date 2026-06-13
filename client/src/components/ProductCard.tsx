import { Link } from "wouter";
import { ASSETS } from "@/lib/assets";
import { productImageUrl } from "@/lib/vialDisplay";
import { useVisualBuilderSettings } from "@/contexts/VisualBuilderContext";
import { themeValue } from "@/lib/siteTheme";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: string;
    compareAtPrice?: string | null;
    imageUrl?: string | null;
    shortDescription?: string | null;
    inStock: boolean;
    discountPercent?: string | null;
    discountActive?: boolean | null;
    isFeatured?: boolean | null;
    form?: string | null;
    purity?: string | null;
    hasVariants?: boolean;
    variantCount?: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { settings } = useVisualBuilderSettings();
  const nameColor = themeValue(settings, "product_card_name_color");
  const priceColor = themeValue(settings, "product_card_price_color");
  const metaColor = themeValue(settings, "product_card_meta_color");
  const price = Number(product.price);
  const hasDiscount = product.discountActive && product.discountPercent;
  const discountedPrice = hasDiscount ? price * (1 - Number(product.discountPercent) / 100) : price;
  const isReconstitutionKit = product.slug === "reconstitution-kit";
  const isBpcCapsules = product.slug === "bpc-157-capsules-500mcg-30";
  const isStorageContainer = product.slug === "3ml-storage-container";
  const isVialCap = product.slug === "vial-cap";
  const isVialCapOpener = product.slug === "vial-cap-opener";
  const isGiftCard = product.slug === "gift-card";

  return (
    <Link href={`/product/${product.slug}`}>
      <div className="group flex flex-col items-center cursor-pointer h-full">
        {/* Vial Image */}
        <div className="relative w-full h-[205px] sm:h-[220px] lg:h-[235px] flex items-end justify-center mb-1 overflow-visible">
          <div className="relative z-0 w-full h-full flex items-end justify-center p-0">
            <img
              src={productImageUrl(product) || product.imageUrl || `/api/vial/${product.slug}.png?v=2`}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="relative z-0 w-auto h-auto max-w-[74%] max-h-[205px] sm:max-h-[220px] lg:max-h-[225px] object-contain object-bottom group-hover:scale-105 transition-transform duration-500"
              style={
                isReconstitutionKit
                  ? { maxWidth: "82%", maxHeight: "230px", transform: "translateY(-8px)" }
                  : isBpcCapsules
                  ? { maxWidth: "92%", maxHeight: "235px", transform: "translateY(6px) scale(0.99)" }
                  : isStorageContainer
                  ? { maxWidth: "92%", maxHeight: "250px", transform: "scale(1.12)" }
                  : isVialCap
                  ? { maxWidth: "90%", maxHeight: "245px", transform: "scale(1.08)" }
                  : isVialCapOpener
                  ? { maxWidth: "94%", maxHeight: "255px", transform: "scale(1.22)" }
                  : isGiftCard
                  ? { transform: "translateY(-55px) scale(1.04)" }
                  : undefined
              }
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ASSETS.peptideVial; }}
            />
          </div>

          {/* Out of Stock badge */}
          {!product.inStock && (
            <div className="absolute z-30 top-3 right-3 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-sm">
              Out of Stock
            </div>
          )}

          {/* Discount badge */}
          {hasDiscount && product.inStock && (
            <div className="absolute z-30 top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-sm">
              {Number(product.discountPercent)}% OFF
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3
          className="relative z-20 text-center text-sm font-medium transition-colors leading-snug mb-1 px-2 line-clamp-2"
          style={{ color: nameColor }}
          data-rvr-setting="product_card_name_color"
        >
          {product.name}
        </h3>

        {product.hasVariants && (
          <p className="relative z-20 text-center text-xs italic mb-1" style={{ color: metaColor }} data-rvr-setting="product_card_meta_color">
            Multiple doses available
          </p>
        )}

        <div className="relative z-20 flex items-baseline gap-2 justify-center" data-rvr-setting="product_card_price_color">
          {product.hasVariants ? (
            <span className="font-bold text-base" style={{ color: priceColor }}>
              From ${price.toFixed(2)}
            </span>
          ) : (
            <>
              <span className="font-bold text-base" style={{ color: hasDiscount ? undefined : priceColor }}>
                ${discountedPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-sm line-through" style={{ color: metaColor }}>
                  ${price.toFixed(2)}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
