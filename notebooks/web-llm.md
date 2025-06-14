<!-- 1 -->

```js
const { CreateMLCEngine, MLCEngine } = await import(
  "https://esm.run/@mlc-ai/web-llm"
);

const initProgressCallback = (progress) => {
  console.log("Model loading progress:", progress);
};

const engineInstance = new MLCEngine({ initProgressCallback });
await engineInstance.reload("Qwen2.5-0.5B-Instruct-q4f32_1-MLC");

const messages = [
  { role: "system", content: "You are a helpful AI assistant." },
  { role: "user", content: "Hello!" },
];

const reply = await engine.chat.completions.create({
  messages,
});

console.log(reply.choices[0].message);
console.log(reply.usage);
```

<!-- 2 -->

```js
import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

const initProgressCallback = (progress) => {
  console.log("Model loading progress:", progress);
};

const system_prompt = `
<purpose>
    You are a helpful assistant with access to tools for retrieving real-time information.
    Your primary task is to get the current weather at a specified location when requested.
</purpose>

<instructions>
    <instruction>When the user asks about the weather, respond with a single JSON object.</instruction>
    <instruction>The JSON must contain a "name" field for the tool and a "parameters" field with necessary arguments.</instruction>
    <instruction>Only use the tool if the request is about current weather.</instruction>
    <instruction>Return no text, no explanation, only the raw JSON object.</instruction>
    <instruction>The parameters object must contain "location" and "unit".</instruction>
</instructions>

<tools>
    <tool>
        <name>get_current_weather</name>
        <description>Get the current weather at a location.</description>
        <parameters>
            <parameter>
                <name>location</name>
                <type>string</type>
                <description>City and country, like "Tokyo, Japan"</description>
                <required>true</required>
            </parameter>
            <parameter>
                <name>unit</name>
                <type>string</type>
                <description>"celsius" or "fahrenheit"</description>
                <required>true</required>
            </parameter>
        </parameters>
    </tool>
</tools>

<expected-output>
    Output must be a JSON object like this:
    {"name": "get_current_weather", "parameters": {"location": "Tokyo", "unit": "celsius"}}
</expected-output>
`;

const selectedModel = "Qwen2.5-0.5B-Instruct-q4f32_1-MLC";


console.log("Starting model loading...");
const engine = await CreateMLCEngine(selectedModel, {
  initProgressCallback,
  logLevel: "INFO",
});
console.log("Model loaded.");

const messages = [
  { role: "system", content: system_prompt },
  { role: "user", content: "What’s the weather in Tokyo?" },
];

const request = {
  stream: false,
  messages,
  seed: 0,
};

console.log("Sending chat completion request...");
const reply = await engine.chat.completions.create(request);
console.log("Chat completion received.");

const content = reply.choices[0].message.content;

console.log("Usage:", reply.usage);
console.log("Raw model response:", content);

try {
  const parsed = JSON.parse(content ?? "");
  console.log("Function to call:", parsed.name);
  console.log("Parameters:", parsed.parameters);
} catch (e) {
  console.warn("Model did not return valid JSON:", e);
}
```
