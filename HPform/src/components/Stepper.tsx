interface StepperProps {
  steps: string[];
  current: number;
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, current, onStepClick }: StepperProps) {
  const completion = Math.round(((current + 1) / steps.length) * 100);

  return (
    <div className="stepper-card">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full shadow-sm">
          Schritt {current + 1} von {steps.length}
        </span>
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-1 rounded-full shadow-sm">{completion}%</span>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {steps.map((title, index) => {
          const active = index === current;
          const complete = index < current;
          const buttonStyles = active
            ? 'bg-sky-600 text-white border-sky-600 shadow-md scale-[1.01]'
            : complete
              ? 'bg-emerald-50 text-emerald-800 border-emerald-100 hover:border-emerald-200'
              : 'bg-white text-slate-700 border-slate-200 hover:border-sky-200 hover:text-sky-700';
          return (
            <button
              key={title}
              type="button"
              onClick={() => onStepClick?.(index)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold shadow-sm border transition ${buttonStyles}`}
            >
              <span
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  active
                    ? 'bg-white/20 text-white border border-white/40'
                    : complete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {index + 1}
              </span>
              <div className="text-left">
                <div>{title}</div>
                <div className="text-[11px] font-medium text-slate-500">
                  {complete ? 'Erledigt' : active ? 'Aktiv' : 'Offen'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
