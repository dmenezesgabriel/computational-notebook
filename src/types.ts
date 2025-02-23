export type EditorLanguages =
  | "javascript"
  | "typescript"
  | "markdown"
  | "jsx"
  | "tsx";

export interface CellData {
  id: number;
  code: string;
  output?: string;
  language: EditorLanguages;
}

export interface CellHandle {
  runCell: () => Promise<void>;
}

export interface NotebookFile {
  id: string;
  title: string;
  cells: CellData[];
}
