import { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export default function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="text-sm font-medium text-zinc-700 ml-0.5">
          {label}
        </label>
      )}
      <select
        className={`w-full px-4 py-2 bg-white border border-zinc-200 rounded-lg outline-none focus:border-black focus:ring-0 text-zinc-900 transition-all duration-150 ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
