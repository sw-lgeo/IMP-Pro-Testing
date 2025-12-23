import { FieldError } from 'react-hook-form';
import { FieldMeta } from '../types/schema';
import { ReactNode } from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  meta: FieldMeta;
  error?: FieldError;
  suffix?: ReactNode;
}

export function InputField({ meta, error, suffix, ...rest }: Props) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-slate-800">{meta.label_de}</label>
        {meta.unit && <span className="text-xs text-slate-500">{meta.unit}</span>}
      </div>
      <div className="flex gap-2 items-center">
        <input {...rest} aria-label={meta.label_de} />
        {suffix}
      </div>
      <p className="text-xs text-slate-500 mt-1">{meta.help_en}</p>
      {error && <p className="text-xs text-red-600 mt-1">{error.message}</p>}
    </div>
  );
}
