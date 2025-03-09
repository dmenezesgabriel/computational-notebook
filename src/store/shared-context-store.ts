import { create } from "zustand";

interface SharedContextState {
  sharedContext: { [key: string]: unknown };
  setContext: (key: string, value: unknown) => void;
  mergeContext: (newContext: { [key: string]: unknown }) => void;
  clearContext: () => void;
}

export const useSharedContextStore = create<SharedContextState>((set) => ({
  sharedContext: {},
  setContext: (key, value) =>
    set((state) => ({
      sharedContext: { ...state.sharedContext, [key]: value },
    })),
  mergeContext: (newContext) =>
    set((state) => ({
      sharedContext: { ...state.sharedContext, ...newContext },
    })),
  clearContext: () =>
    set(() => ({
      sharedContext: {},
    })),
}));
