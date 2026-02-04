import LogLevelEnum from '~/tracer/enums/log-level.enum.ts';
import SpanKindEnum from '~/tracer/enums/span-kind.enum.ts';
import SpanStatusEnum from '~/tracer/enums/span-status.enum.ts';

export type AttributesType = Record<string, unknown>;

export type RedactionRule = {
  paths: string[];
  action: 'mask' | 'remove' | 'hash';
  replacement?: string;
};

export type EventType = {
  type: 'event';
  name: string;
  timestamp: number;
  data?: Record<string, unknown>;
  location?: string;
};

export type LogType = {
  type: 'log';
  level: LogLevelEnum;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
  location?: string;
};

export type TraceEntryType = EventType | LogType;

export type TraceType = {
  id: string;
  spanId: string;
  spanParentId?: string;
  name: string;
  kind: SpanKindEnum;
  status: SpanStatusEnum;

  startTime: number;
  endTime?: number;
  ended?: boolean;

  entries: Array<TraceEntryType>;
  attributes?: AttributesType;
};

export type TracerOptionsType = {
  name: string;
  kind?: SpanKindEnum;
  traceId?: string;
  parentId?: string;
  namespaces?: Array<string>;
  useWorker?: boolean;
};

export type SerializedTransportType = {
  moduleUrl: string;
  exportName: string;
  args: any[];
};

export type InitMessageType = {
  type: 'init';
  transport: SerializedTransportType;
};

export type SendMessageType = {
  type: 'send';
  data: TraceType;
};

export type BatchMessageType = {
  type: 'batch';
  data: TraceType[];
};

export type ShutdownMessageType = {
  type: 'shutdown';
};

export type WorkerMessageType = InitMessageType | SendMessageType | BatchMessageType | ShutdownMessageType;

export type TransportOptionsType = {
  log?: Array<LogLevelEnum> | boolean;
  event?: boolean;
  attributes?: boolean;
  namespaces?: Array<string>;
  pretty?: boolean;
  useWorker?: boolean;
};

export type HttpOptionsType = {
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  timeout?: number;
  signal: AbortSignal;
};

export type WorkerOptionsType = {
  baseUrl: string
}

export default {};
