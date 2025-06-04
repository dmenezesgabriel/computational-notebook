<!-- 1 -->

```ts
const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.2/+esm");

const answerer = await pipeline('question-answering', 'Xenova/distilbert-base-cased-distilled-squad');
const question = 'Who was Jim Henson?';
const context = 'Jim Henson was a nice puppet.';
const output = await answerer(question, context);

output
```

<!-- 2 -->

```ts
const { END, START, StateGraph, Annotation } = await import("https://cdn.jsdelivr.net/npm/@langchain/langgraph@0.3.0/web/+esm");
const { BaseMessage, HumanMessage } =  await import("https://cdn.jsdelivr.net/npm/@langchain/core@0.3.57/messages/+esm");


const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
});

const nodeFn = async (_state: typeof GraphState.State) => {
  return { messages: [new HumanMessage("Hello from the browser!")] };
};

// Define a new graph
const workflow = new StateGraph(GraphState)
  .addNode("node", nodeFn)
  .addEdge(START, "node")
  .addEdge("node", END);

const app = workflow.compile({});

// Use the Runnable
const finalState = await app.invoke(
  { messages: [] },
);

console.log(finalState.messages[finalState.messages.length - 1].content);
```

<!-- 3 -->

```ts
const { END, START, StateGraph, Annotation } = await import("https://cdn.jsdelivr.net/npm/@langchain/langgraph@0.3.0/web/+esm");
const { BaseMessage, HumanMessage, AIMessage, getBufferString } = await import("https://cdn.jsdelivr.net/npm/@langchain/core@0.3.57/messages/+esm");
const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.2/+esm");

// 🧠 Define graph state with LangChain messages
const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
});

// 📦 Load a question-answering pipeline
const qaPipeline = await pipeline(
  'question-answering',
  'Xenova/distilbert-base-cased-distilled-squad'
);

// 🔗 Node function that processes the latest HumanMessage
const nodeFn = async (state) => {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  if (!(lastMessage instanceof HumanMessage)) {
    throw new Error("Last message must be a HumanMessage with the question.");
  }

  const question = lastMessage.content;

  // 🔥 Use a static context for this demo
  const context = "Jim Henson was a nice puppet.";

  const result = await qaPipeline(question, context);
  const answer = result.answer;

  return {
    messages: [new AIMessage(`Answer: ${answer}`)],
  };
};

// 🔧 Build the graph
const workflow = new StateGraph(GraphState)
  .addNode("qa_node", nodeFn)
  .addEdge(START, "qa_node")
  .addEdge("qa_node", END);

// 🚀 Compile the graph
const app = workflow.compile({});

// 🎯 Invoke with a HumanMessage as the question
const finalState = await app.invoke({
  messages: [new HumanMessage("Who was Jim Henson?")],
});

// 🖨️ Print the latest AI response
console.log(finalState.messages[finalState.messages.length - 1].content);
```
