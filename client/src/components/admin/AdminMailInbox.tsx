/** Generic Gmail account chooser — no account pre-filled; any admin signs in with their own Google account. */
const GMAIL_LOGIN_URL =
  "https://accounts.google.com/AccountChooser?service=mail&continue=https://mail.google.com/mail/u/0/&flowEntry=ServiceLogin&hl=en";

export default function AdminMailInbox() {
  return (
    <div className="flex flex-1 flex-col min-h-0 w-full overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col p-0 lg:p-3">
        <div className="flex-1 min-h-0 overflow-hidden rounded-none lg:rounded-xl border-y lg:border border-slate-200 bg-white shadow-sm">
          <iframe
            title="Gmail sign in"
            src={GMAIL_LOGIN_URL}
            className="block w-full h-full min-h-0 border-0 bg-white"
            allow="identity-credentials-get; fullscreen; clipboard-read; clipboard-write"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
