import PolicyLayout, { PolicySection } from "@/components/PolicyLayout";
import { Link } from "wouter";

const SUPPORT_EMAIL = "Support@RVRPeptides.com";

export default function ShippingReturnsRefunds() {
  return (
    <PolicyLayout
      title="Shipping, Returns & Refunds"
      currentPath="/shipping"
    >
      <PolicySection title="Shipping">
        <p>
          We at River Valley Research Peptides offer Free Priority USPS shipping on orders over
          $200 within the US.
        </p>
        <p>
          All our Free Shipping offers are for US addresses only, unless specified otherwise.
        </p>
        <p>
          We offer same (business) day shipping for orders placed before 1pm PST Monday–Friday.
          All orders received after 1pm PST, or on weekends or holidays, will ship on the next
          business day.
        </p>
        <p>
          We also offer Priority Express shipping (overnight USPS). We will soon be offering FedEx
          shipping as well. Stay tuned.
        </p>
        <p>
          When your order ships, our systems will automatically generate a “Package Shipped” email
          notification that will include a tracking number.
        </p>
        <p>
          Shipping rates and options, including free shipping, are subject to change at any time
          without notice.
        </p>
      </PolicySection>

      <PolicySection title="Returns and Refunds">
        <p>
          If your order has not yet shipped, you may cancel your order by contacting us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 hover:text-blue-700">
            {SUPPORT_EMAIL}
          </a>{" "}
          for a refund.
        </p>
        <p>Refunds may be requested up to 30 days after an order is placed.</p>
      </PolicySection>

      <PolicySection title="Refund Timeframe">
        <p>Refunds should settle and post to your account in 2 to 3 business days.</p>
      </PolicySection>

      <PolicySection title="Bulk and Special Orders">
        <p>
          <Link href="/contact" className="text-blue-600 hover:text-blue-700">
            Contact us
          </Link>{" "}
          for bulk or special orders. Our friendly customer service staff will work with you to
          satisfy any special requests.
        </p>
      </PolicySection>

      <div className="mt-10 pt-8 border-t border-slate-200">
        <p className="text-sm text-slate-500 leading-relaxed italic">
          ALL PRODUCTS sold on our site are for laboratory RESEARCH OR EDUCATIONAL PURPOSES ONLY.
          Personal use or human consumption of our products is expressly PROHIBITED. For details,
          please review and adhere to our{" "}
          <Link href="/terms" className="text-blue-600 hover:text-blue-700">
            Terms and Conditions
          </Link>
          .
        </p>
      </div>
    </PolicyLayout>
  );
}
