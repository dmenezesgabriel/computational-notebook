<!-- 1 -->

```jsx
const React = await import("https://esm.sh/react@19/?dev");
const ReactDOM = await import("https://esm.sh/react-dom@19/client?dev");
const { Player } = await import("https://esm.sh/@remotion/player@4.0.145/?dev");
const { interpolate, useCurrentFrame, useVideoConfig } = await import(
  "https://esm.sh/remotion@4.0.145/?dev"
);

// Inject Tailwind via CDN
const tailwindStyles = document.createElement("link");
tailwindStyles.href = "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css";
tailwindStyles.rel = "stylesheet";
document.head.appendChild(tailwindStyles);

// Video composition with JSX
const MyComposition = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const opacity = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div className="flex flex-1 items-center justify-center bg-blue-500 h-full">
      <h1
        className="text-white text-6xl"
        style={{ opacity }}
      >
        Hello Remotion!
      </h1>
    </div>
  );
};

// Player component with JSX
const App = () => {
  return (
    <Player
      component={MyComposition}
      durationInFrames={90} // 3 seconds at 30fps
      compositionWidth={800}
      compositionHeight={400}
      fps={30}
      className="w-[640px] h-[360px]"
      controls
    />
  );
};

const domNode = document.getElementById("root");
const root1 = ReactDOM.createRoot(domNode);
root1.render(<App />);
```
