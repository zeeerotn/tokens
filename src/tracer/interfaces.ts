import type {
  AttributesType,
  TracerSpecsType,
  TraceType,
  TransportSpecsType
} from '~/tracer/types.ts';
import StatusEnum from './enums/status.enum.ts';

export interface RedactorInterface {
  redact(trace: TraceType): TraceType;
}

export interface TransportInterface {
  specs?: TransportSpecsType
  redactor: RedactorInterface
  send(data: TraceType | TraceType[]): Promise<void>;
}

export interface TracerInterface {
  trace: TraceType
  specs: TracerSpecsType

  start(options: Partial<TracerSpecsType> & { name: string }): TracerInterface;
  
  status(status: StatusEnum): void;
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
