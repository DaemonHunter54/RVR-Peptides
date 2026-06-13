import PolicyLayout, { PolicySection } from "@/components/PolicyLayout";
import { Link } from "wouter";
import { BUSINESS } from "@shared/business";

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

      <PolicySection title="Order Cancellation (Before Shipment)">
        <p>
          If your order has not yet shipped, you may cancel it for a full refund by contacting us at{" "}
          <a href={`mailto:${BUSINESS.ordersEmail}`} className="text-blue-600 hover:text-blue-700">
            {BUSINESS.ordersEmail}
          </a>{" "}
          or{" "}
          <a href={`mailto:${BUSINESS.customerServiceEmail}`} className="text-blue-600 hover:text-blue-700">
            {BUSINESS.customerServiceEmail}
          </a>
          . Cancellation requests must be received before the order leaves our facility.
        </p>
        <p>
          Once an order has shipped, it cannot be cancelled. All sales are final after shipment.
        </p>
      </PolicySection>

      <PolicySection title="Returns and Refunds">
        <p>
          We do not accept returns of delivered products. All sales are final once your order has
          shipped.
        </p>
        <p>
          Pre-shipment cancellations (described above) are the only refunds we offer. If you believe
          there is an error with your order, contact{" "}
          <a href={`mailto:${BUSINESS.customerServiceEmail}`} className="text-blue-600 hover:text-blue-700">
            {BUSINESS.customerServiceEmail}
          </a>{" "}
          and we will review your request.
        </p>
      </PolicySection>

      <PolicySection title="Refund Timeframe">
        <p>
          Approved pre-shipment cancellation refunds should settle and post to your account in 2 to
          3 business days, depending on your card issuer or bank.
        </p>
      </PolicySection>

      <PolicySection title="Bulk and Special Orders">
        <p>
          <Link href="/contact" className="text-blue-600 hover:text-blue-700">
            Contact us
          </Link>{" "}
          for bulk or special orders. Our customer service team will work with you to satisfy any
          special requests.
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
