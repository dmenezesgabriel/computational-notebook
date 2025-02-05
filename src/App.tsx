import React, { useState } from "react";
import "./index.css";
import * as ts from "typescript";

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
    let transpiledCode = code;

    if (language === "typescript") {
      // Use transpileModule with ES module options.
      const result = ts.transpileModule(code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext, // or ES6
          target: ts.ScriptTarget.ES2015,
        },
      });
      transpiledCode = result.outputText;
    }

    // Create a blob URL for the transpiled code.
    const blob = new Blob([transpiledCode], { type: "text/javascript" });
    const moduleUrl = URL.createObjectURL(blob);

    try {
      // Dynamically import the module.
      const module = await import(/* @vite-ignore */ moduleUrl);

      // Make every exported property globally available.
      Object.keys(module).forEach((exportKey) => {
        (window as any)[exportKey] = module[exportKey];
      });
    } finally {
      URL.revokeObjectURL(moduleUrl);
    }
  } catch (error: any) {
    console.error("Error executing code:", error);
    logs.push(`Error: ${error.message}`);
  } finally {
    // Remove the global display function.
    delete (window as any).display;
  }

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
        rows={5}
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
