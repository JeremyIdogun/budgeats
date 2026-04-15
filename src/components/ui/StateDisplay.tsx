import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

/**
 * Shared presentational primitives for loading, empty, and error states.
 *
 * Use these instead of hand-rolled placeholders so core journeys share
 * consistent tone, spacing, and accessibility treatment.
 */

interface BaseProps {
  className?: string;
  title?: string;
  description?: ReactNode;
}

export function LoadingState({
  className,
  title = "Loading",
  description = "Fetching the latest data…",
  srLabel,
}: BaseProps & { srLabel?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-cream-dark bg-white/70 px-6 py-10 text-center",
        className,
      )}
    >
      <span className="sr-only">{srLabel ?? title}</span>
      <span
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-2 border-navy/20 border-t-navy"
      />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-navy">{title}</p>
        {description ? (
          <p className="text-sm text-navy-muted">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

interface EmptyStateProps extends BaseProps {
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  className,
  title = "Nothing here yet",
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-cream-dark bg-cream/40 px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? <div aria-hidden="true" className="text-2xl">{icon}</div> : null}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-navy">{title}</p>
        {description ? (
          <p className="text-sm text-navy-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

interface ErrorStateProps extends BaseProps {
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  className,
  title = "Something went wrong",
  description = "We couldn't complete that request. Please try again.",
  onRetry,
  retryLabel = "Retry",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-danger/30 bg-danger/5 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold text-danger">{title}</p>
        {description ? (
          <p className="text-sm text-navy-muted">{description}</p>
        ) : null}
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry} type="button">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
