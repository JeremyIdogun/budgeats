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
      className={`inline-flex items-center ${className}`}
      aria-label="Loavish home"
    >
      <span
        className={
          isWordmark
            ? "relative block h-10 w-[210px] overflow-hidden md:h-12 md:w-[280px]"
            : "relative block h-8 w-[110px] overflow-hidden md:h-10 md:w-[138px]"
        }
      >
        <Image
          src={isWordmark ? "/loavish-wordmark.svg" : "/loavish-brand-logo.svg"}
          alt="Loavish"
          fill
          priority
          className="object-contain"
          sizes={isWordmark ? "(min-width: 768px) 280px, 210px" : "(min-width: 768px) 138px, 110px"}
        />
      </span>
    </Link>
  );
}
