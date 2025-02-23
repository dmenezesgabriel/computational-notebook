import { useRef } from "react";
import { Cell } from "./notebook-cell";
import React from "react";
import { formatCode } from "../utils/code-formatting";
import { PlayCircle, Plus } from "lucide-react";
import type { CellData, CellHandle } from "../types";
import { useNotebooks } from "../contexts/notebooks-context";
import { Button } from "./button";

export function NotebookContent() {
  const { activeNotebook, updateNotebookCells } = useNotebooks();
  const cells = activeNotebook?.cells || [];

  const updateCell = (id: number, changes: Partial<CellData>) => {
    if (!activeNotebook) return;
    const newCells = cells.map((cell) =>
      cell.id === id ? { ...cell, ...changes } : cell
    );
    updateNotebookCells(activeNotebook.id, newCells);
  };

  const deleteCell = (id: number) => {
    if (!activeNotebook) return;
    const newCells = cells.filter((cell) => cell.id !== id);
    updateNotebookCells(activeNotebook.id, newCells);
  };

  const addCell = () => {
    if (!activeNotebook) return;
    const newId = cells.length ? cells[cells.length - 1].id + 1 : 1;
    updateNotebookCells(activeNotebook.id, [
      ...cells,
      { id: newId, code: "// New cell", language: "javascript" },
    ]);
  };

  // Create fresh refs by using a key (since cell ids may repeat across notebooks)
  const cellRefs = useRef<Map<number, React.RefObject<CellHandle>>>(new Map());

  cells.forEach((cell) => {
    if (!cellRefs.current.has(cell.id)) {
      cellRefs.current.set(cell.id, React.createRef<CellHandle>());
    }
  });

  const runAllCells = async () => {
    for (const cell of cells) {
      const ref = cellRefs.current.get(cell.id);
      if (ref && ref.current) {
        await ref.current.runCell();
      }
    }
  };

  const formatAllCells = async () => {
    if (!activeNotebook) return;
    const formattedCells = await Promise.all(
      cells.map(async (cell) => {
        if (cell.language === "markdown") {
          return cell;
        }
        try {
          const formattedCode = await formatCode(cell.code, cell.language);
          return { ...cell, code: formattedCode };
        } catch (error) {
          console.error(`Error formatting cell ${cell.id}:`, error);
          return cell;
        }
      })
    );
    updateNotebookCells(activeNotebook.id, formattedCells);
  };

  return (
    <div>
      <div className="flex items-center mb-4">
        <div className="flex flex-row grow gap-2">
          <Button.Root onClick={runAllCells}>
            <Button.Icon icon={PlayCircle} />
            <Button.Text>Run All Cells</Button.Text>
          </Button.Root>
          <Button.Root variant="warning" onClick={formatAllCells}>
            <Button.Icon icon={PlayCircle} />
            <Button.Text>Format All Cells</Button.Text>
          </Button.Root>
        </div>
        <Button.Root variant="secondary" onClick={addCell}>
          <Button.Icon icon={Plus} />
          <Button.Text>Add Cell</Button.Text>
        </Button.Root>
      </div>
      {cells.map((cell) => (
        <Cell
          key={cell.id}
          cell={cell}
          onChange={updateCell}
          onDelete={deleteCell}
          ref={cellRefs.current.get(cell.id)}
        />
      ))}
    </div>
  );
}
