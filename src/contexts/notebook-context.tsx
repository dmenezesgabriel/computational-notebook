import React, {
  createContext,
  useContext,
  useReducer,
  useState,
  useCallback,
} from "react";
import type { NotebookFile, CellData } from "../types";
import { notebooksReducer } from "../reducers/notebook/reducer";
import {
  addNotebookAction,
  deleteNotebookAction,
  updateNotebookCellsAction,
  updateNotebookTitleAction,
} from "../reducers/notebook/actions";
import { produce } from "immer";

interface NotebookContextType {
  notebooks: NotebookFile[];
  activeNotebookId: string | null;
  openNotebookIds: string[];
  activeNotebook: NotebookFile | undefined;
  setActiveNotebookId: (id: string | null) => void;
  createNotebook: (notebook: NotebookFile) => void;
  deleteNotebook: (id: string) => void;
  openNotebook: (id: string) => void;
  closeNotebookTab: (id: string) => void;
  updateNotebookCells: (id: string, cells: CellData[]) => void;
  updateNotebookTitle: (id: string, title: string) => void;
}

const NotebookContext = createContext<NotebookContextType | null>(null);

export function NotebookProvider({ children }: { children: React.ReactNode }) {
  const [notebooks, dispatch] = useReducer(notebooksReducer, []);
  const [openNotebookIds, setOpenNotebookIds] = useState<string[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);

  const openNotebook = useCallback((id: string) => {
    setOpenNotebookIds((state) =>
      produce(state, (draft) => {
        if (!draft.includes(id)) {
          draft.push(id);
        }
      })
    );
    setActiveNotebookId(id);
  }, []);

  const deleteNotebook = useCallback(
    (id: string) => {
      dispatch(deleteNotebookAction(id));
      setOpenNotebookIds((ids) => ids.filter((nid) => nid !== id));
      if (activeNotebookId === id) {
        setActiveNotebookId(null);
      }
    },
    [activeNotebookId]
  );

  const closeNotebookTab = useCallback(
    (id: string) => {
      setOpenNotebookIds((ids) => {
        const newIds = ids.filter((nid) => nid !== id);
        if (activeNotebookId === id) {
          setActiveNotebookId(newIds[0] || null);
        }
        return newIds;
      });
    },
    [activeNotebookId]
  );

  const createNotebook = useCallback((notebook: NotebookFile) => {
    dispatch(addNotebookAction(notebook));
  }, []);

  const updateNotebookCells = useCallback((id: string, cells: CellData[]) => {
    dispatch(updateNotebookCellsAction({ id, cells }));
  }, []);

  const updateNotebookTitle = useCallback((id: string, title: string) => {
    dispatch(updateNotebookTitleAction({ id, title }));
  }, []);

  const activeNotebook = notebooks.find((nb) => nb.id === activeNotebookId);

  const value = {
    notebooks,
    activeNotebookId,
    openNotebookIds,
    activeNotebook,
    setActiveNotebookId,
    createNotebook,
    deleteNotebook,
    openNotebook,
    closeNotebookTab,
    updateNotebookCells,
    updateNotebookTitle,
  };

  return (
    <NotebookContext.Provider value={value}>
      {children}
    </NotebookContext.Provider>
  );
}

export function useNotebook() {
  const context = useContext(NotebookContext);
  if (!context) {
    throw new Error("useNotebook must be used within a NotebookProvider");
  }
  return context;
}
