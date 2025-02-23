import { type LucideIcon } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "danger" | "warning";
type ButtonSize = "sm" | "md";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "border border-blue-500 text-blue-600 hover:bg-blue-50",
  secondary: "border border-slate-300 text-slate-700 hover:bg-slate-100",
  danger: "border border-red-500 text-red-600 hover:bg-red-50",
  warning: "border border-yellow-500 text-yellow-600 hover:bg-yellow-50",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-2 py-1 text-sm",
  md: "px-3 py-2 text-sm",
};

interface ButtonRootProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

interface ButtonIconProps {
  icon: LucideIcon;
}

function ButtonRoot({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonRootProps) {
  return (
    <button
      {...props}
      className={`flex items-center rounded transition-colors duration-200 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    />
  );
}

function ButtonIcon({ icon: Icon }: ButtonIconProps) {
  return <Icon className="w-4 h-4 mr-1.5" />;
}

function ButtonText({ children }: { children: React.ReactNode }) {
  return <span>{children}</span>;
}

export const Button = {
  Root: ButtonRoot,
  Icon: ButtonIcon,
  Text: ButtonText,
};
