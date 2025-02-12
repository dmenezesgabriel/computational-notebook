import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import * as ts from "typescript";
import prettier from "prettier/standalone";
import * as parserBabel from "prettier/parser-babel";
import * as parserTypescript from "prettier/parser-typescript";
import * as prettierPluginEstree from "prettier/plugins/estree";
import "./index.css";

// --- CodeMirror imports ---
import { EditorState, Compartment } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";

// --- lucide-react icons ---
import { Plus, Trash2, X, PlayCircle } from "lucide-react";

// --- tiptap imports ---
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

// ------------------------------------
// This file contains a complete example of a simple notebook application
// built using React and CodeMirror. It allows creating, editing, and running
// JavaScript and TypeScript code cells. The code cells are executed in an
// isolated environment using a sandboxed iframe.

// ----------------------
// Execute JavaScript code in a sandboxed iframe.
// This function creates an iframe, injects the provided code into it, and
// captures the console output and errors.
async function runInSandbox(code: string): Promise<string> {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const consoleLog = console.log;
  const consoleError = console.error;
  const consoleWarn = console.warn;

  const logs: string[] = [];
  console.log = (...args: any[]) => {
    logs.push(
      args.map((a) => (typeof a === "object" ? JSON.stringify(a) : a)).join(" ")
    );
  };
  console.error = (...args: any[]) => {
    logs.push(
      `ERROR: ${args.map((a) => (typeof a === "object" ? JSON.stringify(a) : a)).join(" ")}`
    );
  };
  console.warn = (...args: any[]) => {
    logs.push(
      `WARNING: ${args.map((a) => (typeof a === "object" ? JSON.stringify(a) : a)).join(" ")}`
    );
  };

  try {
    iframe.contentWindow?.eval(code);
  } catch (error: any) {
    logs.push(`ERROR: ${error.message}`);
  } finally {
    console.log = consoleLog;
    console.error = consoleError;
    console.warn = consoleWarn;
    iframe.remove();
  }

  return logs.join("\n");
}

// ----------------------
// Execute TypeScript code using the TypeScript compiler.
// This function transpiles the TypeScript code to JavaScript using the TypeScript compiler,
// then executes it in a sandboxed iframe.
async function runTypeScript(code: string): Promise<string> {
  const transpiledCode = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.None,
      target: ts.ScriptTarget.ESNext,
    },
  }).outputText;
  return runInSandbox(transpiledCode);
}

// ----------------------
// Execute the provided code (JavaScript or TypeScript) in a sandboxed iframe.
// The language parameter specifies the language of the code.
// Helper: Returns true if a line appears to be a declaration rather than an expression.
function isDeclaration(line: string): boolean {
  return /^\s*(const|let|var|function|class)\s+/.test(line);
}

// ----------------------
// Transforms user code to automatically return the value of the last expression,
// similar to a Jupyter Notebook.
// It separates top-level import statements from the rest and, if the last non-import line
// is an expression (and not a declaration, a call to display, or a lone closing brace),
// wraps it in an IIFE that returns its value.
function transformUserCode(code: string): string {
  const lines = code.split("\n");

  // Separate import lines from non-import lines.
  const importLines: string[] = [];
  const nonImportLines: string[] = [];
  for (const line of lines) {
    if (/^\s*import\s+/.test(line)) {
      importLines.push(line);
    } else {
      nonImportLines.push(line);
    }
  }

  // Remove trailing blank lines.
  while (
    nonImportLines.length > 0 &&
    nonImportLines[nonImportLines.length - 1].trim() === ""
  ) {
    nonImportLines.pop();
  }

  // If there is no non-import code, return the original code.
  if (nonImportLines.length === 0) {
    return code;
  }

  // Check the last non-empty line.
  let lastLine = nonImportLines[nonImportLines.length - 1].trim();

  // If the last line starts with "display(", assume the user is handling output.
  if (lastLine.startsWith("display(")) {
    return code;
  }

  // If the last line is a declaration, don’t wrap it.
  if (isDeclaration(lastLine)) {
    return code;
  }

  // If the last line starts with a closing brace (or is just "}") then do not wrap it.
  if (lastLine.startsWith("}")) {
    return code;
  }

  // Remove a trailing semicolon from the last line if present.
  if (lastLine.endsWith(";")) {
    lastLine = lastLine.slice(0, -1);
  }

  // Otherwise, treat the last line as an expression:
  // Remove it from the non-import code.
  const bodyLines = nonImportLines.slice(0, nonImportLines.length - 1);
  // Create an IIFE that runs the previous code and returns the value of the last expression.
  const bodyCode = bodyLines.join("\n") + "\n" + "return (" + lastLine + ");\n";

  // Reassemble the transformed code:
  return `${importLines.join("\n")}
export default (function(){
${bodyCode}
})();
`;
}

// ----------------------
// Executes the provided code (JavaScript or TypeScript). If the code does
// not explicitly call display(), and if the last non-declaration expression has a value,
// that value is passed to the display function.
// The code is imported dynamically as an ES module via a Blob URL. If the language is
// TypeScript, it is transpiled first.
async function runCode(code: string, language: string): Promise<string> {
  let output = "";
  const logs: string[] = [];

  // Custom display function that collects output.
  const display = (...args: any[]) => {
    const message = args
      .map((a) => (typeof a === "object" ? JSON.stringify(a) : a))
      .join(" ");
    logs.push(message);
    console.log(...args);
  };

  // Expose display globally so that user code can call it.
  (window as any).display = display;

  try {
    // Optionally transform the code to capture the last expression's value.
    const trimmedCode = code.trim();
    const lastLine = trimmedCode.split("\n").pop()?.trim();
    let finalCode = code;
    if (lastLine && !lastLine.startsWith("display(")) {
      finalCode = transformUserCode(code);
    }

    let transpiledCode = finalCode;
    if (language === "typescript") {
      // Transpile TypeScript to ES module code.
      const result = ts.transpileModule(finalCode, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext, // output as ES module
          target: ts.ScriptTarget.ES2015,
        },
      });
      transpiledCode = result.outputText;
    }

    // Create a Blob URL for the code.
    const blob = new Blob([transpiledCode], { type: "text/javascript" });
    const moduleUrl = URL.createObjectURL(blob);

    try {
      // Dynamically import the module.
      const module = await import(/* @vite-ignore */ moduleUrl);

      // Expose every export from the cell globally (for cross-cell usage).
      Object.keys(module).forEach((exportKey) => {
        (window as any)[exportKey] = module[exportKey];
      });

      // If the default export (the auto-return value) is not undefined, display it.
      if (module.default !== undefined) {
        display(module.default);
      }
    } finally {
      // Clean up the Blob URL.
      URL.revokeObjectURL(moduleUrl);
    }
  } catch (error: any) {
    console.error("Error executing code:", error);
    logs.push(`Error: ${error.message}`);
  } finally {
    // Remove the global display function.
    delete (window as any).display;
  }

  output = logs.length ? logs.join("\n") : "Code executed successfully.";
  return output;
}

// ----------------------
// Format code using Prettier
async function formatCode(code: string, language: string): Promise<string> {
  const parser = language === "typescript" ? "typescript" : "babel";
  const plugins = [parserTypescript, parserBabel, prettierPluginEstree];
  return prettier.format(code, { parser, plugins });
}

// ----------------------
// CodeMirror Editor component
interface CodeEditorProps {
  value: string;
  language: "javascript" | "typescript";
  onChange: (value: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  language,
  onChange,
}) => {
  const editorDivRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView>();
  // Create a compartment for the language extension.
  const languageCompartment = useRef(new Compartment());

  useEffect(() => {
    if (editorDivRef.current) {
      // Create an EditorState with initial doc and extensions.
      const startState = EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          oneDark,
          languageCompartment.current.of(
            language === "javascript"
              ? javascript()
              : javascript({ typescript: true })
          ),
          // Update listener to propagate changes.
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const text = update.state.doc.toString();
              onChange(text);
            }
          }),
        ],
      });
      // Create the EditorView.
      const view = new EditorView({
        state: startState,
        parent: editorDivRef.current,
      });
      editorViewRef.current = view;

      return () => {
        view.destroy();
      };
    }
  }, []); // initialize once on mount

  // Update editor content if the external value changes.
  useEffect(() => {
    const view = editorViewRef.current;
    if (view) {
      const currentValue = view.state.doc.toString();
      if (currentValue !== value) {
        view.dispatch({
          changes: { from: 0, to: currentValue.length, insert: value },
        });
      }
    }
  }, [value]);

  // Update language if it changes using the compartment.
  useEffect(() => {
    const view = editorViewRef.current;
    if (view) {
      const newExtension =
        language === "javascript"
          ? javascript()
          : javascript({ typescript: true });
      view.dispatch({
        effects: languageCompartment.current.reconfigure(newExtension),
      });
    }
  }, [language]);

  return (
    <div ref={editorDivRef} className="rounded-md border border-gray-300" />
  );
};

// ----------------------
// MarkdownEditor component using tiptap
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return <EditorContent editor={editor} />;
};

// ----------------------
// Notebook cell data interface.
interface CellData {
  id: number;
  code: string;
  language: "javascript" | "typescript" | "markdown";
}

// ----------------------
// CellHandle interface to expose a runCell method.
interface CellHandle {
  runCell: () => Promise<void>;
}

// ----------------------
// A single notebook cell. It shows a CodeMirror editor (our CodeEditor component),
// a language selector, a run button, and an output area.
const Cell = forwardRef<
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
    <div className="bg-white shadow rounded p-4 my-4">
      <div className="mb-2 flex items-center space-x-2">
        <select
          value={cell.language}
          onChange={handleLanguageChange}
          className="border border-gray-300 rounded px-2 py-1"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="markdown">Markdown</option>
        </select>
        <button
          onClick={handleRun}
          className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
        >
          <PlayCircle className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {cell.language === "markdown" ? (
        <MarkdownEditor value={cell.code} onChange={handleCodeChange} />
      ) : (
        <CodeEditor
          value={cell.code}
          language={cell.language}
          onChange={handleCodeChange}
        />
      )}
      {output && (
        <pre className="mt-3 bg-gray-100 p-3 rounded whitespace-pre-wrap text-sm">
          {output}
        </pre>
      )}
    </div>
  );
});

// ----------------------
// NotebookContent: A controlled notebook view (list of cells) with "Run All" and "Add Cell" controls.
interface NotebookContentProps {
  cells: CellData[];
  onCellsChange: (cells: CellData[]) => void;
}

const NotebookContent: React.FC<NotebookContentProps> = ({
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

// ----------------------
// NotebookFile interface representing a saved notebook.
interface NotebookFile {
  id: number;
  title: string;
  cells: CellData[];
}

// ----------------------
// NotebooksManager: The top-level component that provides a sidebar file explorer
// and a tabbed view for open notebooks.
const NotebooksManager: React.FC = () => {
  // State for all saved notebooks.
  const [notebooks, setNotebooks] = useState<NotebookFile[]>([
    {
      id: 1,
      title: "Example Notebook",
      cells: [
        {
          id: 1,
          code: `// JavaScript cell example:
const a = 3;
a + 2;`,
          language: "javascript",
        },
        {
          id: 2,
          code: `// TypeScript cell example:
import * as math from "https://cdn.jsdelivr.net/npm/mathjs@12.3.0/+esm";

const b: number = math.sqrt(16);
b;`,
          language: "typescript",
        },
      ],
    },
  ]);
  // State for open notebook IDs (the ones shown in tabs).
  const [openNotebookIds, setOpenNotebookIds] = useState<number[]>([]);
  // The currently active notebook (by id).
  const [activeNotebookId, setActiveNotebookId] = useState<number | null>(null);

  // Sidebar: Create new notebook.
  const createNotebook = () => {
    const newId = notebooks.length ? notebooks[notebooks.length - 1].id + 1 : 1;
    const newNotebook: NotebookFile = {
      id: newId,
      title: `Notebook ${newId}`,
      cells: [
        {
          id: 1,
          code: "// New notebook cell",
          language: "javascript",
        },
      ],
    };
    setNotebooks([...notebooks, newNotebook]);
  };

  // Sidebar: Delete a notebook.
  const deleteNotebook = (id: number) => {
    setNotebooks(notebooks.filter((nb) => nb.id !== id));
    // Also remove from open tabs.
    setOpenNotebookIds(openNotebookIds.filter((nid) => nid !== id));
    if (activeNotebookId === id) {
      setActiveNotebookId(null);
    }
  };

  // Open a notebook in the tab view.
  const openNotebook = (id: number) => {
    if (!openNotebookIds.includes(id)) {
      setOpenNotebookIds([...openNotebookIds, id]);
    }
    setActiveNotebookId(id);
  };

  // Close a notebook tab.
  const closeNotebookTab = (id: number) => {
    setOpenNotebookIds(openNotebookIds.filter((nid) => nid !== id));
    if (activeNotebookId === id) {
      setActiveNotebookId(
        openNotebookIds.filter((nid) => nid !== id)[0] || null
      );
    }
  };

  // Update a notebook's cells when changes occur in the NotebookContent.
  const updateNotebookCells = (id: number, newCells: CellData[]) => {
    setNotebooks(
      notebooks.map((nb) => (nb.id === id ? { ...nb, cells: newCells } : nb))
    );
  };

  // Update a notebook's title.
  const updateNotebookTitle = (id: number, newTitle: string) => {
    setNotebooks(
      notebooks.map((nb) => (nb.id === id ? { ...nb, title: newTitle } : nb))
    );
  };

  // Get the active notebook.
  const activeNotebook = notebooks.find((nb) => nb.id === activeNotebookId);

  return (
    <div className="flex h-screen">
      {/* Sidebar File Explorer */}
      <aside className="w-64 bg-gray-50 border-r border-gray-300 p-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Notebooks</h2>
        <button
          onClick={createNotebook}
          className="flex items-center mb-4 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Notebook
        </button>
        <ul className="space-y-2">
          {notebooks.map((nb) => (
            <li
              key={nb.id}
              className="flex justify-between items-center p-2 rounded hover:bg-gray-200 cursor-pointer"
              onClick={() => openNotebook(nb.id)}
            >
              <span className="font-medium">{nb.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotebook(nb.id);
                }}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content Area with Tabbed View */}
      <main className="flex-1 p-6 bg-white overflow-auto">
        {/* Tabs Header */}
        <div className="flex space-x-2 border-b border-gray-300 pb-2 mb-4">
          {openNotebookIds.map((id) => {
            const nb = notebooks.find((n) => n.id === id);
            if (!nb) return null;
            return (
              <div
                key={id}
                onClick={() => setActiveNotebookId(id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-t cursor-pointer ${
                  activeNotebookId === id
                    ? "bg-white border border-gray-300 border-b-0 shadow"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <input
                  type="text"
                  value={nb.title}
                  onChange={(e) => updateNotebookTitle(id, e.target.value)}
                  className="bg-transparent border-none focus:outline-none"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeNotebookTab(id);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
        {/* Active Notebook Content */}
        {activeNotebook ? (
          <NotebookContent
            key={activeNotebook.id} // key to ensure a fresh instance per notebook
            cells={activeNotebook.cells}
            onCellsChange={(newCells) =>
              updateNotebookCells(activeNotebook.id, newCells)
            }
          />
        ) : (
          <div className="text-center text-gray-500">
            No notebook open. Select one from the sidebar.
          </div>
        )}
      </main>
    </div>
  );
};

export default NotebooksManager;
