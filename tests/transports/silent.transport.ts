import type { TraceType, TransportOptionsType } from '~/tracer/types.ts';
import type { TransportInterface, RedactorInterface } from '~/tracer/interfaces.ts';

export class SilentTransport implements TransportInterface {

  constructor(public redactor: RedactorInterface, public options?: TransportOptionsType) { }

  public send(data: TraceType | TraceType[]): Promise<void> {
    const traces = Array.isArray(data) ? data : [data];
    
    for (const trace of traces) {
      let filteredEntries = [...trace.entries];
      
      const shouldIncludeLogs = this.options?.log === undefined || this.options.log === true;
      if (!shouldIncludeLogs) {
        filteredEntries = filteredEntries.filter(entry => entry.type !== 'log');
      } else if (Array.isArray(this.options?.log)) {
        filteredEntries = filteredEntries.filter(entry => 
          entry.type !== 'log' || (this.options!.log as any[]).includes(entry.level)
        );
      }
      
      const shouldIncludeEvents = this.options?.event === undefined || this.options.event === true;
      if (!shouldIncludeEvents) {
        filteredEntries = filteredEntries.filter(entry => entry.type !== 'event');
      }
      
      const shouldIncludeAttributes = this.options?.attributes === undefined || this.options.attributes === true;
      const filteredTrace = shouldIncludeAttributes 
        ? { ...trace, entries: filteredEntries }
        : { ...trace, entries: filteredEntries, attributes: undefined };

      const date = new Date(filteredTrace.startTime);
      const year = date.getUTCFullYear();
      const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const day = date.getUTCDate().toString().padStart(2, '0');
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      const seconds = date.getUTCSeconds().toString().padStart(2, '0');
      const timestamp = `${year}/${month}/${day} ${hours}:${minutes}:${seconds} UTC`;

      const output = JSON.stringify(filteredTrace);
      
      if (timestamp.length + output.length < 0) {
        throw new Error('impossible');
      }
    }
    
    return Promise.resolve();
  }
}

export default SilentTransport;
