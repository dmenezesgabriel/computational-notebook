import React, { useState } from "react";
import "./index.css";
import * as ts from "typescript";

/**
 * Transforms user code to automatically return the value of the last expression,
 * similar to a Jupyter Notebook.
 *
 * The strategy is to separate out any top-level import statements from the rest.
 * The remaining code (if any) is wrapped in an IIFE that returns the value of the
 * last non-empty line. The result is then exported as the default export.
 *
 * If the user already calls display on the last line (i.e. it starts with "display(")
 * then no transformation is done.
 */
function transformUserCode(code: string): string {
  const lines = code.split("\n");

  // Identify all top-level import statements.
  const importLines: string[] = [];
  const nonImportLines: string[] = [];
  for (const line of lines) {
    if (/^\s*import\s+/.test(line)) {
      importLines.push(line);
    } else {
      nonImportLines.push(line);
    }
  }

  // Remove trailing empty lines from nonImportLines.
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
  const lastLine = nonImportLines[nonImportLines.length - 1].trim();
  // If the last line already calls "display(", assume the user is handling output.
  if (lastLine.startsWith("display(")) {
    return code;
  }

  // Otherwise, treat the last line as an expression to be returned.
  // Remove that last line from the non-import code.
  const bodyLines = nonImportLines.slice(0, nonImportLines.length - 1);
  // Reconstruct the body of the IIFE:
  // – First, the code lines (if any)
  // – Then a "return (<last expression>);" statement.
  const bodyCode = bodyLines.join("\n") + "\n" + "return (" + lastLine + ");\n";

  // Reassemble the transformed code:
  // 1. The import statements (unchanged)
  // 2. An export default statement that wraps the body in an IIFE.
  const transformed = `${importLines.join("\n")}
export default (function(){
${bodyCode}
})();
`;
  return transformed;
}

async function runCode(code: string, language: string) {
  let output = "";
  const logs: string[] = [];

  // Define a custom display function that captures output.
  const display = (...args: any[]) => {
    const message = args
      .map((a) => (typeof a === "object" ? JSON.stringify(a) : a))
      .join(" ");
    logs.push(message);
    console.log(...args);
  };

  // Expose display globally.
  (window as any).display = display;

  try {
    // Optionally transform the code to capture the last expression
    // if the last non-empty line does not start with "display(".
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
          module: ts.ModuleKind.ESNext, // use ES module syntax
          target: ts.ScriptTarget.ES2015,
        },
      });
      transpiledCode = result.outputText;
    }

    // Create a blob URL for the (transpiled) code.
    const blob = new Blob([transpiledCode], { type: "text/javascript" });
    const moduleUrl = URL.createObjectURL(blob);

    try {
      // Dynamically import the module.
      const module = await import(/* @vite-ignore */ moduleUrl);

      // Expose every exported property globally.
      Object.keys(module).forEach((exportKey) => {
        (window as any)[exportKey] = module[exportKey];
      });

      // If the default export is not undefined, display it.
      if (module.default !== undefined) {
        display(module.default);
      }
    } finally {
      // Clean up the blob URL.
      URL.revokeObjectURL(moduleUrl);
    }
  } catch (error: any) {
    console.error("Error executing code:", error);
    logs.push(`Error: ${error.message}`);
  } finally {
    // Remove the global display function.
    delete (window as any).display;
  }

  // Return either the captured logs or a default success message.
  if (logs.length === 0) {
    output = "Code executed successfully.";
  } else {
    output = logs.join("\n");
  }
  return output;
}

const App: React.FC = () => {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [language, setLanguage] = useState("javascript");

  const handleRun = async () => {
    console.clear();
    console.log("Running code:", code);
    const result = await runCode(code, language);
    setOutput(result);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Code Executor</h1>
      <textarea
        className="w-full p-2 border rounded mb-2"
        rows={8}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter JavaScript or TypeScript code..."
      />
      <select
        className="w-full p-2 border rounded mb-2"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
      </select>
      <button
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        onClick={handleRun}
      >
        Run Code
      </button>
      {output && (
        <pre className="mt-4 p-2 bg-gray-100 border rounded">{output}</pre>
      )}
    </div>
  );
};

export default App;
