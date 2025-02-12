import type { CellData } from "../components/notebook-cell";

interface NotebookFile {
  id: number;
  title: string;
  cells: CellData[];
}

export async function preloadMarkdownNotebooks(): Promise<NotebookFile[]> {
  const files = import.meta.glob("../../notebooks/*.md");
  const notebooks: NotebookFile[] = await Promise.all(
    Object.keys(files).map(async (key) => {
      const module = await files[key]();
      const response = await fetch(module.default);
      const text = await response.text();
      const lines = text.split("\n");
      const cells: CellData[] = [];
      let currentCell: CellData | null = null;

      lines.forEach((line) => {
        const match = line.match(/^<!-- (\d+) -->$/);
        if (match) {
          if (currentCell) {
            cells.push(currentCell);
          }
          currentCell = {
            id: parseInt(match[1]),
            code: "",
            language: "markdown",
          };
        } else if (currentCell) {
          if (line.startsWith("```")) {
            const lang = line.slice(3).trim();
            currentCell.language = lang === "ts" ? "typescript" : "javascript";
          } else if (line === "```") {
            cells.push(currentCell);
            currentCell = null;
          } else {
            currentCell.code += line + "\n";
          }
        } else if (line.trim() !== "") {
          currentCell = { id: Date.now(), code: line, language: "markdown" };
        }
      });

      if (currentCell) {
        cells.push(currentCell);
      }

      const newId = Date.now();
      return {
        id: newId,
        title: key.replace("../../notebooks/", "").replace(".md", ""),
        cells,
      };
    })
  );
  return notebooks;
}
