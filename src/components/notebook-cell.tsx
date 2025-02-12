import { useState, useImperativeHandle, forwardRef } from "react";

import { runCode } from "../utils/code-execution";
import { PlayCircle, Trash2 } from "lucide-react";
import { CodeEditor } from "./code-editor";
import ReactMarkdown from "react-markdown";

export interface CellData {
  id: number;
  code: string;
  language: "javascript" | "typescript" | "markdown";
}

// ----------------------
// CellHandle interface to expose a runCell method.
export interface CellHandle {
  runCell: () => Promise<void>;
}

// ----------------------
// A single notebook cell. It shows a CodeMirror editor (our CodeEditor component),
// a language selector, a run button, and an output area.
export const Cell = forwardRef<
  CellHandle,
  {
    cell: CellData;
    onChange: (id: number, changes: Partial<CellData>) => void;
    onDelete: (id: number) => void;
  }
>(({ cell, onChange, onDelete }, ref) => {
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

  const handleCodeChange = (newValue: string) => {
    onChange(cell.id, { code: newValue });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(cell.id, {
      language: e.target.value as "javascript" | "typescript" | "markdown",
    });
  };

  const handleDelete = () => {
    onDelete(cell.id);
  };

  return (
    <div className="bg-white border border-gray-300 rounded-md my-2 overflow-hidden">
      <div className="bg-gray-100 px-3 py-2 flex items-center space-x-2 border-b border-gray-300">
        <select
          value={cell.language}
          onChange={handleLanguageChange}
          className="text-sm bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="markdown">Markdown</option>
        </select>
        <button
          onClick={handleRun}
          className="flex items-center justify-center text-gray-800 hover:bg-gray-300 p-1 rounded"
          title="Run Cell"
        >
          <PlayCircle className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center justify-center text-gray-800 hover:bg-gray-300 p-1 rounded"
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
        <div className="border-t border-gray-300 bg-gray-100 p-4 text-sm font-mono">
          <ReactMarkdown>{output}</ReactMarkdown>
        </div>
      )}
    </div>
  );
});
