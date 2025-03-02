<!-- 1 -->

```jsx
const React = await import("https://esm.sh/react@19/?dev");
const ReactDOM = await import("https://esm.sh/react-dom@19/client?dev");
const d3 = await import("https://esm.sh/d3@7/?dev");

function BarChart() {
  const [data, setData] = React.useState([20, 35, 15, 40, 25]);
  const chartRef = React.useRef(null);

  React.useEffect(() => {
    // D3 chart creation
    const svg = d3.select(chartRef.current)
      .attr("width", 400)
      .attr("height", 200);

    // Clear previous content
    svg.selectAll("*").remove();

    // Create bars
    svg.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d, i) => i * 80)
      .attr("y", d => 200 - d)
      .attr("width", 70)
      .attr("height", d => d)
      .attr("fill", "steelblue");
  }, [data]);

  const randomizeData = () => {
    const newData = Array.from({ length: 5 }, () => 
      Math.floor(Math.random() * 100)
    );
    setData(newData);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>React + D3 Bar Chart</h2>
      <svg ref={chartRef}></svg>
      <br />
      <button 
        onClick={randomizeData}
        style={{ marginTop: "10px", padding: "5px 10px" }}
      >
        Randomize Data
      </button>
    </div>
  );
}

// Create and render the component
const domNode = document.getElementById("root");
const root = ReactDOM.createRoot(domNode);
root.render(<BarChart />);
```
