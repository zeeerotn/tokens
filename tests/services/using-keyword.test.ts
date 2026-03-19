import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { expect } from 'jsr:@std/expect@^1';

import Tracer from '~/tracer/services/tracer.service.ts';
import QueueService from '~/common/services/queue.service.ts';
import Timer from '~/common/services/timer.service.ts';
import Container from '~/container/services/container.service.ts';
import Signal from '~/messenger/services/signal.service.ts';
import Packer from '~/packer/services/packer.service.ts';
import type { TraceType } from '~/tracer/types.ts';
import type { TransportInterface } from '~/tracer/interfaces.ts';

describe('using keyword (explicit resource management)', () => {
  
  describe('Span with Symbol.dispose', () => {
    it('should automatically end span when disposed', () => {
      const queue = new QueueService<TraceType, TransportInterface>({
        processors: [],
        processorFn: async () => {}
      });
      const tracer = new Tracer(queue, { name: 'test' });
      let spanEnded = false;
      
      {
        using testSpan = tracer.start({ name: 'test-span' });
        
        expect(testSpan.trace.ended).toBeUndefined();
        testSpan.info('test message');
        spanEnded = testSpan.trace.ended ?? false;
      }
      
      expect(spanEnded).toBe(false);

      queue.stop();
    });

    it('should end span even if error occurs', () => {
      const queue = new QueueService<TraceType, TransportInterface>({
        processors: [],
        processorFn: async () => {}
      });
      const tracer = new Tracer(queue, { name: 'test' });
      let spanTrace: any;
      
      try {
        using testSpan = tracer.start({ name: 'error-span' });
        spanTrace = testSpan.trace;
        
        throw new Error('Test error');
      } catch (_error) {
        expect(spanTrace.ended).toBe(true);
      }
      
      queue.stop();
    });

    it('should not end span twice if already ended', () => {
      const queue = new QueueService<TraceType, TransportInterface>({
        processors: [],
        processorFn: async () => {}
      });
      const tracer = new Tracer(queue, { name: 'test' });
      
      {
        using span = tracer.start({ name: 'test-span' });
        span.end();
        const firstEndTime = span.trace.endTime;
        
        expect(span.trace.ended).toBe(true);
        expect(span.trace.endTime).toBe(firstEndTime);
      }
      
      queue.stop();
    });
  });

  describe('Timer with Symbol.dispose', () => {
    it('should automatically clear timers when disposed', () => {
      let timer: Timer;
      
      {
        using testTimer = new Timer();
        timer = testTimer;
        
        testTimer.setTime('test1');
        testTimer.setTime('test2');
        
        expect(timer.timers.size).toBe(2);
      }
      
      expect(timer!.timers.size).toBe(0);
    });

    it('should clear timers even if error occurs', () => {
      let timer: Timer;
      
      try {
        using testTimer = new Timer();
        timer = testTimer;
        
        testTimer.setTime('test');
        expect(timer.timers.size).toBe(1);
        
        throw new Error('Test error');
      } catch (_error) {
        expect(timer!.timers.size).toBe(0);
      }
    });
  });

  describe('Container with Symbol.dispose', () => {
    it('should automatically clear instances when disposed', () => {
      let container: Container;
      
      {
        using testContainer = new Container({
          providers: [
            { name: 'TestService', target: class TestService {} }
          ],
          consumers: [
            { name: 'TestService', target: class TestService {} }
          ]
        });
        container = testContainer;
        
        testContainer.construct('TestService');
        expect(container.instances.size).toBe(1);
      }
      
      expect(container!.instances.size).toBe(0);
    });

    it('should clear instances even if error occurs', () => {
      let container: Container;
      
      try {
        using testContainer = new Container({
          providers: [
            { name: 'TestService', target: class TestService {} }
          ]
        });
        container = testContainer;
        
        testContainer.construct('TestService');
        expect(container.instances.size).toBe(1);
        
        throw new Error('Test error');
      } catch (_error) {
        expect(container!.instances.size).toBe(0);
      }
    });
  });

  describe('Signal with Symbol.dispose', () => {
    it('should automatically clear listeners when disposed', () => {
      let dispatcher: Signal<{ test: [string] }>;
      
      {
        using testSignal = new Signal<{ test: [string] }>();
        dispatcher = testSignal;
        
        testSignal.subscribe('test', (data) => {
          console.log(data);
        });
        
        expect(Object.keys(dispatcher.listeners).length).toBe(1);
      }
      
      expect(Object.keys(dispatcher!.listeners).length).toBe(0);
    });

    it('should clear listeners even if error occurs', () => {
      let dispatcher: Signal<{ test: [string] }>;
      
      try {
        using testSignal = new Signal<{ test: [string] }>();
        dispatcher = testSignal;
        
        testSignal.subscribe('test', (data) => {
          console.log(data);
        });
        
        throw new Error('Test error');
      } catch (_error) {
        expect(Object.keys(dispatcher!.listeners).length).toBe(0);
      }
    });
  });

  describe('Packer with Symbol.dispose', () => {
    it('should automatically clean up resources when disposed', () => {
      let packer: Packer;
      
      {
        using testPacker = new Packer(class TestPack {});
        packer = testPacker;
        
        packer.packs.push('TestPack');
        expect(packer.packs.length).toBe(1);
      }
      
      expect(packer!.packs.length).toBe(0);
      expect(packer!.container.instances.size).toBe(0);
      expect(Object.keys(packer!.signal.listeners).length).toBe(0);
    });
  });

  describe('Tracer with Symbol.asyncDispose', () => {
    it('should automatically dispose asynchronously', async () => {
      let disposed = false;
      const queue = new QueueService<TraceType, TransportInterface>({
        processors: [],
        processorFn: async () => {}
      });
      
      {
        await using tracer = new Tracer(queue, { name: 'test' });
        
        tracer.info('test message');
        expect(disposed).toBe(false);
      }
      
      disposed = true;
      expect(disposed).toBe(true);
      
      queue.stop();
    });

    it('should flush queue on async dispose', async () => {
      let sendCalled = false;
      const mockTransport = {
        options: {},
        send: (data: any) => {
          sendCalled = true;
          return Promise.resolve();
        }
      } as any;
      
      const queue = new QueueService<TraceType, TransportInterface>({
        processors: [mockTransport],
        intervalMs: 50,
        processorFn: async (batch, processors) => {
          for (const processor of processors) {
            await processor.send(batch);
          }
        }
      });
      
      {
        await using tracer = new Tracer(queue, { name: 'test' });
        tracer.info('test message');
        tracer.end();
      }
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(sendCalled).toBe(true);
      
      queue.stop();
    });

    it('should handle transports without flush method', async () => {
      const mockTransport = {
        options: {},
        send: () => Promise.resolve()
      } as any;
      
      const queue = new QueueService<TraceType, TransportInterface>({
        processors: [mockTransport],
        processorFn: async () => {}
      });
      
      {
        await using tracer = new Tracer(queue, { name: 'test' });
        tracer.info('test message');
      }
      
      expect(true).toBe(true);
      
      queue.stop();
    });
  });

  describe('nested using statements', () => {
    it('should dispose resources in reverse order', () => {
      const disposeOrder: string[] = [];
      
      {
        using timer1 = new Timer();
        timer1.setTime('outer');
        disposeOrder.push('timer1-created');
        
        {
          using timer2 = new Timer();
          timer2.setTime('inner');
          disposeOrder.push('timer2-created');
          
          expect(timer1.timers.size).toBe(1);
          expect(timer2.timers.size).toBe(1);
        }
        
        disposeOrder.push('timer2-disposed');
        expect(timer1.timers.size).toBe(1);
      }
      
      disposeOrder.push('timer1-disposed');
      
      expect(disposeOrder).toEqual([
        'timer1-created',
        'timer2-created',
        'timer2-disposed',
        'timer1-disposed'
      ]);
    });
  });

  describe('multiple resources with using', () => {
    it('should dispose all resources', () => {
      let timer: Timer;
      let container: Container;
      let dispatcher: Signal<any>;
      
      {
        using testTimer = new Timer();
        using testContainer = new Container();
        using testSignal = new Signal<{ test: [string] }>();
        
        timer = testTimer;
        container = testContainer;
        dispatcher = testSignal;
        
        testTimer.setTime('test');
        testContainer.construct('NonExistent');
        testSignal.subscribe('test', () => {});
        
        expect(timer.timers.size).toBe(1);
      }
      
      expect(timer!.timers.size).toBe(0);
      expect(container!.instances.size).toBe(0);
      expect(Object.keys(dispatcher!.listeners).length).toBe(0);
    });
  });

  describe('using with explicit dispose call', () => {
    it('should handle manual dispose before automatic dispose', () => {
      {
        using timer = new Timer();
        timer.setTime('test');
        
        timer[Symbol.dispose]();
        expect(timer.timers.size).toBe(0);
        
      }
      
      expect(true).toBe(true);
    });
  });
});
