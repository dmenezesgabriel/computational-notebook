import { ReactNode } from "react";

interface TabsRootProps {
  children: ReactNode;
}

export function TabsRoot({ children }: TabsRootProps) {
  return (
    <div className="flex space-x-px bg-slate-100 border-b border-slate-300 overflow-x-auto">
      <div className="flex flex-nowrap whitespace-nowrap">{children}</div>
    </div>
  );
}
