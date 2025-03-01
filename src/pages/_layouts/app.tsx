import { useState, type ReactNode } from "react";
import { Header } from "../../components/header";
import { Sidebar } from "../../components/sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  function handleMenuClick() {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  }

  return (
    <div>
      <Header onToggleMenuClick={handleMenuClick} />
      <div className="flex h-screen bg-slate-100 max-w-full">
        <Sidebar isSidebarCollapsed={isSidebarCollapsed} />

        <div className="flex-1 flex flex-col bg-white min-w-0">{children}</div>
      </div>
    </div>
  );
}
