import React, { useEffect, useState, useReducer } from "react";
import { preloadMarkdownNotebooks } from "../utils/preload-markdown-notebook";
import { exportNotebookToMarkdown } from "../utils/export-notebook-markdown";
import { importNotebookFromMarkdown } from "../utils/import-markdown-notebook";
import { Plus, Trash2, X, Copy, File } from "lucide-react";
import { NotebookContent } from "./notebook-content";
import { decodeNotebookFromURL, encodeNotebookToURL } from "../utils/notebook";
import type { CellData, NotebookFile } from "../types";
import {
  NotebookActions,
  notebooksReducer,
} from "../reducers/notebook/reducer";

export function NotebooksManager() {
  // State for all saved notebooks.
  const [notebooks, dispatch] = useReducer(notebooksReducer, []);
  // State for open notebook IDs (the ones shown in tabs).
  const [openNotebookIds, setOpenNotebookIds] = useState<number[]>([]);
  // The currently active notebook (by id).
  const [activeNotebookId, setActiveNotebookId] = useState<number | null>(null);
  // State for sidebar collapse.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const loadNotebooks = async () => {
      const preloadedNotebooks = await preloadMarkdownNotebooks();
      dispatch({
        type: NotebookActions.SET_NOTEBOOKS,
        payload: preloadedNotebooks,
      });

      // Check for notebook data in URL
      const urlNotebook = decodeNotebookFromURL();
      if (urlNotebook) {
        dispatch({ type: NotebookActions.ADD_NOTEBOOK, payload: urlNotebook });
        openNotebook(urlNotebook.id);
      }
    };
    loadNotebooks();
  }, []);

  // Sidebar: Create new notebook.
  const createNotebook = () => {
    const newId = notebooks.length ? notebooks[notebooks.length - 1].id + 1 : 1;
    const newNotebook: NotebookFile = {
      id: newId,
      title: `Notebook ${newId}`,
      cells: [
        {
          id: 1,
          code: "// New notebook cell",
          language: "javascript",
        },
      ],
    };
    dispatch({ type: NotebookActions.ADD_NOTEBOOK, payload: newNotebook });
  };

  // Sidebar: Delete a notebook.
  const deleteNotebook = (id: number) => {
    dispatch({ type: NotebookActions.DELETE_NOTEBOOK, payload: id });
    // Also remove from open tabs.
    setOpenNotebookIds(openNotebookIds.filter((nid) => nid !== id));
    if (activeNotebookId === id) {
      setActiveNotebookId(null);
    }
  };

  // Open a notebook in the tab view.
  const openNotebook = (id: number) => {
    if (!openNotebookIds.includes(id)) {
      setOpenNotebookIds([...openNotebookIds, id]);
    }
    setActiveNotebookId(id);
  };

  // Close a notebook tab.
  const closeNotebookTab = (id: number) => {
    setOpenNotebookIds(openNotebookIds.filter((nid) => nid !== id));
    if (activeNotebookId === id) {
      setActiveNotebookId(
        openNotebookIds.filter((nid) => nid !== id)[0] || null
      );
    }
  };

  // Update a notebook's cells when changes occur in the NotebookContent.
  const updateNotebookCells = (id: number, newCells: CellData[]) => {
    dispatch({
      type: NotebookActions.UPDATE_NOTEBOOK,
      payload: { id: id, cells: newCells },
    });
  };

  // Update a notebook's title.
  const updateNotebookTitle = (id: number, newTitle: string) => {
    dispatch({
      type: NotebookActions.UPDATE_NOTEBOOK,
      payload: { id: id, title: newTitle },
    });
  };

  // Get the active notebook.
  const activeNotebook = notebooks.find((nb) => nb.id === activeNotebookId);

  // Function to handle exporting the active notebook
  const handleExportNotebook = () => {
    if (activeNotebook) {
      const markdownContent = exportNotebookToMarkdown(activeNotebook);
      const blob = new Blob([markdownContent], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeNotebook.title}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Function to handle importing a notebook
  const handleImportNotebook = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const notebook = await importNotebookFromMarkdown(file);
      dispatch({ type: NotebookActions.ADD_NOTEBOOK, payload: notebook });
      openNotebook(notebook.id);
    }
  };

  const handleShareNotebook = () => {
    if (activeNotebook) {
      const shareableURL = encodeNotebookToURL(activeNotebook);
      navigator.clipboard
        .writeText(shareableURL)
        .then(() => {
          alert("Notebook URL copied to clipboard!");
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
        });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar File Explorer */}
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
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-gray-700 hover:bg-gray-300 p-1 rounded"
          >
            {isSidebarCollapsed ? ">" : "<"}
          </button>
        </div>
        {!isSidebarCollapsed && (
          <>
            <div className="p-4">
              <button
                onClick={createNotebook}
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

      {/* Main Content Area with Tabbed View */}
      <main className="flex-1 flex flex-col bg-white">
        {/* Tabs Header */}
        <div className="flex space-x-px bg-gray-100 border-b border-gray-300">
          {openNotebookIds.map((id) => {
            const nb = notebooks.find((n) => n.id === id);
            if (!nb) return null;
            return (
              <div
                key={id}
                onClick={() => setActiveNotebookId(id)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm cursor-pointer ${
                  activeNotebookId === id
                    ? "bg-white text-gray-700 border-t-2 border-t-blue-500"
                    : "text-gray-500 hover:bg-gray-200"
                }`}
              >
                <input
                  type="text"
                  value={nb.title}
                  onChange={(e) => updateNotebookTitle(id, e.target.value)}
                  className="bg-transparent border-none focus:outline-none"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeNotebookTab(id);
                  }}
                  className="text-gray-700 hover:bg-gray-300 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
        {/* Active Notebook Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeNotebook ? (
            <>
              <div className="flex justify-end mb-4 space-x-2">
                <button
                  onClick={handleShareNotebook}
                  className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Share Notebook
                </button>
                <button
                  onClick={handleExportNotebook}
                  className="flex items-center bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                >
                  <File className="w-4 h-4 mr-1" />
                  Export to Markdown
                </button>
              </div>
              <NotebookContent
                key={activeNotebook.id}
                cells={activeNotebook.cells}
                onCellsChange={(newCells) =>
                  updateNotebookCells(activeNotebook.id, newCells)
                }
              />
            </>
          ) : (
            <div className="text-center text-gray-500 mt-8">
              No notebook open. Select one from the sidebar.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
