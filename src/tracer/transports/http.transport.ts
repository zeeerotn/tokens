import type { TransportInterface, RedactorInterface } from '~/tracer/interfaces.ts';
import type { HttpOptionsType, TraceType, TransportOptionsType } from '~/tracer/types.ts';
import LogLevelEnum from '~/tracer/enums/log-level.enum.ts';

export class HttpTransport implements TransportInterface {
  public url: string;
  
  constructor(url: string, public redactor: RedactorInterface, public options?: TransportOptionsType & HttpOptionsType) {
    this.url = url;
  }

  public async send(data: TraceType | TraceType[]): Promise<void> {
    const traces = Array.isArray(data) ? data : [data];
    
    for (let trace of traces) {
      // Apply redaction first if configured
      if (this.redactor) {
        trace = this.redactor.redact(trace);
      }
      
      let filteredEntries = [...trace.entries];
      
      const shouldIncludeLogs = this.options?.log === undefined || this.options.log === true;
      if (!shouldIncludeLogs) {
        filteredEntries = filteredEntries.filter(entry => entry.type !== 'log');
      } else if (Array.isArray(this.options?.log)) {
        filteredEntries = filteredEntries.filter(entry => 
          entry.type !== 'log' || (this.options!.log as LogLevelEnum[]).includes(entry.level)
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

      try {
        const response = await fetch(this.url, {
          method: this.options?.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.options?.headers || {}),
          },
          body: JSON.stringify(filteredTrace),
          signal: this.options?.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP transport failed: ${response.status}`);
        }
      } catch (error) {
        // @TODO maybe the abort signal should be handled differently
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('HTTP transport request aborted');
        } else {
          throw error;
        }
      }
    }
  }
}

export default HttpTransport;
