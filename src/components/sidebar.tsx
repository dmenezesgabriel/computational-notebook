import { Toolbar } from "./toolbar";
import { FileExplorer } from "./file-explorer";

interface NotebookSidebarProps {
  isSidebarCollapsed: boolean;
  onCollapseSidebar: (collapsed: boolean) => void;
}

export function Sidebar({
  isSidebarCollapsed,
  onCollapseSidebar,
}: NotebookSidebarProps) {
  return (
    <aside
      className={`${
        isSidebarCollapsed ? "w-16" : "w-64"
      } bg-gray-100 border-r border-gray-300 overflow-y-auto transition-width duration-300`}
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-300">
        <h2 className="text-sm font-semibold text-gray-700">
          {isSidebarCollapsed ? "NB" : "NOTEBOOKS"}
        </h2>
        <button
          onClick={() => onCollapseSidebar(!isSidebarCollapsed)}
          className="text-gray-700 hover:bg-gray-300 p-1 rounded"
        >
          {isSidebarCollapsed ? ">" : "<"}
        </button>
      </div>
      {!isSidebarCollapsed && (
        <>
          <Toolbar />
          <FileExplorer />
        </>
      )}
    </aside>
  );
}
