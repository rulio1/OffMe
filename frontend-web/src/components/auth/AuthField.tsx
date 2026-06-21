import clsx from 'clsx';
import { InputHTMLAttributes, ReactNode } from 'react';

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  endAdornment?: ReactNode;
}

export function AuthField({ label, endAdornment, className, id, ...props }: AuthFieldProps) {
  const fieldId = id ?? props.name;

  return (
    <div className="group relative">
      <input
        id={fieldId}
        placeholder=" "
        className={clsx(
          'peer w-full border-b border-offme-border bg-transparent py-4 text-[17px] text-offme-text outline-none transition-colors',
          'placeholder:text-transparent focus:border-offme-accent',
          endAdornment && 'pr-12',
          className
        )}
        {...props}
      />
      <label
        htmlFor={fieldId}
        className={clsx(
          'pointer-events-none absolute left-0 top-4 text-[17px] text-offme-muted transition-all',
          'peer-focus:top-0 peer-focus:text-[13px] peer-focus:text-offme-accent',
          'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[13px]'
        )}
      >
        {label}
      </label>
      {endAdornment && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2">{endAdornment}</div>
      )}
    </div>
  );
}