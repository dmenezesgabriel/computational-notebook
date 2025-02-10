import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import * as ts from "typescript";
import "./index.css";

// --- CodeMirror imports ---
import { EditorState, Compartment } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";

// ----------------------
// Helper: Returns true if a line appears to be a declaration rather than an expression.
function isDeclaration(line: string): boolean {
  return /^\s*(const|let|var|function|class)\s+/.test(line);
}

// ----------------------
// Transforms user code to automatically return the value of the last expression,
// similar to a Jupyter Notebook.
// It separates top-level import statements from the rest and, if the last non-import line
// is an expression (and not a declaration or a call to display), wraps it in an IIFE that returns its value.
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

  return <div ref={editorDivRef} />;
};

// ----------------------
// Notebook cell data interface.
interface CellData {
  id: number;
  code: string;
  language: "javascript" | "typescript";
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
  { cell: CellData; onChange: (id: number, changes: Partial<CellData>) => void }
>(({ cell, onChange }, ref) => {
  const [output, setOutput] = useState<string>("");

  const handleRun = async () => {
    const result = await runCode(cell.code, cell.language);
    setOutput(result);
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
      language: e.target.value as "javascript" | "typescript",
    });
  };

  return (
    <div
      className="cell"
      style={{
        border: "1px solid #ddd",
        margin: "1em 0",
        padding: "1em",
        borderRadius: "4px",
      }}
    >
      <div style={{ marginBottom: "0.5em" }}>
        <select value={cell.language} onChange={handleLanguageChange}>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
        </select>
      </div>
      {/* Use the CodeEditor instead of a plain textarea */}
      <CodeEditor
        value={cell.code}
        language={cell.language}
        onChange={handleCodeChange}
      />
      <div style={{ marginTop: "0.5em" }}>
        <button onClick={handleRun}>▶ Run Cell</button>
      </div>
      {output && (
        <pre
          style={{
            background: "#f8f8f8",
            padding: "0.5em",
            marginTop: "0.5em",
            whiteSpace: "pre-wrap",
          }}
        >
          {output}
        </pre>
      )}
    </div>
  );
});

// ----------------------
// The Notebook component holds an array of cells.
// Cells share a global namespace so that variables declared in one cell are available in later cells.
// A top nav toolbar is added with a "Run All Cells" button.
const Notebook: React.FC = () => {
  const [cells, setCells] = useState<CellData[]>([
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
  ]);

  // Create refs for each cell.
  const cellRefs = useRef<Map<number, React.RefObject<CellHandle>>>(new Map());

  // Ensure each cell has a ref.
  cells.forEach((cell) => {
    if (!cellRefs.current.has(cell.id)) {
      cellRefs.current.set(cell.id, React.createRef<CellHandle>());
    }
  });

  // Function to update cell data.
  const updateCell = (id: number, changes: Partial<CellData>) => {
    setCells((prev) =>
      prev.map((cell) => (cell.id === id ? { ...cell, ...changes } : cell))
    );
  };

  // Run all cells by iterating over their refs.
  const runAllCells = async () => {
    for (const cell of cells) {
      const ref = cellRefs.current.get(cell.id);
      if (ref && ref.current) {
        await ref.current.runCell();
      }
    }
  };

  const addCell = () => {
    const newId = cells.length ? cells[cells.length - 1].id + 1 : 1;
    setCells([...cells, { id: newId, code: "", language: "javascript" }]);
  };

  return (
    <div className="notebook" style={{ maxWidth: "800px", margin: "auto" }}>
      {/* Top Navigation Toolbar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1em",
          background: "#eee",
          borderBottom: "1px solid #ddd",
          marginBottom: "1em",
        }}
      >
        <h1>My Notebook</h1>
        <button onClick={runAllCells}>▶ Run All Cells</button>
      </header>
      {cells.map((cell) => (
        <Cell
          key={cell.id}
          cell={cell}
          onChange={updateCell}
          ref={cellRefs.current.get(cell.id)}
        />
      ))}
      <button onClick={addCell} style={{ marginTop: "1em" }}>
        + Add Cell
      </button>
    </div>
  );
};

export default Notebook;
