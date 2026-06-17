import * as db from "./db";

type OrderLine = {
  productName: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
};

async function sendViaResend(from: string, to: string, subject: string, text: string, html?: string) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.log(`[Order Email Pending] To: ${to} | ${subject}\n${text}`);
    return false;
  }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text, html: html || undefined }),
  });
  return true;
}

function formatLines(items: OrderLine[]) {
  return items
    .map((item) => `- ${item.productName} x${item.quantity} — $${Number(item.totalPrice).toFixed(2)}`)
    .join("\n");
}

export async function sendNewOrderEmails(orderId: number) {
  const order = await db.getOrderById(orderId);
  if (!order) return;
  const items = await db.getOrderItems(orderId);
  const ownerEmail =
    (await db.getSetting("admin_inbox_email")) ||
    (await db.getSetting("orders_email")) ||
    "rvrtrainingandconsulting@gmail.com";
  const fromEmail = process.env.ORDERS_FROM_EMAIL || process.env.FROM_EMAIL || "Orders@RVRPeptides.com";
  const customerEmail = order.guestEmail || (order.userId ? (await db.getUserById(order.userId))?.email : undefined);

  const pickupLabel = order.pickupSlotStart
    ? new Date(order.pickupSlotStart).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })
    : "";

  const summary = [
    `Order: ${order.orderNumber}`,
    `Customer: ${order.guestName || "—"} <${customerEmail || "no email"}>`,
    `Fulfillment: ${order.fulfillmentMethod || "ship"}`,
    `Payment: ${order.paymentChoice || "email_invoice"}`,
    pickupLabel ? `Meetup time: ${pickupLabel}` : "",
    order.shippingAddress ? `Ship to: ${order.shippingName}, ${order.shippingAddress}, ${order.shippingCity}, ${order.shippingState} ${order.shippingZip}` : "",
    "",
    "Items:",
    formatLines(items),
    "",
    `Subtotal: $${Number(order.subtotal).toFixed(2)}`,
    `Shipping: $${Number(order.shippingCost).toFixed(2)}`,
    `Discount/Gift card: $${Number(order.discountAmount).toFixed(2)}`,
    `Total: $${Number(order.total).toFixed(2)}`,
    order.notes ? `\nNotes: ${order.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  await sendViaResend(
    fromEmail,
    ownerEmail,
    `New order ${order.orderNumber} — action required`,
    `${summary}\n\nReply to the customer to confirm payment or meetup details.`
  );

  if (customerEmail) {
    const customerText = [
      `Thank you for your order with River Valley Research Peptides.`,
      "",
      `Order number: ${order.orderNumber}`,
      `Total: $${Number(order.total).toFixed(2)}`,
      order.fulfillmentMethod === "local_pickup"
        ? pickupLabel
          ? `Your requested local meetup time: ${pickupLabel}. We will email or text you to confirm.`
          : "We will contact you to confirm your local meetup time."
        : "You will receive an email invoice shortly to complete payment before your order ships.",
      "",
      "Questions? Reply to this email or contact CustomerService@RVRPeptides.com.",
    ].join("\n");

    await sendViaResend(fromEmail, customerEmail, `Order received — ${order.orderNumber}`, customerText);
  }
}

export async function sendAdminComposeEmail(input: { to: string; subject: string; body: string }) {
  const fromEmail = process.env.ORDERS_FROM_EMAIL || process.env.FROM_EMAIL || "Orders@RVRPeptides.com";
  return sendViaResend(fromEmail, input.to, input.subject, input.body);
}
