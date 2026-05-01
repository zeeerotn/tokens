import type { CacheInterface } from '~/common/interfaces.ts';

class LRUMemoryCache<K, V> implements CacheInterface<K, V> {
  public cache: Map<K, { value: V; expires: number }>;

  constructor(private maxSize: number, private ttl: number) {
    this.cache = new Map<K, { value: V; expires: number }>();
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    // Refresh entry to move it to the end of the map (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict the least recently used item (the first one in map's iteration)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttl,
    });
  }

  public fetch(key: K, factory: () => V): V {
    const existingValue = this.get(key);
    if (existingValue !== undefined) {
      return existingValue;
    }

    const newValue = factory();
    this.set(key, newValue);
    return newValue;
  }
}

export default LRUMemoryCache;