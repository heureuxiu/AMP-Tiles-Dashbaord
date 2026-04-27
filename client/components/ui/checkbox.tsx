"use client";

import * as React from "react";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    if (!label) {
      // Render checkbox without label wrapper
      return (
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={[
            "size-4 rounded border-slate-300 text-amp-primary focus:ring-amp-primary/40",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
      );
    }

    return (
      <div className="flex items-center">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={[
            "size-4 rounded border-slate-300 text-amp-primary focus:ring-amp-primary/40",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        <label
          htmlFor={inputId}
          className="ml-3 block cursor-pointer text-sm text-foreground"
        >
          {label}
        </label>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
