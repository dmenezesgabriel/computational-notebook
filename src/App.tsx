import React, { useState } from "react";
import * as ts from "typescript";
import "./index.css";

/**
 * Helper: Returns true if a line appears to be a declaration rather than an expression.
 */
function isDeclaration(line: string): boolean {
  return /^\s*(const|let|var|function|class)\s+/.test(line);
}

/**
 * Transforms user code to automatically return the value of the last expression,
 * similar to a Jupyter Notebook.
 *
 * It first separates top‑level import statements from the rest of the code. If the
 * last non‑import line is not a declaration and does not start with "display(", it is
 * wrapped in an IIFE that returns its value. Otherwise, the code is returned as‑is.
 */
/**
 * Transforms user code to automatically return the value of the last expression,
 * similar to a Jupyter Notebook.
 *
 * It first separates top‑level import statements from the rest of the code. If the
 * last non‑import line is not a declaration and does not start with "display(", it is
 * wrapped in an IIFE that returns its value. Otherwise, the code is returned as‑is.
 */
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

/**
 * Executes the provided code (which may be JavaScript or TypeScript). If the code does
 * not explicitly call display(), and if the last non‑declaration expression has a value,
 * that value is passed to the display function.
 *
 * The code is dynamically imported as an ES module via a Blob URL. If the language is
 * TypeScript, it is first transpiled to ES module syntax.
 */
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
      // Use transpileModule with ES module options.
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

      // Expose every export from the cell globally (for cross‑cell usage).
      Object.keys(module).forEach((exportKey) => {
        (window as any)[exportKey] = module[exportKey];
      });

      // If the default export (the auto‑returned value) is not undefined, display it.
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

/**
 * Interface for a notebook cell's data.
 */
interface CellData {
  id: number;
  code: string;
  language: "javascript" | "typescript";
}

/**
 * A single notebook cell. It shows a textarea for code input, a language selector,
 * a play button to execute the cell, and an output area.
 */
interface CellProps {
  cell: CellData;
  onChange: (id: number, changes: Partial<CellData>) => void;
}

const Cell: React.FC<CellProps> = ({ cell, onChange }) => {
  const [output, setOutput] = useState<string>("");

  const handleRun = async () => {
    const result = await runCode(cell.code, cell.language);
    setOutput(result);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(cell.id, { code: e.target.value });
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
      <textarea
        style={{
          width: "100%",
          height: "100px",
          fontFamily: "monospace",
          padding: "0.5em",
          boxSizing: "border-box",
        }}
        value={cell.code}
        onChange={handleCodeChange}
        placeholder="Enter your code here..."
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
};

/**
 * The Notebook component holds an array of cells. Cells share a global namespace,
 * so variables declared in one cell are available in later cells.
 */
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

  // Update cell data based on changes from a cell (code and/or language).
  const updateCell = (id: number, changes: Partial<CellData>) => {
    setCells((prev) =>
      prev.map((cell) => (cell.id === id ? { ...cell, ...changes } : cell))
    );
  };

  const addCell = () => {
    const newId = cells.length ? cells[cells.length - 1].id + 1 : 1;
    setCells([...cells, { id: newId, code: "", language: "javascript" }]);
  };

  return (
    <div className="notebook" style={{ maxWidth: "800px", margin: "auto" }}>
      <h1>My Notebook</h1>
      {cells.map((cell) => (
        <Cell key={cell.id} cell={cell} onChange={updateCell} />
      ))}
      <button onClick={addCell} style={{ marginTop: "1em" }}>
        + Add Cell
      </button>
    </div>
  );
};

export default Notebook;
