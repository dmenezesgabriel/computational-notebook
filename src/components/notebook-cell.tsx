import {
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
} from "react";

import { runCode, sharedContext } from "../utils/code-execution";
import { PlayCircle, Trash2, WrapText } from "lucide-react";
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
  const [isWordWrapEnabled, setIsWordWrapEnabled] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getIframeSharedContext = () => {
    const iframe = iframeRef.current;
    if (iframe) {
      const iframeWindow = iframe.contentWindow;
      if (iframeWindow) {
        iframeWindow.sharedContext = sharedContext;
      }
    }
  };

  const handleRun = async () => {
    if (cell.language === "markdown") {
      setOutput(cell.code);
    } else if (cell.language === "jsx" || cell.language === "tsx") {
      const result = await runCode(cell.code, cell.language);
      const iframe = iframeRef.current;
      if (iframe) {
        const document = iframe.contentDocument;
        if (document) {
          document.body.innerHTML = "";
          const rootDiv = document.createElement("div");
          rootDiv.setAttribute("id", "root");
          document.body.appendChild(rootDiv);
          const script = document.createElement("script");
          script.type = "module";
          script.textContent = result;
          document.body.appendChild(script);
          getIframeSharedContext();
        }
      }
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

  const toggleWordWrap = () => {
    setIsWordWrapEnabled(!isWordWrapEnabled);
  };

  useEffect(() => {
    // Update the iframe key to force re-render when the cell's code changes
    setIframeKey((prevKey) => prevKey + 1);
  }, [cell.code, cell.id]);

  return (
    <div className="bg-white border border-slate-300 rounded-md my-2 overflow-hidden max-w-full">
      <div className="bg-slate-100 px-3 py-2 flex items-center space-x-2 border-b border-slate-300">
        <select
          value={cell.language}
          onChange={handleLanguageChange}
          className="text-sm bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="jsx">JSX</option>
          <option value="tsx">TSX</option>
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
        <button
          onClick={toggleWordWrap}
          className="flex items-center justify-center text-slate-800 hover:bg-slate-300 p-1 rounded"
          title="Toggle Word Wrap"
        >
          <WrapText className="w-4 h-4" />
        </button>
      </div>
      <div className="px-4 py-2">
        <CodeEditor
          value={cell.code}
          language={cell.language}
          onChange={handleCodeChange}
          wordWrap={isWordWrapEnabled}
        />
      </div>
      {cell.language === "jsx" || cell.language === "tsx" ? (
        <iframe
          key={iframeKey}
          id={`jsx-iframe-${cell.id}`}
          title={`JSX Output ${cell.id}`}
          style={{ width: "100%", height: "300px", border: "none" }}
          ref={iframeRef}
        />
      ) : (
        output && (
          <div className="border-t border-slate-300 bg-slate-100 p-4 text-sm font-mono min-w-0 overflow-x-auto">
            <ReactMarkdown>{output}</ReactMarkdown>
          </div>
        )
      )}
    </div>
  );
}

export const Cell = forwardRef(NotebookCell);
