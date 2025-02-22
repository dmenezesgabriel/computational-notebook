export interface CellData {
  id: number;
  code: string;
  language: "javascript" | "typescript" | "markdown";
}

export interface CellHandle {
  runCell: () => Promise<void>;
}

export interface NotebookFile {
  id: number;
  title: string;
  cells: CellData[];
}
