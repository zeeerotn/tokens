import type { TransportInterface, RedactorInterface } from '~/tracer/interfaces.ts';
import type { HttpOptionsType, TraceType, TransportSpecsType } from '~/tracer/types.ts';
import LogLevelEnum from '~/tracer/enums/log-level.enum.ts';

export class HttpTransport implements TransportInterface {
  public url: string;
  public specs?: TransportSpecsType & HttpOptionsType;
  
  constructor(url: string, public redactor: RedactorInterface, TRANSPORT_SPECS?: TransportSpecsType & HttpOptionsType) {
    this.url = url;
    this.specs = TRANSPORT_SPECS;
  }

  public async send(data: TraceType | TraceType[]): Promise<void> {
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
          entry.type !== 'log' || (this.specs!.log as LogLevelEnum[]).includes(entry.level)
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

      const payload = { ...filteredTrace, timeOrigin: performance.timeOrigin };

      try {
        const response = await fetch(this.url, {
          method: this.specs?.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.specs?.headers || {}),
          },
          body: JSON.stringify(payload),
          signal: this.specs?.signal,
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
