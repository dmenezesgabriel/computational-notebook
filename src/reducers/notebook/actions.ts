import type { NotebookFile } from "../../types";

export const NotebookActions = {
  ADD_NOTEBOOK: "ADD_NOTEBOOK",
  DELETE_NOTEBOOK: "DELETE_NOTEBOOK",
  UPDATE_NOTEBOOK_CELLS: "UPDATE_NOTEBOOK_CELLS",
  UPDATE_NOTEBOOK_TITLE: "UPDATE_NOTEBOOK_TITLE",
  SET_NOTEBOOKS: "SET_NOTEBOOKS",
};

export function addNotebookAction(notebook: NotebookFile) {
  return { type: NotebookActions.ADD_NOTEBOOK, payload: notebook };
}

export function deleteNotebookAction(notebookId: number) {
  return { type: NotebookActions.DELETE_NOTEBOOK, payload: notebookId };
}

export function updateNotebookCellsAction(notebook: Partial<NotebookFile>) {
  return { type: NotebookActions.UPDATE_NOTEBOOK_CELLS, payload: notebook };
}

export function updateNotebookTitleAction(notebook: Partial<NotebookFile>) {
  return { type: NotebookActions.UPDATE_NOTEBOOK_TITLE, payload: notebook };
}

export function setNotebooksAction(notebooks: NotebookFile[]) {
  return { type: NotebookActions.SET_NOTEBOOKS, payload: notebooks };
}
