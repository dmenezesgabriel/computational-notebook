import { Toolbar } from "./toolbar";
import { FileExplorer } from "./file-explorer";

interface NotebookSidebarProps {
  isSidebarCollapsed: boolean;
}

export function Sidebar({ isSidebarCollapsed }: NotebookSidebarProps) {
  return (
    <aside
      className={`${
        isSidebarCollapsed ? "w-0 hidden" : "w-64"
      } bg-slate-100 border-r border-slate-300 overflow-y-auto transition-width duration-300`}
    >
      {!isSidebarCollapsed && (
        <>
          <Toolbar />
          {/* divider */}
          <div className="border-t border-slate-300 my-2 mx-2" />
          <FileExplorer />
        </>
      )}
    </aside>
  );
}
