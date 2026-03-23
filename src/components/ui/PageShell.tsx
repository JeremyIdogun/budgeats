import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function PageShell({ children, className, contentClassName }: PageShellProps) {
  return (
    <main className={cn("min-h-screen bg-cream px-4 py-6 md:px-8 md:py-8", className)}>
      <div className={cn("mx-auto max-w-7xl", contentClassName)}>{children}</div>
    </main>
  );
}
