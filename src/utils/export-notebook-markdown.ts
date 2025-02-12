import type { CellData } from "../components/notebook-cell";

interface NotebookFile {
  id: number;
  title: string;
  cells: CellData[];
}

export function exportNotebookToMarkdown(notebook: NotebookFile): string {
  const markdownLines: string[] = [];

  notebook.cells.forEach((cell) => {
    markdownLines.push(`<!-- ${cell.id} -->`);
    if (cell.language === "markdown") {
      markdownLines.push(cell.code);
    } else {
      const lang = cell.language === "typescript" ? "ts" : "js";
      markdownLines.push(`\`\`\`${lang}`);
      markdownLines.push(cell.code);
      markdownLines.push(`\`\`\``);
    }
  });

  return markdownLines.join("\n");
}
