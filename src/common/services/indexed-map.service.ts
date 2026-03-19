
class IndexedMap<K, V> extends Map<K, V> {
  private map = new Map<K, V>();
  private keyz: K[] = [];

  override set(key: K, value: V): this {
    if (!this.map.has(key)) this.keyz.push(key);
    this.map.set(key, value);
    return this;
  }

  override delete(key: K): boolean {
    if (!this.map.has(key)) return false;
    this.map.delete(key);
    this.keyz.splice(this.keyz.indexOf(key), 1);
    return true;
  }

  override get(key: K): V | undefined { return this.map.get(key); }
  at(index: number): V | undefined { return this.map.get(this.keyz[index]); }
  override get size(): number { return this.keyz.length; }

  override values(): MapIterator<V> {
    return this.map.values();
  }
}

export default IndexedMap;
