import React, { useId } from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: React.ReactElement;
}

export function FormField({
  label,
  required = false,
  error,
  description,
  children,
}: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  const ariaDescribedBy = [
    error ? errorId : null,
    description ? descriptionId : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="mb-2 block font-medium text-gray-700 text-sm"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {React.cloneElement(children, {
        id,
        "aria-describedby": ariaDescribedBy || undefined,
        // biome-ignore lint/suspicious/noExplicitAny: for utility
      } as any)}
      {description && (
        <p id={descriptionId} className="text-gray-500 text-sm">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-red-600 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
