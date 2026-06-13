import axios from "axios";
import * as db from "./db";

const AUTHORIZE_API_PROD = "https://api.authorize.net/xml/v1/request.api";
const AUTHORIZE_API_SANDBOX = "https://apitest.authorize.net/xml/v1/request.api";
const AUTHORIZE_HOSTED_PROD = "https://accept.authorize.net/payment/payment";
const AUTHORIZE_HOSTED_SANDBOX = "https://test.authorize.net/payment/payment";
const NMI_THREE_STEP = "https://secure.networkmerchants.com/api/v2/three-step";

export type PaymentCloudGateway = "authorize_net" | "nmi";

export interface PaymentCloudConfig {
  gateway: PaymentCloudGateway;
  apiLoginId: string;
  transactionKey: string;
  securityKey: string;
  isSandbox: boolean;
  billingDescriptor: string;
}

function getAppBaseUrl() {
  return (process.env.VITE_APP_URL || process.env.WEB_APP_URL || "").replace(/\/$/, "");
}

export async function getConfig(): Promise<PaymentCloudConfig> {
  const gateway = ((await db.getSetting("paymentcloud_gateway")) || "authorize_net") as PaymentCloudGateway;
  const apiLoginId = (await db.getSetting("paymentcloud_api_login_id")) || "";
  const transactionKey = (await db.getSetting("paymentcloud_transaction_key")) || "";
  const securityKey = (await db.getSetting("paymentcloud_security_key")) || "";
  const sandboxMode = await db.getSetting("paymentcloud_sandbox_mode");
  const billingDescriptor = (await db.getSetting("paymentcloud_billing_descriptor")) || "RVR Peptides LLC";
  const isSandbox = sandboxMode !== "false";

  return { gateway, apiLoginId, transactionKey, securityKey, isSandbox, billingDescriptor };
}

function assertConfigured(config: PaymentCloudConfig) {
  if (config.gateway === "nmi") {
    if (!config.securityKey) {
      throw new Error(
        "PaymentCloud NMI security key is not configured. Add your gateway credentials in Admin → Payments."
      );
    }
    return;
  }

  if (!config.apiLoginId || !config.transactionKey) {
    throw new Error(
      "PaymentCloud Authorize.net credentials are not configured. Add your API Login ID and Transaction Key in Admin → Payments."
    );
  }
}

async function createAuthorizeNetHostedPayment(
  orderId: number,
  orderNumber: string,
  totalUsd: string,
  payerEmail?: string
) {
  const config = await getConfig();
  assertConfigured(config);

  const baseUrl = getAppBaseUrl();
  if (!baseUrl) {
    throw new Error("WEB_APP_URL or VITE_APP_URL must be set for payment return URLs.");
  }

  const apiUrl = config.isSandbox ? AUTHORIZE_API_SANDBOX : AUTHORIZE_API_PROD;
  const hostedUrl = config.isSandbox ? AUTHORIZE_HOSTED_SANDBOX : AUTHORIZE_HOSTED_PROD;

  const payload = {
    getHostedPaymentPageRequest: {
      merchantAuthentication: {
        name: config.apiLoginId,
        transactionKey: config.transactionKey,
      },
      transactionRequest: {
        transactionType: "authCaptureTransaction",
        amount: Number(totalUsd).toFixed(2),
        order: {
          invoiceNumber: orderNumber.slice(0, 20),
          description: `River Valley Research Peptides - ${orderNumber}`.slice(0, 255),
        },
        ...(payerEmail ? { customer: { email: payerEmail } } : {}),
      },
      hostedPaymentSettings: {
        setting: [
          {
            settingName: "returnUrl",
            settingValue: `${baseUrl}/api/paymentcloud/return?order=${encodeURIComponent(orderNumber)}`,
          },
          {
            settingName: "cancelUrl",
            settingValue: `${baseUrl}/order/${encodeURIComponent(orderNumber)}?status=cancelled`,
          },
          { settingName: "showReceipt", settingValue: "false" },
          {
            settingName: "hostedPaymentReturnOptions",
            settingValue: JSON.stringify({ showReceipt: false, url: `${baseUrl}/api/paymentcloud/return?order=${encodeURIComponent(orderNumber)}`, urlText: "Continue", cancelUrl: `${baseUrl}/order/${encodeURIComponent(orderNumber)}?status=cancelled`, cancelUrlText: "Cancel" }),
          },
        ],
      },
    },
  };

  const response = await axios.post(apiUrl, payload, {
    headers: { "Content-Type": "application/json" },
  });

  const token = response.data?.token || response.data?.getHostedPaymentPageResponse?.token;
  const messages = response.data?.messages || response.data?.getHostedPaymentPageResponse?.messages;

  if (!token) {
    const messageText = messages?.message?.[0]?.text || messages?.message?.text || "Unable to create hosted payment page";
    throw new Error(messageText);
  }

  await db.updateOrder(orderId, {
    paymentId: orderNumber,
    paymentStatus: "waiting",
    paymentMethod: "paymentcloud",
  } as any);

  return {
    invoiceUrl: `/pay/${orderNumber}`,
    paymentId: orderNumber,
    formAction: hostedUrl,
    token,
    gateway: "authorize_net" as const,
  };
}

async function createNmiHostedPayment(
  orderId: number,
  orderNumber: string,
  totalUsd: string,
  payerEmail?: string
) {
  const config = await getConfig();
  assertConfigured(config);

  const baseUrl = getAppBaseUrl();
  if (!baseUrl) {
    throw new Error("WEB_APP_URL or VITE_APP_URL must be set for payment return URLs.");
  }

  const params = new URLSearchParams({
    security_key: config.securityKey,
    type: "sale",
    amount: Number(totalUsd).toFixed(2),
    order_id: orderNumber,
    redirect_url: `${baseUrl}/api/paymentcloud/return?order=${encodeURIComponent(orderNumber)}`,
    ...(payerEmail ? { email: payerEmail } : {}),
  });

  const response = await axios.post(NMI_THREE_STEP, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const data = response.data;
  const formUrl =
    data?.form_url ||
    data?.formUrl ||
    (typeof data === "string" && data.includes("form-url")
      ? data.match(/<form-url>([^<]+)<\/form-url>/i)?.[1]
      : undefined);

  if (!formUrl) {
    throw new Error(
      typeof data === "string" && data.includes("error")
        ? data.replace(/<[^>]+>/g, " ").trim()
        : "Unable to create NMI hosted payment page"
    );
  }

  await db.updateOrder(orderId, {
    paymentId: orderNumber,
    paymentStatus: "waiting",
    paymentMethod: "paymentcloud",
  } as any);

  return {
    invoiceUrl: formUrl,
    paymentId: orderNumber,
    formAction: formUrl,
    token: null,
    gateway: "nmi" as const,
  };
}

export async function createHostedPayment(
  orderId: number,
  orderNumber: string,
  totalUsd: string,
  payerEmail?: string
) {
  const config = await getConfig();
  if (config.gateway === "nmi") {
    return createNmiHostedPayment(orderId, orderNumber, totalUsd, payerEmail);
  }
  return createAuthorizeNetHostedPayment(orderId, orderNumber, totalUsd, payerEmail);
}

export async function getHostedPaymentForm(orderNumber: string) {
  const order = await db.getOrderByNumber(orderNumber);
  if (!order) throw new Error("Order not found");
  if (order.status !== "pending") {
    throw new Error("This order is no longer awaiting payment.");
  }

  const config = await getConfig();
  assertConfigured(config);

  if (config.gateway === "nmi") {
    const result = await createNmiHostedPayment(order.id, order.orderNumber, String(order.total), order.guestEmail || undefined);
    return {
      formAction: result.formAction,
      token: null as string | null,
      gateway: result.gateway,
    };
  }

  const result = await createAuthorizeNetHostedPayment(
    order.id,
    order.orderNumber,
    String(order.total),
    order.guestEmail || undefined
  );

  return {
    formAction: result.formAction,
    token: result.token as string | null,
    gateway: result.gateway,
  };
}

export async function markOrderPaid(orderNumber: string, paymentId?: string) {
  const order = await db.getOrderByNumber(orderNumber);
  if (!order) return { success: false, reason: "order_not_found" as const };
  if (order.status === "paid") return { success: true, alreadyPaid: true as const };

  await db.updateOrder(order.id, {
    status: "paid",
    paymentStatus: "approved",
    paymentId: paymentId || order.paymentId || orderNumber,
    paymentMethod: "paymentcloud",
  } as any);
  await db.finalizeGiftCardRedemptionForOrder(order.id);
  await db.issueGiftCardsForOrder(order.id, order.guestEmail || undefined);
  return { success: true, alreadyPaid: false as const };
}

export async function markOrderFailed(orderNumber: string, paymentId?: string) {
  const order = await db.getOrderByNumber(orderNumber);
  if (!order) return { success: false };
  if (order.status === "paid") return { success: true };

  await db.updateOrder(order.id, {
    status: "cancelled",
    paymentStatus: "failed",
    paymentId: paymentId || order.paymentId || orderNumber,
  } as any);
  await db.releaseGiftCardReservationForOrder(order.id);
  return { success: true };
}

export async function handlePaymentReturn(payload: Record<string, unknown>, orderNumber: string) {
  const responseCode = String(
    payload.response_code ??
      payload.x_response_code ??
      payload.responseCode ??
      payload.responsetext ??
      ""
  );

  const transactionId = String(payload.transactionid ?? payload.x_trans_id ?? payload.transaction_id ?? "");
  const approved =
    responseCode === "1" ||
    String(payload.responsetext ?? payload.x_response_reason_text ?? "").toLowerCase().includes("approved");

  if (approved) {
    return markOrderPaid(orderNumber, transactionId || undefined);
  }

  await markOrderFailed(orderNumber, transactionId || undefined);
  return { success: false, reason: "declined" as const };
}

export async function handlePaymentWebhook(payload: Record<string, unknown>) {
  const orderNumber = String(payload.order_id ?? payload.invoiceNumber ?? payload.x_invoice_num ?? "");
  if (!orderNumber) {
    console.warn("[PaymentCloud] Webhook missing order reference");
    return { success: false };
  }
  return handlePaymentReturn(payload, orderNumber);
}

export async function getApiStatus() {
  const config = await getConfig();

  if (config.gateway === "nmi") {
    return {
      configured: Boolean(config.securityKey),
      gateway: config.gateway,
      status: config.securityKey ? "ready" : "not_configured",
      sandbox: config.isSandbox,
      billingDescriptor: config.billingDescriptor,
    };
  }

  if (!config.apiLoginId || !config.transactionKey) {
    return {
      configured: false,
      gateway: config.gateway,
      status: "not_configured",
      sandbox: config.isSandbox,
      billingDescriptor: config.billingDescriptor,
    };
  }

  const apiUrl = config.isSandbox ? AUTHORIZE_API_SANDBOX : AUTHORIZE_API_PROD;
  try {
    const response = await axios.post(
      apiUrl,
      {
        authenticateTestRequest: {
          merchantAuthentication: {
            name: config.apiLoginId,
            transactionKey: config.transactionKey,
          },
        },
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const resultCode =
      response.data?.messages?.resultCode ||
      response.data?.authenticateTestResponse?.messages?.resultCode;

    return {
      configured: true,
      gateway: config.gateway,
      status: resultCode === "Ok" ? "ok" : "error",
      sandbox: config.isSandbox,
      billingDescriptor: config.billingDescriptor,
      error:
        resultCode === "Ok"
          ? undefined
          : response.data?.messages?.message?.[0]?.text ||
            response.data?.authenticateTestResponse?.messages?.message?.[0]?.text,
    };
  } catch (err: any) {
    return {
      configured: true,
      gateway: config.gateway,
      status: "error",
      sandbox: config.isSandbox,
      billingDescriptor: config.billingDescriptor,
      error: err.message,
    };
  }
}
