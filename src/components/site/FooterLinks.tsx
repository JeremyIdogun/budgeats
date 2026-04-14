import Link from "next/link";
import { cn } from "@/lib/cn";

interface FooterLinksProps {
  className?: string;
  linkClassName?: string;
}

export function FooterLinks({ className, linkClassName }: FooterLinksProps) {
  return (
    <ul className={cn("flex list-none gap-6", className)}>
      <li>
        <Link href="/privacy" className={linkClassName}>
          Privacy
        </Link>
      </li>
      <li>
        <Link href="/terms" className={linkClassName}>
          Terms
        </Link>
      </li>
      <li>
        <Link href="/support" className={linkClassName}>
          Contact
        </Link>
      </li>
    </ul>
  );
}
