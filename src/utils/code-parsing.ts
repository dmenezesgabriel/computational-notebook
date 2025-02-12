export function isDeclaration(line: string): boolean {
  return /^\s*(const|let|var|function|class)\s+/.test(line);
}
