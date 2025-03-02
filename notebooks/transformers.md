<!-- 1 -->

```js
const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.2/+esm");

// Allocate a pipeline for sentiment-analysis
const pipe = await pipeline("sentiment-analysis");

const out = await pipe("I love transformers!");
// [{'label': 'POSITIVE', 'score': 0.999817686}]

out;
```
