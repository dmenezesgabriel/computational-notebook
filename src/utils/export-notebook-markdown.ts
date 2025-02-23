import type { NotebookFile } from "../types";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import type { Root, Code, Html } from "mdast";

export function exportNotebookToMarkdown(notebook: NotebookFile): string {
  const nodes = notebook.cells.flatMap((cell) => {
    const idComment: Html = {
      type: "html",
      value: `<!-- ${cell.id} -->`,
    };

    if (cell.language === "markdown") {
      return [idComment, (fromMarkdown(cell.code.trim()) as Root).children[0]];
    }

    const node: Code = {
      type: "code",
      lang: cell.language === "typescript" ? "ts" : "js",
      value: cell.code.trim(),
    };

    return [idComment, node];
  });

  const root: Root = { type: "root", children: nodes };

  return toMarkdown(root);
}
