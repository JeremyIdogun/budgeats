import { DocumentLayout } from "@/components/legal/DocumentLayout";

const UPDATED_AT = "April 6, 2026";

export default function TermsPage() {
  return (
    <DocumentLayout
      title="Terms of Service"
      subtitle="These terms govern your use of Loavish. By creating an account or using the service, you agree to them."
      updatedAt={UPDATED_AT}
    >
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-navy">Using Loavish</h2>
        <p>
          You may use Loavish only in compliance with applicable law and these
          terms. You are responsible for keeping your account credentials secure
          and for all activity that occurs under your account.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-navy">Service scope</h2>
        <p>
          Loavish provides budgeting, meal planning, pantry, shopping, and price
          comparison tools. Availability, prices, product matches, retailer
          coverage, and recommendations may change over time and may not always be
          complete, current, or available in every region.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-navy">Acceptable use</h2>
        <p>You agree not to misuse the service. That includes trying to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Access accounts, systems, or data that do not belong to you.</li>
          <li>Interfere with or disrupt the product or its infrastructure.</li>
          <li>Reverse engineer or scrape the service in a way that harms Loavish or third parties.</li>
          <li>Use the product for unlawful, fraudulent, or abusive activity.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-navy">Your content</h2>
        <p>
          You retain ownership of the information you submit to Loavish. You give
          us permission to host, process, and display that information as needed
          to operate and improve the service.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-navy">Disclaimers</h2>
        <p>
          Loavish is provided on an &quot;as is&quot; and &quot;as available&quot; basis.
          We do not guarantee uninterrupted access, complete retailer coverage, or
          error-free operation. Planning, savings, and nutrition outcomes depend on
          your choices and real-world retailer availability.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-navy">Suspension and termination</h2>
        <p>
          We may suspend or terminate access if you violate these terms, create
          risk for other users, or expose Loavish to legal or operational harm.
          You may stop using the service at any time.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-navy">Contact</h2>
        <p>
          Questions about these terms can be sent to{" "}
          <a className="font-semibold text-navy hover:underline" href="mailto:hello@loavish.app">
            hello@loavish.app
          </a>
          .
        </p>
      </section>
    </DocumentLayout>
  );
}
