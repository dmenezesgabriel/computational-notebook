import type { NotebookFile } from "../types";

export function encodeNotebookToURL(notebook: NotebookFile): string {
  const notebookString = JSON.stringify(notebook);
  const encodedNotebook = btoa(encodeURIComponent(notebookString));
  return `${window.location.origin}${
    window.location.pathname
  }?notebook=${encodedNotebook}`;
}
