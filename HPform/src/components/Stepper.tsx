interface StepperProps {
  steps: string[];
  current: number;
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, current, onStepClick }: StepperProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {steps.map((title, index) => {
        const active = index === current;
        return (
          <button
            key={title}
            type="button"
            onClick={() => onStepClick?.(index)}
            className={`px-3 py-2 rounded-lg border text-sm ${active ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-700 border-slate-200'}`}
          >
            {index + 1}. {title}
          </button>
        );
      })}
    </div>
  );
}
