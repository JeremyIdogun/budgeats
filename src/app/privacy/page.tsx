import { DocumentLayout } from "@/components/legal/DocumentLayout";

const UPDATED_AT = "April 6, 2026";

export default function PrivacyPage() {
  return (
    <DocumentLayout
      title="Privacy Policy"
      subtitle="This page explains what information Loavish collects, why we collect it, and the choices you have when using the product."
      updatedAt={UPDATED_AT}
    >
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-navy">What we collect</h2>
        <p>
          We collect the information you provide directly to us, such as your
          email address, sign-in credentials, onboarding preferences, meal plan
          inputs, pantry items, shopping list state, and account settings.
        </p>
        <p>
          We also collect limited product and device information needed to run
          the service, debug issues, prevent abuse, and understand product usage.
          That may include browser information, approximate location based on IP,
          page visits, feature usage, and error logs.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-navy">How we use information</h2>
        <p>We use your information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Create and secure your account.</li>
          <li>Save your plans, pantry state, shopping data, and preferences.</li>
          <li>Personalise recommendations, swaps, alerts, and dashboard views.</li>
          <li>Send transactional emails such as confirmations and account recovery.</li>
          <li>Improve product quality, reliability, and safety.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-navy">How we share information</h2>
        <p>
          We do not sell your personal information. We share data only when it is
          necessary to operate the service, comply with law, prevent fraud or
          abuse, or complete actions you request.
        </p>
        <p>
          That can include infrastructure providers, analytics tools, email
          providers, authentication services, and database or hosting partners
          that process data on our behalf under appropriate safeguards.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-navy">Retention and security</h2>
        <p>
          We keep information for as long as needed to provide the service,
          comply with legal obligations, resolve disputes, and enforce our
          agreements. We use reasonable administrative, technical, and
          organisational safeguards to protect your information, but no system can
          guarantee absolute security.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-navy">Your choices</h2>
        <p>
          You may request access, correction, deletion, or export of your account
          information, subject to applicable law. You can also stop receiving
          non-essential emails by using the unsubscribe option where available.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-navy">Contact</h2>
        <p>
          For privacy questions or data requests, contact{" "}
          <a className="font-semibold text-navy hover:underline" href="mailto:hello@loavish.app">
            hello@loavish.app
          </a>
          .
        </p>
      </section>
    </DocumentLayout>
  );
}
