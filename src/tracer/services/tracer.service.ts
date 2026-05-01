import type { QueueInterface } from '~/common/interfaces.ts';
import type { TracerInterface, TransportInterface } from '~/tracer/interfaces.ts';
import type {
  AttributesType,
  TracerSpecsType,
  TraceType,
} from '~/tracer/types.ts';


import SpanEnum from '../enums/span.enum.ts';
import LogLevelEnum from '~/tracer/enums/log-level.enum.ts';
import StatusEnum from '../enums/status.enum.ts';
import Generator from '~/tracer/services/generator.service.ts';

export class Tracer implements TracerInterface {
  public trace: TraceType;
  public specs: TracerSpecsType;

  constructor(public queue: QueueInterface<TraceType, TransportInterface>, TRACER_SPECS: TracerSpecsType) {
    this.specs = TRACER_SPECS;
    this.trace = {
      id: this.specs.traceId || Generator.randomId(16),
      spanId: Generator.randomId(8),
      spanParentId: this.specs.parentId,
      name: this.specs.name,
      kind: this.specs.kind || SpanEnum.INTERNAL,
      status: StatusEnum.UNSET,
      startTime: performance.now(),
      entries: [],
    };
  }

  public start(options: Partial<TracerSpecsType> & { name: string }): TracerInterface {
    const childTracer = new Tracer(this.queue, {
      name: options.name,
      kind: options.kind,
      traceId: options.traceId || this.trace.id,
      parentId: this.trace.spanId,
      namespaces: options.namespaces || this.specs.namespaces,
      useWorker: options.useWorker ?? this.specs.useWorker,
    });
    
    return childTracer;
  }

  public status(status: StatusEnum): void {
    this.trace.status = status;
  }

  public attributes(attributes: AttributesType): void {
    this.trace.attributes = { ...this.trace.attributes, ...attributes };
  }

  public event(name: string, data?: Record<string, unknown>): void {
    const stack = new Error().stack;
    const caller = stack?.split('\n')[2]?.trim();
    const match = caller?.match(/at\s+(?:.*\s+\()?(.+):(\d+):(\d+)/);
    const location = match ? `${match[1].split('/').pop()}:${match[2]}` : undefined;
    
    this.trace.entries.push({
      type: 'event',
      name,
      timestamp: performance.now(),
      ...(data && { data }),
      ...(location && { location }),
    });
  }

  public end(): void {
    this.trace.ended = true;
    this.trace.endTime = performance.now();
    
    this.queue.enqueue(this.trace);
  }

  public flush(): void {
    if (this.queue) {
      this.queue.flush();
    }
  }

  private log(level: LogLevelEnum, message: string, data?: Record<string, unknown>, location?: string): void {
    this.trace.entries.push({
      type: 'log',
      level,
      message,
      timestamp: performance.now(),
      ...(data && { data }),
      ...(location && { location }),
    });
  }

  public info(...messages: Array<string | Record<string, unknown>>): void {
    const stack = new Error().stack;
    const caller = stack?.split('\n')[2]?.trim();
    const match = caller?.match(/at\s+(?:.*\s+\()?(.+):(\d+):(\d+)/);
    const location = match ? `${match[1].split('/').pop()}:${match[2]}` : undefined;
    
    const data = typeof messages[messages.length - 1] === 'object' && !Array.isArray(messages[messages.length - 1])
      ? messages.pop() as Record<string, unknown>
      : undefined;
    
    for (const message of messages as Array<string>) {
      this.log(LogLevelEnum.INFO, message, data, location);
    }
  }

  public warn(...messages: Array<string | Record<string, unknown>>): void {
    const stack = new Error().stack;
    const caller = stack?.split('\n')[2]?.trim();
    const match = caller?.match(/at\s+(?:.*\s+\()?(.+):(\d+):(\d+)/);
    const location = match ? `${match[1].split('/').pop()}:${match[2]}` : undefined;
    
    const data = typeof messages[messages.length - 1] === 'object' && !Array.isArray(messages[messages.length - 1])
      ? messages.pop() as Record<string, unknown>
      : undefined;
    
    for (const message of messages as Array<string>) {
      this.log(LogLevelEnum.WARN, message, data, location);
    }
  }

  public error(...messages: Array<string | Record<string, unknown>>): void {
    const stack = new Error().stack;
    const caller = stack?.split('\n')[2]?.trim();
    const match = caller?.match(/at\s+(?:.*\s+\()?(.+):(\d+):(\d+)/);
    const location = match ? `${match[1].split('/').pop()}:${match[2]}` : undefined;
    
    const data = typeof messages[messages.length - 1] === 'object' && !Array.isArray(messages[messages.length - 1])
      ? messages.pop() as Record<string, unknown>
      : undefined;
    
    for (const message of messages as Array<string>) {
      this.log(LogLevelEnum.ERROR, message, data, location);
    }
    if (this.trace.status === StatusEnum.UNSET) {
      this.trace.status = StatusEnum.REJECTED;
    }
  }

  public fatal(...messages: Array<string | Record<string, unknown>>): void {
    const stack = new Error().stack;
    const caller = stack?.split('\n')[2]?.trim();
    const match = caller?.match(/at\s+(?:.*\s+\()?(.+):(\d+):(\d+)/);
    const location = match ? `${match[1].split('/').pop()}:${match[2]}` : undefined;
    
    const data = typeof messages[messages.length - 1] === 'object' && !Array.isArray(messages[messages.length - 1])
      ? messages.pop() as Record<string, unknown>
      : undefined;
    
    for (const message of messages as Array<string>) {
      this.log(LogLevelEnum.FATAL, message, data, location);
    }
    this.trace.status = StatusEnum.REJECTED;
  }

  public debug(...messages: Array<string | Record<string, unknown>>): void {
    const stack = new Error().stack;
    const caller = stack?.split('\n')[2]?.trim();
    const match = caller?.match(/at\s+(?:.*\s+\()?(.+):(\d+):(\d+)/);
    const location = match ? `${match[1].split('/').pop()}:${match[2]}` : undefined;
    
    const data = typeof messages[messages.length - 1] === 'object' && !Array.isArray(messages[messages.length - 1])
      ? messages.pop() as Record<string, unknown>
      : undefined;
    
    for (const message of messages as Array<string>) {
      this.log(LogLevelEnum.DEBUG, message, data, location);
    }
  }

  [Symbol.dispose](): void {
    if (!this.trace.ended) {
      this.end();
    }
  }

  [Symbol.asyncDispose](): void {
    if (!this.trace.ended) {
      this.end();
    }
  }
}

export default Tracer;
