import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useRoute } from "wouter";

export default function PaymentRedirect() {
  const [, params] = useRoute("/pay/:orderNumber");
  const orderNumber = params?.orderNumber || "";
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);

  const hostedFormQuery = trpc.payments.hostedForm.useQuery(
    { orderNumber },
    { enabled: Boolean(orderNumber), retry: false }
  );

  useEffect(() => {
    const data = hostedFormQuery.data;
    if (!data || submittedRef.current) return;

    if (data.gateway === "nmi" && data.formAction) {
      submittedRef.current = true;
      window.location.href = data.formAction;
      return;
    }

    if (data.token && formRef.current) {
      submittedRef.current = true;
      formRef.current.submit();
    }
  }, [hostedFormQuery.data]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="container py-20 flex-1 flex flex-col items-center justify-center text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Redirecting to secure payment</h1>
        <p className="text-slate-500 max-w-md">
          Please wait while we connect you to our PaymentCloud secure checkout for order {orderNumber}.
        </p>
        {hostedFormQuery.error && (
          <p className="text-red-600 text-sm mt-4 max-w-lg">{hostedFormQuery.error.message}</p>
        )}
        {hostedFormQuery.data?.token && hostedFormQuery.data.formAction && (
          <form ref={formRef} method="post" action={hostedFormQuery.data.formAction} className="hidden">
            <input type="hidden" name="token" value={hostedFormQuery.data.token} />
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}
