import { Button } from "@/components/ui/Button";

interface StepHeaderProps {
  step: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  onBack?: () => void;
}

export function StepHeader({ step, title, description, onBack }: StepHeaderProps) {
  return (
    <header>
      {onBack && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4 px-0"
        >
          Back
        </Button>
      )}
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
        Step {step} of 4
      </p>
      <h1 className="mt-3 font-heading text-3xl font-bold leading-tight text-navy">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-navy-muted">{description}</p>
    </header>
  );
}
