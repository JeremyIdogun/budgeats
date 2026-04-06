import Link from "next/link";
import { DocumentLayout } from "@/components/legal/DocumentLayout";

const UPDATED_AT = "April 6, 2026";

export default function SupportPage() {
  return (
    <DocumentLayout
      title="Support"
      subtitle="If something breaks or you need help with your account, this is the fastest path to get unblocked."
      updatedAt={UPDATED_AT}
    >
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-navy">Get in touch</h2>
        <p>
          Email{" "}
          <a className="font-semibold text-navy hover:underline" href="mailto:hello@loavish.app">
            hello@loavish.app
          </a>{" "}
          and include the email address on your account, a short description of
          the issue, and any screenshots that help us reproduce it.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-navy">Account access</h2>
        <p>
          If you can&apos;t sign in, request a reset link from the{" "}
          <Link href="/forgot-password" className="font-semibold text-navy hover:underline">
            password recovery page
          </Link>
          . If you no longer have access to that email address, contact support
          and we&apos;ll help you verify ownership before making changes.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-navy">Common issues</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Dashboard data looks stale after login: refresh the page once after sign-in.</li>
          <li>Confirmation or recovery email missing: check spam, promotions, and any email security filters.</li>
          <li>Retailer or price coverage looks incomplete: the product may still be missing support for that item or store.</li>
        </ul>
      </section>
    </DocumentLayout>
  );
}
