<!-- 1 -->

```jsx
const React = await import("https://esm.sh/react@19/?dev");
const ReactDOM = await import("https://esm.sh/react-dom@19/client?dev");

function Counter() {
  const [count, setCount] = React.useState(0);
  return (
    <div style={{ textAlign: "center", fontSize: "20px" }}>
      <h2>Counter: {count}</h2>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

const rootDiv1 = document.createElement("div");
rootDiv1.setAttribute("id", "root1");

const domNode = document.getElementById("root");
const root1 = ReactDOM.createRoot(domNode);

root1.render(<Counter />);
```

<!-- 2 -->

```md
[Reference](https://peterkellner.net/2024/05/10/running-react-19-from-a-cdn-and-using-esm.sh/)
```
