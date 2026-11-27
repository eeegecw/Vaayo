import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Terms of service | VAYO",
  description: "Terms for using VAYO to request a driver for your own vehicle.",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Using VAYO"
      title="Terms of service"
      intro="These terms explain how the VAYO website and driver-booking service currently work. Please read them before creating an account, requesting a driver or applying to drive."
      updated="27 November 2026"
    >
      <section>
        <h2>1. About the service</h2>
        <p>
          VAYO is a driver-booking service being developed for Mananthavady and the wider
          Wayanad area in Kerala. It lets a customer request a driver to drive the customer&apos;s
          own vehicle. The available request types are one-way, hourly and full-day.
        </p>
        <p>
          The website is currently an early-stage service. Availability, operating areas and
          features may be limited while the service is being introduced.
        </p>
      </section>

      <section>
        <h2>2. Who may use VAYO</h2>
        <p>
          You must be at least 18 years old, have legal capacity to enter an agreement and
          provide accurate account information. You are responsible for keeping your sign-in
          credentials private and for activity carried out through your account.
        </p>
        <p>
          Do not create an account using another person&apos;s details, impersonate anyone,
          interfere with the website or use the service for an unlawful or unsafe purpose.
        </p>
      </section>

      <section>
        <h2>3. Accounts and driver applications</h2>
        <p>
          Customers use an email address and password to create and access an account. A
          customer account does not automatically give the user driver or administrator
          permissions. Driver access is granted only after the VAYO team reviews an application.
        </p>
        <p>
          A driver applicant must provide accurate details and hold a valid driving licence
          appropriate for the vehicle they will drive. Submitting an application does not
          guarantee approval or work. Approval in the current pilot is an administrative
          decision and should not be treated as a statement that every possible background,
          identity or document check has been completed.
        </p>
      </section>

      <section>
        <h2>4. Booking requests and confirmation</h2>
        <ol>
          <li>Select one-way, hourly or full-day service and provide the requested trip details.</li>
          <li>VAYO reviews the request and an authorised administrator enters a fare.</li>
          <li>The quoted fare is shown in your account. You may accept or decline it.</li>
          <li>After you accept, VAYO proceeds with arranging an available driver. A trip is ready to proceed only when VAYO has assigned a driver and communicated the assignment to you.</li>
        </ol>
        <p>
          Sending a request is not a confirmed booking. A quote or an accepted quote does not
          guarantee that a driver will be available until the assignment is made. VAYO may
          contact you to clarify the pickup point, timing or other trip details.
        </p>
        <p>
          You must check the booking details and tell VAYO promptly if they are incorrect or
          need to change. A change may require a revised quote or a new driver arrangement.
        </p>
      </section>

      <section>
        <h2>5. Fares and payment</h2>
        <p>
          Fares are set by authorised VAYO administrators based on the request. The website
          does not publish a fixed rate card. You will be shown a quote before you accept it.
          Do not assume a fare until it has been provided through your VAYO account.
        </p>
        <p>
          The current website does not process card, UPI or other online payments. Any payment
          method, timing, taxes or additional charges must be communicated and agreed before
          the service is carried out. Do not enter payment credentials into the VAYO website.
        </p>
      </section>

      <section>
        <h2>6. Your responsibilities as a customer</h2>
        <ul>
          <li>You must own the vehicle or have the owner&apos;s permission to arrange for a driver to use it.</li>
          <li>You are responsible for ensuring the vehicle is roadworthy and has the registrations, insurance and other documents required by law.</li>
          <li>Provide accurate trip, pickup and timing details, and tell VAYO about material changes.</li>
          <li>Do not ask a driver to break traffic laws, carry prohibited items or do anything unsafe or unlawful.</li>
          <li>Before the trip starts, make sure the driver and vehicle arrangement is the one you agreed to with VAYO.</li>
        </ul>
      </section>

      <section>
        <h2>7. Responsibilities of drivers</h2>
        <p>
          Drivers using VAYO must provide accurate application details, maintain an appropriate
          and valid driving licence, follow applicable road and safety laws, and treat customers
          and their property respectfully. A driver must not accept a trip they are not legally
          or safely able to perform. VAYO may suspend or remove access where an application,
          account or trip raises a safety or conduct concern.
        </p>
      </section>

      <section>
        <h2>8. Changes and cancellations</h2>
        <p>
          You may decline a quoted fare before accepting it. If you need to change or cancel a
          request after accepting a quote, contact VAYO as early as possible so the driver
          arrangement can be reviewed. The current website does not yet provide a self-service
          cancellation control or publish a cancellation fee schedule.
        </p>
        <p>
          No cancellation charge is specified by these website terms. Any charge or payment
          consequence must be clearly communicated to you before you agree to it and must
          comply with applicable law.
        </p>
      </section>

      <section>
        <h2>9. Availability and service limits</h2>
        <p>
          VAYO may not be able to fulfil every request. A driver may be unavailable, weather,
          road conditions or other events may affect a trip, and the service area may change.
          VAYO will make reasonable efforts to communicate material changes to a booking.
        </p>
        <p>
          The website is provided for booking and account management. Temporary outages,
          maintenance or changes to features may occur.
        </p>
      </section>

      <section>
        <h2>10. Suspension and misuse</h2>
        <p>
          VAYO may restrict or suspend an account or application where there is suspected fraud,
          inaccurate information, misuse, a safety concern, breach of these terms or a legal
          requirement. Where reasonable and lawful, VAYO will explain the reason and any steps
          available to resolve the issue.
        </p>
      </section>

      <section>
        <h2>11. Liability and consumer rights</h2>
        <p>
          Nothing in these terms removes any consumer right or legal responsibility that cannot
          lawfully be excluded or limited. To the extent permitted by law, VAYO is not responsible
          for interruptions or delays caused by events outside its reasonable control. This
          clause does not decide responsibility for a particular accident, vehicle loss,
          injury or service failure; those matters depend on the facts and applicable law.
        </p>
        <p>
          Vehicle owners should maintain appropriate insurance and ensure that the policy
          permits the intended use of the vehicle and the relevant driver arrangement.
        </p>
      </section>

      <section>
        <h2>12. Intellectual property and website use</h2>
        <p>
          VAYO names, branding, page design and website content may not be copied or used in a
          misleading way without permission. You may use the website only for lawful personal
          booking or driver application purposes and must not attempt to disrupt its operation
          or gain unauthorised access to accounts or data.
        </p>
      </section>

      <section>
        <h2>13. Complaints and contact</h2>
        <p>
          VAYO has not yet published a named grievance officer, legal operator name, principal
          business address, customer support email or phone number. These details must be
          completed before public launch. Until then, this page should be treated as a working
          description of the pilot service rather than a complete consumer grievance notice.
        </p>
      </section>

      <section>
        <h2>14. Governing law and updates</h2>
        <p>
          These terms are intended to be governed by the laws of India. Any dispute will be
          handled by the courts or consumer forums that have jurisdiction under applicable law.
          VAYO may update these terms when the service or applicable law changes. The latest
          version and update date will appear on this page.
        </p>
      </section>
    </LegalPageShell>
  );
}
