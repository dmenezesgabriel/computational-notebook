import ts from "typescript";
import { transformUserCode } from "./code-transform";

const sharedContext: { [key: string]: any } = {};

export async function runCode(code: string, language: string): Promise<string> {
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
  window.display = display;
  window.sharedContext = sharedContext;

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
        window[exportKey] = module[exportKey];
      });

      // If the default export (the auto-return value) is not undefined, display it.
      if (module.default !== undefined) {
        display(module.default);
      }
    } finally {
      // Clean up the Blob URL.
      URL.revokeObjectURL(moduleUrl);
    }
  } catch (error) {
    console.error("Error executing code:", error);
    logs.push(`Error: ${(error as Error).message}`);
  } finally {
    // Remove the global display function.
    delete window.display;
  }

  output = logs.length ? logs.join("\n") : "Code executed successfully.";
  return output;
}
