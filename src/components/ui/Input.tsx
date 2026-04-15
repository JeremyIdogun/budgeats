import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-cream-dark bg-white px-3 py-2.5 text-sm text-navy outline-none",
        "transition-colors duration-150 focus:border-navy/35",
        className,
      )}
      {...props}
    />
  );
});
