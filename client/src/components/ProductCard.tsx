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

  return (
    <Link href={`/product/${product.slug}`}>
      <div className="group flex flex-col items-center cursor-pointer h-full">
        {/* Vial Image - server-generated with product name, dosage, logo baked in */}
        <div className="relative w-full aspect-[3/4] flex items-center justify-center mb-3 overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center p-2">
            <img
              src={product.imageUrl || `/api/vial/${product.slug}.png`}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
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
