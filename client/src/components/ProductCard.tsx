import { ASSETS } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "./ui/badge";

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
      <div className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-blue-50/30 overflow-hidden">
          <img
            src={product.imageUrl || ASSETS.peptideVial}
            alt={product.name}
            className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {hasDiscount && (
              <Badge className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5">
                {Number(product.discountPercent)}% OFF
              </Badge>
            )}
            {!product.inStock && (
              <Badge variant="secondary" className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5">
                OUT OF STOCK
              </Badge>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          {/* Product details */}
          {(product.form || product.purity) && (
            <div className="flex items-center gap-2 mb-1.5">
              {product.purity && (
                <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                  {product.purity} Purity
                </span>
              )}
            </div>
          )}

          <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-1.5 group-hover:text-blue-700 transition-colors line-clamp-2">
            {product.name}
          </h3>

          {product.shortDescription && (
            <p className="text-xs text-slate-500 line-clamp-2 mb-3 flex-1">
              {product.shortDescription}
            </p>
          )}

          {/* Price */}
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className={cn("font-bold text-lg", hasDiscount ? "text-red-600" : "text-slate-900")}>
                ${discountedPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-slate-400 line-through">
                  ${price.toFixed(2)}
                </span>
              )}
            </div>
            {product.inStock && (
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ShoppingCart className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
