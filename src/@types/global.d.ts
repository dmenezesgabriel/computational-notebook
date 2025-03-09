export declare global {
  interface Window {
    [key: string]: unknown;

    display?: (...args: unknown[]) => void;
    sharedContext?: { [key: string]: unknown };
  }
}
