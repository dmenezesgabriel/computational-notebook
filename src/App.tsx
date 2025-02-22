import "./index.css";

import { NotebooksManager } from "./components/notebook-manager";
import { NotebookProvider } from "./contexts/notebook-context";

function App() {
  return (
    <NotebookProvider>
      <NotebooksManager />
    </NotebookProvider>
  );
}

export default App;
