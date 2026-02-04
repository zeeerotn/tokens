import type {
  AttributesType,
  TransportOptionsType,
  TracerOptionsType,
  TraceType
} from '~/tracer/types.ts';
import SpanStatusEnum from '~/tracer/enums/span-status.enum.ts';

export interface RedactorInterface {
  redact(trace: TraceType): TraceType;
}

export interface TransportInterface {
  redactor: RedactorInterface
  options?: TransportOptionsType
  send(data: TraceType | TraceType[]): Promise<void>;
}

export interface TracerInterface {
  trace: TraceType
  options: TracerOptionsType

  start(options: Partial<TracerOptionsType> & { name: string }): TracerInterface;
  
  status(status: SpanStatusEnum): void;
  attributes(attributes: AttributesType): void;
  event(name: string, data?: Record<string, unknown>): void;
  
  end(): void;
  flush(): void;
  
  info(...messages: Array<string | Record<string, unknown>>): void;
  warn(...messages: Array<string | Record<string, unknown>>): void;
  error(...messages: Array<string | Record<string, unknown>>): void;
  fatal(...messages: Array<string | Record<string, unknown>>): void;
  debug(...messages: Array<string | Record<string, unknown>>): void;
  
  [Symbol.dispose](): void;
  [Symbol.asyncDispose](): void;
}

export default {};
