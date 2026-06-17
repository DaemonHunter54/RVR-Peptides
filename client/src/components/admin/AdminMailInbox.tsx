import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Inbox, Send, PenSquare, Mail, Loader2, Search, Star, Archive, ChevronLeft,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { formatFulfillmentMethod, formatPaymentChoice } from "@shared/checkoutOptions";

type MailView = "inbox" | "compose";

type InboxMessage = {
  id: number;
  subject: string;
  from: string;
  to: string;
  snippet: string;
  date: Date;
  order: any;
};

function orderPreview(order: any): InboxMessage {
  const name = order.guestName || order.shippingName || "Customer";
  const email = order.guestEmail || "no email";
  return {
    id: order.id,
    subject: `New order ${order.orderNumber} — ${formatFulfillmentMethod(order.fulfillmentMethod || "ship")}`,
    from: `${name} <${email}>`,
    to: email,
    snippet: `${formatPaymentChoice(order.paymentChoice || "email_invoice")} · $${Number(order.total).toFixed(2)} · ${order.status}`,
    date: new Date(order.createdAt),
    order,
  };
}

export default function AdminMailInbox() {
  const [view, setView] = useState<MailView>("inbox");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [compose, setCompose] = useState({ to: "", subject: "", body: "" });

  const settingsQuery = trpc.settings.all.useQuery();
  const ordersQuery = trpc.admin.orders.list.useQuery({ limit: 100 });
  const sendMail = trpc.admin.mail.send.useMutation({
    onSuccess: () => {
      toast.success("Email sent.");
      setCompose({ to: "", subject: "", body: "" });
      setView("inbox");
    },
    onError: (err) => toast.error(err.message),
  });

  const inboxEmail = settingsQuery.data?.admin_inbox_email || "rvrtrainingandconsulting@gmail.com";
  const orders = ordersQuery.data?.orders || [];
  const messages = useMemo(() => {
    const list = orders.map(orderPreview);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (m: InboxMessage) =>
        m.subject.toLowerCase().includes(q) ||
        m.from.toLowerCase().includes(q) ||
        m.snippet.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const selected = messages.find((m: InboxMessage) => m.id === selectedId) || messages[0] || null;

  const replyToSelected = () => {
    if (!selected) return;
    setCompose({
      to: selected.to,
      subject: `Re: Order ${selected.order.orderNumber}`,
      body: `Hi ${selected.order.guestName || "there"},\n\nThank you for your order #${selected.order.orderNumber}.\n\n`,
    });
    setView("compose");
  };

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-2rem)] flex flex-col -m-6 lg:-m-8">
      <div className="px-6 lg:px-8 pt-6 pb-3 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Mail className="h-6 w-6 text-red-500" />
              Mail
            </h1>
            <p className="text-sm text-slate-500">{inboxEmail}</p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            onClick={() => { setView("compose"); setSelectedId(null); }}
          >
            <PenSquare className="h-4 w-4" /> Compose
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 bg-white">
        {/* Gmail-style sidebar */}
        <aside className="w-52 shrink-0 border-r border-slate-200 p-3 hidden md:block bg-slate-50/80">
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => setView("inbox")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium ${view === "inbox" ? "bg-red-100 text-red-800" : "text-slate-700 hover:bg-slate-100"}`}
            >
              <Inbox className="h-4 w-4" /> Inbox
              <span className="ml-auto text-xs bg-slate-200 rounded-full px-2 py-0.5">{messages.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setView("compose")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium ${view === "compose" ? "bg-red-100 text-red-800" : "text-slate-700 hover:bg-slate-100"}`}
            >
              <Send className="h-4 w-4" /> Compose
            </button>
          </nav>
          <p className="text-xs text-slate-400 mt-6 px-2 leading-relaxed">
            Order notifications appear here. Compose sends email through your site mail service. Full Gmail sync will be available once Cloudflare forwarding is configured.
          </p>
        </aside>

        {view === "compose" ? (
          <div className="flex-1 p-6 overflow-y-auto">
            <button type="button" className="md:hidden text-sm text-blue-600 mb-4 flex items-center gap-1" onClick={() => setView("inbox")}>
              <ChevronLeft className="h-4 w-4" /> Back to inbox
            </button>
            <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="font-semibold text-slate-800">New message</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <Label>To</Label>
                  <Input value={compose.to} onChange={(e) => setCompose((c) => ({ ...c, to: e.target.value }))} className="mt-1.5" placeholder="customer@example.com" />
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input value={compose.subject} onChange={(e) => setCompose((c) => ({ ...c, subject: e.target.value }))} className="mt-1.5" />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea value={compose.body} onChange={(e) => setCompose((c) => ({ ...c, body: e.target.value }))} className="mt-1.5 min-h-[220px]" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setView("inbox")}>Cancel</Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    disabled={sendMail.isPending || !compose.to || !compose.subject || !compose.body}
                    onClick={() => sendMail.mutate(compose)}
                  >
                    {sendMail.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Message list */}
            <div className={`${selected ? "hidden lg:flex" : "flex"} w-full lg:w-96 shrink-0 flex-col border-r border-slate-200`}>
              <div className="p-3 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders" className="pl-9 bg-slate-50 border-slate-200" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {ordersQuery.isLoading ? (
                  <div className="p-8 text-center text-slate-400">Loading...</div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">No order messages yet.</div>
                ) : (
                  messages.map((msg: InboxMessage) => (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={() => setSelectedId(msg.id)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${selected?.id === msg.id ? "bg-blue-50 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-medium text-sm text-slate-900 truncate">{msg.from.split("<")[0].trim()}</span>
                        <span className="text-xs text-slate-400 shrink-0">{msg.date.toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-800 truncate font-medium">{msg.subject}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{msg.snippet}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Reading pane */}
            <div className={`${selected ? "flex" : "hidden lg:flex"} flex-1 flex-col min-w-0`}>
              {selected ? (
                <>
                  <div className="p-4 border-b border-slate-100 flex items-start gap-3">
                    <button type="button" className="lg:hidden p-1 text-slate-500" onClick={() => setSelectedId(null)}>
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-slate-900 truncate">{selected.subject}</h2>
                      <p className="text-sm text-slate-600 mt-1">From: {selected.from}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{selected.date.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="text-slate-400"><Star className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-slate-400"><Archive className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-2xl space-y-4 text-sm text-slate-700 leading-relaxed">
                      <p>You received a new order notification for <strong>#{selected.order.orderNumber}</strong>.</p>
                      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-2">
                        <p><span className="text-slate-500">Customer:</span> {selected.order.guestName || selected.order.shippingName || "—"}</p>
                        <p><span className="text-slate-500">Email:</span> {selected.order.guestEmail || "—"}</p>
                        <p><span className="text-slate-500">Fulfillment:</span> {formatFulfillmentMethod(selected.order.fulfillmentMethod || "ship")}</p>
                        <p><span className="text-slate-500">Payment:</span> {formatPaymentChoice(selected.order.paymentChoice || "email_invoice")}</p>
                        {selected.order.pickupSlotStart ? (
                          <p><span className="text-slate-500">Meetup:</span> {new Date(selected.order.pickupSlotStart).toLocaleString()}</p>
                        ) : null}
                        <p><span className="text-slate-500">Total:</span> ${Number(selected.order.total).toFixed(2)}</p>
                        <Badge className="mt-1">{selected.order.status}</Badge>
                      </div>
                      {selected.order.notes ? (
                        <p><span className="text-slate-500">Notes:</span> {selected.order.notes}</p>
                      ) : null}
                      <p className="text-slate-500">Reply to confirm the meetup time or send an invoice for payment.</p>
                    </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={replyToSelected}>
                      <Send className="h-4 w-4" /> Reply
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <Inbox className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p>Select an order message to read</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
