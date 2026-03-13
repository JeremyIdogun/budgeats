import Link from "next/link";
import Image from "next/image";

interface BrandLogoProps {
  href?: string;
  className?: string;
}

export function BrandLogo({ href = "/", className = "" }: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center ${className}`}
      aria-label="Loavish home"
    >
      <span className="relative block h-8 aspect-[758/232] overflow-hidden md:h-10">
        <Image
          src="/loavish-brand-logo.svg"
          alt="Loavish"
          fill
          priority
          className="object-contain"
          sizes="(min-width: 768px) 130px, 104px"
        />
      </span>
    </Link>
  );
}
