import { Toolbar } from "./toolbar";
import { FileExplorer } from "./file-explorer";
import { cn } from "../lib/utils";

interface NotebookSidebarProps {
  isSidebarCollapsed: boolean;
}

export function Sidebar({ isSidebarCollapsed }: NotebookSidebarProps) {
  return (
    <aside
      className={cn(
        isSidebarCollapsed ? "w-0 hidden" : "w-64 absolute w-full h-full z-10",
        "bg-slate-100 border-r border-slate-300 overflow-y-auto transition-width duration-300 md:relative md:w-64 md:h-auto md:z-0"
      )}
    >
      {!isSidebarCollapsed && (
        <>
          <Toolbar />
          <div className="border-t border-slate-300 my-2 mx-2" />
          <FileExplorer />
        </>
      )}
    </aside>
  );
}
