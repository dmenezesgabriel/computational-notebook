<!-- 1 -->

```js
const duckdb = await import("https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/+esm");

const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

// Select a bundle based on browser checks
const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

const worker_url = URL.createObjectURL(
  new Blob([`importScripts("${bundle.mainWorker}");`], {
    type: "text/javascript",
  })
);

const worker = new Worker(worker_url);
const logger = new duckdb.ConsoleLogger();
const db = new duckdb.AsyncDuckDB(logger, worker);
await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
URL.revokeObjectURL(worker_url);
```

<!-- 2 -->

```js
let conn = await db.connect();

const result = await conn.query("SELECT 42 as col");

const out = result.toArray().map((row) => row.toJSON());
```

<!-- 3 -->

```js
const url = 'https://raw.githubusercontent.com/plotly/datasets/master/2015_flights.parquet';

const response = await fetch(url);
if (!response.ok){
    throw Error("Failed to fetch")
}

const buffer = await response.arrayBuffer();
const uint8Array = new Uint8Array(buffer);
await db.registerFileBuffer('2015_flights.parquet', uint8Array);


const data = await conn.query(`
SELECT * FROM read_parquet('2015_flights.parquet') LIMIT 10;
`
)

const rows = data.toArray().map(row => {
  const jsonRow = row.toJSON();
  for (const key in jsonRow) {
    if (typeof jsonRow[key] === 'bigint') {
      jsonRow[key] = jsonRow[key].toString();
    }
  }
  return jsonRow;
});

console.log(data.toString())
```

<!-- 4 -->

```js
const { default: Handlebars } = await import("https://cdn.jsdelivr.net/npm/handlebars@4.7.8/+esm");

await conn.query(`
  CREATE TABLE sales (region TEXT, amount INT);
  INSERT INTO sales VALUES ('US', 100), ('EU', 200), ('US', 150);
`);

const sqlTemplate = `
  SELECT region, SUM(amount) as total
  FROM sales
  {{#if regionFilter}}
    WHERE region = '{{regionFilter}}'
  {{/if}}
  GROUP BY region
`;

const template = Handlebars.compile(sqlTemplate);

const query = template({ regionFilter: "US" });

console.log("Executing SQL:\n", query);

const result = await conn.query(query);
const output = result.toArray().map((row) => row.toJSON());
console.log("Query Result:", output);
```
