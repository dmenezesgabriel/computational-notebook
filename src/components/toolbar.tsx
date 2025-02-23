import React, { useRef } from "react";
import { Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useNotebooks } from "../contexts/notebooks-context";
import { importNotebookFromMarkdown } from "../utils/import-markdown-notebook";
import { Button } from "./button";

export function Toolbar() {
  const { createNotebook, openNotebook } = useNotebooks();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4">
      <Button.Root onClick={handleCreateNotebook} className="w-full">
        <Button.Icon icon={Plus} />
        <Button.Text>New Notebook</Button.Text>
      </Button.Root>
      <div className="mt-2">
        <Button.Root variant="secondary" className="w-full" onClick={handleImportClick}>
          <Button.Icon icon={Plus} />
          <Button.Text>Import Notebook</Button.Text>
        </Button.Root>
        <input
          ref={fileInputRef}
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
