import React from "react";
import { Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useNotebook } from "../contexts/notebook-context";
import { importNotebookFromMarkdown } from "../utils/import-markdown-notebook";

export function Toolbar() {
  const { createNotebook, openNotebook } = useNotebook();

  const handleCreateNotebook = () => {
    const newId = uuidv4();
    const newNotebook = {
      id: newId,
      title: `Notebook ${newId}`,
      cells: [
        {
          id: 1,
          code: "// New notebook cell",
          language: "javascript" as const,
        },
      ],
    };
    createNotebook(newNotebook);
  };

  const handleImportNotebook = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const notebook = await importNotebookFromMarkdown(file);
      createNotebook(notebook);
      openNotebook(notebook.id);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={handleCreateNotebook}
        className="flex items-center w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        <Plus className="w-4 h-4 mr-1" />
        New Notebook
      </button>
      <div className="mt-2">
        <label
          htmlFor="import-notebook"
          className="flex items-center w-full px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1" />
          Import Notebook
        </label>
        <input
          id="import-notebook"
          type="file"
          accept=".md"
          onChange={handleImportNotebook}
          className="hidden"
        />
      </div>
    </div>
  );
}
