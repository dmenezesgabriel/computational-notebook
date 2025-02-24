import { X } from "lucide-react";
import { useNotebooks } from "../contexts/notebooks-context";
import { Tabs } from "./tabs";

interface NotebookTabsProps {
  tabsMaxWidth: number;
}

export function NotebookTabs({ tabsMaxWidth }: NotebookTabsProps) {
  const {
    notebooks,
    openNotebookIds,
    activeNotebookId,
    setActiveNotebookId,
    closeNotebookTab,
    updateNotebookTitle,
  } = useNotebooks();

  return (
    <Tabs.Root maxWidth={tabsMaxWidth}>
      {openNotebookIds.map((id) => {
        const nb = notebooks.find((n) => n.id === id);
        if (!nb) return null;
        return (
          <Tabs.Item
            key={id}
            isActive={activeNotebookId === id}
            onClick={() => setActiveNotebookId(id)}
          >
            <input
              type="text"
              value={nb.title}
              onChange={(e) => updateNotebookTitle(id, e.target.value)}
              className="bg-transparent border-none focus:outline-none"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeNotebookTab(id);
              }}
              className="text-slate-700 hover:bg-slate-300 p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </Tabs.Item>
        );
      })}
    </Tabs.Root>
  );
}
