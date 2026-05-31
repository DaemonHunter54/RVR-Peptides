import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { ASSETS } from "@/lib/assets";

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
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const price = Number(product.price);
  const hasDiscount = product.discountActive && product.discountPercent;
  const discountedPrice = hasDiscount ? price * (1 - Number(product.discountPercent) / 100) : price;

  // Generate a unique accent color for each product label overlay
  const accentColors = [
    "#48c9b0", // teal
    "#f39c12", // gold
    "#e74c3c", // red
    "#9b59b6", // purple
    "#2ecc71", // green
    "#3498db", // blue
    "#e67e22", // orange
    "#1abc9c", // mint
  ];
  const colorIndex = product.name.length % accentColors.length;
  const accentColor = accentColors[colorIndex];

  return (
    <Link href={`/product/${product.slug}`}>
      <div className="group flex flex-col items-center cursor-pointer h-full">
        {/* Vial Image - White background with photorealistic vial */}
        <div className="relative w-full aspect-[3/4] flex items-center justify-center bg-white mb-3 overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center p-3">
            {/* Photorealistic vial image */}
            <img
              src={product.imageUrl || ASSETS.peptideVial}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ASSETS.peptideVial; }}
            />


          </div>

          {/* Accent color bar at bottom of card */}
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: accentColor }} />

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

        {/* Price */}
        <div className="flex items-baseline gap-2 justify-center">
          <span className={cn("font-bold text-base", hasDiscount ? "text-red-600" : "text-[#4a9eff]")}>
            ${discountedPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              ${price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
