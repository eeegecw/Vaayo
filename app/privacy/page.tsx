import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Privacy policy | VAYO",
  description: "How VAYO uses account, booking and driver application information.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Your information"
      title="Privacy policy"
      intro="This notice explains what information VAYO uses when you visit the website, create an account, request a driver or apply to drive. It describes the current website and pilot service."
      updated="27 November 2026"
    >
      <section>
        <h2>1. Who this notice is about</h2>
        <p>
          VAYO is a driver-booking service being developed for Mananthavady and the wider
          Wayanad area in Kerala. The website is operated under the VAYO brand. The legal
          name of the person or entity operating the service and its principal business
          address have not yet been provided for publication. Those details must be added
          before the service is opened to the public.
        </p>
      </section>

      <section>
        <h2>2. Information we collect</h2>
        <p>Depending on how you use VAYO, the current website may process:</p>
        <ul>
          <li><strong>Account details:</strong> your display name and email address. Supabase Auth handles your password; VAYO does not receive or store your password in plain text.</li>
          <li><strong>Profile details:</strong> your account identifier, account role and, where present in the account record, a phone number.</li>
          <li><strong>Booking details:</strong> service type, pickup point, destination (where relevant), requested date and time, hourly duration, booking status and the fare quoted by VAYO.</li>
          <li><strong>Driver application details:</strong> applicant name and driving licence number, together with the application status.</li>
          <li><strong>Technical information:</strong> information needed by the hosting, authentication and security services to deliver the website, maintain a session and protect the service.</li>
        </ul>
        <p>
          The current driver application form asks for a licence number. It does not provide
          an upload facility for licence photographs or other identity documents. The current
          website does not collect card numbers, UPI PINs or bank account credentials.
        </p>
      </section>

      <section>
        <h2>3. Why we use this information</h2>
        <ul>
          <li>To create and secure your account and let you sign in.</li>
          <li>To receive, review and manage your driver booking request.</li>
          <li>To calculate and share a fare, record whether you accept or decline it, and arrange an assigned driver.</li>
          <li>To receive and review driver applications and manage approved driver accounts.</li>
          <li>To support users, protect the website, prevent misuse and keep operational records.</li>
          <li>To meet legal obligations or respond to lawful requests where required.</li>
        </ul>
        <p>
          VAYO should use personal information only for the purposes described here or for
          another purpose explained to you and permitted by applicable law.
        </p>
      </section>

      <section>
        <h2>4. Who may receive information</h2>
        <ul>
          <li><strong>Authorised VAYO administrators</strong> can review bookings and driver applications, set fares and assign drivers.</li>
          <li><strong>An assigned driver</strong> can access the trip information made available in the driver area, such as pickup, destination, schedule and fare, so the trip can be carried out.</li>
          <li><strong>Supabase</strong> provides the website database and email/password authentication infrastructure. See the <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer">Supabase privacy policy</a>.</li>
          <li><strong>Vercel</strong> hosts and delivers the website. See the <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">Vercel privacy policy</a>.</li>
          <li><strong>Google Fonts</strong> supplies the typefaces used by the website; a browser may request font resources from Google when pages load.</li>
        </ul>
        <p>
          We do not sell your personal information. We do not currently operate an advertising
          profile or targeted-ad system on the VAYO website.
        </p>
      </section>

      <section>
        <h2>5. Account sessions, cookies and analytics</h2>
        <p>
          The sign-in system uses browser session storage mechanisms, including cookies, where
          required to keep you authenticated and protect account access. The current website
          does not include a VAYO analytics or advertising SDK. Hosting and security providers
          may process technical request information as part of operating and protecting the site.
        </p>
      </section>

      <section>
        <h2>6. How long information is kept</h2>
        <p>
          Account and booking information may be kept while your account is active and for as
          long as reasonably needed to manage the service, resolve disputes, maintain records,
          protect the platform or meet legal requirements. Driver application information may
          be retained while an application is reviewed and for a reasonable period afterwards
          for account administration and record-keeping. Retention periods should be reviewed
          and applied by the VAYO operator before public launch.
        </p>
      </section>

      <section>
        <h2>7. Security</h2>
        <p>
          VAYO uses Supabase authentication and database access controls, including row-level
          security, to restrict access to account and booking records. No online service can
          guarantee absolute security. Keep your password private, sign out on shared devices
          and contact VAYO promptly if you believe your account has been used without permission.
        </p>
      </section>

      <section>
        <h2>8. Your choices and privacy requests</h2>
        <p>
          You can choose not to provide information requested by the website, but some features
          may then be unavailable. You can stop using the service and, where supported, sign out
          of your account. The current website does not yet provide a self-service account
          deletion or privacy request form.
        </p>
        <p>
          Depending on the provisions of Indian data protection law that are in force and
          applicable to the service, you may have rights to request information about processing,
          correction or updating of personal data, erasure where retention is no longer
          necessary, grievance redressal and nomination of another person to exercise rights
          in specified circumstances.
        </p>
        <p>
          <strong>Privacy contact:</strong> a named privacy contact, working email address and
          phone number have not yet been supplied for VAYO. They must be published here before
          users are invited to submit privacy or data-rights requests.
        </p>
      </section>

      <section>
        <h2>9. Children</h2>
        <p>
          VAYO is intended for adults arranging driver services or applying to drive. The
          website is not intended for children under 18, and we do not knowingly invite them
          to create accounts or submit driver applications.
        </p>
      </section>

      <section>
        <h2>10. Changes to this notice</h2>
        <p>
          We may update this notice when the service, technology or applicable law changes.
          The latest version will be published on this page with a revised update date.
        </p>
      </section>
    </LegalPageShell>
  );
}
