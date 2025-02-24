import type { NotebookFile } from "../types";

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
