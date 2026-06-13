import PolicyLayout, { PolicySection, PolicySubsection } from "@/components/PolicyLayout";
import { Link } from "wouter";
import { BUSINESS } from "@shared/business";

const SITE = BUSINESS.website;
const SITE_URL = BUSINESS.websiteUrl;
const SUPPORT_EMAIL = BUSINESS.supportEmail;
const COMPANY = BUSINESS.legalName;

export default function PrivacyPolicy() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      subtitle={`${SITE_URL} — Last updated: June 9, 2026`}
      currentPath="/privacy"
    >
      <p className="text-slate-600 leading-relaxed text-[15px] mb-10">
        This Privacy Policy describes Our policies and procedures on the collection, use and
        disclosure of Your information when You use the Service and tells You about Your privacy
        rights and how the law protects You.
      </p>
      <p className="text-slate-600 leading-relaxed text-[15px] mb-10">
        We use Your Personal data to provide and improve the Service. By using the Service, You
        agree to the collection and use of information in accordance with this Privacy Policy.
      </p>

      <PolicySection title="Interpretation and Definitions">
        <PolicySubsection title="Interpretation">
          <p>
            The words of which the initial letter is capitalized have meanings defined under the
            following conditions. The following definitions shall have the same meaning regardless
            of whether they appear in singular or in plural.
          </p>
        </PolicySubsection>

        <PolicySubsection title="Definitions">
          <p>For the purposes of this Privacy Policy:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>You</strong> means the individual accessing or using the Service, or the
              company, or other legal entity on behalf of which such individual is accessing or using
              the Service, as applicable.
            </li>
            <li>
              <strong>Company</strong> (referred to as either “the Company”, “We”, “Us” or “Our” in
              this Agreement) refers to {COMPANY}, based in the United States.
            </li>
            <li>
              <strong>Affiliate</strong> means an entity that controls, is controlled by or is under
              common control with a party, where “control” means ownership of 50% or more of the
              shares, equity interest or other securities entitled to vote for election of directors
              or other managing authority.
            </li>
            <li>
              <strong>Account</strong> means a unique account created for You to access our Service
              or parts of our Service.
            </li>
            <li>
              <strong>Website</strong> refers to {COMPANY}, accessible from {SITE_URL}
            </li>
            <li>
              <strong>Service</strong> refers to the Website.
            </li>
            <li>
              <strong>Country</strong> refers to: United States
            </li>
            <li>
              <strong>Service Provider</strong> means any natural or legal person who processes the
              data on behalf of the Company.
            </li>
            <li>
              <strong>Third-party Social Media Service</strong> refers to any website or any social
              network website through which a User can log in or create an account to use the
              Service.
            </li>
            <li>
              <strong>Personal Data</strong> is any information that relates to an identified or
              identifiable individual.
            </li>
            <li>
              <strong>Cookies</strong> are small files that are placed on Your computer, mobile
              device or any other device by a website, containing the details of Your browsing
              history on that website among its many uses.
            </li>
            <li>
              <strong>Device</strong> means any device that can access the Service such as a
              computer, a cellphone or a digital tablet.
            </li>
            <li>
              <strong>Usage Data</strong> refers to data collected automatically, either generated
              by the use of the Service or from the Service infrastructure itself (for example, the
              duration of a page visit).
            </li>
          </ul>
        </PolicySubsection>
      </PolicySection>

      <PolicySection title="Collecting and Using Your Personal Data">
        <PolicySubsection title="Types of Data Collected">
          <p>
            <strong>Personal Data.</strong> While using Our Service, We may ask You to provide Us
            with certain personally identifiable information that can be used to contact or identify
            You. Personally identifiable information may include, but is not limited to: email
            address, first name and last name, phone number, address, State, Province, ZIP/Postal
            code, City, and Usage Data.
          </p>
          <p>
            <strong>Usage Data.</strong> Usage Data is collected automatically when using the
            Service. Usage Data may include information such as Your Device’s Internet Protocol
            address (e.g. IP address), browser type, browser version, the pages of our Service that
            You visit, the time and date of Your visit, the time spent on those pages, unique device
            identifiers and other diagnostic data.
          </p>
          <p>
            When You access the Service by or through a mobile device, We may collect certain
            information automatically, including, but not limited to, the type of mobile device You
            use, Your mobile device unique ID, the IP address of Your mobile device, Your mobile
            operating system, the type of mobile Internet browser You use, unique device identifiers
            and other diagnostic data.
          </p>
        </PolicySubsection>

        <PolicySubsection title="Tracking Technologies and Cookies">
          <p>
            We use Cookies and similar tracking technologies to track the activity on Our Service
            and store certain information. Tracking technologies used are beacons, tags, and scripts
            to collect and track information and to improve and analyze Our Service.
          </p>
          <p>
            You can instruct Your browser to refuse all Cookies or to indicate when a Cookie is
            being sent. However, if You do not accept Cookies, You may not be able to use some parts
            of our Service.
          </p>
          <p>
            Cookies can be “Persistent” or “Session” Cookies. Persistent Cookies remain on your
            personal computer or mobile device when You go offline, while Session Cookies are
            deleted as soon as You close your web browser.
          </p>
          <p>We use both session and persistent Cookies for the purposes set out below:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Necessary / Essential Cookies:</strong> These Cookies are essential to provide
              You with services available through the Website and to enable You to use some of its
              features.
            </li>
            <li>
              <strong>Cookies Policy / Notice Acceptance Cookies:</strong> These Cookies identify
              if users have accepted the use of cookies on the Website.
            </li>
            <li>
              <strong>Functionality Cookies:</strong> These Cookies allow us to remember choices You
              make when You use the Website, such as remembering your login details or language
              preference.
            </li>
            <li>
              <strong>Tracking and Performance Cookies:</strong> These Cookies are used to track
              information about traffic to the Website and how users use the Website.
            </li>
          </ul>
        </PolicySubsection>

        <PolicySubsection title="Use of Your Personal Data">
          <p>The Company may use Personal Data for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide and maintain our Service, including to monitor the usage of our Service.</li>
            <li>
              To manage Your Account: to manage Your registration as a user of the Service.
            </li>
            <li>
              For the performance of a contract: the development, compliance and undertaking of the
              purchase contract for the products, items or services You have purchased.
            </li>
            <li>
              To contact You: by email, telephone calls, SMS, or other equivalent forms of electronic
              communication regarding updates or informative communications related to the
              functionalities, products or contracted services.
            </li>
            <li>
              To provide You with news, special offers and general information about other goods,
              services and events which we offer.
            </li>
            <li>To manage Your requests: To attend and manage Your requests to Us.</li>
          </ul>
          <p>We may share your personal information in the following situations:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>With Service Providers:</strong> We may share Your personal information with
              Service Providers to monitor and analyze the use of our Service, to contact You.
            </li>
            <li>
              <strong>For Business transfers:</strong> We may share or transfer Your personal
              information in connection with any merger, sale of Company assets, financing, or
              acquisition.
            </li>
            <li>
              <strong>With Affiliates:</strong> We may share Your information with Our affiliates,
              in which case we will require those affiliates to honor this Privacy Policy.
            </li>
            <li>
              <strong>With Business partners:</strong> We may share Your information with Our
              business partners to offer You certain products, services or promotions.
            </li>
          </ul>
          <p>
            No mobile information will be shared with third parties/affiliates for
            marketing/promotional purposes. All the above categories exclude text messaging
            originator opt-in data and consent; this information will not be shared with any third
            parties.
          </p>
        </PolicySubsection>

        <PolicySubsection title="Retention of Your Personal Data">
          <p>
            The Company will retain Your Personal Data only for as long as is necessary for the
            purposes set out in this Privacy Policy. We will retain and use Your Personal Data to
            the extent necessary to comply with our legal obligations, resolve disputes, and enforce
            our legal agreements and policies.
          </p>
          <p>
            The Company will also retain Usage Data for internal analysis purposes. Usage Data is
            generally retained for a shorter period of time, except when this data is used to
            strengthen the security or to improve the functionality of Our Service, or We are
            legally obligated to retain this data for longer time periods.
          </p>
        </PolicySubsection>

        <PolicySubsection title="Transfer of Your Personal Data">
          <p>
            Your information, including Personal Data, is processed at the Company’s operating
            offices and in any other places where the parties involved in the processing are
            located. It means that this information may be transferred to — and maintained on —
            computers located outside of Your state, province, country or other governmental
            jurisdiction where the data protection laws may differ than those from Your jurisdiction.
          </p>
          <p>
            Your consent to this Privacy Policy followed by Your submission of such information
            represents Your agreement to that transfer.
          </p>
          <p>
            The Company will take all steps reasonably necessary to ensure that Your data is treated
            securely and in accordance with this Privacy Policy.
          </p>
        </PolicySubsection>

        <PolicySubsection title="Disclosure of Your Personal Data">
          <p>
            If the Company is involved in a merger, acquisition or asset sale, Your Personal Data
            may be transferred. We will provide notice before Your Personal Data is transferred and
            becomes subject to a different Privacy Policy.
          </p>
          <p>
            Under certain circumstances, the Company may be required to disclose Your Personal Data
            if required to do so by law or in response to valid requests by public authorities (e.g.
            a court or a government agency).
          </p>
          <p>
            The Company may disclose Your Personal Data in the good faith belief that such action is
            necessary to: comply with a legal obligation; protect and defend the rights or property
            of the Company; prevent or investigate possible wrongdoing in connection with the
            Service; protect the personal safety of Users of the Service or the public; or protect
            against legal liability.
          </p>
        </PolicySubsection>

        <PolicySubsection title="Security of Your Personal Data">
          <p>
            The security of Your Personal Data is important to Us, but remember that no method of
            transmission over the Internet, or method of electronic storage is 100% secure. While We
            strive to use commercially acceptable means to protect Your Personal Data, We cannot
            guarantee its absolute security.
          </p>
        </PolicySubsection>
      </PolicySection>

      <PolicySection title="Detailed Information on the Processing of Your Personal Data">
        <p>
          Service Providers have access to Your Personal Data only to perform their tasks on Our
          behalf and are obligated not to disclose or use it for any other purpose.
        </p>
        <PolicySubsection title="Marketing">
          <p>
            You may opt-in for marketing communications on our website, including our newsletter.
            Marketing requests may be sent to{" "}
            <a href={`mailto:${BUSINESS.mailingListEmail}`} className="text-blue-600 hover:text-blue-700">
              {BUSINESS.mailingListEmail}
            </a>
            . These include emails and SMS messaging, which you can opt-out of at any time. No
            purchase is necessary. Standard message and data rates may apply.
          </p>
        </PolicySubsection>
        <PolicySubsection title="Payment Processing">
          <p>
            When you make a purchase, payment information is collected and processed by our payment
            service providers through PaymentCloud (including Authorize.net or NMI, depending on
            configuration). We do not store full credit card or debit card numbers on our servers.
          </p>
          <p>
            Payment providers may collect your name, billing address, email, payment method details,
            and transaction amount to process your order, prevent fraud, and comply with applicable
            law. Their use of your information is governed by their own privacy and security policies
            in addition to this Privacy Policy.
          </p>
          <p>
            Order confirmations and shipping updates may be sent from{" "}
            <a href={`mailto:${BUSINESS.ordersEmail}`} className="text-blue-600 hover:text-blue-700">
              {BUSINESS.ordersEmail}
            </a>
            .
          </p>
        </PolicySubsection>
        <PolicySubsection title="Analytics">
          <p>
            We may use third-party Service providers to monitor and analyze the use of our Service,
            including Google Analytics, a service provided by Google.
          </p>
        </PolicySubsection>
      </PolicySection>

      <PolicySection title="Links to Other Websites">
        <p>
          Our Service may contain links to other websites that are not operated by Us. If You click
          on a third party link, You will be directed to that third party’s site. We strongly advise
          You to review the Privacy Policy of every site You visit.
        </p>
        <p>
          We have no control over and assume no responsibility for the content, privacy policies or
          practices of any third party sites or services.
        </p>
      </PolicySection>

      <PolicySection title="Changes to this Privacy Policy">
        <p>
          We may update our Privacy Policy from time to time. We will notify You of any changes by
          posting the new Privacy Policy on this page.
        </p>
        <p>
          We will let You know via email and/or a prominent notice on Our Service, prior to the
          change becoming effective and update the “Last updated” date at the top of this Privacy
          Policy.
        </p>
        <p>
          You are advised to review this Privacy Policy periodically for any changes. Changes to
          this Privacy Policy are effective when they are posted on this page.
        </p>
      </PolicySection>

      <PolicySection title="Contact Us">
        <p>If you have any questions about this Privacy Policy, You can contact us:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            General support:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 hover:text-blue-700">
              {SUPPORT_EMAIL}
            </a>
          </li>
          <li>
            Customer service:{" "}
            <a href={`mailto:${BUSINESS.customerServiceEmail}`} className="text-blue-600 hover:text-blue-700">
              {BUSINESS.customerServiceEmail}
            </a>
          </li>
          <li>
            Orders:{" "}
            <a href={`mailto:${BUSINESS.ordersEmail}`} className="text-blue-600 hover:text-blue-700">
              {BUSINESS.ordersEmail}
            </a>
          </li>
          <li>
            or by visiting our{" "}
            <Link href="/contact" className="text-blue-600 hover:text-blue-700">
              Contact Us
            </Link>{" "}
            page.
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="Cookies We Collect">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-3 font-semibold text-slate-800 border-b border-slate-200">
                  Cookie Name
                </th>
                <th className="text-left p-3 font-semibold text-slate-800 border-b border-slate-200">
                  Cookie Description
                </th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {[
                ["session", "Maintains your authenticated session on the server."],
                ["cart", "Stores items in your shopping cart."],
                ["auth", "Indicates whether you are currently logged into the store."],
                ["preferences", "Remembers your site preferences and settings."],
                ["analytics", "Helps us understand how visitors use our website."],
              ].map(([name, desc]) => (
                <tr key={name} className="border-b border-slate-100">
                  <td className="p-3 font-medium text-slate-700">{name}</td>
                  <td className="p-3">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PolicySection>
    </PolicyLayout>
  );
}
