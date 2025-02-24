import { ReactNode } from "react";

interface TabsRootProps {
  children: ReactNode;
  maxWidth: number;
}

export function TabsRoot({ children, maxWidth }: TabsRootProps) {
  return (
    <div
      className="flex space-x-px bg-slate-100 border-b border-slate-300 overflow-x-auto"
      style={{ maxWidth: `${maxWidth}px` }}
    >
      <div className="flex flex-nowrap whitespace-nowrap">{children}</div>
    </div>
  );
}
