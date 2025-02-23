import { useEffect, useState, useRef } from "react";
import { X, Copy, File } from "lucide-react";
import { NotebookContent } from "./notebook-content";
import { Sidebar } from "./sidebar";
import { preloadMarkdownNotebooks } from "../utils/preload-markdown-notebook";
import { exportNotebookToMarkdown } from "../utils/export-notebook-markdown";
import { decodeNotebookFromURL } from "../utils/notebook";
import { useNotebooks } from "../contexts/notebooks-context";
import { encodeNotebookToURL } from "../utils/notebook";
import { Button } from "./button";

export function NotebooksManager() {
  const isInitialized = useRef(false);
  const {
    notebooks,
    openNotebookIds,
    activeNotebookId,
    activeNotebook,
    setActiveNotebookId,
    createNotebook,
    closeNotebookTab,
    updateNotebookTitle,
    openNotebook,
  } = useNotebooks();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [tabsMaxWidth, setTabsMaxWidth] = useState<number>(800);

  useEffect(() => {
    const loadNotebooks = async () => {
      if (!isInitialized.current) {
        const preloadedNotebooks = await preloadMarkdownNotebooks();
        preloadedNotebooks.forEach((notebook) => {
          createNotebook(notebook);
        });
      }

      const urlNotebook = decodeNotebookFromURL();
      if (urlNotebook) {
        createNotebook(urlNotebook);
        openNotebook(urlNotebook.id);
      }
    };

    loadNotebooks();
    isInitialized.current = true;
  }, [createNotebook, openNotebook]);

  useEffect(() => {
    const updateTabsMaxWidth = () => {
      const sidebarWidth = isSidebarCollapsed ? 64 : 256; // Adjust based on your sidebar's actual width
      const availableWidth = window.innerWidth - sidebarWidth;
      setTabsMaxWidth(availableWidth);
    };

    // Initial calculation
    updateTabsMaxWidth();

    // Update on window resize
    window.addEventListener("resize", updateTabsMaxWidth);

    return () => window.removeEventListener("resize", updateTabsMaxWidth);
  }, [isSidebarCollapsed]);

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
    <div className="flex h-screen bg-slate-100 max-w-full">
      <Sidebar
        isSidebarCollapsed={isSidebarCollapsed}
        onCollapseSidebar={setIsSidebarCollapsed}
      />

      {/* Main Content Area with Tabbed View */}
      <main className="flex-1 flex flex-col bg-white min-w-0">
        {/* Tabs Header */}
        <div
          className="flex space-x-px bg-slate-100 border-b border-slate-300 overflow-x-auto"
          style={{ maxWidth: `${tabsMaxWidth}px` }}
        >
          <div className="flex flex-nowrap whitespace-nowrap">
            {openNotebookIds.map((id) => {
              const nb = notebooks.find((n) => n.id === id);
              if (!nb) return null;
              return (
                <div
                  key={id}
                  onClick={() => setActiveNotebookId(id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm cursor-pointer ${
                    activeNotebookId === id
                      ? "bg-white text-slate-700 border-t-2 border-t-blue-500"
                      : "text-slate-500 hover:bg-slate-200"
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
                    className="text-slate-700 hover:bg-slate-300 p-1 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        {/* Active Notebook Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeNotebook ? (
            <>
              <div className="flex justify-end mb-4 space-x-2">
                <Button.Root onClick={handleShareNotebook}>
                  <Button.Icon icon={Copy} />
                  <Button.Text>Share Notebook</Button.Text>
                </Button.Root>
                <Button.Root variant="secondary" onClick={handleExportNotebook}>
                  <Button.Icon icon={File} />
                  <Button.Text>Export to Markdown</Button.Text>
                </Button.Root>
              </div>
              <NotebookContent key={activeNotebook.id} />
            </>
          ) : (
            <div className="text-center text-slate-500 mt-8">
              No notebook open. Select one from the sidebar.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
