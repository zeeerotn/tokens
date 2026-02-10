import type { QueueOptionsType } from '~/common/types.ts';
import type { QueueInterface } from '~/common/interfaces.ts';

/**
 * Generic queue service for batch processing of items.
 * Items are added via enqueue() and processed asynchronously
 * to avoid blocking the main execution flow.
 * 
 * @template T - The type of items stored in the queue
 * @template P - The type of processor used to handle batches
 */
class QueueService<T, P> implements QueueInterface<T, P> {
  private queue: T[] = [];
  private processing = false;
  private flushInterval: number | null = null;
  
  constructor(public options: QueueOptionsType<T, P>) {}
  
  private startInterval(): void {
    if (this.flushInterval !== null) return;
    
    this.flushInterval = setInterval(() => {
      if (!this.processing && this.queue.length > 0) {
        this.processQueue();
      } else if (!this.processing && this.queue.length === 0) {
        this.stop();
      }
    }, this.options.intervalMs || 5000);
  }
  
  public enqueue(item: T): void {
    if (this.options.processors.length === 0) return
    this.queue.push(item);
    this.startInterval();
  }

  private processQueue(): void {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    const batch = this.queue.splice(0);
    const chunkSize = this.options.chunkSize || 50;

    try {
      for (let i = 0; i < batch.length; i += chunkSize) {
        this.options.processorFn(batch.slice(i, i + chunkSize), this.options.processors);
      }
      
      this.processing = false;
    } catch (error) {
      // @TODO maybe implement retry logic here and expose a callback for failures
      console.error('Queue processing error:', error);
      this.processing = false;
    }
  }

  public flush(): void {
    if (!this.processing && this.queue.length > 0) {
      this.processQueue();
    }
  }

  public stop(): void {
    if (this.flushInterval !== null) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}

export default QueueService;
