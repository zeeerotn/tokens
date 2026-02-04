import type { TraceType } from '~/tracer/types.ts';
import type { TransportInterface } from '~/tracer/interfaces.ts';

import Tracer from '~/tracer/services/tracer.service.ts';
import SpanKindEnum from '~/tracer/enums/span-kind.enum.ts';
import SpanStatusEnum from '~/tracer/enums/span-status.enum.ts';
import QueueService from '~/common/services/queue.service.ts';
import SilentTransport from '../transports/silent.transport.ts';

const noopRedactor = {
  redact: (trace: TraceType) => trace
};
const silentTransport = new SilentTransport(noopRedactor, { pretty: false, log: true });

const emptyQueue = new QueueService<TraceType, TransportInterface>({
  processors: [],
  intervalMs: 50,
  processorFn: (batch, processors) => {
    for (const transport of processors) {
      transport.send(batch);
    }
  },
});

const benchQueue = new QueueService<TraceType, TransportInterface>({
  processors: [silentTransport],
  intervalMs: 50,
  processorFn: (batch, processors) => {
    for (const transport of processors) {
      transport.send(batch);
    }
  },
});

const tracerNoTransport = new Tracer(emptyQueue, { name: 'bench-no-transport' });
const tracerWithSilent = new Tracer(benchQueue, { name: 'bench-with-silent' });

async function processSimpleRequest(tracer: Tracer): Promise<{ result: string, span: any }> {
  const requestSpan = tracer.start({ name: 'request', kind: SpanKindEnum.SERVER });
  
  const data = { status: 'ok' };
  
  requestSpan.status(SpanStatusEnum.RESOLVED);
  requestSpan.end();
  
  const result = JSON.stringify(data);
  
  return { result, span: requestSpan };
}

async function processRequestWithMiddleware(tracer: Tracer): Promise<{ result: string, span: any }> {
  const serverSpan = tracer.start({ name: 'server', kind: SpanKindEnum.SERVER });
  
  const handlerSpan = serverSpan.start({ name: 'handler', kind: SpanKindEnum.INTERNAL });
  handlerSpan.attributes({ pid: 1234, memory: '50MB' });
  
  const requestSpan = serverSpan.start({ name: 'request', kind: SpanKindEnum.INTERNAL });
  requestSpan.attributes({ method: 'GET', pathname: '/api/test' });
  requestSpan.info('GET /api/test');
  requestSpan.status(SpanStatusEnum.RESOLVED);
  requestSpan.end();
  
  const middleware1 = serverSpan.start({ name: 'middleware exception', kind: SpanKindEnum.INTERNAL });
  middleware1.status(SpanStatusEnum.RESOLVED);
  middleware1.end();
  
  const middleware2 = serverSpan.start({ name: 'middleware response', kind: SpanKindEnum.INTERNAL });
  middleware2.status(SpanStatusEnum.RESOLVED);
  middleware2.end();
  
  const middleware3 = serverSpan.start({ name: 'middleware gateway', kind: SpanKindEnum.INTERNAL });
  middleware3.status(SpanStatusEnum.RESOLVED);
  middleware3.end();
  
  const responseSpan = serverSpan.start({ name: 'response', kind: SpanKindEnum.INTERNAL });
  responseSpan.info('GET /api/test with 200');
  responseSpan.attributes({ status: 200, statusText: 'OK' });
  responseSpan.status(SpanStatusEnum.RESOLVED);
  responseSpan.end();
  
  handlerSpan.status(SpanStatusEnum.RESOLVED);
  handlerSpan.end();
  
  serverSpan.status(SpanStatusEnum.RESOLVED);
  serverSpan.end();
  
  const result = JSON.stringify({ status: 'ok' });
  
  return { result, span: serverSpan };
}

Deno.bench({
  name: 'API Request - Empty - simple',
  group: 'simple-request',
  baseline: true,
  async fn() {
    const { result, span } = await processSimpleRequest(tracerNoTransport);
  },
});

Deno.bench({
  name: 'API Request - SilentTransport - simple',
  group: 'simple-request',
  async fn() {
    const { result, span } = await processSimpleRequest(tracerWithSilent);
  },
});

Deno.bench({
  name: 'API Request - Empty - with middleware',
  group: 'middleware-request',
  baseline: true,
  async fn() {
    await processRequestWithMiddleware(tracerNoTransport);
  },
});

Deno.bench({
  name: 'API Request - SilentTransport - with middleware',
  group: 'middleware-request',
  async fn() {
    await processRequestWithMiddleware(tracerWithSilent);
  },
});

Deno.bench({
  name: 'API Concurrent - Empty - 10 requests',
  group: 'concurrent',
  baseline: true,
  async fn() {
    await Promise.all(
      Array.from({ length: 10 }, () => processRequestWithMiddleware(tracerNoTransport))
    );
  },
});

Deno.bench({
  name: 'API Concurrent - SilentTransport - 10 requests',
  group: 'concurrent',
  async fn() {
    await Promise.all(
      Array.from({ length: 10 }, () => processRequestWithMiddleware(tracerWithSilent))
    );
  },
});

Deno.bench({
  name: 'Basic - Empty - single span',
  group: 'basic-span',
  baseline: true,
  fn() {
    const span = tracerNoTransport.start({ name: 'test-span', kind: SpanKindEnum.INTERNAL });
    span.attributes({ test: 'value' });
    span.end();
  },
});

Deno.bench({
  name: 'Basic - SilentTransport - single span',
  group: 'basic-span',
  fn() {
    const span = tracerWithSilent.start({ name: 'test-span', kind: SpanKindEnum.INTERNAL });
    span.attributes({ test: 'value' });
    span.end();
  },
});

Deno.bench({
  name: 'High Load - Empty - 100 requests',
  group: 'high-load',
  baseline: true,
  async fn() {
    await Promise.all(
      Array.from({ length: 100 }, () => processRequestWithMiddleware(tracerNoTransport))
    );
  },
});

Deno.bench({
  name: 'High Load - SilentTransport - 100 requests',
  group: 'high-load',
  async fn() {
    await Promise.all(
      Array.from({ length: 100 }, () => processRequestWithMiddleware(tracerWithSilent))
    );
  },
});

Deno.bench({
  name: 'Extreme Load - Empty - 1000 requests',
  group: 'extreme-load',
  baseline: true,
  async fn() {
    await Promise.all(
      Array.from({ length: 1000 }, () => processRequestWithMiddleware(tracerNoTransport))
    );
  },
});

Deno.bench({
  name: 'Extreme Load - SilentTransport - 1000 requests (chunked)',
  group: 'extreme-load',
  async fn() {
    await Promise.all(
      Array.from({ length: 1000 }, () => processRequestWithMiddleware(tracerWithSilent))
    );
  },
});