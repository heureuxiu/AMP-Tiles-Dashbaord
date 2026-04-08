import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, type, style, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const isNumberInput = type === "number";

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors dark:border-neutral-600 dark:bg-neutral-800 dark:text-white",
            "placeholder:text-gray-400 dark:placeholder:text-neutral-500",
            "focus:border-amp-primary focus:bg-white focus:ring-2 focus:ring-amp-primary/20 dark:focus:bg-neutral-800",
            "disabled:cursor-not-allowed disabled:opacity-50",
            isNumberInput &&
              "[appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          type={type}
          style={
            isNumberInput
              ? ({
                  ...style,
                  appearance: "textfield",
                  MozAppearance: "textfield",
                } as React.CSSProperties)
              : style
          }
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
