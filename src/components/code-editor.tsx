import { EditorState, Compartment } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { useEffect, useRef } from "react";

interface CodeEditorProps {
  value: string;
  language: "javascript" | "typescript" | "markdown";
  onChange: (value: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  language,
  onChange,
}) => {
  const editorDivRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView>();
  // Create a compartment for the language extension.
  const languageCompartment = useRef(new Compartment());

  useEffect(() => {
    if (editorDivRef.current) {
      // Create an EditorState with initial doc and extensions.
      const startState = EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          oneDark,
          languageCompartment.current.of(
            language === "javascript"
              ? javascript()
              : javascript({ typescript: true })
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
  }, []); // initialize once on mount

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
      const newExtension =
        language === "javascript"
          ? javascript()
          : javascript({ typescript: true });

      view.dispatch({
        effects: languageCompartment.current.reconfigure(newExtension),
      });
    }
  }, [language]);

  return (
    <div ref={editorDivRef} className="rounded-md border border-gray-300" />
  );
};
