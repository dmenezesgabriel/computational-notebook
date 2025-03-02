<!-- 1 -->

```jsx
(async () => {
  const React = await import("https://esm.sh/react@19/?dev");
  const ReactDOM = await import("https://esm.sh/react-dom@19/client?dev");
  const { Player } = await import(
    "https://esm.sh/@remotion/player@4.0.145/?dev"
  );
  const { interpolate, useCurrentFrame, useVideoConfig } = await import(
    "https://esm.sh/remotion@4.0.145/?dev"
  );

  // Video composition
  const MyComposition = () => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    const opacity = interpolate(frame, [0, durationInFrames], [0, 1], {
      extrapolateRight: "clamp",
    });

    return React.createElement(
      "div",
      {
        style: {
          flex: 1,
          backgroundColor: "#3498db",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
      },
      React.createElement(
        "h1",
        {
          style: {
            color: "white",
            fontSize: "60px",
            opacity,
          },
        },
        "Hello Remotion!",
      ),
    );
  };

  // Player component
  const App = () => {
    return React.createElement(Player, {
      component: MyComposition,
      durationInFrames: 90, // 3 seconds at 30fps
      compositionWidth: 1280,
      compositionHeight: 720,
      fps: 30,
      style: {
        width: "640px",
        height: "360px",
      },
      controls: true,
    });
  };

  // Render
  let rootElement = document.getElementById("root1");
  if (!rootElement) {
    rootElement = document.createElement("div");
    rootElement.id = "root1";
    document.body.appendChild(rootElement);
  }
  ReactDOM.createRoot(rootElement).render(React.createElement(App));
})();
```
