
export interface DispatchInterface<T>  {
  listeners: {
    [K in keyof T]?: Array<(...args: T[K] extends any[] ? T[K] : [T[K]]) => void>;
  }

  subscribe<K extends keyof T>(eventName: K, callback: (...args: T[K] extends any[] ? T[K] : [T[K]]) => void): () => void
  unsubscribe<K extends keyof T>(eventName: K, callback: (...args: T[K] extends any[] ? T[K] : [T[K]]) => void): void
  dispatch<K extends keyof T>(eventName: K, ...args: T[K] extends any[] ? T[K] : [T[K]]): Promise<void>
  
  [Symbol.dispose](): void;
}

export default {}