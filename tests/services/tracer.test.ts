import type { TraceType } from '~/tracer/types.ts';
import type { TransportInterface } from '~/tracer/interfaces.ts';

import { describe, it, beforeEach, afterEach } from "@std/bdd";
import { expect } from "@std/expect";

import ConsoleTransport from '~/tracer/transports/console.transport.ts'
import Tracer from '~/tracer/services/tracer.service.ts';
import HttpTransport from '~/tracer/transports/http.transport.ts'
import LogLevelEnum from '~/tracer/enums/log-level.enum.ts';
import SpanKindEnum from '~/tracer/enums/span-kind.enum.ts';
import SpanStatusEnum from '~/tracer/enums/span-status.enum.ts';
import QueueService from '~/common/services/queue.service.ts';

class MockHttpTransport extends HttpTransport {
  public sentData: Array<TraceType> = [];
  public callCount = 0;

  constructor() {
    const controller = new AbortController();
    // Create a no-op redactor for mock
    const noopRedactor = {
      redact: (trace: TraceType) => trace
    };
    super('https://example.com/v1/traces', noopRedactor, {
      headers: {
        'Authorization': 'Bearer mock-token',
        'X-Service-Name': 'test-service',
      },
      signal: controller.signal,
    });
  }

  override async send(data: TraceType | TraceType[]): Promise<void> {
    const traces = Array.isArray(data) ? data : [data];
    for (let trace of traces) {
      // Apply redaction if configured (same as parent class)
      if (this.redactor) {
        trace = this.redactor.redact(trace);
      }
      this.sentData.push(trace);
      this.callCount++;
    }
    return Promise.resolve();
  }

  reset() {
    this.sentData = [];
    this.callCount = 0;
  }
}

class MockConsoleTransport extends ConsoleTransport {
  public logs: string[] = [];
  public callCount = 0;

  constructor() {
    // Create a no-op redactor for mock
    const noopRedactor = {
      redact: (trace: TraceType) => trace
    };
    super(noopRedactor, { pretty: false });
  }

  override async send(data: TraceType | TraceType[]): Promise<void> {
    const traces = Array.isArray(data) ? data : [data];
    for (const trace of traces) {
      this.logs.push(JSON.stringify(trace));
      this.callCount++;
    }
    return Promise.resolve();
  }

  reset() {
    this.logs = [];
    this.callCount = 0;
  }
}

describe('Tracer with Console and HTTP Transports', () => {
  let mockHttpTransport: MockHttpTransport;
  let mockConsoleTransport: MockConsoleTransport;
  let tracer: Tracer;
  let queue: QueueService<TraceType, TransportInterface>;
  const queuesToCleanup: QueueService<TraceType, TransportInterface>[] = [];

  beforeEach(() => {
    mockHttpTransport = new MockHttpTransport();
    mockConsoleTransport = new MockConsoleTransport();
    
    queue = new QueueService<TraceType, TransportInterface>({
      processors: [mockHttpTransport, mockConsoleTransport],
      intervalMs: 50,
      processorFn: (batch, processors) => {
        for (const transport of processors) {
          transport.send(batch);
        }
      },
    });
    queuesToCleanup.push(queue);
    
    tracer = new Tracer(queue, { name: 'test-tracer' });
  });

  afterEach(() => {
    mockHttpTransport.reset();
    mockConsoleTransport.reset();
    for (const q of queuesToCleanup) {
      q.stop();
    }
    queuesToCleanup.length = 0;
  });

  describe('Basic Tracer Functionality', () => {
    it('should create a tracer with correct options', () => {
      expect(tracer.options.name).toBe('test-tracer');
      expect(tracer.trace.id).toBeTruthy();
      expect(tracer.trace.spanId).toBeTruthy();
    });

    it('should log messages at tracer level', async () => {
      tracer.info('Test message');
      tracer.end();
      
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockHttpTransport.callCount).toBe(1);
      expect(mockConsoleTransport.callCount).toBe(1);

      const sentData = mockHttpTransport.sentData[0];
      expect(sentData.name).toBe('test-tracer');
      const logs = sentData.entries.filter(e => e.type === 'log');
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe(LogLevelEnum.INFO);
      expect(logs[0].message).toBe('Test message');
    });

    it('should send traces to both HTTP and Console transports', async () => {
      tracer.error('Error occurred');
      tracer.end();
      
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockHttpTransport.callCount).toBe(1);
      expect(mockConsoleTransport.callCount).toBe(1);

      const httpData = mockHttpTransport.sentData[0];
      const logs = httpData.entries.filter(e => e.type === 'log');
      expect(logs[0].message).toBe('Error occurred');
      expect(httpData.status).toBe(SpanStatusEnum.REJECTED);

      const consoleData = JSON.parse(mockConsoleTransport.logs[0]);
      const consoleLogs = consoleData.entries.filter((e: any) => e.type === 'log');
      expect(consoleLogs[0].message).toBe('Error occurred');
    });
  });

  describe('Single Span Operations', () => {
    it('should create and end a span', async () => {
      const span = tracer.start({ name: 'test-operation', kind: SpanKindEnum.SERVER });
      
      expect(span.trace.name).toBe('test-operation');
      expect(span.trace.kind).toBe(SpanKindEnum.SERVER);
      expect(span.trace.id).toBeTruthy();
      expect(span.trace.spanId).toBeTruthy();

      span.end();
      
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockHttpTransport.callCount).toBe(1);
      expect(mockConsoleTransport.callCount).toBe(1);

      const sentData = mockHttpTransport.sentData[0];
      expect(sentData.name).toBe('test-operation');
      expect(sentData.startTime).toBeTruthy();
      expect(sentData.endTime).toBeTruthy();
    });

    it('should set attributes on a span', async () => {
      const span = tracer.start({ name: 'attribute-test' });
      
      span.attributes({
        userId: 'user-123',
        requestId: 'req-456',
        timestamp: new Date().toISOString(),
      });

      span.end();
      
      await new Promise(resolve => setTimeout(resolve, 100));

      const sentData = mockHttpTransport.sentData[0];
      expect(sentData.attributes?.userId).toBe('user-123');
      expect(sentData.attributes?.requestId).toBe('req-456');
      expect(sentData.attributes?.timestamp).toBeTruthy();
    });

    it('should add events to a span', async () => {
      const span = tracer.start({ name: 'event-test' });
      
      span.event('validation-start');
      span.event('validation-complete');
      span.event('processing-complete');

      span.end();
      
      await new Promise(resolve => setTimeout(resolve, 100));

      const sentData = mockHttpTransport.sentData[0];
      const events = sentData.entries.filter(e => e.type === 'event');
      expect(events.length).toBe(3);
      expect(events[0].name).toBe('validation-start');
      expect(events[1].name).toBe('validation-complete');
      expect(events[2].name).toBe('processing-complete');
    });

    it('should set span status', async () => {
      const span = tracer.start({ name: 'status-test' });
      
      span.status(SpanStatusEnum.RESOLVED);
      span.end();
      
      await new Promise(resolve => setTimeout(resolve, 100));

      const sentData = mockHttpTransport.sentData[0];
      expect(sentData.status).toBe(SpanStatusEnum.RESOLVED);
    });

    it('should handle span errors', async () => {
      const span = tracer.start({ name: 'error-test' });
      
      span.error('Something went wrong');
      span.end();
      
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockHttpTransport.callCount).toBe(1);

      const spanData = mockHttpTransport.sentData[0];
      const logs = spanData.entries.filter(e => e.type === 'log');
      expect(logs[0].level).toBe(LogLevelEnum.ERROR);
      expect(logs[0].message).toBe('Something went wrong');
      expect(spanData.status).toBe(SpanStatusEnum.REJECTED);
    });
  });

  describe('Nested Spans - Two Levels', () => {
    it('should create parent and child spans', async () => {
      const parent = tracer.start({ name: 'parent-operation', kind: SpanKindEnum.SERVER });
      parent.attributes({ parentAttr: 'parent-value' });

      const child = parent.start({ name: 'child-operation', kind: SpanKindEnum.CLIENT });
      child.attributes({ childAttr: 'child-value' });

      child.end();
      parent.end();
      
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockHttpTransport.callCount).toBe(2);

      const childData = mockHttpTransport.sentData[0];
      const parentData = mockHttpTransport.sentData[1];

      expect(childData.name).toBe('child-operation');
      expect(childData.spanParentId).toBe(parent.trace.spanId);
      expect(childData.id).toBe(parent.trace.id);

      expect(parentData.name).toBe('parent-operation');
      expect(parentData.spanId).toBe(parent.trace.spanId);
    });

    it('should maintain trace context across parent-child', async () => {
      const traceId = 'custom-trace-123';
      const parent = tracer.start({ name: 'parent', traceId, kind: SpanKindEnum.SERVER });
      const child = parent.start({ name: 'child', kind: SpanKindEnum.INTERNAL });

      child.end();
      parent.end();
      
      await new Promise(resolve => setTimeout(resolve, 100));

      const childData = mockHttpTransport.sentData[0];
      const parentData = mockHttpTransport.sentData[1];

      expect(childData.id).toBe(traceId);
      expect(parentData.id).toBe(traceId);
      expect(childData.spanParentId).toBe(parent.trace.spanId);
    });

    it('should log within span context', async () => {
      const parent = tracer.start({ name: 'parent-with-logs' });
      parent.info('Parent started');

      const child = parent.start({ name: 'child-with-logs' });
      child.debug('Child processing');
      child.info('Child completed');

      child.end();
      parent.end();
      
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockHttpTransport.callCount).toBe(2);

      const childData = mockHttpTransport.sentData[0];
      const childLogs = childData.entries.filter(e => e.type === 'log');
      expect(childLogs.length).toBe(2);
      expect(childLogs[0].message).toBe('Child processing');
      expect(childLogs[1].message).toBe('Child completed');

      const parentData = mockHttpTransport.sentData[1];
      const parentLogs = parentData.entries.filter(e => e.type === 'log');
      expect(parentLogs.length).toBe(1);
      expect(parentLogs[0].message).toBe('Parent started');
    });
  });

  describe('Nested Spans - Three Levels', () => {
    it('should create three levels of nested spans', async () => {
      const rootTracer = new Tracer(queue, { name: 'root-tracer'});

      const level1 = rootTracer.start({ name: 'level1-api-request', kind: SpanKindEnum.SERVER });
      level1.attributes({ endpoint: '/api/users', method: 'GET' });

      const level2 = level1.start({ name: 'level2-business-logic', kind: SpanKindEnum.INTERNAL });
      level2.attributes({ operation: 'validate-user' });

      const level3 = level2.start({ name: 'level3-database-query', kind: SpanKindEnum.CLIENT });
      level3.attributes({ query: 'SELECT * FROM users', db: 'postgres' });

      level3.end();
      level2.end();
      level1.end();
      
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockHttpTransport.callCount).toBe(3);

      const level3Data = mockHttpTransport.sentData[0];
      const level2Data = mockHttpTransport.sentData[1];
      const level1Data = mockHttpTransport.sentData[2];

      expect(level3Data.id).toBe(level1Data.id);
      expect(level2Data.id).toBe(level1Data.id);

      expect(level3Data.spanParentId).toBe(level2.trace.spanId);
      expect(level2Data.spanParentId).toBe(level1.trace.spanId);
      expect(level1Data.spanParentId).toBe(rootTracer.trace.spanId);
    });

    it('should handle errors at different nesting levels', async () => {
      const level1 = tracer.start({ name: 'level1' });
      level1.info('Level 1 started');

      const level2 = level1.start({ name: 'level2' });
      level2.info('Level 2 started');

      const level3 = level2.start({ name: 'level3' });
      level3.error('Level 3 encountered an error');
      level3.end();

      level2.warn('Level 2 completed with warnings');
      level2.end();

      level1.end();
      
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockHttpTransport.callCount).toBe(3);

      const level3Data = mockHttpTransport.sentData[0];
      const level3Logs = level3Data.entries.filter(e => e.type === 'log');
      const level3ErrorLog = level3Logs.find(l => l.level === LogLevelEnum.ERROR);
      expect(level3ErrorLog?.message).toBe('Level 3 encountered an error');
    });
  });

  describe('Multiple Child Spans', () => {
    it('should create multiple children from same parent', async () => {
      const parent = tracer.start({ name: 'parent-with-multiple-children' });

      const child1 = parent.start({ name: 'child1', kind: SpanKindEnum.CLIENT });
      child1.attributes({ childId: 1 });
      child1.end();

      const child2 = parent.start({ name: 'child2', kind: SpanKindEnum.CLIENT });
      child2.attributes({ childId: 2 });
      child2.end();

      const child3 = parent.start({ name: 'child3', kind: SpanKindEnum.CLIENT });
      child3.attributes({ childId: 3 });
      child3.end();

      parent.end();
      
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockHttpTransport.callCount).toBe(4);

      const child1Data = mockHttpTransport.sentData[0];
      const child2Data = mockHttpTransport.sentData[1];
      const child3Data = mockHttpTransport.sentData[2];

      expect(child1Data.spanParentId).toBe(parent.trace.spanId);
      expect(child2Data.spanParentId).toBe(parent.trace.spanId);
      expect(child3Data.spanParentId).toBe(parent.trace.spanId);

      expect(child1Data.attributes?.childId).toBe(1);
      expect(child2Data.attributes?.childId).toBe(2);
      expect(child3Data.attributes?.childId).toBe(3);
    });

    it('should handle sibling spans with different kinds', async () => {
      const parent = tracer.start({ name: 'parent', kind: SpanKindEnum.SERVER });

      const dbSpan = parent.start({ name: 'database-query', kind: SpanKindEnum.CLIENT });
      dbSpan.attributes({ db: 'postgresql', operation: 'SELECT' });
      dbSpan.end();

      const cacheSpan = parent.start({ name: 'cache-lookup', kind: SpanKindEnum.CLIENT });
      cacheSpan.attributes({ cache: 'redis', key: 'user:123' });
      cacheSpan.end();

      const queueSpan = parent.start({ name: 'queue-publish', kind: SpanKindEnum.PRODUCER });
      queueSpan.attributes({ queue: 'notifications', messageId: 'msg-456' });
      queueSpan.end();

      parent.end();
      
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockHttpTransport.callCount).toBe(4);

      const dbData = mockHttpTransport.sentData[0];
      const cacheData = mockHttpTransport.sentData[1];
      const queueData = mockHttpTransport.sentData[2];

      expect(dbData.kind).toBe(SpanKindEnum.CLIENT);
      expect(cacheData.kind).toBe(SpanKindEnum.CLIENT);
      expect(queueData.kind).toBe(SpanKindEnum.PRODUCER);
    });
  });

  describe('Complex Real-World Scenario', () => {
    it('should trace a complete order processing workflow', async () => {
      const requestSpan = tracer.start({ name: 'http.request', kind: SpanKindEnum.SERVER, traceId: 'trace-order-12345' });

      requestSpan.attributes({
        'http.method': 'POST',
        'http.route': '/api/orders',
        'http.status_code': 200,
        'user.id': 'zeeromabs',
        'request.timestamp': '2025-10-24 15:03:23',
      });

      requestSpan.info('Received order request');

      const validateSpan = requestSpan.start({ name: 'order.validate', kind: SpanKindEnum.INTERNAL });
      validateSpan.debug('Validating order data');
      validateSpan.event('validation.started');
      await new Promise(resolve => setTimeout(resolve, 10));
      validateSpan.event('validation.completed');
      validateSpan.status(SpanStatusEnum.RESOLVED);
      validateSpan.end();

      const inventorySpan = requestSpan.start({ name: 'inventory.check', kind: SpanKindEnum.CLIENT });
      inventorySpan.attributes({
        'inventory.sku': 'ITEM-001',
        'inventory.quantity': 5,
      });
      inventorySpan.info('Checking inventory');
      await new Promise(resolve => setTimeout(resolve, 20));

      const inventoryDbSpan = inventorySpan.start({ name: 'inventory.database.query', kind: SpanKindEnum.CLIENT });
      inventoryDbSpan.attributes({
        'db.system': 'postgresql',
        'db.statement': 'SELECT quantity FROM inventory WHERE sku = $1',
      });
      await new Promise(resolve => setTimeout(resolve, 15));
      inventoryDbSpan.event('query.complete');
      inventoryDbSpan.end();

      inventorySpan.event('inventory.available');
      inventorySpan.end();

      const paymentSpan = requestSpan.start({ name: 'payment.process', kind: SpanKindEnum.CLIENT });
      paymentSpan.attributes({
        'payment.provider': 'stripe',
        'payment.amount': 99.99,
        'payment.currency': 'USD',
      });
      paymentSpan.info('Processing payment');
      paymentSpan.event('payment.authorized');
      paymentSpan.status(SpanStatusEnum.RESOLVED);
      paymentSpan.end();

      const createOrderSpan = requestSpan.start({ name: 'order.create', kind: SpanKindEnum.CLIENT });
      createOrderSpan.attributes({
        'db.system': 'postgresql',
        'db.operation': 'INSERT',
        'order.id': 'ORD-12345',
      });
      await new Promise(resolve => setTimeout(resolve, 25));
      createOrderSpan.event('order.created');
      createOrderSpan.end();

      const notificationSpan = requestSpan.start({ name: 'notification.send', kind: SpanKindEnum.PRODUCER });
      notificationSpan.attributes({
        'messaging.system': 'rabbitmq',
        'messaging.destination': 'order.notifications',
        'notification.type': 'order_confirmation',
      });
      await new Promise(resolve => setTimeout(resolve, 10));
      notificationSpan.event('message.published');
      notificationSpan.end();

      requestSpan.info('Order processed successfully');
      requestSpan.status(SpanStatusEnum.RESOLVED);
      requestSpan.end();
      
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockHttpTransport.callCount).toBe(7);

      const spanData = mockHttpTransport.sentData;
      const allTraceIds = spanData.map(s => s.id);
      const uniqueTraceIds = new Set(allTraceIds);
      expect(uniqueTraceIds.size).toBe(1);
      expect(uniqueTraceIds.has('trace-order-12345')).toBe(true);

      const requestData = spanData.find(s => s.name === 'http.request');
      const inventoryData = spanData.find(s => s.name === 'inventory.check');
      const inventoryDbData = spanData.find(s => s.name === 'inventory.database.query');

      expect(inventoryData?.spanParentId).toBe(requestData?.spanId);
      expect(inventoryDbData?.spanParentId).toBe(inventorySpan.trace.spanId);
    });
  });

  describe('Namespace Filtering', () => {
    it('should filter spans by namespace with worker transport', async () => {
      const noopRedactor = {
        redact: (trace: TraceType) => trace
      };
      const silentTransport = new (await import('../transports/silent.transport.ts')).SilentTransport(
        noopRedactor,
        { pretty: false, log: true, namespaces: ['api'] }
      );

      const filteredTracer = new Tracer(queue, { name: 'filtered-tracer' });

      const apiSpan = filteredTracer.start({ name: 'api.getUser' });
      apiSpan.end();

      const internalSpan = filteredTracer.start({ name: 'internal.cache' });
      internalSpan.end();

      await new Promise(resolve => setTimeout(resolve, 50));

    });
  });

  describe('Redaction', () => {
    it('should redact sensitive data using Redactor', async () => {
      const { Redactor } = await import('~/tracer/services/redactor.service.ts');
      
      const redactor = new Redactor([
        {
          paths: ['attributes.password', 'attributes.apiKey'],
          action: 'mask',
          replacement: '***REDACTED***'
        }
      ]);

      const mockTransport = new MockHttpTransport();
      mockTransport.redactor = redactor;

      const redactQueue = new QueueService<TraceType, TransportInterface>({
        processors: [mockTransport],
        intervalMs: 50,
        processorFn: (batch, processors) => {
          for (const transport of processors) {
            transport.send(batch);
          }
        },
      });
      queuesToCleanup.push(redactQueue);

      const redactTracer = new Tracer(redactQueue, { name: 'redacting-tracer' });

      redactTracer.info('User login');
      redactTracer.attributes({
        username: 'zeeromabs',
        password: 'secret123',
        apiKey: 'token-abc-xyz',
        email: 'user@example.com',
      });
      redactTracer.end();

      await new Promise(resolve => setTimeout(resolve, 100));

      const sentData = mockTransport.sentData[0];
      expect(sentData.attributes?.username).toBe('zeeromabs');
      expect(sentData.attributes?.email).toBe('user@example.com');
      expect(sentData.attributes?.password).toBe('***REDACTED***');
      expect(sentData.attributes?.apiKey).toBe('***REDACTED***');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing attributes gracefully', async () => {
      const span = tracer.start({ name: 'no-attributes-test' });
      span.end();
      
      await new Promise(resolve => setTimeout(resolve, 100));

      const sentData = mockHttpTransport.sentData[0];
      const events = sentData.entries.filter(e => e.type === 'event');
      const logs = sentData.entries.filter(e => e.type === 'log');
      expect(events).toEqual([]);
      expect(logs).toEqual([]);
    });
  });
});
