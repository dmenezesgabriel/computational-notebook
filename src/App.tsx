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
import ReactMarkdown from "react-markdown";

// ------------------------------------
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
      `ERROR: ${args
        .map((a) => (typeof a === "object" ? JSON.stringify(a) : a))
        .join(" ")}`
    );
  };
  console.warn = (...args: any[]) => {
    logs.push(
      `WARNING: ${args
        .map((a) => (typeof a === "object" ? JSON.stringify(a) : a))
        .join(" ")}`
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
// Helper: Returns true if a line appears to be a declaration rather than an expression.
function isDeclaration(line: string): boolean {
  return /^\s*(const|let|var|function|class)\s+/.test(line);
}

// ----------------------
// Transforms user code to automatically return the value of the last expression,
// similar to a Jupyter Notebook. In addition, this version detects top-level declarations
// (using a simple regex) and automatically appends an assignment to the shared context.
// This allows variables declared in one cell to be available in later cells.
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

  // Process non-import lines to automatically attach declared variables to sharedContext.
  const declarationRegex =
    /^\s*(const|let|var|function|class)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)/;
  const processedLines: string[] = [];
  for (let i = 0; i < nonImportLines.length; i++) {
    const line = nonImportLines[i];
    processedLines.push(line);
    const match = line.match(declarationRegex);
    if (match) {
      const varName = match[2];
      // Avoid adding duplicate assignment if the line already mentions sharedContext.
      if (!line.includes("sharedContext.")) {
        processedLines.push(`sharedContext.${varName} = ${varName};`);
      }
    }
  }

  // Remove trailing blank lines.
  while (
    processedLines.length > 0 &&
    processedLines[processedLines.length - 1].trim() === ""
  ) {
    processedLines.pop();
  }

  // If there is no non-import code, return the original code.
  if (processedLines.length === 0) {
    return code;
  }

  // Check the last non-empty line.
  let lastLine = processedLines[processedLines.length - 1].trim();

  // If the last line starts with "display(", assume the user is handling output.
  if (lastLine.startsWith("display(")) {
    return `${importLines.join("\n")}\n${processedLines.join("\n")}`;
  }

  // If the last line is a declaration, don’t wrap it.
  if (isDeclaration(lastLine)) {
    return `${importLines.join("\n")}\n${processedLines.join("\n")}`;
  }

  // If the last line starts with a closing brace (or is just "}") then do not wrap it.
  if (lastLine.startsWith("}")) {
    return `${importLines.join("\n")}\n${processedLines.join("\n")}`;
  }

  // Remove a trailing semicolon from the last line if present.
  if (lastLine.endsWith(";")) {
    lastLine = lastLine.slice(0, -1);
  }

  // Remove the last non-import line (which is treated as an expression).
  processedLines.pop();
  const bodyCode =
    processedLines.join("\n") + "\n" + "return (" + lastLine + ");\n";

  // Wrap the code in an IIFE and export it as default.
  return `${importLines.join("\n")}\nexport default (function(){\n${bodyCode}})();\n`;
}

// ----------------------
// Shared context for all cells
const sharedContext: { [key: string]: any } = {};

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

  // Expose display and sharedContext globally so that user code can call it.
  (window as any).display = display;
  (window as any).sharedContext = sharedContext;

  try {
    // Optionally transform the code to capture the last expression's value and attach declarations.
    const trimmedCode = code.trim();
    const lastLine = trimmedCode.split("\n").pop()?.trim();
    let finalCode = code;
    if (lastLine && !lastLine.startsWith("display(")) {
      finalCode = transformUserCode(code);
    }

    // Inject shared context into the code.
    let contextCode = "";
    const contextKeys = Object.keys(sharedContext);
    if (contextKeys.length > 0) {
      contextCode = `const sharedContext = window.sharedContext;\n`;
      for (const key of contextKeys) {
        if (key !== "default") {
          contextCode += `const ${key} = sharedContext["${key}"];\n`;
        }
      }
    }

    const fullCode = `${contextCode}${finalCode}`;

    console.log("Executing code:\n", fullCode); // Debugging output

    let transpiledCode = fullCode;
    if (language === "typescript") {
      // Transpile TypeScript to ES module code.
      const result = ts.transpileModule(fullCode, {
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

      // Update shared context with new exports.
      Object.keys(module).forEach((exportKey) => {
        sharedContext[exportKey] = module[exportKey];
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
// Function to export a notebook to Markdown format
function exportNotebookToMarkdown(notebook: NotebookFile): string {
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
// 'a' will be attached to sharedContext automatically.
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
        {
          id: 3,
          code: `# Hello from Markdown`,
          language: "markdown",
        },
        {
          id: 4,
          code: `// JavaScript cell example using previously declared 'a':
a + 7;`,
          language: "javascript",
        },
      ],
    },
  ]);
  // State for open notebook IDs (the ones shown in tabs).
  const [openNotebookIds, setOpenNotebookIds] = useState<number[]>([]);
  // The currently active notebook (by id).
  const [activeNotebookId, setActiveNotebookId] = useState<number | null>(null);
  // State for sidebar collapse.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

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

  // Function to handle exporting the active notebook
  const handleExportNotebook = () => {
    if (activeNotebook) {
      const markdownContent = exportNotebookToMarkdown(activeNotebook);
      const blob = new Blob([markdownContent], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeNotebook.title}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar File Explorer */}
      <aside
        className={`${
          isSidebarCollapsed ? "w-16" : "w-64"
        } bg-gray-100 border-r border-gray-300 overflow-y-auto transition-width duration-300`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-300">
          <h2 className="text-sm font-semibold text-gray-700">
            {isSidebarCollapsed ? "NB" : "NOTEBOOKS"}
          </h2>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-gray-700 hover:bg-gray-300 p-1 rounded"
          >
            {isSidebarCollapsed ? ">" : "<"}
          </button>
        </div>
        {!isSidebarCollapsed && (
          <>
            <div className="p-4">
              <button
                onClick={createNotebook}
                className="flex items-center w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Notebook
              </button>
            </div>
            <ul className="px-2">
              {notebooks.map((nb) => (
                <li
                  key={nb.id}
                  className={`px-2 py-1 rounded text-sm hover:bg-gray-300 cursor-pointer ${
                    activeNotebookId === nb.id ? "bg-gray-200" : ""
                  }`}
                  onClick={() => openNotebook(nb.id)}
                >
                  <div className="group flex justify-between items-center">
                    <span className="text-gray-700">{nb.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotebook(nb.id);
                      }}
                      className="text-gray-700 hover:text-red-600 p-1 rounded opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>

      {/* Main Content Area with Tabbed View */}
      <main className="flex-1 flex flex-col bg-white">
        {/* Tabs Header */}
        <div className="flex space-x-px bg-gray-100 border-b border-gray-300">
          {openNotebookIds.map((id) => {
            const nb = notebooks.find((n) => n.id === id);
            if (!nb) return null;
            return (
              <div
                key={id}
                onClick={() => setActiveNotebookId(id)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm cursor-pointer ${
                  activeNotebookId === id
                    ? "bg-white text-gray-700 border-t-2 border-t-blue-500"
                    : "text-gray-500 hover:bg-gray-200"
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
                  className="text-gray-700 hover:bg-gray-300 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
        {/* Active Notebook Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeNotebook ? (
            <>
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleExportNotebook}
                  className="flex items-center bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                >
                  Export to Markdown
                </button>
              </div>
              <NotebookContent
                key={activeNotebook.id}
                cells={activeNotebook.cells}
                onCellsChange={(newCells) =>
                  updateNotebookCells(activeNotebook.id, newCells)
                }
              />
            </>
          ) : (
            <div className="text-center text-gray-500 mt-8">
              No notebook open. Select one from the sidebar.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NotebooksManager;
