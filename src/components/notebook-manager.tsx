import { useEffect, useState, useReducer, useCallback } from "react";
import { preloadMarkdownNotebooks } from "../utils/preload-markdown-notebook";
import { exportNotebookToMarkdown } from "../utils/export-notebook-markdown";
import { X, Copy, File } from "lucide-react";
import { NotebookContent } from "./notebook-content";
import { NotebookSidebar } from "./notebook-sidebar";
import { decodeNotebookFromURL, encodeNotebookToURL } from "../utils/notebook";
import type { CellData } from "../types";
import { notebooksReducer } from "../reducers/notebook/reducer";
import {
  addNotebookAction,
  deleteNotebookAction,
  setNotebooksAction,
  updateNotebookCellsAction,
  updateNotebookTitleAction,
} from "../reducers/notebook/actions";
import { produce } from "immer";

export function NotebooksManager() {
  const [notebooks, dispatch] = useReducer(notebooksReducer, []);
  const [openNotebookIds, setOpenNotebookIds] = useState<string[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const openNotebook = useCallback((id: string) => {
    setOpenNotebookIds((state) =>
      produce(state, (draft) => {
        if (!draft.includes(id)) {
          draft.push(id);
        }
      })
    );

    setActiveNotebookId(id);
  }, []);

  useEffect(() => {
    const loadNotebooks = async () => {
      const preloadedNotebooks = await preloadMarkdownNotebooks();
      dispatch(setNotebooksAction(preloadedNotebooks));

      const urlNotebook = decodeNotebookFromURL();
      if (urlNotebook) {
        dispatch(addNotebookAction(urlNotebook));
        openNotebook(urlNotebook.id);
      }
    };
    loadNotebooks();
  }, [openNotebook]);

  // Sidebar: Delete a notebook.
  const deleteNotebook = (id: string) => {
    dispatch(deleteNotebookAction(id));
    // Also remove from open tabs.
    setOpenNotebookIds(openNotebookIds.filter((nid) => nid !== id));
    if (activeNotebookId === id) {
      setActiveNotebookId(null);
    }
  };

  // Close a notebook tab.
  const closeNotebookTab = (id: string) => {
    setOpenNotebookIds(openNotebookIds.filter((nid) => nid !== id));
    if (activeNotebookId === id) {
      setActiveNotebookId(
        openNotebookIds.filter((nid) => nid !== id)[0] || null
      );
    }
  };

  // Update a notebook's cells when changes occur in the NotebookContent.
  const updateNotebookCells = (id: string, newCells: CellData[]) => {
    dispatch(updateNotebookCellsAction({ id, cells: newCells }));
  };

  // Update a notebook's title.
  const updateNotebookTitle = (id: string, newTitle: string) => {
    dispatch(updateNotebookTitleAction({ id, title: newTitle }));
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
      <NotebookSidebar
        notebooks={notebooks}
        activeNotebookId={activeNotebookId}
        isSidebarCollapsed={isSidebarCollapsed}
        onCreateNotebook={(notebook) => dispatch(addNotebookAction(notebook))}
        onDeleteNotebook={deleteNotebook}
        onOpenNotebook={openNotebook}
        onCollapseSidebar={setIsSidebarCollapsed}
      />

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
