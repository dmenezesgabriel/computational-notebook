import { useEffect, useRef } from "react";
import { Copy, File } from "lucide-react";
import { NotebookContent } from "../components/notebook-content";
import { NotebookTabs } from "../components/notebook-tabs";
import { preloadMarkdownNotebooks } from "../utils/preload-markdown-notebook";
import { exportNotebookToMarkdown } from "../utils/export-notebook-markdown";
import { decodeNotebookFromURL } from "../utils/decode-notebook-url";
import { useNotebooks } from "../contexts/notebooks-context";
import { encodeNotebookToURL } from "../utils/encode-notebook-url";
import { Button } from "../components/button";

export function NotebooksManager() {
  const isInitialized = useRef(false);
  const { activeNotebook, createNotebook, openNotebook } = useNotebooks();

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
    <>
      <NotebookTabs />
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
    </>
  );
}
