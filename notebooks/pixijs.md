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

<!-- 2 -->

```jsx
const PIXI = await import("https://esm.sh/pixi.js@6.0.4");

const app = new PIXI.Application({
  width: 800,
  height: 600,
  backgroundColor: 0x1099bb,
});
document.body.appendChild(app.view);

// Load the spritesheet
PIXI.Loader.shared
  .add("character", "https://i.sstatic.net/AjFP5.png")
  .load(setup);

function setup() {
  // Create animated sprite from spritesheet
  const texture = PIXI.Loader.shared.resources["character"].texture;
  const spriteSize = 256
  const framesPerRow = 4
  const spriteWidth = spriteSize/framesPerRow
  const spriteHeight = spriteSize/framesPerRow;

  // Create texture arrays for each direction
  const downFrames = [];
  const leftFrames = [];
  const rightFrames = [];
  const upFrames = [];

  for (let i = 0; i < 4; i++) {
    downFrames.push(
      new PIXI.Texture(
        texture,
        new PIXI.Rectangle(i * spriteWidth, 0, spriteWidth, spriteHeight),
      ),
    );
    leftFrames.push(
      new PIXI.Texture(
        texture,
        new PIXI.Rectangle(
          i * spriteWidth,
          spriteHeight,
          spriteWidth,
          spriteHeight,
        ),
      ),
    );
    rightFrames.push(
      new PIXI.Texture(
        texture,
        new PIXI.Rectangle(
          i * spriteWidth,
          spriteHeight * 2,
          spriteWidth,
          spriteHeight,
        ),
      ),
    );
    upFrames.push(
      new PIXI.Texture(
        texture,
        new PIXI.Rectangle(
          i * spriteWidth,
          spriteHeight * 3,
          spriteWidth,
          spriteHeight,
        ),
      ),
    );
  }

  // Create animated sprite
  const character = new PIXI.AnimatedSprite(downFrames);
  character.animationSpeed = 0.2;
  character.loop = true;
  character.x = app.screen.width / 2;
  character.y = app.screen.height / 2;
  character.anchor.set(0.5);
  app.stage.addChild(character);

  // Movement variables
  const speed = 3;
  let currentDirection = "down";
  const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
  };

  // Keyboard events
  document.addEventListener("keydown", (e) => {
    switch (e.key.toLowerCase()) {
      case "w":
        keys.w = true;
        break;
      case "a":
        keys.a = true;
        break;
      case "s":
        keys.s = true;
        break;
      case "d":
        keys.d = true;
        break;
    }
  });

  document.addEventListener("keyup", (e) => {
    switch (e.key.toLowerCase()) {
      case "w":
        keys.w = false;
        break;
      case "a":
        keys.a = false;
        break;
      case "s":
        keys.s = false;
        break;
      case "d":
        keys.d = false;
        break;
    }
  });

  // Game loop
  app.ticker.add(() => {
    let moving = false;

    // Handle movement and direction changes
    if (keys.w) {
      character.y -= speed;
      if (currentDirection !== "up") {
        character.textures = upFrames;
        currentDirection = "up";
        character.gotoAndPlay(0);
      }
      moving = true;
    }
    if (keys.s) {
      character.y += speed;
      if (currentDirection !== "down") {
        character.textures = downFrames;
        currentDirection = "down";
        character.gotoAndPlay(0);
      }
      moving = true;
    }
    if (keys.a) {
      character.x -= speed;
      if (currentDirection !== "left") {
        character.textures = leftFrames;
        currentDirection = "left";
        character.gotoAndPlay(0);
      }
      moving = true;
    }
    if (keys.d) {
      character.x += speed;
      if (currentDirection !== "right") {
        character.textures = rightFrames;
        currentDirection = "right";
        character.gotoAndPlay(0);
      }
      moving = true;
    }

    // Control animation playback
    if (moving) {
      if (!character.playing) {
        character.play();
      }
    } else {
      character.stop();
      character.gotoAndStop(0);
    }

    // Keep character in bounds
    character.x = Math.max(
      spriteWidth / 2,
      Math.min(app.screen.width - spriteWidth / 2, character.x),
    );
    character.y = Math.max(
      spriteHeight / 2,
      Math.min(app.screen.height - spriteHeight / 2, character.y),
    );
  });
}
```
