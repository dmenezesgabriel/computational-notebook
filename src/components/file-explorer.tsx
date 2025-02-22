import { Trash2 } from "lucide-react";
import { useNotebook } from "../contexts/notebook-context";

export function FileExplorer() {
  const { notebooks, activeNotebookId, deleteNotebook, openNotebook } =
    useNotebook();

  return (
    <ul className="px-2">
      {notebooks.map((nb) => (
        <li
          key={nb.id}
          className={`px-2 py-1 rounded text-sm hover:bg-gray-300 cursor-pointer ${
            activeNotebookId === nb.id ? "bg-gray-200" : ""
          }`}
          onClick={() => openNotebook(nb.id)}
        >
          <div className="group flex justify-between items-center">
            <span className="text-gray-700">{nb.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNotebook(nb.id);
              }}
              className="text-gray-700 hover:text-red-600 p-1 rounded opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
