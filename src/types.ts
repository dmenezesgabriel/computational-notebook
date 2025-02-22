export interface CellData {
  id: number;
  code: string;
  output?: string;
  language: "javascript" | "typescript" | "markdown";
}

export interface CellHandle {
  runCell: () => Promise<void>;
}

export interface NotebookFile {
  id: string;
  title: string;
  cells: CellData[];
}

export type EditorLanguages = "javascript" | "typescript" | "markdown";
