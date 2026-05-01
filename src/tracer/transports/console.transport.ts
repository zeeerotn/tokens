import type { TraceType, TransportSpecsType } from '~/tracer/types.ts';
import type { TransportInterface, RedactorInterface } from '~/tracer/interfaces.ts';

import LogLevelEnum from '~/tracer/enums/log-level.enum.ts';
import StatusEnum from '~/tracer/enums/status.enum.ts';
import Console from '~/common/services/console.service.ts';

export class ConsoleTransport implements TransportInterface {
  public specs?: TransportSpecsType;

  public logColors = {
    [LogLevelEnum.ERROR]: Console.red.dark,
    [LogLevelEnum.FATAL]: Console.red.medium,
    [LogLevelEnum.WARN]: Console.yellow.dark,
    [LogLevelEnum.INFO]: Console.gray.dark,
    [LogLevelEnum.DEBUG]: Console.gray.medium,
  };

  public traceColors = {
    [StatusEnum.UNSET]: Console.yellow.cream,
    [StatusEnum.RESOLVED]: Console.green.dark,
    [StatusEnum.REJECTED]: Console.red.dark,
  }

constructor(public redactor: RedactorInterface, TRANSPORT_SPECS?: TransportSpecsType) {
  this.specs = TRANSPORT_SPECS;
}

  public send(data: TraceType | TraceType[]): Promise<void> {
    const traces = Array.isArray(data) ? data : [data];
    
    for (let trace of traces) {
      // Apply redaction first if configured
      if (this.redactor) {
        trace = this.redactor.redact(trace);
      }
      
      let filteredEntries = [...trace.entries];
      
      const shouldIncludeLogs = this.specs?.log === undefined || this.specs.log === true;
      if (!shouldIncludeLogs) {
        filteredEntries = filteredEntries.filter(entry => entry.type !== 'log');
      } else if (Array.isArray(this.specs?.log)) {
        filteredEntries = filteredEntries.filter(entry => 
          entry.type !== 'log' || (this.specs?.log as LogLevelEnum[]).includes(entry.level)
        );
      }
      
      const shouldIncludeEvents = this.specs?.event === undefined || this.specs.event === true;
      if (!shouldIncludeEvents) {
        filteredEntries = filteredEntries.filter(entry => entry.type !== 'event');
      }
      
      const shouldIncludeAttributes = this.specs?.attributes === undefined || this.specs.attributes === true;
      const filteredTrace = shouldIncludeAttributes 
        ? { ...trace, entries: filteredEntries }
        : { ...trace, entries: filteredEntries, attributes: undefined };

      if (this.specs?.pretty) {
        this.prettyPrint(filteredTrace);
      } else {
        console.log(JSON.stringify(filteredTrace));
      }
    }
    
    return Promise.resolve();
  }

  private timestampToFullDateString(timestamp: number): string {
    const date = new Date(performance.timeOrigin + timestamp);
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}/${month}/${day} ${this.timestampToTimeString(timestamp)} UTC`;
  }

  private timestampToTimeString(timestamp: number): string {
    const date = new Date(performance.timeOrigin + timestamp);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    const milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  private formatDuration(ms: number): string {
    if (ms < 0) ms = 0;

    if (ms < 0.001) { // less than 1µs
      return `${parseFloat((ms * 1000).toFixed(3))} µs`;
    }
    if (ms < 1000) {
      return `${parseFloat(ms.toFixed(3))} ms`;
    }
    const seconds = ms / 1000;
    if (seconds < 60) {
      return `${parseFloat(seconds.toFixed(3))} s`;
    }
    const minutes = seconds / 60;
    if (minutes < 60) {
      return `${parseFloat(minutes.toFixed(3))} m`;
    }
    const hours = minutes / 60;
    return `${parseFloat(hours.toFixed(3))} h`;
  }

  private prettyPrint(data: TraceType): void {
    const name = data.name.toUpperCase();
    const traceColor = this.traceColors[data.status]
    const timestamp = this.timestampToFullDateString(data.startTime);
    const duration = this.formatDuration(data.endTime ? data.endTime - data.startTime : 0);

    let log = console.log;
    if (data.status === StatusEnum.REJECTED) log = console.error;
    
    log(`${traceColor}·  TRACE ${String(data.kind).toUpperCase()} ${name} at ${timestamp} took ${duration} was ${data.status}${Console.reset}`);

    const items: Array<{ type: 'span' | 'attrs' | 'entry', timestamp: number, data: any }> = [];

    items.push({ type: 'span', timestamp: data.startTime, data: { id: data.id, spanId: data.spanId, spanParentId: data.spanParentId } });
    
    if (data.attributes) {
      items.push({ type: 'attrs', timestamp: data.startTime, data: JSON.stringify(data.attributes) });
    }
    
    for (const entry of data.entries) {
      items.push({ type: 'entry', timestamp: entry.timestamp, data: entry });
    }
    
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const isLast = index === items.length - 1;
      const indent = isLast ? '└─' : '├─';
      
      if (item.type === 'span') {
        let parentId = ``
        if (item.data.spanParentId) {
          parentId = ` spanParentId ${item.data.spanParentId} `;
        }
        log(`${Console.gray.medium}${indent} SPAN traceId ${item.data.id}${parentId} spanId ${item.data.spanId}${Console.reset}`);
      }
      
      if (item.type === 'attrs') {
        log(`${Console.gray.medium}${indent} WITH ${item.data}${Console.reset}`);
      }
      
      if (item.type === 'entry' && item.data.type === 'event') {
        const eventTime = this.timestampToTimeString(item.timestamp);
        const dataStr = item.data.data ? ` with ${JSON.stringify(item.data.data)}` : '';
        const location = item.data.location ? ` in ${item.data.location}` : '';
        log(`${Console.gray.medium}${indent} EVENT${location} at ${eventTime} name ${item.data.name}${dataStr}${Console.reset}`);
      }
      
      if (item.type === 'entry' && item.data.type === 'log') {
        const logTime = this.timestampToTimeString(item.timestamp);
        const logColor = this.logColors[item.data.level as keyof typeof this.logColors];
        let key = LogLevelEnum[item.data.level] || 'LOG';
        
        if (item.data.level === LogLevelEnum.WARN) key = 'WARN';
        if (item.data.level === LogLevelEnum.INFO) key = 'INFO';
        
        const dataStr = item.data.data ? ` with ${JSON.stringify(item.data.data)}` : '';
        const location = item.data.location ? ` in ${item.data.location}` : '';
        log(`${logColor}${indent} ${key}${location} at ${logTime} message ${item.data.message}${dataStr}${Console.reset}`);
      }
    }
  }
}

export default ConsoleTransport
