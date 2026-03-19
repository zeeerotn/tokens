import type { RequireAtLeastOne } from '@zeeerotn/tokens';

import IntentEnum from '~/messenger/enums/intent.enum.ts';
import ExchangeEventEnum from '~/messenger/enums/exchange-event.enum.ts';
import SocketEventEnum from '~/messenger/enums/socket-event.enum.ts';

export type IntentType<E> = {
  event: E
  source?: string;
  target?: string;
  topics?: Array<string>;
  timestamp: number;
  [key: string]: unknown;
}

export type ContentType = {
  data?: unknown;
  meta?: Record<string, unknown>;
}

export type MessageType<E> = {
  id: string;
  tag?: string;
  content?: ContentType;
} & RequireAtLeastOne<Record<IntentEnum, IntentType<E>>>


export type WebSocketOptionsType = {
  name: string;
  instance: string;
  version: string;
  connect: {
    url: string;
    headers?: HeadersInit;
    client?: Deno.HttpClient;
    protocols?: string | string[];
    initialDelayMs?: number;
    maxDelayMs?: number;
    factor?: number;
  }
};

export type ExchangeOptionsType = WebSocketOptionsType & {
  onTokenExpired?: () => void;
};

export type WebSocketHandler = (event: Event | ErrorEvent | MessageEvent) => void;

export type ExchangeHandler = (intent: IntentEnum, message: MessageType<SocketEventEnum | ExchangeEventEnum>) => Promise<void>

