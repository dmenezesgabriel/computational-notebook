import { useRef } from "react";
import { Cell, type CellData, type CellHandle } from "./notebook-cell";
import React from "react";
import { formatCode } from "../utils/code-formatting";
import { PlayCircle, Plus } from "lucide-react";

export interface NotebookContentProps {
  cells: CellData[];
  onCellsChange: (cells: CellData[]) => void;
}

export const NotebookContent: React.FC<NotebookContentProps> = ({
  cells,
  onCellsChange,
}) => {
  const updateCell = (id: number, changes: Partial<CellData>) => {
    const newCells = cells.map((cell) =>
      cell.id === id ? { ...cell, ...changes } : cell
    );
    onCellsChange(newCells);
  };

  const deleteCell = (id: number) => {
    const newCells = cells.filter((cell) => cell.id !== id);
    onCellsChange(newCells);
  };

  const addCell = () => {
    const newId = cells.length ? cells[cells.length - 1].id + 1 : 1;
    onCellsChange([
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
    onCellsChange(formattedCells);
  };

  return (
    <div>
      <div className="flex items-center mb-4">
        <div className="flex flex-row grow gap-2">
          <button
            onClick={runAllCells}
            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
          >
            <PlayCircle className="w-4 h-4 mr-1" />
            Run All Cells
          </button>
          <button
            onClick={formatAllCells}
            className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
          >
            <PlayCircle className="w-4 h-4 mr-1" />
            Format All Cells
          </button>
        </div>
        <button
          onClick={addCell}
          className="flex items-center bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Cell
        </button>
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
};
