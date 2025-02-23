import "./index.css";

import { NotebooksManager } from "./components/notebook-manager";
import { NotebooksProvider } from "./contexts/notebooks-context";

function App() {
  return (
    <NotebooksProvider>
      <NotebooksManager />
    </NotebooksProvider>
  );
}

export default App;
