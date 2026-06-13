interface AcceptedPaymentMethodsProps {
  compact?: boolean;
}

function LogoBadge({
  label,
  compact,
  children,
  className = "bg-white",
}: {
  label: string;
  compact?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`${className} rounded flex items-center justify-center shrink-0 ${
        compact ? "h-7 min-w-[42px] px-1.5" : "h-8 min-w-[48px] px-2"
      }`}
      title={label}
      aria-label={label}
    >
      {children}
    </div>
  );
}

function VisaLogo({ className = "h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 16" aria-hidden="true">
      <path
        fill="#1434CB"
        d="M19.5 1.2 17 14.8h-3.1L16.4 1.2h3.1Zm11.2 8.8 1.3-3.6.7 3.6h-2Zm3.2 4.8h2.9l-2.5-13.6h-2.7c-.6 0-1.1.4-1.3.9l-4.7 12.7h3.3l.7-1.8h4.1l.4 1.8Zm-3.6-4.3 1.7-4.7.9 4.7h-2.6ZM15.2 1.2 11.6 10.1 11.1 7.5c-.8-3.2-3.3-5.2-6.2-5.5l-.1 12.8H7.8L12.5 1.2h2.7Zm28.8 0-4.1 13.6H37l4.1-13.6h2.9Z"
      />
    </svg>
  );
}

function MastercardLogo({ className = "h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 20" aria-hidden="true">
      <circle cx="12" cy="10" r="7" fill="#EB001B" />
      <circle cx="20" cy="10" r="7" fill="#F79E1B" fillOpacity="0.95" />
      <path
        fill="#FF5F00"
        d="M16 4.8a7 7 0 0 0-2.6 5.2A7 7 0 0 0 16 15.2a7 7 0 0 0 2.6-5.2A7 7 0 0 0 16 4.8Z"
      />
    </svg>
  );
}

function AmexLogo({ className = "h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 16" aria-hidden="true">
      <rect width="48" height="16" rx="2" fill="#006FCF" />
      <path
        fill="#fff"
        d="M6.5 5.2h1.8l1 2.4 1-2.4h1.8v5.6H11l-.1-3.3-.9 2.2h-1l-.9-2.2-.1 3.3H6.5V5.2Zm9.2 0h4.8v1.2h-3v.8h2.8v1.1h-2.8v.9h3.1v1.6h-4.9V5.2Zm6.1 0h2.2c1.4 0 2.3.7 2.3 1.8 0 .8-.4 1.4-1.1 1.7l1.4 2.1h-2l-1.2-1.9h-.9v1.9h-1.7V5.2Zm1.7 1.1v1.1h.5c.5 0 .8-.2.8-.6 0-.3-.3-.5-.8-.5h-.5Zm5.8-1.1h3.4l1 2.6.9-2.6h3.3v5.6h-1.6V7.1l-1.1 3.7h-1.5l-1.1-3.7v3.7h-1.6V5.2Zm10.2 0h1.7l2.2 3.4V5.2H43v5.6h-1.6l-2.3-3.5v3.5h-1.7V5.2Z"
      />
    </svg>
  );
}

function DiscoverLogo({ className = "h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 16" aria-hidden="true">
      <rect width="48" height="16" rx="2" fill="#fff" stroke="#ddd" strokeWidth="0.5" />
      <path fill="#231F20" d="M8.5 5.4h2.1c1.5 0 2.5.9 2.5 2.4s-1 2.4-2.5 2.4H8.5V5.4Zm2 3.8c.8 0 1.3-.5 1.3-1.4s-.5-1.4-1.3-1.4h-.6v2.8h.6Zm4.8-3.8h1.5v5.2h-1.5V5.4Zm3.1 0h2.2c1.4 0 2.3.7 2.3 1.8 0 .8-.4 1.4-1.1 1.7l1.3 2h-1.6l-1.1-1.7h-.7v1.7h-1.3V5.4Zm1.3 1v1h.5c.5 0 .8-.2.8-.5 0-.3-.3-.5-.8-.5h-.5Zm5.2 3.3c-.9.7-2 .9-3 .9-2.2 0-3.7-1.4-3.7-3.3S21.8 4 24 4c1 0 2 .3 2.7.8l-.8 1.1c-.5-.4-1.2-.6-1.9-.6-1.3 0-2.2.8-2.2 2s.9 2 2.2 2c.7 0 1.4-.2 1.9-.6l.8 1.1Zm2.4-2.6h2.4c.4 0 .7-.2.7-.5 0-.3-.3-.5-.7-.5h-2.4v1Zm0 1.1h2.7c.5 0 .8-.2.8-.6 0-.3-.4-.6-.8-.6h-2.7v1.2Zm0 1.2h3c.5 0 .9-.2.9-.6 0-.4-.4-.6-.9-.6h-3v1.2Z" />
      <circle cx="38" cy="8" r="4" fill="#F47216" />
    </svg>
  );
}

function ApplePayLogo({ className = "h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 16" aria-hidden="true">
      <path
        fill="#000"
        d="M10.2 3.4c-.5.6-1.3 1-2.1.9-.1-.8.3-1.6.7-2.1.5-.6 1.3-1 2-1 .1.8-.2 1.6-.6 2.2Zm.6 1c-1.1-.1-2 .7-2.5.7-.5 0-1.3-.6-2.2-.6-1.1 0-2.2.7-2.8 1.7-1.2 2-.3 5 0 6.6.4 1.2.9 2.5 1.9 2.4.8 0 1.1-.5 2-.5.9 0 1.2.5 2 .5 1 0 1.6-1.2 2-2.3.3-.7.4-1.4.4-1.5-.1 0-3.8-1.5-3.8-5.8 0-3.7 2.9-5.4 3.1-5.6Zm6.1-.2h3.8c2.2 0 3.7 1.2 3.7 3.1 0 2-1.5 3.2-3.8 3.2h-2.2v2.9h-1.5V4.2Zm1.5 1.2v2.5h2.1c1.4 0 2.2-.7 2.2-1.9 0-1.1-.8-1.8-2.2-1.8h-2.1Zm8.1 6.6c-.9 0-1.6-.5-2-1.2h-.1c0 .7-.1 1.4-.3 2.1h-1.3c.2-1.1.3-2.2.3-3.3V4.2h1.4v1.8h.1c.4-.7 1.2-1.2 2.1-1.2 1.7 0 2.8 1.4 2.8 3.5 0 2.2-1.1 3.7-2.9 3.7Zm-.3-5.8c-1 0-1.8.9-1.8 2.2 0 1.3.8 2.2 1.8 2.2 1.1 0 1.8-.9 1.8-2.2 0-1.3-.7-2.2-1.8-2.2Zm5.8 5.8c-1.5 0-2.4-1.1-2.4-2.9 0-1.9.9-3 2.5-3 1.5 0 2.4 1.1 2.4 2.9 0 1.9-.9 3-2.5 3Zm0-1.1c.8 0 1.2-.8 1.2-1.8 0-1-.4-1.8-1.2-1.8s-1.2.8-1.2 1.8c0 1 .4 1.8 1.2 1.8Z"
      />
    </svg>
  );
}

function GooglePayLogo({ className = "h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 16" aria-hidden="true">
      <path fill="#5F6368" d="M8.8 8.1V6.4h6.8c.1.4.2.8.2 1.3 0 1.6-.4 3.6-1.7 5-1.2 1.3-2.8 2-4.9 2-3.8 0-6.9-3.1-6.9-6.9S6.4 1 10.2 1c1.7 0 2.9.7 3.8 1.3l-1.6 1.6c-.6-.6-1.5-1.1-2.2-1.1-1.8 0-3.2 1.5-3.2 3.4s1.4 3.4 3.2 3.4c1.4 0 2.2-.6 2.7-1.1.3-.3.6-.8.7-1.2H8.8Z" />
      <path fill="#4285F4" d="M22.2 6.8c0-.5 0-.9-.1-1.3h-3.6v2.4h2c-.1.7-.5 1.7-1.4 2.3l2.2 1.7c1.3-1.2 2-3 2-5.1Z" />
      <path fill="#34A853" d="M18.5 12.1c1.9 0 3.5-.6 4.6-1.7l-2.2-1.7c-.6.4-1.4.7-2.4.7-1.8 0-3.4-1.2-3.9-2.9h-2.3v1.8c1.1 2.2 3.4 3.8 6.2 3.8Z" />
      <path fill="#FBBC04" d="M14.6 7.5c-.1-.4-.2-.8-.2-1.2 0-.4.1-.8.2-1.2V3.3h-2.3c-.5 1-0.8 2.1-0.8 3.2s0.3 2.2 0.8 3.2l2.3-1.8Z" />
      <path fill="#EA4335" d="M18.5 4.3c1 0 1.9.4 2.6 1.1l2-2C21.9 2.2 20.3 1.5 18.5 1.5c-2.8 0-5.1 1.6-6.2 3.8l2.3 1.8c.5-1.7 2.1-2.9 3.9-2.9Z" />
      <path fill="#5F6368" d="M28.2 4.8h5.8V6h-4.3v1.6h3.8v1.1h-3.8v2.5h-1.5V4.8Zm7.2 0h1.5v5.2h3.4v1.2h-4.9V4.8Z" />
    </svg>
  );
}

function AchLogo({ className = "h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 16" aria-hidden="true">
      <rect width="40" height="16" rx="2" fill="#2D6A4F" />
      <path
        fill="#fff"
        d="M6 4.5h2.2v7H6V4.5Zm3.5 0h1.8l2.2 4.8 2.2-4.8H17l-3.2 7h-1.8L9.5 4.5Zm9.2 0h3.4c2 0 3.3 1.1 3.3 3.5s-1.3 3.5-3.3 3.5h-3.4V4.5Zm1.8 1.3v4.4h1.4c1.1 0 1.7-.6 1.7-2.2 0-1.6-.6-2.2-1.7-2.2h-1.4Z"
      />
    </svg>
  );
}

export default function AcceptedPaymentMethods({ compact = false }: AcceptedPaymentMethodsProps) {
  const iconSize = compact ? "h-3" : "h-3.5";
  const mcSize = compact ? "h-4" : "h-5";

  return (
    <div className={`flex flex-wrap items-center ${compact ? "gap-1.5" : "gap-2"}`}>
      <LogoBadge label="Visa" compact={compact}>
        <VisaLogo className={iconSize} />
      </LogoBadge>
      <LogoBadge label="Mastercard" compact={compact}>
        <MastercardLogo className={mcSize} />
      </LogoBadge>
      <LogoBadge label="American Express" compact={compact} className="bg-white overflow-hidden">
        <AmexLogo className={compact ? "h-5 w-[38px]" : "h-6 w-[44px]"} />
      </LogoBadge>
      <LogoBadge label="Discover" compact={compact} className="bg-white overflow-hidden">
        <DiscoverLogo className={compact ? "h-5 w-[38px]" : "h-6 w-[44px]"} />
      </LogoBadge>
      <LogoBadge label="Apple Pay" compact={compact}>
        <ApplePayLogo className={compact ? "h-3 w-[38px]" : "h-3.5 w-[44px]"} />
      </LogoBadge>
      <LogoBadge label="Google Pay" compact={compact}>
        <GooglePayLogo className={compact ? "h-3 w-[38px]" : "h-3.5 w-[44px]"} />
      </LogoBadge>
      <LogoBadge label="ACH" compact={compact} className="bg-white overflow-hidden p-0">
        <AchLogo className={compact ? "h-5 w-[38px]" : "h-6 w-[44px]"} />
      </LogoBadge>
    </div>
  );
}
