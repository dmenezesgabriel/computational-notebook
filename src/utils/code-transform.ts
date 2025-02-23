import { isDeclaration, getTopLevelDeclarations } from "./code-parsing";

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

  // Get all top-level declarations using AST parsing
  const nonImportCode = nonImportLines.join("\n");
  const declarations = getTopLevelDeclarations(nonImportCode);

  // Create shared context assignments for all found declarations
  const sharedContextAssignment = declarations
    .filter((name) => !nonImportCode.includes(`sharedContext.${name}`))
    .map((name) => `sharedContext.${name} = ${name};`);

  const processedLines = [...nonImportLines, ...sharedContextAssignment];

  // Remove trailing blank lines
  while (
    processedLines.length > 0 &&
    processedLines[processedLines.length - 1].trim() === ""
  ) {
    processedLines.pop();
  }

  // If there is no non-import code, return the original code
  if (processedLines.length === 0) {
    return code;
  }

  // Check the last non-empty line
  let lastLine = processedLines[processedLines.length - 1].trim();

  // If the last line starts with "display(", assume the user is handling output
  if (lastLine.startsWith("display(")) {
    return `${importLines.join("\n")}\n${processedLines.join("\n")}`;
  }

  // If the last line is a declaration, don't wrap it
  if (isDeclaration(lastLine)) {
    return `${importLines.join("\n")}\n${processedLines.join("\n")}`;
  }

  // If the last line starts with a closing brace then do not wrap it
  if (lastLine.startsWith("}")) {
    return `${importLines.join("\n")}\n${processedLines.join("\n")}`;
  }

  // Remove a trailing semicolon from the last line if present
  if (lastLine.endsWith(";")) {
    lastLine = lastLine.slice(0, -1);
  }

  // Remove the last non-import line (which is treated as an expression)
  processedLines.pop();
  const bodyCode =
    processedLines.join("\n") + "\n" + "return (" + lastLine + ");\n";

  // Wrap the code in an IIFE and export it as default
  return `${importLines.join("\n")}\nexport default await(async function(){\n${bodyCode}})();\n`;
}
