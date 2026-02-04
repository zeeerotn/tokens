import type { TracerInterface, TransportInterface } from '~/tracer/interfaces.ts';
import type {
  AttributesType,
  TracerOptionsType,
  TraceType,
} from '~/tracer/types.ts';

import SpanKindEnum from '~/tracer/enums/span-kind.enum.ts';
import LogLevelEnum from '~/tracer/enums/log-level.enum.ts';
import SpanStatusEnum from '~/tracer/enums/span-status.enum.ts';
import Generator from '~/tracer/services/generator.service.ts';
import QueueService from '~/common/services/queue.service.ts';

export class Tracer implements TracerInterface {
  public trace: TraceType;

  constructor(public queue: QueueService<TraceType, TransportInterface>, public options: TracerOptionsType) {
    this.trace = {
      id: options.traceId || Generator.randomId(16),
      spanId: Generator.randomId(8),
      spanParentId: options.parentId,
      name: options.name,
      kind: options.kind || SpanKindEnum.INTERNAL,
      status: SpanStatusEnum.UNSET,
      startTime: Date.now(),
      entries: [],
    };
  }

  public start(options: Partial<TracerOptionsType> & { name: string }): TracerInterface {
    const childTracer = new Tracer(this.queue, {
      name: options.name,
      kind: options.kind,
      traceId: options.traceId || this.trace.id,
      parentId: this.trace.spanId,
      namespaces: options.namespaces || this.options.namespaces,
      useWorker: options.useWorker ?? this.options.useWorker,
    });
    
    return childTracer;
  }

  public status(status: SpanStatusEnum): void {
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
      timestamp: Date.now(),
      ...(data && { data }),
      ...(location && { location }),
    });
  }

  public end(): void {
    this.trace.ended = true;
    this.trace.endTime = Date.now();
    
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
      timestamp: Date.now(),
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
    if (this.trace.status === SpanStatusEnum.UNSET) {
      this.trace.status = SpanStatusEnum.REJECTED;
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
    this.trace.status = SpanStatusEnum.REJECTED;
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
