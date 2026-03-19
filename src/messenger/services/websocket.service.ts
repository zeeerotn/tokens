import type { WebSocketInterface } from '~/messenger/interfaces.ts';
import type { WebSocketOptionsType } from '~/messenger/types.ts';

import WebSocketException from '~/messenger/exceptions/web-socket.exception.ts';

export class WebSocket implements WebSocketInterface {
  private socket: globalThis.WebSocket | null = null;
  private schedule: { timer: ReturnType<typeof setTimeout>; nextDelay: number } | null = null;

  get isOpen(): boolean {
    return !!this.socket && this.socket.readyState === globalThis.WebSocket.OPEN;
  }
  get isClosed(): boolean {
    return !!this.socket && this.socket.readyState === globalThis.WebSocket.CLOSED;
  }

  public onOpen = (): void => {}
  public onClose = (_event: CloseEvent): void => {}
  public onMessage = (_data: MessageEvent): void => {}
  public onExpired = (): void => {}
  public onError = (_error: Event | ErrorEvent): void => {}

  constructor(private options: WebSocketOptionsType) {  }
  
  public fnv1a(input: string): string {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 16777619) >>> 0;
    return h.toString(16).padStart(8, '0');
  }
  
  public hash(input: string): string {
    return `${this.fnv1a(input)}-${crypto.randomUUID()}`;
  }

  public reconnect(): void {
    const delay  = this.schedule?.nextDelay ?? this.options.connect.initialDelayMs ?? 100;
    const max    = this.options.connect.maxDelayMs ?? 30_000;
    const factor = this.options.connect.factor ?? 2;

    this.schedule = {
      timer: setTimeout(() => this.open(), delay),
      nextDelay: Math.min(delay * factor, max),
    };
  }

  private _onOpen(): void {
    if (this.schedule) {
      clearTimeout(this.schedule.timer);
      this.schedule = null;
    }
    this.onOpen();
  }

  private _onMessage(event: MessageEvent): void {
    this.onMessage(event);
  }

  private _onError(event: Event | ErrorEvent): void {
    this.onError(event);
  }

  private _onClose(event: CloseEvent): void {
    if (this.socket) {
      this.socket.onopen    = null;
      this.socket.onmessage = null;
      this.socket.onerror   = null;
      this.socket.onclose   = null;
    }
    this.socket = null;
    this.reconnect();
    this.onClose(event);
  }

  public open(): void {
    this.socket = new globalThis.WebSocket(this.options.connect.url, this.options.connect);

    this.socket.onopen = this._onOpen.bind(this);
    this.socket.onmessage = this._onMessage.bind(this);
    this.socket.onerror = this._onError.bind(this);
    this.socket.onclose = this._onClose.bind(this);
  }

  public close(code?: number, reason?: string): void {
    if (!this.isOpen) {
      Promise.resolve();
    }

    this.socket!.close(code ?? 1000, !code && !reason ? 'Normal closure' : reason);
  }
   
  public send(message: unknown): void {
    if (!this.isOpen) {
      throw new WebSocketException('Cannot send message: WebSocket is not connected', { key: 'NOT_CONNECTED' });
    }
    
    this.socket!.send(JSON.stringify(message));
  }
}

export default WebSocket;
