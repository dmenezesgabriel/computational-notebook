<!-- 1 -->

```js
// JavaScript cell example:
// 'a' will be attached to sharedContext automatically.
const a = 3;
a + 2;
```

<!-- 2 -->

```ts
// TypeScript cell example:
import * as math from "https://cdn.jsdelivr.net/npm/mathjs@12.3.0/+esm";

const b: number = math.sqrt(16);
b;
```

<!-- 3 -->

```md
# Hello from Markdown
```

<!-- 4 -->

```js
// JavaScript cell example using previously declared 'a':
a + 7;
```

<!-- 5 -->

```js
const x = [1, 2, 3, 4, 5, 6].map((index, item) => {
  const isEven = item % 2 === 0;
  return isEven;
});

x;
```

<!-- 6 -->

```js
x;
```

<!-- 7 -->

```jsx
import React from "https://cdn.jsdelivr.net/npm/react@18/+esm";
import ReactDOM from "https://cdn.jsdelivr.net/npm/react-dom@18/+esm";

function Greetings() {
  return (
    <h1>Hello readers, Thankyou for reading this blog! 'a' result is {a}</h1>
  );
}

function GrettingApp() {
  return <Greetings name="John" />;
}

const rootDiv1 = document.createElement("div");
rootDiv1.setAttribute("id", "root1");

const domNode = document.getElementById("root");
const root1 = ReactDOM.createRoot(domNode);

root1.render(<GrettingApp />);
```

<!-- 8 -->

```tsx
import React from "https://cdn.jsdelivr.net/npm/react@18/+esm";
import ReactDOM from "https://cdn.jsdelivr.net/npm/react-dom@18/+esm";

type HelloProps = {
  name: string;
};

function Hello({ name }: HelloProps) {
  return (
    <h1>
      Hello {name}, Thankyou for reading this blog! 'a' result is {a}
    </h1>
  );
}

function HelloApp() {
  return <Hello name="John" />;
}

const rootDiv2 = document.createElement("div");
rootDiv2.setAttribute("id", "root");

const domNode = document.getElementById("root");
const root2 = ReactDOM.createRoot(domNode);

root2.render(<HelloApp />);
```
