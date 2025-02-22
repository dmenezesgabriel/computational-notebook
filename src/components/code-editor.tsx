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
  const languageCompartment = useRef(new Compartment());
  const initialValueRef = useRef(value);

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
      const startState = EditorState.create({
        doc: initialValueRef.current,
        extensions: [
          basicSetup,
          oneDark,
          languageCompartment.current.of(
            languages[language] || languages.javascript
          ),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const text = update.state.doc.toString();
              onChange(text);
            }
          }),
        ],
      });

      const view = new EditorView({
        state: startState,
        parent: editorDivRef.current,
      });
      editorViewRef.current = view;

      return () => {
        view.destroy();
      };
    }
  }, []); // Only initialize once on mount

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

  useEffect(() => {
    const view = editorViewRef.current;
    if (view) {
      const newExtension = languages[language] || languages.javascript;
      view.dispatch({
        effects: languageCompartment.current.reconfigure(newExtension),
      });
    }
  }, [language, languages]);

  return <div ref={editorDivRef} />;
}
