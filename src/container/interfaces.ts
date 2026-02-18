import type { KeyableType } from '~/common/types.ts';
import type { ConsumerType, InjectType, ProviderType } from '~/container/types.ts';

import ScopeEnum from '~/container/enums/scope.enum.ts';

export interface ContainerInterface {
  artifacts?: { providers?: Array<ProviderType>; consumers?: Array<ConsumerType> };
  collection: Map<KeyableType, { artifact: ConsumerType | ProviderType; tags: Array<'P' | 'C'> }>;
  injection: Map<KeyableType, InjectType>;
  instances: Map<KeyableType, any>;

  add(artifacts: Array<ConsumerType>, type: 'consumer'): void;
  add(artifacts: Array<ProviderType>, type: 'provider'): void;
  add(artifacts: Array<ConsumerType> | Array<ProviderType>, type: 'consumer' | 'provider'): void;
  construct<T>(key: KeyableType, scope?: ScopeEnum): T | undefined;
  duplicate(withInstances?: Map<KeyableType, any>): ContainerInterface;
  
  [Symbol.dispose](): void;
}

export default {};
