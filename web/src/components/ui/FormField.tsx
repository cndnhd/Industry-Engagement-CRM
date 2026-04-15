'use client';

import { useId } from 'react';

type FormFieldProps = {
  label: string;
  required?: boolean;
  children: (id: string) => React.ReactNode;
};

export default function FormField({ label, required, children }: FormFieldProps) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children(id)}
    </div>
  );
}

export const inputClass =
  'block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20';

export const selectClass = inputClass;
