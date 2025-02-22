import type { NotebookFile } from "../types";

export function encodeNotebookToURL(notebook: NotebookFile): string {
  const notebookString = JSON.stringify(notebook);
  const encodedNotebook = btoa(encodeURIComponent(notebookString));
  return `${window.location.origin}${
    window.location.pathname
  }?notebook=${encodedNotebook}`;
}

// Function to decode notebook data from URL
export function decodeNotebookFromURL(): NotebookFile | null {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedNotebook = urlParams.get("notebook");
  if (encodedNotebook) {
    try {
      const decodedNotebookString = decodeURIComponent(atob(encodedNotebook));
      const notebook = JSON.parse(decodedNotebookString);
      return notebook;
    } catch (error) {
      console.error("Error decoding notebook from URL:", error);
      return null;
    }
  }
  return null;
}
