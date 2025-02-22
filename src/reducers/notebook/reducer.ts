import type { NotebookFile } from "../../types";
import { NotebookActions, type NotebookAction } from "./actions";

export function notebooksReducer(
  state: NotebookFile[],
  action: NotebookAction
): NotebookFile[] {
  switch (action.type) {
    case NotebookActions.ADD_NOTEBOOK:
      return [...state, action.payload];
    case NotebookActions.DELETE_NOTEBOOK:
      return state.filter((nb) => nb.id !== action.payload);
    case NotebookActions.UPDATE_NOTEBOOK_CELLS:
      return state.map((nb) =>
        nb.id === action.payload.id ? { ...nb, ...action.payload } : nb
      );
    case NotebookActions.UPDATE_NOTEBOOK_TITLE:
      return state.map((nb) =>
        nb.id === action.payload.id ? { ...nb, ...action.payload } : nb
      );
    case NotebookActions.SET_NOTEBOOKS:
      return action.payload;
    default:
      return state;
  }
}
