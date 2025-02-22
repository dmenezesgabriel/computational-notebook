import type { NotebookFile } from "../../types";

export enum NotebookActions {
  ADD_NOTEBOOK = "ADD_NOTEBOOK",
  DELETE_NOTEBOOK = "DELETE_NOTEBOOK",
  UPDATE_NOTEBOOK_CELLS = "UPDATE_NOTEBOOK_CELLS",
  UPDATE_NOTEBOOK_TITLE = "UPDATE_NOTEBOOK_TITLE",
  SET_NOTEBOOKS = "SET_NOTEBOOKS",
}

export interface AddNotebookAction {
  type: NotebookActions.ADD_NOTEBOOK;
  payload: NotebookFile;
}

export interface DeleteNotebookAction {
  type: NotebookActions.DELETE_NOTEBOOK;
  payload: number;
}

export interface UpdateNotebookCellsAction {
  type: NotebookActions.UPDATE_NOTEBOOK_CELLS;
  payload: Partial<NotebookFile>;
}

export interface UpdateNotebookTitleAction {
  type: NotebookActions.UPDATE_NOTEBOOK_TITLE;
  payload: Partial<NotebookFile>;
}

export interface SetNotebooksAction {
  type: NotebookActions.SET_NOTEBOOKS;
  payload: NotebookFile[];
}

export type NotebookAction =
  | AddNotebookAction
  | DeleteNotebookAction
  | UpdateNotebookCellsAction
  | UpdateNotebookTitleAction
  | SetNotebooksAction;

export function addNotebookAction(notebook: NotebookFile): AddNotebookAction {
  return { type: NotebookActions.ADD_NOTEBOOK, payload: notebook };
}

export function deleteNotebookAction(notebookId: number): DeleteNotebookAction {
  return { type: NotebookActions.DELETE_NOTEBOOK, payload: notebookId };
}

export function updateNotebookCellsAction(
  notebook: Partial<NotebookFile>
): UpdateNotebookCellsAction {
  return { type: NotebookActions.UPDATE_NOTEBOOK_CELLS, payload: notebook };
}

export function updateNotebookTitleAction(
  notebook: Partial<NotebookFile>
): UpdateNotebookTitleAction {
  return { type: NotebookActions.UPDATE_NOTEBOOK_TITLE, payload: notebook };
}

export function setNotebooksAction(
  notebooks: NotebookFile[]
): SetNotebooksAction {
  return { type: NotebookActions.SET_NOTEBOOKS, payload: notebooks };
}
