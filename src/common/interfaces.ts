import type { JsonType, TimeType } from '~/common/types.ts';

/**
 * Extended errors with known keys
 *
 * @interface ExceptionInterface<K>
 *
 * @member {K | 'EXCEPTION'} key - Custom allowed keys
 * @member {string} name - Exeption name
 * @member {string} message - Exeption message
 * @member {JsonType} context - Metadata about the exception
 * @member {string | undefined} stack - Execution stack
 */
export interface ExceptionInterface<K, C = JsonType> extends Error {
  key?: K | 'ERROR';
  name: string;
  message: string;
  context?: C;
  stack?: string | undefined;
}

/**
 * Extended error options with context
 *
 * @interface ExceptionOptionsInterface
 *
 * @member {JsonType} context - Metadata about the exception
 */
export interface ExceptionOptionsInterface<C = JsonType> extends ErrorOptions {
  context?: C;
}

/**
 * Extended exceptions options with key
 *
 * @interface KeyableExceptionOptionsInterface
 *
 * @member {K} key - Custom allowed keys
 */
export interface KeyableExceptionOptionsInterface<K, C = JsonType> extends ExceptionOptionsInterface<C> {
  key?: K;
}

export interface InteropeableInterface {
  readonly name: string;
}

export interface TimerInterface {
  timers: Map<string, TimeType>;
  
  setTime(key: string): void
  endTime(key: string): void
  getTime(key: string): TimeType | undefined
  
  [Symbol.dispose](): void;
}

export interface QueueInterface<T, P> {
  enqueue(item: T): void
  flush(): void
  stop(): void
}

export default {};
