// code-execution.tsx
import ts from "typescript";
import { transformUserCode } from "./code-transform";
import { setupDisplay } from "./display";
import { useSharedContextStore } from "../store/shared-context-store";

export async function runCode(code: string, language: string): Promise<string> {
  const logs: string[] = [];
  const display = setupDisplay(logs);

  // Get the Zustand store methods (note: we're not in a component, so we use the store directly)
  const { sharedContext, mergeContext } = useSharedContextStore.getState();

  // Expose display globally (we'll clean this up later)
  window.display = display;

  try {
    const trimmedCode = code.trim();
    const lastLine = trimmedCode.split("\n").pop()?.trim();
    let finalCode = code;
    if (lastLine && !lastLine.startsWith("display(")) {
      finalCode = transformUserCode(code);
    }

    // Inject shared context into the code
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

    let transpiledCode = fullCode;

    console.log("Executing code:\n", fullCode);

    if (language === "typescript") {
      const result = ts.transpileModule(fullCode, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2015,
        },
      });
      transpiledCode = result.outputText;
    }

    if (language === "jsx" || language === "tsx") {
      const React = await import("react");
      const ReactDOM = await import("react-dom");

      window.React = React;
      window.ReactDOM = ReactDOM;

      const result = ts.transpileModule(fullCode, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2015,
          jsx: ts.JsxEmit.React,
          jsxFactory: "React.createElement",
          jsxFragmentFactory: "React.Fragment",
        },
      });

      transpiledCode = result.outputText;
      return transpiledCode;
    }

    const blob = new Blob([transpiledCode], { type: "text/javascript" });
    const moduleUrl = URL.createObjectURL(blob);

    try {
      // Expose sharedContext temporarily to the window for the module execution
      window.sharedContext = sharedContext;
      const module = await import(/* @vite-ignore */ moduleUrl);

      // Update the store with new exports
      const newContext: { [key: string]: unknown } = {};
      Object.keys(module).forEach((exportKey) => {
        newContext[exportKey] = module[exportKey];
        window[exportKey] = module[exportKey]; // Still exposing to window for immediate use
      });
      mergeContext(newContext);

      if (module.default !== undefined) {
        display(module.default);
      }
    } finally {
      URL.revokeObjectURL(moduleUrl);
      delete window.sharedContext; // Clean up
    }
  } catch (error) {
    console.error("Error executing code:", error);
    logs.push(`Error: ${(error as Error).message}`);
  } finally {
    delete window.display;
  }

  const output = logs.length ? logs.join("\n") : "Code executed successfully.";
  return output;
}
