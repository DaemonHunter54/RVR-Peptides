import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { ASSETS } from "@/lib/assets";
import { productImageUrl } from "@/lib/vialDisplay";

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
  const price = Number(product.price);
  const hasDiscount = product.discountActive && product.discountPercent;
  const discountedPrice = hasDiscount ? price * (1 - Number(product.discountPercent) / 100) : price;
  const isReconstitutionKit = product.slug === "reconstitution-kit";
  const isBpcCapsules = product.slug === "bpc-157-capsules-500mcg-30";

  return (
    <Link href={`/product/${product.slug}`}>
      <div className="group flex flex-col items-center cursor-pointer h-full">
        {/* Vial Image */}
        <div className="relative w-full h-[205px] sm:h-[220px] lg:h-[235px] flex items-end justify-center mb-1 overflow-visible">
          <div className="relative w-full h-full flex items-end justify-center p-0">
            <img
              src={productImageUrl(product) || product.imageUrl || `/api/vial/${product.slug}.png?v=2`}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="w-auto h-auto max-w-[74%] max-h-[205px] sm:max-h-[220px] lg:max-h-[225px] object-contain object-bottom group-hover:scale-105 transition-transform duration-500"
              style={isReconstitutionKit ? { maxWidth: "82%", maxHeight: "230px", transform: "translateY(-8px)" } : isBpcCapsules ? { maxWidth: "120%", maxHeight: "320px", transform: "scale(1.18)" } : undefined}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ASSETS.peptideVial; }}
            />
          </div>

          {/* Out of Stock badge */}
          {!product.inStock && (
            <div className="absolute top-3 right-3 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-sm">
              Out of Stock
            </div>
          )}

          {/* Discount badge */}
          {hasDiscount && product.inStock && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-sm">
              {Number(product.discountPercent)}% OFF
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3 className="text-center text-sm font-medium text-gray-800 group-hover:text-blue-700 transition-colors leading-snug mb-1 px-2 line-clamp-2">
          {product.name}
        </h3>

        {/* Multiple doses available indicator */}
        {product.hasVariants && (
          <p className="text-center text-xs text-gray-500 italic mb-1">
            Multiple doses available
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 justify-center">
          {product.hasVariants ? (
            <span className="font-bold text-base text-[#4a9eff]">
              From ${price.toFixed(2)}
            </span>
          ) : (
            <>
              <span className={cn("font-bold text-base", hasDiscount ? "text-red-600" : "text-[#4a9eff]")}>
                ${discountedPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">
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
