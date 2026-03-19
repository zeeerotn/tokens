import type { ExchangeOptionsType, ExchangeHandler, ContentType, MessageType } from '~/messenger/types.ts';
import type { ExchangeInterface } from '~/messenger/interfaces.ts';

import ExchangeEventEnum from '~/messenger/enums/exchange-event.enum.ts';
import IntentEnum from '~/messenger/enums/intent.enum.ts';
import WebSocket from '~/messenger/services/websocket.service.ts';
import { SocketEventEnum } from '../enums/socket-event.enum.ts';

// @TODO We need to implement a HEARTBET mechanism to detect and close stale connections
export class Exchange implements ExchangeInterface {
  private socket: WebSocket;
  private subscribers: Map<string, Map<string, ExchangeHandler>> = new Map();
  
  constructor(
    private exchangeOptions: ExchangeOptionsType,
  ) {
    const query = `name=${exchangeOptions.name}&instance=${exchangeOptions.instance}&version=${exchangeOptions.version}`;

    this.socket = new WebSocket({
      name: exchangeOptions.name,
      instance: exchangeOptions.instance,
      version: exchangeOptions.version,
      connect: {
        ...exchangeOptions.connect,
        url: `${exchangeOptions.connect.url}?${query}`,
      },
    });

    this.socket.onOpen = () => this.listen(SocketEventEnum.OPEN, new Event('open'));
    this.socket.onClose = (event: CloseEvent) => this.listen(SocketEventEnum.CLOSE, event);
    this.socket.onMessage = (event: MessageEvent) => this.listen('MESSAGE', event);
    this.socket.onError = (event: Event | ErrorEvent) => this.listen(SocketEventEnum.ERROR, event);
  }

  public randomUUID(): string {
    return crypto.randomUUID();
    // return this.socket.hash(`${this.exchangeOptions.name}:${this.exchangeOptions.instance}`);
  }

  public connect(): void {
    this.socket.open();
  }

  public disconnect(): void {
    this.socket.close()
  }

  public publish(key: string, topics: string | Array<string>, content: ContentType): void {
    const message = {
      id: this.randomUUID(),
      rid: key,
      accept: {
        event: ExchangeEventEnum.PUBLISH,
        topics: Array.isArray(topics) ? topics : [topics],
        timestamp: Date.now(),
      },
      content,
    }

    this.socket.send(message);
  }

  public unpublish(key: string): string {
   const message = {
      id: this.randomUUID(),
      rid: key,
      exclude: {
        event: ExchangeEventEnum.PUBLISH,
        timestamp: Date.now(),
      },
    }

    this.socket.send(message);

    return message.id;
  }

  public subscribe(key: string, topics: string | Array<string>, handler: ExchangeHandler): void {        
    const list = Array.isArray(topics) ? topics : [topics];

    for (const topic of list) {
      if (!this.subscribers.has(topic)) {
        this.subscribers.set(topic, new Map());

        const message = {
          id: this.randomUUID(),
          accept: {
            event: ExchangeEventEnum.SUBSCRIBE,
            topics: [topic],
            timestamp: Date.now(),
          },
        }

        this.socket.send(message);
      }

      this.subscribers.get(topic)!.set(key, handler);
    }
  }

  public unsubscribe(key: string, topics: string | Array<string>): void {
    const list = Array.isArray(topics) ? topics : [topics];
    for (const topic of list) {
      if (!this.subscribers.has(topic)) continue;
      
      this.subscribers.get(topic)!.delete(key);
      if (this.subscribers.get(topic)?.size === 0) {
        const message = {
          id: this.randomUUID(),
          exclude: {
            event: ExchangeEventEnum.SUBSCRIBE,
            topics: [topic],
            timestamp: Date.now(),
          },
        }

        this.socket.send(message);
      }
    }
  }

  private listen(type: SocketEventEnum | ExchangeEventEnum | 'MESSAGE', data: Event | ErrorEvent | MessageEvent): void {
    let intent: IntentEnum = IntentEnum.ACCEPT;
    let message: MessageType<SocketEventEnum | ExchangeEventEnum> = {
      id: this.randomUUID(),
      accept: {
        event: SocketEventEnum.ERROR,
        timestamp: Date.now(),
      }
    }

    if (type === 'MESSAGE') {
      message = JSON.parse((data as MessageEvent).data) as MessageType<SocketEventEnum | ExchangeEventEnum>;
      
      if (message.decline) intent = IntentEnum.DECLINE;
      if (message.exception) intent = IntentEnum.EXCEPTION;
      if (message.expire) intent = IntentEnum.EXPIRE;
    }

    const event = message[intent]?.event || 'unknown'

    for (const handler of this.subscribers.get(event)?.values() || []) {
      try {
        handler(intent, message);
      } catch (error) {
        console.error(`Error handling message for topic ${event}:`, error);
      }
    }
  }
}

export default Exchange;
