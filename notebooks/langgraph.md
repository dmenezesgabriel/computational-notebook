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

<!-- 4 -->

```ts
const { END, START, StateGraph, Annotation } = await import("https://cdn.jsdelivr.net/npm/@langchain/langgraph@0.3.0/web/+esm");
const { BaseMessage, HumanMessage, AIMessage } = await import("https://cdn.jsdelivr.net/npm/@langchain/core@0.3.57/messages/+esm");
const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.2/+esm");

// 🗺️ Define graph state
const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
});

// 📦 Load token-classification pipeline
const nerPipeline = await pipeline(
  'token-classification',
  'Xenova/bert-base-multilingual-cased-ner-hrl'
);

// 🛠️ Dummy weather tool
const getWeather = async (location) => {
  return `The weather in ${location} is sunny. ☀️`;
};

// 🔗 Node function for entity extraction + tool calling
const nerToolNode = async (state) => {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  if (!(lastMessage instanceof HumanMessage)) {
    throw new Error("Last message must be a HumanMessage.");
  }

  const inputText = lastMessage.content;

  const entities = await nerPipeline(inputText);

  console.log("Entities:", entities);

  // 🔥 Simple grouping for LOC
  const locations = entities
    .filter(e => e.entity.startsWith("B-LOC") || e.entity.startsWith("I-LOC"))
    .map(e => e.word);

  if (locations.length === 0) {
    return {
      messages: [new AIMessage("I couldn't detect a location.")],
    };
  }

  const location = locations.join(" "); // Merge if multiple tokens
  const weather = await getWeather(location);

  return {
    messages: [new AIMessage(weather)],
  };
};

// 🔧 Build the graph
const workflow = new StateGraph(GraphState)
  .addNode("ner_tool_node", nerToolNode)
  .addEdge(START, "ner_tool_node")
  .addEdge("ner_tool_node", END);

// 🚀 Compile
const app = workflow.compile({});

// 🎯 Invoke
const finalState = await app.invoke({
  messages: [new HumanMessage("What's the weather in Paris?")],
});

// 🖨️ Print
console.log(finalState.messages[finalState.messages.length - 1].content);
```

<!-- 5 -->

```ts
const { END, START, StateGraph, Annotation } = await import("https://cdn.jsdelivr.net/npm/@langchain/langgraph@0.3.0/web/+esm");
const { BaseMessage, HumanMessage, AIMessage } = await import("https://cdn.jsdelivr.net/npm/@langchain/core@0.3.57/messages/+esm");
const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.2/+esm");

// 🗺️ Define graph state
const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
});

// 📦 Load token-classification pipeline
const nerPipeline = await pipeline(
  'token-classification',
  'Xenova/bert-base-multilingual-cased-ner-hrl'
);

console.log(nerPipeline.model.config.id2label); // Available labels

// 🔧 Dummy tools
const getWeather = async (location) => `The weather in ${location} is sunny. ☀️`;
const getPersonInfo = async (person) => `${person} is a wonderful person. 🌟`;
const getOrgInfo = async (org) => `${org} is a successful company. 🏢`;

// 🔗 Node function for entity extraction + tool calling
const nerToolNode = async (state) => {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  if (!(lastMessage instanceof HumanMessage)) {
    throw new Error("Last message must be a HumanMessage.");
  }

  const inputText = lastMessage.content;

  const entities = await nerPipeline(inputText);

  console.log("Entities:", entities);

  // 🔥 Group consecutive tokens for full entities
  const groupedEntities = [];
  let current = null;

  for (const token of entities) {
    const label = token.entity.slice(2); // Remove B- or I-
    const prefix = token.entity.slice(0, 1);

    if (prefix === 'B' || !current) {
      if (current) groupedEntities.push(current);
      current = { entity_group: label, words: [token.word] };
    } else if (prefix === 'I' && current?.entity_group === label) {
      current.words.push(token.word);
    }
  }
  if (current) groupedEntities.push(current);

  console.log("Grouped Entities:", groupedEntities);

  if (groupedEntities.length === 0) {
    return {
      messages: [new AIMessage("I couldn't detect any relevant entities.")],
    };
  }

  // 🛠️ Process each entity based on type
  const responses = await Promise.all(groupedEntities.map(async (ent) => {
    const name = ent.words.join(" ").replace(" ##", ""); // Fix subword tokens
    switch (ent.entity_group) {
      case "LOC":
        return await getWeather(name);
      case "PER":
        return await getPersonInfo(name);
      case "ORG":
        return await getOrgInfo(name);
      default:
        return `I detected "${name}" of type ${ent.entity_group}, but I don't have a tool for that.`;
    }
  }));

  return {
    messages: [new AIMessage(responses.join("\n"))],
  };
};

const workflow = new StateGraph(GraphState)
  .addNode("ner_tool_node", nerToolNode)
  .addEdge(START, "ner_tool_node")
  .addEdge("ner_tool_node", END);

const app = workflow.compile({});

const finalState = await app.invoke({
  messages: [
    new HumanMessage("What's the weather in Paris and tell me about Elon Musk and Google."),
  ],
});

console.log(finalState.messages[finalState.messages.length - 1].content);
```

<!-- 6 -->

```md
START
  ↓
NER Node → checks for entities (table, column, value)
  ↓
Intent Node → Is it a database query?
   ├─ Yes → SQL Node → query DuckDB
   └─ No  → Fallback Node → default message
  ↓
END
```

<!-- 7 -->

```ts
const { END, START, StateGraph, Annotation } = await import("https://cdn.jsdelivr.net/npm/@langchain/langgraph@0.3.0/web/+esm");
const { BaseMessage, HumanMessage, AIMessage } = await import("https://cdn.jsdelivr.net/npm/@langchain/core@0.3.57/messages/+esm");
const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.2/+esm");
const duckdb = await import("https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/+esm");

const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
const worker_url = URL.createObjectURL(
  new Blob([`importScripts("${bundle.mainWorker}");`], { type: "text/javascript" })
);
const worker = new Worker(worker_url);
const logger = new duckdb.ConsoleLogger();
const db = new duckdb.AsyncDuckDB(logger, worker);
await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
URL.revokeObjectURL(worker_url);

// 🌟 Create sample table
const conn = await db.connect();
await conn.query(`
  CREATE TABLE employees (
    id INTEGER,
    name TEXT,
    department TEXT
  );
`);
await conn.query(`
  INSERT INTO employees VALUES
  (1, 'Alice', 'HR'),
  (2, 'Bob', 'Engineering'),
  (3, 'Charlie', 'Marketing'),
  (4, 'Diana', 'Engineering'),
  (5, 'Eve', 'HR');
`);

const nerPipeline = await pipeline(
  'token-classification',
  'Xenova/bert-base-multilingual-cased-ner-hrl'
);

const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({ reducer: (x, y) => x.concat(y) }),
  entities: Annotation<any[]>({ reducer: (_, y) => y }), // overwrite
  intent: Annotation<string>({ reducer: (_, y) => y })   // overwrite
});

const nerNode = async (state) => {
  const lastMessage = state.messages.at(-1);
  const input = lastMessage.content;

  const tokens = await nerPipeline(input);
  
  // Group tokens into entities
  const grouped = [];
  let current = null;

  for (const token of tokens) {
    const label = token.entity.slice(2);
    const prefix = token.entity.slice(0, 1);
    if (prefix === 'B' || !current) {
      if (current) grouped.push(current);
      current = { entity_group: label, words: [token.word] };
    } else if (prefix === 'I' && current?.entity_group === label) {
      current.words.push(token.word);
    }
  }
  if (current) grouped.push(current);

  console.log("Entities:", grouped);

  return {
    ...state,
    entities: grouped,
    messages: [
      ...state.messages,
      new AIMessage(`Detected entities: ${grouped.map(e => e.words.join(" ")).join(", ")}`)
    ],
  };
};

const intentNode = async (state) => {
  const text = state.messages.at(-2)?.content.toLowerCase() || "";

  const isDataQuery = ["show", "list", "data", "employee", "department"].some(word =>
    text.includes(word)
  );

  return {
    ...state,
    intent: isDataQuery ? "data_query" : "other",
  };
};

const sqlNode = async (state) => {
  const conn = await db.connect();

  const personEntities = state.entities.filter(e => e.entity_group === "PER");
  const orgEntities = state.entities.filter(e => e.entity_group === "ORG");
  const locEntities = state.entities.filter(e => e.entity_group === "LOC");
  
  const names = personEntities.map(e => e.words.join(" ").replace(" ##", ""));
  const departments = orgEntities.map(e => e.words.join(" ").replace(" ##", ""));

  // Build WHERE clause
  const conditions = [];
  if (names.length > 0) {
    const nameConditions = names.map(n => `name = '${n}'`);
    conditions.push(`(${nameConditions.join(" OR ")})`);
  }
  if (departments.length > 0) {
    const deptConditions = departments.map(d => `department = '${d}'`);
    conditions.push(`(${deptConditions.join(" OR ")})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `SELECT * FROM employees ${whereClause};`;

  console.log("Generated SQL:", query);

  try {
    const result = await conn.query(query);
    const rows = result.toArray().map(r => r.toJSON());

    if (rows.length === 0) {
      return {
        ...state,
        messages: [
          ...state.messages,
          new AIMessage(`No results found for your query.`),
        ],
      };
    }

    return {
      ...state,
      messages: [
        ...state.messages,
        new AIMessage(`Query results:\n${JSON.stringify(rows, null, 2)}`),
      ],
    };
  } catch (err) {
    return {
      ...state,
      messages: [
        ...state.messages,
        new AIMessage(`SQL Error: ${err.message}`),
      ],
    };
  }
};


const fallbackNode = async (state) => {
  return {
    ...state,
    messages: [
      ...state.messages,
      new AIMessage("I'm not sure how to answer that, but I'm learning!"),
    ],
  };
};

const workflow = new StateGraph(GraphState)
  .addNode("ner", nerNode)
  .addNode("detect_intent", intentNode)
  .addNode("sql", sqlNode)
  .addNode("fallback", fallbackNode)
  .addEdge(START, "ner")
  .addEdge("ner", "detect_intent")
  .addConditionalEdges("detect_intent", (state) => {
    return state.intent === "data_query" ? "sql" : "fallback";
  })
  .addEdge("sql", END)
  .addEdge("fallback", END);

const app = workflow.compile({});

const finalState = await app.invoke({
  messages: [
    // new HumanMessage("Show me the employees in the company."),
    // new HumanMessage("List employees in Engineering."),
    new HumanMessage("What department is Alice in?"),
    // new HumanMessage("Show employees in HR and Engineering."),
    // new HumanMessage("Who works in Marketing?"),

  ],
});

console.log(
  finalState.messages.map(m => m.content).join("\n")
);
```
