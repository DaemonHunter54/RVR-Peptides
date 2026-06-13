export const BUSINESS = {
  legalName: "River Valley Research Peptides LLC",
  billingDescriptor: "RVR Peptides LLC",
  supportEmail: "Support@RVRPeptides.com",
  website: "www.RVRPeptides.com",
} as const;

export const ACCEPTED_PAYMENT_METHODS = [
  { label: "Visa", className: "bg-[#1a1f71] text-white" },
  { label: "Mastercard", className: "bg-[#eb001b] text-white" },
  { label: "Amex", className: "bg-[#006fcf] text-white" },
  { label: "Discover", className: "bg-[#ff6000] text-white" },
  { label: "Apple Pay", className: "bg-black text-white border border-white/20" },
  { label: "Google Pay", className: "bg-white text-slate-900" },
  { label: "ACH", className: "bg-[#2d6a4f] text-white" },
] as const;
