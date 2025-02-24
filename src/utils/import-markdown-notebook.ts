import type { CellData, NotebookFile } from "../types";
import { v4 as uuidv4 } from "uuid";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import type { Code, Paragraph, Text, Html } from "mdast";

export async function importNotebookFromMarkdown(
  file: File
): Promise<NotebookFile> {
  const codeLanguages = {
    ts: "typescript",
    js: "javascript",
    jsx: "jsx",
    tsx: "tsx",
    md: "markdown",
  } as const;

  const text = await file.text();

  const processor = unified().use(remarkParse).use(remarkFrontmatter);

  const ast = processor.parse(text);
  const cells: CellData[] = [];
  let lastSeenId: number | null = null;

  ast.children.forEach((node) => {
    const codeNode = node as Code;

    if (node.type === "text" && node.value.trim() === "") {
      return;
    }

    if (node.type === "html") {
      const htmlNode = node as Html;
      const idMatch = htmlNode.value.match(/<!-- (\d+) -->/);

      if (idMatch) {
        lastSeenId = parseInt(idMatch[1], 10);
      }
    } else if (node.type === "code") {
      cells.push({
        id: lastSeenId || Date.now() + Math.random(),
        code: codeNode.value.trim(),
        language: codeLanguages[codeNode.lang as keyof typeof codeLanguages],
      });

      lastSeenId = null;
    } else if (node.type === "text" || node.type === "paragraph") {
      const textNode = node as Text | Paragraph;
      const textContent =
        textNode.type === "text"
          ? textNode.value
          : textNode.children.reduce((acc, child) => {
              if ("value" in child) return acc + child.value;
              return acc;
            }, "");

      if (textContent.trim()) {
        cells.push({
          id: lastSeenId || Date.now() + Math.random(),
          code: textContent.trim(),
          language: codeLanguages[codeNode.lang as keyof typeof codeLanguages],
        });
        lastSeenId = null;
      }
    }
  });

  const newId = uuidv4();

  return { id: newId, title: file.name.replace(".md", ""), cells };
}
