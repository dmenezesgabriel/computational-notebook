import { useState, useImperativeHandle, forwardRef, useCallback } from "react";

import { runCode } from "../utils/code-execution";
import { PlayCircle, Trash2 } from "lucide-react";
import { CodeEditor } from "./code-editor";
import ReactMarkdown from "react-markdown";
import type { CellData, CellHandle, EditorLanguages } from "../types";

interface NotebookCellProps {
  cell: CellData;
  onChange: (id: number, changes: Partial<CellData>) => void;
  onDelete: (id: number) => void;
}

function NotebookCell(
  { cell, onChange, onDelete }: NotebookCellProps,
  ref: React.Ref<CellHandle>
) {
  const [output, setOutput] = useState<string>("");

  const handleRun = async () => {
    if (cell.language === "markdown") {
      setOutput(cell.code);
    } else {
      const result = await runCode(cell.code, cell.language);
      setOutput(result);
    }
  };

  // Expose the runCell function to parent via ref.
  useImperativeHandle(ref, () => ({
    runCell: handleRun,
  }));

  const handleCodeChange = useCallback(
    (newValue: string) => {
      onChange(cell.id, { code: newValue });
    },
    [cell.id, onChange]
  );

  const handleLanguageChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(cell.id, {
        language: event.target.value as EditorLanguages,
      });
    },
    [cell.id, onChange]
  );

  const handleDelete = () => {
    onDelete(cell.id);
  };

  return (
    <div className="bg-white border border-slate-300 rounded-md my-2 overflow-hidden">
      <div className="bg-slate-100 px-3 py-2 flex items-center space-x-2 border-b border-slate-300">
        <select
          value={cell.language}
          onChange={handleLanguageChange}
          className="text-sm bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="markdown">Markdown</option>
        </select>
        <button
          onClick={handleRun}
          className="flex items-center justify-center text-slate-800 hover:bg-slate-300 p-1 rounded"
          title="Run Cell"
        >
          <PlayCircle className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center justify-center text-slate-800 hover:bg-slate-300 p-1 rounded"
          title="Delete Cell"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="px-4 py-2">
        <CodeEditor
          value={cell.code}
          language={cell.language}
          onChange={handleCodeChange}
        />
      </div>
      {output && (
        <div className="border-t border-slate-300 bg-slate-100 p-4 text-sm font-mono">
          <ReactMarkdown>{output}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export const Cell = forwardRef(NotebookCell);
