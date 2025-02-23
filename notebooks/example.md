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
