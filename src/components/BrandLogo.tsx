import Link from "next/link";
import Image from "next/image";

interface BrandLogoProps {
  href?: string;
  className?: string;
  variant?: "brand" | "wordmark";
}

export function BrandLogo({
  href = "/",
  className = "",
  variant = "brand",
}: BrandLogoProps) {
  const isWordmark = variant === "wordmark";

  return (
    <Link
      href={href}
      className={`inline-flex items-center leading-none ${className}`}
      aria-label="Loavish home"
    >
      <span
        className={
          isWordmark
            ? "relative block h-10 w-47.5 overflow-hidden md:h-14 md:w-70"
            : "relative block h-7 w-25 overflow-hidden md:h-8 md:w-31"
        }
      >
        <Image
          src={isWordmark ? "/loavish-wordmark.svg" : "/loavish-brand-logo.svg"}
          alt="Loavish"
          fill
          priority
          className={`object-contain ${isWordmark ? "object-center" : "object-left"}`}
          sizes={isWordmark ? "(min-width: 768px) 220px, 180px" : "(min-width: 768px) 124px, 100px"}
        />
      </span>
    </Link>
  );
}
