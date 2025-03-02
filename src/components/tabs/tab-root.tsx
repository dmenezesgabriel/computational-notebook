import { ReactNode } from "react";

interface TabRootProps {
  children: ReactNode;
}

export function TabRoot({ children }: TabRootProps) {
  return (
    <div className="flex space-x-px bg-slate-100 border-b border-slate-300 overflow-x-auto">
      <div className="flex flex-nowrap whitespace-nowrap">{children}</div>
    </div>
  );
}
