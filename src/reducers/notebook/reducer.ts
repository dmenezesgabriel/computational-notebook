import type { NotebookFile } from "../../types";
import { NotebookActions, type NotebookAction } from "./actions";
import { produce } from "immer";

export function notebooksReducer(
  state: NotebookFile[],
  action: NotebookAction
): NotebookFile[] {
  switch (action.type) {
    case NotebookActions.ADD_NOTEBOOK:
      return produce(state, (draft) => {
        draft.push(action.payload.notebook);
      });
    case NotebookActions.DELETE_NOTEBOOK:
      return produce(state, (draft) => {
        const index = draft.findIndex(
          (notebook) => notebook.id === action.payload.notebookId
        );
        if (index !== -1) {
          draft.splice(index, 1);
        }
      });
    case NotebookActions.UPDATE_NOTEBOOK_CELLS:
      return produce(state, (draft) => {
        const index = draft.findIndex(
          (notebook) => notebook.id === action.payload.notebook.id
        );
        if (index !== -1) {
          draft[index] = { ...draft[index], ...action.payload.notebook };
        }
      });
    case NotebookActions.UPDATE_NOTEBOOK_TITLE:
      return produce(state, (draft) => {
        const index = draft.findIndex(
          (notebook) => notebook.id === action.payload.notebook.id
        );
        if (index !== -1) {
          draft[index] = { ...draft[index], ...action.payload.notebook };
        }
      });
    case NotebookActions.SET_NOTEBOOKS:
      return produce(state, (draft) => {
        draft.splice(0, draft.length, ...action.payload.notebooks);
      });
    default:
      return state;
  }
}
