import type { CellData, NotebookFile } from "../types";
import { v4 as uuidv4 } from "uuid";

export async function importNotebookFromMarkdown(
  file: File
): Promise<NotebookFile> {
  const text = await file.text();
  const lines = text.split("\n");
  const cells: CellData[] = [];
  let currentCell: CellData | null = null;

  lines.forEach((line) => {
    const match = line.match(/^<!-- (\d+) -->$/);
    if (match) {
      if (currentCell) {
        cells.push(currentCell);
      }
      currentCell = { id: parseInt(match[1]), code: "", language: "markdown" };
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

  const newId = uuidv4();
  return { id: newId, title: file.name.replace(".md", ""), cells };
}
