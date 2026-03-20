import type { ElementType, HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardPadding = "sm" | "md" | "lg";

const paddingClasses: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6 md:p-8",
};

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  padding?: CardPadding;
}

export function Card({
  as: Component = "div",
  padding = "md",
  className,
  ...props
}: CardProps) {
  return (
    <Component
      className={cn(
        "rounded-xl border border-cream-dark bg-white",
        paddingClasses[padding],
        className,
      )}
      {...props}
    />
  );
}
