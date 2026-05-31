import { ASSETS } from "@/lib/assets";
import { cn } from "@/lib/utils";
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
      <div className="group bg-white rounded-lg border border-slate-200/80 overflow-hidden hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 transition-all duration-300 h-full flex flex-col cursor-pointer">
        {/* Image - White background, centered vial */}
        <div className="relative aspect-square bg-white overflow-hidden p-4">
          <img
            src={product.imageUrl || ASSETS.peptideVial}
            alt={product.name}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ASSETS.peptideVial; }}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {hasDiscount && (
              <Badge className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 shadow-sm">
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

        {/* Info - Product name and price like corepeptides */}
        <div className="p-3 lg:p-4 flex flex-col flex-1 border-t border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-2 group-hover:text-blue-700 transition-colors line-clamp-2">
            {product.name}
          </h3>

          {/* Price */}
          <div className="mt-auto flex items-baseline gap-2">
            <span className={cn("font-bold text-base lg:text-lg", hasDiscount ? "text-red-600" : "text-slate-900")}>
              ${discountedPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-slate-400 line-through">
                ${price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
