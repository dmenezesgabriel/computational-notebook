<!-- 1 -->

```jsx
// Import Pixi.js from a CDN (using esm.sh for ES module support)
const PIXI = await import("https://esm.sh/pixi.js@6.0.4");

// Create a Pixi.js application with a canvas of 400x200 pixels and a white background
const app = new PIXI.Application({ width: 400, height: 200, backgroundColor: 0xffffff });

// Append the canvas to the DOM element with id "root", matching the React example
document.getElementById("root").appendChild(app.view);

// Create a text object to display the counter
const counterText = new PIXI.Text("Counter: 0", {
  fontFamily: "Arial",
  fontSize: 30, // Slightly larger than the React example's 20px for visibility
  fill: 0x000000, // Black color
});

// Center the counter text horizontally and position it near the top
counterText.anchor.set(0.5, 0); // Anchor at center-x, top-y
counterText.x = app.screen.width / 2; // Center horizontally
counterText.y = 50; // Position 50px from the top

// Create a graphics object for the button background
const button = new PIXI.Graphics();
button.beginFill(0xcccccc); // Light gray background
button.drawRect(0, 0, 150, 50); // Draw a 150x50 rectangle
button.endFill();

// Create a text object for the button label
const buttonText = new PIXI.Text("Increment", {
  fontFamily: "Arial",
  fontSize: 20, // Matches the React example's font size
  fill: 0x000000, // Black color
});
buttonText.anchor.set(0.5, 0.5); // Center the text within the button
buttonText.x = 75; // Center of the 150px-wide button
buttonText.y = 25; // Center of the 50px-high button

// Add the button text as a child of the button graphics
button.addChild(buttonText);

// Make the button interactive
button.interactive = true;
button.buttonMode = true; // Shows a hand cursor on hover

// Manage the count state manually
let count = 0;

// Add a click event handler to increment the count and update the counter text
button.on("pointerdown", () => {
  count++;
  counterText.text = `Counter: ${count}`;
});

// Position the button below the counter text, centered horizontally
button.x = (app.screen.width - 150) / 2; // Center the 150px-wide button
button.y = 100; // Position 100px from the top

// Add the counter text and button to the stage
app.stage.addChild(counterText);
app.stage.addChild(button);// New notebook cell
```
