import ts from "typescript";

export function isDeclaration(line: string): boolean {
  // Create a source file from the line
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    line,
    ts.ScriptTarget.Latest,
    true
  );

  // Check if any child is a declaration
  let isDecl = false;
  sourceFile.forEachChild((node) => {
    if (
      ts.isVariableStatement(node) ||
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node)
    ) {
      isDecl = true;
    }
  });

  return isDecl;
}

export function getTopLevelDeclarations(code: string): string[] {
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    code,
    ts.ScriptTarget.Latest,
    true
  );

  const declarations: string[] = [];

  // Walk through the AST to find top-level declarations
  sourceFile.forEachChild((node) => {
    if (ts.isVariableStatement(node)) {
      // Handle variable declarations (const, let, var)
      node.declarationList.declarations.forEach((declaration) => {
        if (ts.isIdentifier(declaration.name)) {
          declarations.push(declaration.name.text);
        }
      });
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      // Handle function declarations
      declarations.push(node.name.text);
    } else if (ts.isClassDeclaration(node) && node.name) {
      // Handle class declarations
      declarations.push(node.name.text);
    }
  });

  return declarations;
}
