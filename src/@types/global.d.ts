export declare global {
  interface Window {
    [key: string]: any;

    display?: (...args: any[]) => void;
    sharedContext: { [key: string]: any };
  }
}
