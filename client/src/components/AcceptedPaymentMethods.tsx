const PAYMENT_LOGOS = [
  { src: "/assets/payments/visa.svg", alt: "Visa" },
  { src: "/assets/payments/mastercard.svg", alt: "Mastercard" },
  { src: "/assets/payments/americanexpress.svg", alt: "American Express" },
  { src: "/assets/payments/discover.svg", alt: "Discover" },
  { src: "/assets/payments/applepay.svg", alt: "Apple Pay" },
  { src: "/assets/payments/googlepay.svg", alt: "Google Pay" },
  { src: "/assets/payments/ach.svg", alt: "ACH Bank Transfer" },
] as const;

interface AcceptedPaymentMethodsProps {
  compact?: boolean;
}

export default function AcceptedPaymentMethods({ compact = false }: AcceptedPaymentMethodsProps) {
  return (
    <div className={`flex flex-wrap items-center ${compact ? "gap-2" : "gap-2.5"}`}>
      {PAYMENT_LOGOS.map((logo) => (
        <div
          key={logo.alt}
          className={`bg-white rounded-md border border-slate-200/90 shadow-sm flex items-center justify-center shrink-0 ${
            compact ? "h-9 px-3 min-w-[60px]" : "h-10 px-3.5 min-w-[68px]"
          }`}
        >
          <img
            src={logo.src}
            alt={logo.alt}
            width={compact ? 56 : 64}
            height={compact ? 28 : 32}
            className={`${compact ? "h-6" : "h-7"} w-auto max-w-full object-contain`}
            loading="lazy"
            decoding="async"
          />
        </div>
      ))}
    </div>
  );
}
