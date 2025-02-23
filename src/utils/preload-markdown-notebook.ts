import type { NotebookFile } from "../types";
import { importNotebookFromMarkdown } from "./import-markdown-notebook";

export async function preloadMarkdownNotebooks(): Promise<NotebookFile[]> {
  const files = import.meta.glob("../../notebooks/*.md");

  const notebooks: NotebookFile[] = await Promise.all(
    Object.keys(files).map(async (key) => {
      const module = (await files[key]()) as { default: string };
      const response = await fetch(module.default);
      const blob = await response.blob();
      const file = new File([blob], key.replace("../../notebooks/", ""));

      return importNotebookFromMarkdown(file);
    })
  );

  return notebooks;
}
