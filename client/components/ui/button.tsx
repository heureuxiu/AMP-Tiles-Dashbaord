import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
  isLoading?: boolean;
}

const variantStyles = {
  primary:
    "bg-amp-primary text-white shadow-lg hover:bg-amp-primary-hover focus:ring-amp-primary/40",
  secondary:
    "border border-amp-footer/30 bg-amp-footer text-amp-footer-text hover:bg-amp-footer-light focus:ring-amp-footer/40",
  ghost:
    "bg-transparent text-foreground hover:bg-foreground/5 focus:ring-foreground/20",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      fullWidth,
      isLoading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={props.type ?? "button"}
        disabled={disabled ?? isLoading}
        className={[
          "inline-flex cursor-pointer items-center justify-center rounded-md px-4 py-2.5 text-[15px] font-medium outline-none transition-colors focus:ring-2 focus:ring-offset-2",
          variantStyles[variant],
          fullWidth && "w-full",
          (disabled ?? isLoading) && "cursor-not-allowed opacity-70",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
            Signing in…
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
