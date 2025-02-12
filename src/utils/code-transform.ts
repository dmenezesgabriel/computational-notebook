import { isDeclaration } from "./code-parsing";

// Transforms user code to automatically return the value of the last expression,
// similar to a Jupyter Notebook. In addition, this version detects top-level declarations
// (using a simple regex) and automatically appends an assignment to the shared context.
// This allows variables declared in one cell to be available in later cells.
// It separates top-level import statements from the rest and, if the last non-import line
// is an expression (and not a declaration, a call to display, or a lone closing brace),
// wraps it in an IIFE that returns its value.
export function transformUserCode(code: string): string {
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
