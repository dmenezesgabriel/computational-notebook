function getCircularReplacer() {
  const seen = new WeakSet();
  return (_key: string, value: unknown) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }
    return value;
  };
}

export function setupDisplay(logs: string[]) {
  return (...args: unknown[]) => {
    const message = args
      .map((arg) =>
        typeof arg === "object"
          ? JSON.stringify(arg, getCircularReplacer())
          : arg
      )
      .join(" ");

    logs.push(message);

    console.log(...args);
  };
}
