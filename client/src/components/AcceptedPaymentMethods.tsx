import { ACCEPTED_PAYMENT_METHODS } from "@shared/business";

interface AcceptedPaymentMethodsProps {
  compact?: boolean;
}

export default function AcceptedPaymentMethods({ compact = false }: AcceptedPaymentMethodsProps) {
  return (
    <div className={`flex flex-wrap ${compact ? "gap-1.5" : "gap-2"}`}>
      {ACCEPTED_PAYMENT_METHODS.map((method) => (
        <div
          key={method.label}
          className={`font-bold rounded-sm tracking-wide ${compact ? "text-[9px] px-2 py-1.5" : "text-[10px] px-2.5 py-2"} ${method.className}`}
        >
          {method.label}
        </div>
      ))}
    </div>
  );
}
