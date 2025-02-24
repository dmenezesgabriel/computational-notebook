import { type LucideIcon } from "lucide-react";

interface ButtonIconProps {
  icon: LucideIcon;
}

export function ButtonIcon({ icon: Icon }: ButtonIconProps) {
  return <Icon className="w-4 h-4 mr-1.5" />;
}
