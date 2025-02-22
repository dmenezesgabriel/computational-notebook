import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { importNotebookFromMarkdown } from "../utils/import-markdown-notebook";
import { useNotebook } from "../contexts/notebook-context";

interface NotebookSidebarProps {
  isSidebarCollapsed: boolean;
  onCollapseSidebar: (collapsed: boolean) => void;
}

export function NotebookSidebar({
  isSidebarCollapsed,
  onCollapseSidebar,
}: NotebookSidebarProps) {
  const {
    notebooks,
    activeNotebookId,
    createNotebook,
    deleteNotebook,
    openNotebook,
  } = useNotebook();

  const handleCreateNotebook = () => {
    const newId = uuidv4();
    console.log("Creating new notebook with id: ", newId);
    const newNotebook = {
      id: newId,
      title: `Notebook ${newId}`,
      cells: [
        {
          id: 1,
          code: "// New notebook cell",
          language: "javascript" as const,
        },
      ],
    };
    createNotebook(newNotebook);
  };

  const handleImportNotebook = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const notebook = await importNotebookFromMarkdown(file);
      createNotebook(notebook);
      openNotebook(notebook.id);
    }
  };

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
          <div className="p-4">
            <button
              onClick={handleCreateNotebook}
              className="flex items-center w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Notebook
            </button>
            <div className="mt-2">
              <label
                htmlFor="import-notebook"
                className="flex items-center w-full px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1" />
                Import Notebook
              </label>
              <input
                id="import-notebook"
                type="file"
                accept=".md"
                onChange={handleImportNotebook}
                className="hidden"
              />
            </div>
          </div>
          <ul className="px-2">
            {notebooks.map((nb) => (
              <li
                key={nb.id}
                className={`px-2 py-1 rounded text-sm hover:bg-gray-300 cursor-pointer ${
                  activeNotebookId === nb.id ? "bg-gray-200" : ""
                }`}
                onClick={() => openNotebook(nb.id)}
              >
                <div className="group flex justify-between items-center">
                  <span className="text-gray-700">{nb.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotebook(nb.id);
                    }}
                    className="text-gray-700 hover:text-red-600 p-1 rounded opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
