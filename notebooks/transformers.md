<!-- 1 -->

```js
const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.2/+esm");

// Allocate a pipeline for sentiment-analysis
const pipe = await pipeline("sentiment-analysis");

const out = await pipe("I love transformers!");
// [{'label': 'POSITIVE', 'score': 0.999817686}]

out;
```

<!-- 2 -->

```js
const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.2/+esm");

// Create a text generation pipeline
const generator = await pipeline(
  "text-generation",
  "HuggingFaceTB/SmolLM2-135M-Instruct",
);

// Define the list of messages
const messages = [
  { role: "system", content: "You are a helpful assistant." },
  { role: "user", content: "Tell me a joke." },
];

// Generate a response
const output = await generator(messages, { max_new_tokens: 128 });
console.log(output[0].generated_text.at(-1).content);
// "Why don't scientists trust atoms?\n\nBecause they make up everything!"
```
