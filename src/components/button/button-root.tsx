import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "warning";
type ButtonSize = "sm" | "md";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "border border-blue-500 text-blue-600 hover:bg-blue-100",
  secondary: "border border-slate-300 text-slate-700 hover:bg-slate-200",
  danger: "border border-red-500 text-red-600 hover:bg-red-100",
  warning: "border border-orange-500 text-orange-600 hover:bg-orange-100",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-2 py-1 text-sm",
  md: "px-3 py-2 text-sm",
};

interface ButtonRootProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function ButtonRoot({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonRootProps) {
  return (
    <button
      {...props}
      className={cn(
        "flex items-center rounded transition-colors duration-200 hover:cursor-pointer",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    />
  );
}
