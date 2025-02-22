import type { NotebookFile } from "../../types";

export const NotebookActions = {
  ADD_NOTEBOOK: "ADD_NOTEBOOK",
  DELETE_NOTEBOOK: "DELETE_NOTEBOOK",
  UPDATE_NOTEBOOK: "UPDATE_NOTEBOOK",
  SET_NOTEBOOKS: "SET_NOTEBOOKS",
};

export function notebooksReducer(
  state: NotebookFile[],
  action: { type: string; payload: any }
): NotebookFile[] {
  switch (action.type) {
    case NotebookActions.ADD_NOTEBOOK:
      return [...state, action.payload];
    case NotebookActions.DELETE_NOTEBOOK:
      return state.filter((nb) => nb.id !== action.payload);
    case NotebookActions.UPDATE_NOTEBOOK:
      return state.map((nb) =>
        nb.id === action.payload.id ? { ...nb, ...action.payload } : nb
      );
    case NotebookActions.SET_NOTEBOOKS:
      return action.payload;
    default:
      return state;
  }
}
