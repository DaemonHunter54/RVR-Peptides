export const FULFILLMENT_METHODS = {
  ship: { id: "ship", label: "Ship to my address", description: "We ship your order. You will receive an email invoice to pay before dispatch." },
  local_pickup: { id: "local_pickup", label: "Local pickup / meetup", description: "Meet locally at your chosen time. Pay on-site by invoice, card, or cash." },
} as const;

export type FulfillmentMethod = keyof typeof FULFILLMENT_METHODS;

export const PAYMENT_OPTIONS = {
  email_invoice: { id: "email_invoice", label: "Email invoice", description: "Owner sends a secure invoice after your order is submitted.", forFulfillment: ["ship"] as FulfillmentMethod[] },
  local_invoice: { id: "local_invoice", label: "Invoice at meetup", description: "Pay via invoice when you meet for pickup.", forFulfillment: ["local_pickup"] },
  local_card: { id: "local_card", label: "Card at meetup", description: "Pay by card in person at your scheduled meetup.", forFulfillment: ["local_pickup"] },
  local_cash: { id: "local_cash", label: "Cash at meetup", description: "Pay with cash in person at your scheduled meetup.", forFulfillment: ["local_pickup"] },
} as const;

export type PaymentChoice = keyof typeof PAYMENT_OPTIONS;

export const PICKUP_INTERVALS = [15, 30, 60] as const;
export type PickupInterval = (typeof PICKUP_INTERVALS)[number];

export function paymentOptionsForFulfillment(method: FulfillmentMethod) {
  return Object.values(PAYMENT_OPTIONS).filter((option) =>
    (option.forFulfillment as readonly FulfillmentMethod[]).includes(method)
  );
}

export function formatPaymentChoice(choice: string) {
  return PAYMENT_OPTIONS[choice as PaymentChoice]?.label || choice;
}

export function formatFulfillmentMethod(method: string) {
  return FULFILLMENT_METHODS[method as FulfillmentMethod]?.label || method;
}
