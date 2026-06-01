import axios from "axios";
import * as db from "./db";
import crypto from "crypto";

const NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1";
const NOWPAYMENTS_SANDBOX_URL = "https://api-sandbox.nowpayments.io/v1";

async function getConfig() {
  const apiKey = await db.getSetting("nowpayments_api_key");
  const ipnSecret = await db.getSetting("nowpayments_ipn_secret");
  const sandboxMode = await db.getSetting("nowpayments_sandbox_mode");
  const isSandbox = sandboxMode === "true";
  const baseUrl = isSandbox ? NOWPAYMENTS_SANDBOX_URL : NOWPAYMENTS_API_URL;
  return { apiKey: apiKey || "", ipnSecret: ipnSecret || "", baseUrl, isSandbox };
}

export async function createPayment(orderId: number, orderNumber: string, totalUsd: string, payerEmail?: string) {
  const config = await getConfig();
  if (!config.apiKey) throw new Error("NowPayments API key not configured. Please set it in the admin panel.");

  const webhookUrl = await db.getSetting("nowpayments_webhook_url");

  const payload: any = {
    price_amount: parseFloat(totalUsd),
    price_currency: "usd",
    order_id: orderNumber,
    order_description: `River Valley Research Peptides - Order ${orderNumber}`,
    ipn_callback_url: webhookUrl || undefined,
    success_url: `${process.env.VITE_APP_URL || ""}/order/${orderNumber}?status=success`,
    cancel_url: `${process.env.VITE_APP_URL || ""}/order/${orderNumber}?status=cancelled`,
  };

  if (payerEmail) payload.payer_email = payerEmail;

  const response = await axios.post(`${config.baseUrl}/invoice`, payload, {
    headers: {
      "x-api-key": config.apiKey,
      "Content-Type": "application/json",
    },
  });

  const invoiceData = response.data;

  // Store the payment ID on the order
  await db.updateOrder(orderId, {
    paymentId: String(invoiceData.id),
    paymentStatus: "waiting",
  } as any);

  return {
    invoiceUrl: invoiceData.invoice_url,
    paymentId: String(invoiceData.id),
    invoiceId: invoiceData.id,
  };
}

export async function getPaymentStatus(paymentId: string) {
  const config = await getConfig();
  if (!config.apiKey) throw new Error("NowPayments API key not configured");

  const response = await axios.get(`${config.baseUrl}/payment/${paymentId}`, {
    headers: { "x-api-key": config.apiKey },
  });

  return response.data;
}

export function verifyIpnSignature(body: any, receivedSignature: string, ipnSecret: string): boolean {
  // Sort the body keys and create a string
  const sortedKeys = Object.keys(body).sort();
  const sortedBody: any = {};
  for (const key of sortedKeys) {
    sortedBody[key] = body[key];
  }
  const hmac = crypto.createHmac("sha512", ipnSecret);
  hmac.update(JSON.stringify(sortedBody));
  const calculatedSignature = hmac.digest("hex");
  return calculatedSignature === receivedSignature;
}

export async function handleIpnWebhook(body: any, signature: string) {
  const config = await getConfig();

  if (config.ipnSecret && signature) {
    const valid = verifyIpnSignature(body, signature, config.ipnSecret);
    if (!valid) {
      console.warn("[NowPayments] Invalid IPN signature");
      throw new Error("Invalid IPN signature");
    }
  }

  const paymentStatus = body.payment_status;
  const orderId = body.order_id; // This is our orderNumber
  const paymentId = String(body.payment_id);

  console.log(`[NowPayments] IPN received: order=${orderId}, status=${paymentStatus}, paymentId=${paymentId}`);

  // Map NowPayments statuses to our order statuses
  if (paymentStatus === "finished" || paymentStatus === "confirmed") {
    await db.updateOrderPayment(paymentId, "finished");
  } else if (paymentStatus === "failed" || paymentStatus === "expired" || paymentStatus === "refunded") {
    await db.updateOrderPayment(paymentId, "failed");
  } else if (paymentStatus === "partially_paid") {
    await db.updateOrderPayment(paymentId, "partially_paid");
  }
  // "waiting", "confirming", "sending" are intermediate states - no action needed

  return { success: true };
}

export async function getApiStatus() {
  const config = await getConfig();
  if (!config.apiKey) return { configured: false, status: "not_configured" };

  try {
    const response = await axios.get(`${config.baseUrl}/status`, {
      headers: { "x-api-key": config.apiKey },
    });
    return { configured: true, status: response.data?.message || "ok", sandbox: config.isSandbox };
  } catch (err: any) {
    return { configured: true, status: "error", error: err.message, sandbox: config.isSandbox };
  }
}
