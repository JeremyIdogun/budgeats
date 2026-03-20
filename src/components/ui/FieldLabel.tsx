import type { LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface FieldLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}

export function FieldLabel({ className, children, ...props }: FieldLabelProps) {
  return (
    <label className={cn("block text-sm font-medium text-navy", className)} {...props}>
      {children}
    </label>
  );
}
