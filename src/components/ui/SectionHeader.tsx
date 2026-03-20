import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
  titleClassName,
  descriptionClassName,
}: SectionHeaderProps) {
  return (
    <section className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h1 className={cn("text-2xl font-bold text-navy md:text-3xl", titleClassName)}>{title}</h1>
        {description && (
          <p className={cn("text-sm text-navy-muted", descriptionClassName)}>{description}</p>
        )}
      </div>
      {actions && <div className="w-full sm:w-auto">{actions}</div>}
    </section>
  );
}
