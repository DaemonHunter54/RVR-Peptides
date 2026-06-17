import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ExternalLink, Mail, RefreshCw } from "lucide-react";
import { useMemo } from "react";

/** Google Account sign-in for Gmail; after login, continues into the Gmail web app. */
function gmailLoginUrl(emailHint?: string) {
  const params = new URLSearchParams({
    service: "mail",
    passive: "1209600",
    continue: "https://mail.google.com/mail/u/0/",
    followup: "https://mail.google.com/mail/u/0/",
    emr: "1",
    osid: "1",
    flowName: "GlifWebSignIn",
    flowEntry: "ServiceLogin",
  });
  if (emailHint) params.set("Email", emailHint);
  return `https://accounts.google.com/ServiceLogin?${params.toString()}`;
}

export default function AdminMailInbox() {
  const settingsQuery = trpc.settings.all.useQuery();
  const inboxEmail = settingsQuery.data?.admin_inbox_email || "rvrtrainingandconsulting@gmail.com";

  const iframeSrc = useMemo(() => gmailLoginUrl(inboxEmail), [inboxEmail]);

  const reloadGmail = () => {
    const frame = document.getElementById("admin-gmail-frame") as HTMLIFrameElement | null;
    if (frame) frame.src = iframeSrc;
  };

  const openInNewTab = () => {
    window.open(iframeSrc, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full overflow-hidden bg-white">
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Mail className="h-5 w-5 text-red-500 shrink-0" />
            Gmail
          </h1>
          <p className="text-xs text-slate-500 truncate">{inboxEmail}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button type="button" variant="outline" size="sm" className="gap-1.5 h-8" onClick={reloadGmail}>
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reload</span>
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5 h-8" onClick={openInNewTab}>
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New tab</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative overflow-hidden bg-slate-100">
        <iframe
          id="admin-gmail-frame"
          title="Gmail"
          src={iframeSrc}
          className="absolute inset-0 w-full h-full border-0 bg-white"
          allow="fullscreen; clipboard-read; clipboard-write"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
