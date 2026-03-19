import type { ContentType, ExchangeHandler } from '~/messenger/types.ts';

export interface SignalInterface<T>  {
  listeners: {
    [K in keyof T]?: Array<(...args: T[K] extends any[] ? T[K] : [T[K]]) => void>;
  }

  subscribe<K extends keyof T>(eventName: K, callback: (...args: T[K] extends any[] ? T[K] : [T[K]]) => void): () => void
  unsubscribe<K extends keyof T>(eventName: K, callback: (...args: T[K] extends any[] ? T[K] : [T[K]]) => void): void
  dispatch<K extends keyof T>(eventName: K, ...args: T[K] extends any[] ? T[K] : [T[K]]): Promise<void>
  
  [Symbol.dispose](): void;
}

export interface WebSocketInterface {
  onOpen: () => void;
  onClose: (event: CloseEvent) => void;
  onMessage: (event: MessageEvent) => void;
  onError: (error: Event | ErrorEvent) => void;
  
  fnv1a(input: string): string
  hash(input: string): string
  
  open(): void;
  send(message: unknown): void;
  close(code?: number, reason?: string): void;
}

export interface ExchangeInterface {
  connect(): void;
  disconnect(): void;
  
  randomUUID(): string;
  
  publish(key: string, topics: Array<string>, content: ContentType): void;
  unpublish(key: string): void;

  subscribe(key: string, topics: string | Array<string>, handler: ExchangeHandler): void;
  unsubscribe(key: string, topics: string | Array<string>): void;
}

export default {}