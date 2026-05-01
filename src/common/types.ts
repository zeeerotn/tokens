/**
 * Simple keyable type
 *
 * @type KeyableType
 */
export type KeyableType = string | symbol;

/**
 * Defines the common artifact type
 *
 * @type ArtifactType
 */
export type ArtifactType = {
  name: KeyableType;
  target: any;
};

/**
 * Defines a safe function type
 *
 * @type PropertiesType<T>
 */
export type FunctionType = (...args: any[]) => any;

/**
 * Defines a type without his functions
 *
 * @type PropertiesType<T>
 */
export type PropertiesType<T> = { [P in keyof T as T[P] extends FunctionType ? never : P]: T[P]; }

export type NewableType<T extends new (...args: any[]) => any> = new (...args: any) => InstanceType<T>

/**
 * Map a value to a type without his functions
 *
 * @type MappedPropertiesType<T>
 */
export type MappedPropertiesType<E, V> = { [key in keyof OmitType<E, FunctionType>]: V }

/**
 * Maps a entry type
 *
 * @type EntryType<T>
 */
export type EntryType<T extends Record<PropertyKey, any>> = T extends readonly [unknown, ...unknown[]] ? TupleEntryType<T>
  : T extends ReadonlyArray<infer U> ? [`${number}`, U]
  : T extends object
    ? { [K in keyof T]: [K, Required<T>[K]] }[keyof T] extends infer E
      ? E extends [infer K, infer V] ? K extends string | number ? [`${K}`, V]
        : never
      : never
    : never
  : never;

/**
 * Maps guard function type
 *
 * @type GuardType
 */
export type GuardType = (record: any) => boolean;

/**
 * Accepts data types function type
 * Alias for GuardType
 *
 * @type GuardType
 */
export type AcceptType = GuardType

/**
 * Maps a common json object
 *
 * @type JsonType
 */
export type JsonType =
  | string
  | number
  | boolean
  | null
  | undefined
  | object
  | readonly JsonType[]
  | { readonly [key: string]: JsonType }
  | { toJSON(): JsonType };

/**
 * Maps key types of the object
 *
 * @type MappedKeyType<T>
 */
export type MappedKeyType<T> = { [K in keyof T]: T[K] };

/**
 * Maps to a diferent type of value
 *
 * @type ReMapType<T, V>
 */
export type ReMapType<T, V> = { [K in keyof T]: V };

/**
 * Define the default metadata object type
 *
 * @type MetadaType
 */
export type MetadataType<T> = { [key: string | symbol]: T };

/**
 * Omit and maps the key types of the object
 *
 * @type OmitType<T, R>
 */
export type OmitType<T, R> = { [P in keyof T as T[P] extends R ? never : P]: T[P] };

/**
 * Pick and maps the key types of the object
 *
 * @type PickType
 */
export type PickType<T, R> = { [P in keyof T as T[P] extends R ? P : never]: T[P] };

/**
 * Define the possible types of the target property object
 *
 * @type PropertyType
 */
export type PropertyType = string | number | symbol;

/**
 * Map a tuple entry type
 *
 * @type TupleEntryType
 */
export type TupleEntryType<T extends readonly unknown[], I extends unknown[] = [], R = never> = T extends
  readonly [infer Head, ...infer Tail] ? TupleEntryType<Tail, [...I, unknown], R | [`${I['length']}`, Head]>
  : R;

export type DescriptorOptionsType = {
  predicate?: (name: string) => boolean;
  properties: PropertyDescriptor;
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  & Pick<T, Exclude<keyof T, Keys>>
  & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type TimeType = {
  key: string
  duration: number
  end: number
  start: number
}

export type QueueOptionsType<T, P> = {
  processors: P[];
  intervalMs?: number;
  chunkSize?: number;
  processorFn: (batch: T[], processors: P[]) => void | Promise<void>;
};

export type CacheEntryType<K, V> = {
  key: K;
  value: V;
  expires: number;
  next: CacheEntryType<K, V> | null;
  prev: CacheEntryType<K, V> | null;
};

export default {};
