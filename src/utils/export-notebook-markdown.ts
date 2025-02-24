import type { NotebookFile } from "../types";
import { toMarkdown } from "mdast-util-to-markdown";
import type { Root, Code, Html } from "mdast";

export function exportNotebookToMarkdown(notebook: NotebookFile): string {
  const codeLanguages = {
    typescript: "ts",
    javascript: "js",
    jsx: "jsx",
    tsx: "tsx",
    markdown: "md",
  };

  const nodes = notebook.cells.flatMap((cell) => {
    const idComment: Html = {
      type: "html",
      value: `<!-- ${cell.id} -->`,
    };

    const node: Code = {
      type: "code",
      lang: codeLanguages[cell.language],
      value: cell.code.trim(),
    };

    return [idComment, node];
  });

  const root: Root = { type: "root", children: nodes };

  return toMarkdown(root);
}
