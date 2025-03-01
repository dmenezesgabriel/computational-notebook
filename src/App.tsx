import "./index.css";

import { NotebooksManager } from "./pages/notebook-manager";
import { NotebooksProvider } from "./contexts/notebooks-context";
import { AppLayout } from "./pages/_layouts/app";

function App() {
  return (
    <NotebooksProvider>
      <AppLayout>
        <NotebooksManager />
      </AppLayout>
    </NotebooksProvider>
  );
}

export default App;
