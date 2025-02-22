import { EditorState, Compartment } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { useEffect, useMemo, useRef } from "react";
import type { EditorLanguages } from "../types";

interface CodeEditorProps {
  value: string;
  language: EditorLanguages;
  onChange: (value: string) => void;
}

export function CodeEditor({ value, language, onChange }: CodeEditorProps) {
  const editorDivRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView>();
  // Create a compartment for the language extension.
  const languageCompartment = useRef(new Compartment());
  const languages = useMemo(
    () => ({
      javascript: javascript(),
      typescript: javascript({ typescript: true }),
      markdown: markdown(),
    }),
    []
  );

  useEffect(() => {
    if (editorDivRef.current) {
      // Create an EditorState with initial doc and extensions.
      const startState = EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          oneDark,
          languageCompartment.current.of(
            languages[language] || languages.javascript
          ),
          // Update listener to propagate changes.
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const text = update.state.doc.toString();
              onChange(text);
            }
          }),
        ],
      });
      // Create the EditorView.
      const view = new EditorView({
        state: startState,
        parent: editorDivRef.current,
      });
      editorViewRef.current = view;

      return () => {
        view.destroy();
      };
    }
  }, [language, languages, onChange, value]); // initialize once on mount

  // Update editor content if the external value changes.
  useEffect(() => {
    const view = editorViewRef.current;

    if (view) {
      const currentValue = view.state.doc.toString();
      if (currentValue !== value) {
        view.dispatch({
          changes: { from: 0, to: currentValue.length, insert: value },
        });
      }
    }
  }, [value]);

  // Update language if it changes using the compartment.
  useEffect(() => {
    const view = editorViewRef.current;
    if (view) {
      const newExtension = languages[language] || languages.javascript;

      view.dispatch({
        effects: languageCompartment.current.reconfigure(newExtension),
      });
    }
  }, [language, languages]);

  return (
    <div ref={editorDivRef} className="rounded-md border border-gray-300" />
  );
}
