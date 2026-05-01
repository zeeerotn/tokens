
class IndexedMap<K, V> extends Map<K, V> {
  private map = new Map<K, V>();
  private key: K[] = [];

  override set(key: K, value: V): this {
    if (!this.map.has(key)) this.key.push(key);
    this.map.set(key, value);
    return this;
  }

  override delete(key: K): boolean {
    if (!this.map.has(key)) return false;
    this.map.delete(key);
    this.key.splice(this.key.indexOf(key), 1);
    return true;
  }

  override get(key: K): V | undefined { return this.map.get(key); }
  at(index: number): V | undefined { return this.map.get(this.key[index]); }
  override get size(): number { return this.key.length; }

  override values(): MapIterator<V> {
    return this.map.values();
  }
}

export default IndexedMap;
